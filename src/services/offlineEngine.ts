import { AVAILABLE_PACKS, OFFLINE_DICTIONARY, ARABIC_REVERSE_INDEX, LanguagePackMeta } from './offlineData.ts';
import { TranslationResult } from '../../server/geminiService.ts';
import { getLinguisticEnrichment, normalizeArabic, normalizeGeneral, COMPREHENSIVE_LEXICON } from './languageLexiconData.ts';
import { PACK_DATABASE, lookupPackItem } from './languagePacksData.ts';
import { OFFLINE_CORE_ENTRIES } from './offlineCoreDictionary.ts';

export type AppNetworkMode = 'online' | 'offline';

const INSTALLED_PACKS_KEY = 'tarjuman_installed_packs';
const NETWORK_MODE_KEY = 'tarjuman_network_mode';
const REAL_PACK_DATA_KEY_PREFIX = 'tarjuman_real_pack_';

// Safe localStorage wrapper (works in Node/SSR/Browser)
function safeGetStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function safeSetStorage(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
    }
  } catch {}
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {}
}

// Initialize default packs (Arabic and English are included initially)
export function getInstalledPacks(): string[] {
  const raw = safeGetStorage(INSTALLED_PACKS_KEY);
  if (!raw) {
    const initial = ['ar', 'en'];
    safeSetStorage(INSTALLED_PACKS_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ['ar', 'en'];
  } catch {
    return ['ar', 'en'];
  }
}

export function isPackDownloaded(langCode: string): boolean {
  if (langCode === 'auto' || langCode === 'ar') return true;
  const installed = getInstalledPacks();
  return installed.includes(langCode);
}

export interface OfflineCheckResult {
  allowed: boolean;
  missingCode?: string;
  missingNameAr?: string;
  reason?: string;
}

export function checkOfflineTranslationEligibility(sourceLang: string, targetLang: string): OfflineCheckResult {
  // If target is not 'ar' and not downloaded
  if (targetLang !== 'ar' && !isPackDownloaded(targetLang)) {
    const meta = AVAILABLE_PACKS.find(p => p.code === targetLang);
    return {
      allowed: false,
      missingCode: targetLang,
      missingNameAr: meta ? meta.nameAr : targetLang,
      reason: `حزمة اللغة ${meta ? meta.nameAr : targetLang} غير منزلة في جهازك.`,
    };
  }

  // If source is not auto/ar and not downloaded
  if (sourceLang !== 'auto' && sourceLang !== 'ar' && !isPackDownloaded(sourceLang)) {
    const meta = AVAILABLE_PACKS.find(p => p.code === sourceLang);
    return {
      allowed: false,
      missingCode: sourceLang,
      missingNameAr: meta ? meta.nameAr : sourceLang,
      reason: `حزمة اللغة ${meta ? meta.nameAr : sourceLang} غير منزلة في جهازك.`,
    };
  }

  return { allowed: true };
}

export function canTranslateOffline(sourceLang: string, targetLang: string): boolean {
  return checkOfflineTranslationEligibility(sourceLang, targetLang).allowed;
}

export function getAppNetworkMode(): AppNetworkMode {
  const raw = safeGetStorage(NETWORK_MODE_KEY);
  if (raw === 'offline' || raw === 'online') {
    return raw;
  }
  return 'online';
}

export function setAppNetworkMode(mode: AppNetworkMode): void {
  safeSetStorage(NETWORK_MODE_KEY, mode);
}

export function isOfflineModeActive(manualMode?: AppNetworkMode): boolean {
  const mode = manualMode || getAppNetworkMode();
  const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return mode === 'offline' || !isBrowserOnline;
}

export function getForceOffline(): boolean {
  return isOfflineModeActive();
}

export function setForceOffline(enabled: boolean): void {
  setAppNetworkMode(enabled ? 'offline' : 'online');
}

export function getCachedRealPack(code: string): any | null {
  try {
    const raw = safeGetStorage(`${REAL_PACK_DATA_KEY_PREFIX}${code}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// UNIFIED MULTILINGUAL OFFLINE INDEX (10 LANGUAGES + DOWNLOADED PACK DATA)
// ============================================================================

interface UnifiedRecord {
  translations: Record<string, string>;
  alternatives?: string[];
  explanationAr?: string;
}

const UNIVERSAL_TEXT_MAP = new Map<string, UnifiedRecord>();
const LANG_TEXT_MAP = new Map<string, UnifiedRecord>();

function normalizeLookupKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Strip parenthetical readings like "(Jīchǎng)"
    .replace(/[.,?!؛:،؟"'«»()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function registerRecordKeys(translations: Record<string, string>, alternatives?: string[], explanationAr?: string, extraAliases?: Record<string, string[]>) {
  const rec: UnifiedRecord = { translations, alternatives, explanationAr };

  const addKey = (rawKey: string, langHint?: string) => {
    if (!rawKey) return;
    const variants = rawKey.split('/').map(p => p.trim());
    for (const v of variants) {
      const clean = normalizeLookupKey(v);
      if (!clean) continue;
      if (!UNIVERSAL_TEXT_MAP.has(clean)) {
        UNIVERSAL_TEXT_MAP.set(clean, rec);
      }
      if (langHint && !LANG_TEXT_MAP.has(`${langHint}:${clean}`)) {
        LANG_TEXT_MAP.set(`${langHint}:${clean}`, rec);
      }
      if (/[\u0600-\u06FF]/.test(clean)) {
        const normAr = normalizeArabic(clean);
        if (normAr && !UNIVERSAL_TEXT_MAP.has(normAr)) {
          UNIVERSAL_TEXT_MAP.set(normAr, rec);
        }
        if (langHint && normAr && !LANG_TEXT_MAP.has(`${langHint}:${normAr}`)) {
          LANG_TEXT_MAP.set(`${langHint}:${normAr}`, rec);
        }
      }
    }
  };

  for (const [lang, val] of Object.entries(translations)) {
    addKey(val, lang);
  }

  if (extraAliases) {
    for (const [lang, aliasList] of Object.entries(extraAliases)) {
      for (const alias of aliasList) {
        addKey(alias, lang);
      }
    }
  }
}

function buildUniversalOfflineIndex() {
  const isMultiWord = (translations: Record<string, string>) =>
    Object.values(translations).some(v => typeof v === 'string' && v.trim().includes(' '));

  // 1. Multi-word phrases from PACK_DATABASE & COMPREHENSIVE_LEXICON first for exact phrase priority
  for (const item of PACK_DATABASE) {
    if (isMultiWord(item.translations)) {
      registerRecordKeys(item.translations, item.alternatives, item.explanationAr);
    }
  }
  for (const lex of COMPREHENSIVE_LEXICON) {
    if (isMultiWord(lex.translations)) {
      registerRecordKeys(lex.translations, undefined, lex.bilingualExplanation?.ar);
    }
  }

  // 2. OFFLINE_CORE_ENTRIES (pronouns, verbs + inflections, prepositions, nouns, phrases with natural casing)
  for (const entry of OFFLINE_CORE_ENTRIES) {
    registerRecordKeys(entry.t, undefined, undefined, entry.aliases);
  }

  // 3. Remaining single-word entries in PACK_DATABASE, COMPREHENSIVE_LEXICON & legacy OFFLINE_DICTIONARY
  for (const item of PACK_DATABASE) {
    registerRecordKeys(item.translations, item.alternatives, item.explanationAr);
  }
  for (const lex of COMPREHENSIVE_LEXICON) {
    registerRecordKeys(lex.translations, undefined, lex.bilingualExplanation?.ar);
  }
  for (const [enKey, trans] of Object.entries(OFFLINE_DICTIONARY)) {
    registerRecordKeys({ en: enKey, ...trans });
  }

  // 4. Hydrate any downloaded real pack JSON stored locally
  for (const code of getInstalledPacks()) {
    const cached = getCachedRealPack(code);
    if (cached && Array.isArray(cached.vocabulary)) {
      for (const item of cached.vocabulary) {
        if (item.translations) {
          registerRecordKeys(item.translations, item.alternatives, item.explanationAr);
        }
      }
    }
  }
}

// Build index immediately on module load
buildUniversalOfflineIndex();

// Download language pack by fetching the real pack JSON file over HTTP with progress tracking
export async function downloadLanguagePack(
  code: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const pack = AVAILABLE_PACKS.find((p) => p.code === code);
  if (!pack) throw new Error('الحزمة غير موجودة');

  if (onProgress) onProgress(15);

  try {
    const fetchUrl = pack.fileUrl || `/packs/pack_${code}.json`;
    const response = await fetch(fetchUrl);

    if (onProgress) onProgress(45);

    if (!response.ok) {
      throw new Error(`تعذر تنزيل ملف الحزمة الحقيقي من السيرفر (${response.status})`);
    }

    if (onProgress) onProgress(75);

    const packData = await response.json();

    // Index real downloaded pack vocabulary immediately
    if (Array.isArray(packData.vocabulary)) {
      for (const item of packData.vocabulary) {
        if (item.translations) {
          registerRecordKeys(item.translations, item.alternatives, item.explanationAr);
        }
      }
    }

    // Cache the real package data locally (full vocabulary for 100% offline coverage)
    try {
      safeSetStorage(`${REAL_PACK_DATA_KEY_PREFIX}${code}`, JSON.stringify({
        packageInfo: packData.packageInfo,
        vocabularyCount: packData.vocabularyCount,
        rootsCount: packData.rootsIndex?.length || 0,
        vocabulary: Array.isArray(packData.vocabulary) ? packData.vocabulary : [],
        cachedAt: Date.now(),
      }));
    } catch {
      try {
        safeSetStorage(`${REAL_PACK_DATA_KEY_PREFIX}${code}`, JSON.stringify({
          packageInfo: packData.packageInfo,
          vocabularyCount: packData.vocabularyCount,
          rootsCount: packData.rootsIndex?.length || 0,
          vocabulary: Array.isArray(packData.vocabulary) ? packData.vocabulary.slice(0, 600) : [],
          cachedAt: Date.now(),
        }));
      } catch {}
    }

    if (onProgress) onProgress(100);

    const installed = getInstalledPacks();
    if (!installed.includes(code)) {
      installed.push(code);
      safeSetStorage(INSTALLED_PACKS_KEY, JSON.stringify(installed));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tarjuman-packs-changed'));
    }
  } catch (err: any) {
    console.warn(`Pack download notice for ${code}, registering built-in core pack:`, err?.message);
    const installed = getInstalledPacks();
    if (!installed.includes(code)) {
      installed.push(code);
      safeSetStorage(INSTALLED_PACKS_KEY, JSON.stringify(installed));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tarjuman-packs-changed'));
    }
    if (onProgress) onProgress(100);
  }
}

// Helper to trigger direct browser download of the real .json package file onto the user device
export function downloadPackFileToDevice(code: string): void {
  const pack = AVAILABLE_PACKS.find((p) => p.code === code);
  const downloadUrl = pack?.downloadApiUrl || `/api/packs/download/${code}`;

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `tarjuman_pack_${code}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function deleteLanguagePack(code: string): void {
  if (code === 'ar') return;
  const installed = getInstalledPacks().filter((c) => c !== code);
  safeSetStorage(INSTALLED_PACKS_KEY, JSON.stringify(installed));
  safeRemoveStorage(`${REAL_PACK_DATA_KEY_PREFIX}${code}`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tarjuman-packs-changed'));
  }
}

// ============================================================================
// LANGUAGE DETECTION & MORPHOLOGICAL HELPERS
// ============================================================================

export function detectLanguageOffline(text: string): string {
  const s = text.trim();
  if (/[\u0600-\u06FF]/.test(s)) return 'ar';
  if (/[\u0400-\u04FF]/.test(s)) return 'ru';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(s)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(s)) return 'zh';
  if (/[ğüşöçıİĞÜŞÖÇ]/.test(s)) return 'tr';
  if (/[ñ¿¡áéíóú]/i.test(s) && !/[àâçéèêëîïôûù]/i.test(s)) return 'es';
  if (/[ßäöü]/i.test(s)) return 'de';
  if (/[àâçéèêëîïôûùœ]/i.test(s)) return 'fr';

  const padded = ` ${s.toLowerCase()} `;
  if (/\b(bonjour|salut|merci|je suis|je veux|comment allez|s'il vous|avec|pourquoi|où est)\b/.test(padded)) return 'fr';
  if (/\b(hola|gracias|por favor|buenos dias|buenas tardes|como estas|donde esta|quiero|necesito)\b/.test(padded)) return 'es';
  if (/\b(hallo|danke|bitte|guten morgen|guten tag|wie geht|ich bin|ich möchte|wo ist)\b/.test(padded)) return 'de';
  if (/\b(merhaba|tesekkur|nasilsin|nerede|istiyorum|evet|hayir|gunaydin)\b/.test(padded)) return 'tr';
  if (/\b(ciao|grazie|per favore|buongiorno|come stai|dove|voglio|ho bisogno)\b/.test(padded)) return 'it';
  return 'en';
}

function cleanTargetValue(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, '')
    .split('/')[0]
    .trim();
}

// Expand common English contractions for crisp word-by-word & phrase translation
function expandEnglishContractions(text: string): string {
  return text
    .replace(/\bi'm\b/gi, 'i am')
    .replace(/\byou're\b/gi, 'you are')
    .replace(/\bwe're\b/gi, 'we are')
    .replace(/\bthey're\b/gi, 'they are')
    .replace(/\bthere're\b/gi, 'there are')
    .replace(/\bhe's\b/gi, 'he is')
    .replace(/\bshe's\b/gi, 'she is')
    .replace(/\bit's\b/gi, 'it is')
    .replace(/\bwhat's\b/gi, 'what is')
    .replace(/\bwhere's\b/gi, 'where is')
    .replace(/\bwho's\b/gi, 'who is')
    .replace(/\bhow's\b/gi, 'how is')
    .replace(/\bthat's\b/gi, 'that is')
    .replace(/\bthere's\b/gi, 'there is')
    .replace(/\bhere's\b/gi, 'here is')
    .replace(/\bi've\b/gi, 'i have')
    .replace(/\byou've\b/gi, 'you have')
    .replace(/\bwe've\b/gi, 'we have')
    .replace(/\bthey've\b/gi, 'they have')
    .replace(/\bi'll\b/gi, 'i will')
    .replace(/\byou'll\b/gi, 'you will')
    .replace(/\bwe'll\b/gi, 'we will')
    .replace(/\bthey'll\b/gi, 'they will')
    .replace(/\bhe'll\b/gi, 'he will')
    .replace(/\bshe'll\b/gi, 'she will')
    .replace(/\bi'd\b/gi, 'i would')
    .replace(/\byou'd\b/gi, 'you would')
    .replace(/\bwe'd\b/gi, 'we would')
    .replace(/\bthey'd\b/gi, 'they would')
    .replace(/\bdon't\b/gi, 'do not')
    .replace(/\bdoesn't\b/gi, 'does not')
    .replace(/\bdidn't\b/gi, 'did not')
    .replace(/\bcan't\b/gi, 'cannot')
    .replace(/\bwon't\b/gi, 'will not')
    .replace(/\bwouldn't\b/gi, 'would not')
    .replace(/\bshouldn't\b/gi, 'should not')
    .replace(/\bisn't\b/gi, 'is not')
    .replace(/\baren't\b/gi, 'are not')
    .replace(/\bwasn't\b/gi, 'was not')
    .replace(/\bweren't\b/gi, 'were not')
    .replace(/\bhaven't\b/gi, 'have not')
    .replace(/\bhasn't\b/gi, 'has not')
    .replace(/\bgonna\b/gi, 'going to')
    .replace(/\bwanna\b/gi, 'want to')
    .replace(/\bgotta\b/gi, 'have to')
    .replace(/\blet's\b/gi, 'let us');
}

function directIndexLookup(query: string, sourceLang: string, targetLang: string): UnifiedRecord | null {
  const clean = normalizeLookupKey(query);
  if (!clean) return null;

  if (sourceLang && sourceLang !== 'auto') {
    const langSpecific = LANG_TEXT_MAP.get(`${sourceLang}:${clean}`);
    if (langSpecific && langSpecific.translations[targetLang]) return langSpecific;
  }

  const exact = UNIVERSAL_TEXT_MAP.get(clean);
  if (exact && exact.translations[targetLang]) return exact;

  if (/[\u0600-\u06FF]/.test(clean)) {
    const normAr = normalizeArabic(clean);
    const arLangRec = LANG_TEXT_MAP.get(`ar:${normAr}`);
    if (arLangRec && arLangRec.translations[targetLang]) return arLangRec;
    const arRec = UNIVERSAL_TEXT_MAP.get(normAr);
    if (arRec && arRec.translations[targetLang]) return arRec;
  }

  const packVal = lookupPackItem(clean, sourceLang, targetLang);
  if (packVal) {
    return { translations: { [targetLang]: packVal } };
  }

  return null;
}

function conjugateArabicFirstPerson(arText: string): string {
  const trimmed = arText.trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split(/\s+/);
  const first = parts[0];
  if (first.startsWith('يأ') && first.length >= 3) {
    parts[0] = 'آ' + first.slice(2);
  } else if (first.startsWith('ي') && first.length >= 3 && !first.startsWith('يو')) {
    parts[0] = 'أ' + first.slice(1);
  }
  return parts.join(' ');
}

function conjugateArabicSecondPerson(arText: string): string {
  const trimmed = arText.trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split(/\s+/);
  const first = parts[0];
  if (first.startsWith('ي') && first.length >= 3) {
    parts[0] = 'ت' + first.slice(1);
  }
  return parts.join(' ');
}

function smoothTranslatedGrammar(text: string, _sourceLang: string, targetLang: string): string {
  let res = text;
  if (targetLang === 'ar') {
    // Move Arabic 'جداً' after the adjective (since \b does not match Arabic letters)
    res = res.replace(/(^|\s)جداً\s+([^\s،.؟!]+)/g, '$1$2 جداً');
    // Attach Arabic conjunction 'و' directly to the next word ('كتاب و قلم' -> 'كتاب وقلم')
    res = res.replace(/(^|\s)و\s+([^\s])/g, '$1و$2');
    // Deduplicate doubled words like 'في في'
    res = res.replace(/(^|\s)([^\s]+)\s+\2(?=\s|$)/g, '$1$2');
  } else if (targetLang === 'en') {
    res = res.replace(/\b([^\s]+)\s+very\b/gi, 'very $1');
    res = res.replace(/\b(this|that|these|those|my|your|his|her|our|their)\s+the\b/gi, '$1');
    res = res.replace(/\bthe the\b/gi, 'the');
    res = res.replace(/\bto to\b/gi, 'to');
    if (res.length > 0) {
      res = res.charAt(0).toUpperCase() + res.slice(1);
    }
  }
  return res.replace(/\s+([.,?!؛:،؟])/g, '$1').trim();
}

// Phonetic Transliteration Fallback so out-of-vocabulary proper nouns/names always render in target script
function transliterateLatinToArabic(word: string): string {
  const lower = word.toLowerCase();
  const digraphs: Array<[RegExp, string]> = [
    [/sh/g, 'ش'],
    [/ch/g, 'تش'],
    [/th/g, 'ث'],
    [/ph/g, 'ف'],
    [/kh/g, 'خ'],
    [/gh/g, 'غ'],
    [/oo|ou/g, 'و'],
    [/ee|ea/g, 'ي'],
    [/tion/g, 'شن'],
  ];
  let w = lower;
  for (const [rx, rep] of digraphs) {
    w = w.replace(rx, rep);
  }
  const map: Record<string, string> = {
    a: 'ا', b: 'ب', c: 'ك', d: 'د', e: 'ي', f: 'ف', g: 'ج', h: 'ه',
    i: 'ي', j: 'ج', k: 'ك', l: 'ل', m: 'م', n: 'ن', o: 'و', p: 'ب',
    q: 'ق', r: 'ر', s: 'س', t: 'ت', u: 'و', v: 'ف', w: 'و', x: 'كس',
    y: 'ي', z: 'ز',
  };
  let out = '';
  for (const ch of w) {
    out += map[ch] ?? ch;
  }
  return out;
}

function transliterateArabicToLatin(word: string): string {
  const norm = word.replace(/[\u064B-\u065F\u0670]/g, '');
  const map: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'y', 'ؤ': 'w',
  };
  let out = '';
  for (const ch of norm) {
    out += map[ch] ?? ch;
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// Morphological single-term lookup supporting English inflections & Arabic prefixes/suffixes/plurals
function lookupSingleTerm(term: string, sourceLang: string, targetLang: string, depth: number = 0): string | null {
  if (depth > 2) return null;
  const clean = normalizeLookupKey(term);
  if (!clean) return null;

  // Convert Eastern Arabic digits <-> Western digits cleanly
  if (/^[0-9٠-٩]+([.,][0-9٠-٩]+)?$/.test(clean)) {
    const western = clean.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    return western;
  }

  // 1. Direct lookup
  const direct = directIndexLookup(clean, sourceLang, targetLang);
  if (direct && direct.translations[targetLang]) {
    return cleanTargetValue(direct.translations[targetLang]);
  }

  // 2. Arabic morphological decomposition (prefixes, suffixes, feminine, plurals, verbs)
  if (/[\u0600-\u06FF]/.test(clean)) {
    const normAr = normalizeArabic(clean);

    // Strip leading 'ال' -> e.g., الكتاب -> the book
    if (normAr.startsWith('ال') && normAr.length > 3) {
      const base = normAr.substring(2);
      const val = lookupSingleTerm(base, 'ar', targetLang, depth + 1);
      if (val) {
        if (targetLang === 'en') {
          return val.toLowerCase().startsWith('the ') ? val : `the ${val}`;
        }
        return val;
      }
    }

    // Try feminine 'ة' stripping on original clean token (e.g., جديدة -> جديد, كبيرة -> كبير)
    if (clean.endsWith('ة') && clean.length > 3) {
      const mascRec = directIndexLookup(normAr.slice(0, -1), 'ar', targetLang);
      if (mascRec && mascRec.translations[targetLang]) {
        return cleanTargetValue(mascRec.translations[targetLang]);
      }
    }

    // Try plural suffix stripping: ات / ون / ين
    if (normAr.endsWith('ات') && normAr.length > 4) {
      const base = normAr.slice(0, -2);
      const plurRec = directIndexLookup(base + 'ة', 'ar', targetLang) || directIndexLookup(base, 'ar', targetLang);
      if (plurRec && plurRec.translations[targetLang]) {
        return cleanTargetValue(plurRec.translations[targetLang]);
      }
    }
    if ((normAr.endsWith('ون') || normAr.endsWith('ين')) && normAr.length > 4) {
      const base = normAr.slice(0, -2);
      const plurRec = directIndexLookup(base, 'ar', targetLang);
      if (plurRec && plurRec.translations[targetLang]) {
        return cleanTargetValue(plurRec.translations[targetLang]);
      }
    }

    // Try Arabic verb conjugation prefix normalization (أ/ت/ن -> ي)
    if (/^[اتن]/.test(normAr) && normAr.length >= 4) {
      const verbRec = directIndexLookup('ي' + normAr.slice(1), 'ar', targetLang);
      if (verbRec && verbRec.translations[targetLang]) {
        return cleanTargetValue(verbRec.translations[targetLang]);
      }
    }

    // Handle attached conjunctions & prepositions: و (and), ف (so), ب (with/by), ل (to/for), س (will)
    const arPrefixMap: Array<{ prefix: string; enPrefix: string; frPrefix: string; esPrefix: string; dePrefix: string; trPrefix: string }> = [
      { prefix: 'وال', enPrefix: 'and the ', frPrefix: 'et le ', esPrefix: 'y el ', dePrefix: 'und der ', trPrefix: 've ' },
      { prefix: 'بال', enPrefix: 'with the ', frPrefix: 'avec le ', esPrefix: 'con el ', dePrefix: 'mit dem ', trPrefix: 'ile ' },
      { prefix: 'كال', enPrefix: 'like the ', frPrefix: 'comme le ', esPrefix: 'como el ', dePrefix: 'wie ', trPrefix: 'gibi ' },
      { prefix: 'لل', enPrefix: 'to the ', frPrefix: 'au ', esPrefix: 'al ', dePrefix: 'zum ', trPrefix: 'için ' },
      { prefix: 'و', enPrefix: 'and ', frPrefix: 'et ', esPrefix: 'y ', dePrefix: 'und ', trPrefix: 've ' },
      { prefix: 'ف', enPrefix: 'so ', frPrefix: 'donc ', esPrefix: 'entonces ', dePrefix: 'also ', trPrefix: '' },
      { prefix: 'ب', enPrefix: 'with ', frPrefix: 'avec ', esPrefix: 'con ', dePrefix: 'mit ', trPrefix: '' },
      { prefix: 'ل', enPrefix: 'for ', frPrefix: 'pour ', esPrefix: 'para ', dePrefix: 'für ', trPrefix: '' },
      { prefix: 'س', enPrefix: 'will ', frPrefix: 'va ', esPrefix: 'va a ', dePrefix: 'wird ', trPrefix: '' },
    ];

    for (const p of arPrefixMap) {
      if (normAr.startsWith(p.prefix) && normAr.length > p.prefix.length + 2) {
        const rest = normAr.substring(p.prefix.length);
        const val = lookupSingleTerm(rest, 'ar', targetLang, depth + 1);
        if (val) {
          const pre =
            targetLang === 'en' ? p.enPrefix :
            targetLang === 'fr' ? p.frPrefix :
            targetLang === 'es' ? p.esPrefix :
            targetLang === 'de' ? p.dePrefix :
            targetLang === 'tr' ? p.trPrefix : p.enPrefix;
          if (targetLang === 'en' && pre.endsWith('the ') && val.toLowerCase().startsWith('the ')) {
            return `${pre.slice(0, -4)}${val}`;
          }
          return `${pre}${val}`;
        }
      }
    }

    // Handle Arabic possessive & object suffixes: كتابي (my book), اسمك (your name), بيتنا (our house)
    const arSuffixMap: Array<{ suffix: string; en: string; fr: string; es: string; de: string; tr: string }> = [
      { suffix: 'ني', en: 'me ', fr: 'me ', es: 'me ', de: 'mich ', tr: 'beni ' },
      { suffix: 'ي', en: 'my ', fr: 'mon ', es: 'mi ', de: 'mein ', tr: 'benim ' },
      { suffix: 'ك', en: 'your ', fr: 'ton ', es: 'tu ', de: 'dein ', tr: 'senin ' },
      { suffix: 'نا', en: 'our ', fr: 'notre ', es: 'nuestro ', de: 'unser ', tr: 'bizim ' },
      { suffix: 'ها', en: 'her ', fr: 'son ', es: 'su ', de: 'ihr ', tr: 'onun ' },
      { suffix: 'هم', en: 'their ', fr: 'leur ', es: 'su ', de: 'ihr ', tr: 'onların ' },
      { suffix: 'ه', en: 'his ', fr: 'son ', es: 'su ', de: 'sein ', tr: 'onun ' },
    ];
    for (const s of arSuffixMap) {
      // Never confuse feminine 'ة' (e.g. جديدة) with masculine possessive 'ه' (his)!
      if (s.suffix === 'ه' && clean.endsWith('ة')) continue;
      if (normAr.endsWith(s.suffix) && normAr.length > s.suffix.length + 2) {
        const stem = normAr.slice(0, -s.suffix.length);
        const rec = directIndexLookup(stem, 'ar', targetLang) ||
                    (stem.endsWith('ت') ? directIndexLookup(stem.slice(0, -1) + 'ة', 'ar', targetLang) : null);
        if (rec && rec.translations[targetLang]) {
          const val = cleanTargetValue(rec.translations[targetLang]);
          const poss =
            targetLang === 'en' ? s.en :
            targetLang === 'fr' ? s.fr :
            targetLang === 'es' ? s.es :
            targetLang === 'de' ? s.de :
            targetLang === 'tr' ? s.tr : '';
          return poss ? `${poss}${val}` : val;
        }
      }
    }

    // Standard fallback lookup in ARABIC_REVERSE_INDEX
    const arMatch = ARABIC_REVERSE_INDEX[clean] || ARABIC_REVERSE_INDEX[normAr];
    if (arMatch) {
      const val = targetLang === 'en' ? arMatch.en : arMatch[targetLang];
      if (val) return cleanTargetValue(val);
    }
  } else {
    // 3. English & Latin morphological stemming
    const normGen = normalizeGeneral(clean);
    const stemCandidates: string[] = [normGen];

    if (normGen.endsWith("'s") && normGen.length > 3) stemCandidates.push(normGen.slice(0, -2));
    if (normGen.endsWith('ies') && normGen.length > 4) stemCandidates.push(normGen.slice(0, -3) + 'y');
    if (normGen.endsWith('es') && normGen.length > 3) stemCandidates.push(normGen.slice(0, -2));
    if (normGen.endsWith('s') && normGen.length > 3) stemCandidates.push(normGen.slice(0, -1));
    if (normGen.endsWith('ied') && normGen.length > 4) stemCandidates.push(normGen.slice(0, -3) + 'y');
    if (normGen.endsWith('ed') && normGen.length > 4) {
      stemCandidates.push(normGen.slice(0, -2));
      stemCandidates.push(normGen.slice(0, -1)); // e.g., loved -> love
    }
    if (normGen.endsWith('ing') && normGen.length > 5) {
      stemCandidates.push(normGen.slice(0, -3));
      stemCandidates.push(normGen.slice(0, -3) + 'e'); // e.g., making -> make
    }
    if (normGen.endsWith('ly') && normGen.length > 4) {
      stemCandidates.push(normGen.slice(0, -2));
    }

    for (const candidate of stemCandidates) {
      const rec = directIndexLookup(candidate, sourceLang, targetLang);
      if (rec && rec.translations[targetLang]) {
        return cleanTargetValue(rec.translations[targetLang]);
      }
    }
  }

  return null;
}

function fallbackWordTranslate(rawWord: string, targetLang: string): string {
  if (/^[0-9٠-٩.,]+$/.test(rawWord)) {
    return rawWord.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  }
  if (/[\u0600-\u06FF]/.test(rawWord) && targetLang !== 'ar') {
    return transliterateArabicToLatin(rawWord);
  }
  if (/^[a-zA-Z]+$/.test(rawWord) && targetLang === 'ar') {
    return transliterateLatinToArabic(rawWord);
  }
  return rawWord;
}

// Translate an arbitrary inner phrase recursively (used inside sentence templates!)
function translatePhraseBody(phrase: string, sourceLang: string, targetLang: string): string {
  const res = translateSingleClause(phrase, sourceLang, targetLang);
  return res.translatedText;
}

function translateSingleClause(
  clause: string,
  sourceLang: string,
  targetLang: string
): { translatedText: string; detectedLanguage: string; alternatives?: string[]; explanation?: string } {
  const trimmed = clause.trim();
  if (!trimmed) return { translatedText: '', detectedLanguage: sourceLang };

  const detected = sourceLang === 'auto' ? detectLanguageOffline(trimmed) : sourceLang;

  // Handle same-language edge case
  if (detected === targetLang) {
    return { translatedText: trimmed, detectedLanguage: detected };
  }

  const expanded = detected === 'en' ? expandEnglishContractions(trimmed) : trimmed;
  const lower = expanded.toLowerCase();
  const normAr = normalizeArabic(trimmed);

  // 1. Direct full-phrase match in Universal Index
  const fullMatch = directIndexLookup(expanded, detected, targetLang) || directIndexLookup(trimmed, detected, targetLang);
  if (fullMatch && fullMatch.translations[targetLang]) {
    return {
      translatedText: cleanTargetValue(fullMatch.translations[targetLang]),
      detectedLanguage: detected,
      alternatives: fullMatch.alternatives,
      explanation: fullMatch.explanationAr,
    };
  }

  // 2. Grammar-Aware Sentence Templates (Arabic -> Target)
  if (detected === 'ar') {
    const arPatterns: Array<{
      regex: RegExp;
      build: (m: RegExpMatchArray, entityTranslated: string) => string;
      note: string;
    }> = [
      {
        regex: /^(?:اين يقع|اين يوجد|اين|وين)\s+(.+?)[؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `Where is ${ent}?` :
          targetLang === 'fr' ? `Où est ${ent} ?` :
          targetLang === 'es' ? `¿Dónde está ${ent}?` :
          targetLang === 'de' ? `Wo ist ${ent}?` :
          targetLang === 'tr' ? `${ent} nerede?` :
          targetLang === 'it' ? `Dov'è ${ent}?` :
          targetLang === 'ru' ? `Где ${ent}?` : `Where is ${ent}?`,
        note: 'تمت الترجمة بنمط الاستفهام المكاني أوفلاين ⚡',
      },
      {
        regex: /^(?:اريد ان|ارغب في ان|اود ان)\s+(.+?)[.!؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `I want to ${ent}` :
          targetLang === 'fr' ? `Je veux ${ent}` :
          targetLang === 'es' ? `Quiero ${ent}` :
          targetLang === 'de' ? `Ich möchte ${ent}` :
          targetLang === 'tr' ? `${ent} istiyorum` :
          targetLang === 'it' ? `Voglio ${ent}` :
          targetLang === 'ru' ? `Я хочу ${ent}` : `I want to ${ent}`,
        note: 'تمت الترجمة بنمط الرغبة الفعلية أوفلاين ⚡',
      },
      {
        regex: /^(?:اريد|ابغي|بدي|ارغب في)\s+(.+?)[.!؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `I want ${ent}` :
          targetLang === 'fr' ? `Je veux ${ent}` :
          targetLang === 'es' ? `Quiero ${ent}` :
          targetLang === 'de' ? `Ich möchte ${ent}` :
          targetLang === 'tr' ? `${ent} istiyorum` :
          targetLang === 'it' ? `Voglio ${ent}` :
          targetLang === 'ru' ? `Я хочу ${ent}` : `I want ${ent}`,
        note: 'تمت الترجمة بنمط الرغبة والطلب أوفلاين ⚡',
      },
      {
        regex: /^(?:احتاج الي ان|احتاج الى ان|احتاج ان)\s+(.+?)[.!؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `I need to ${ent}` :
          targetLang === 'fr' ? `J'ai besoin de ${ent}` :
          targetLang === 'es' ? `Necesito ${ent}` :
          targetLang === 'de' ? `Ich muss ${ent}` :
          targetLang === 'tr' ? `${ent} gerekiyor` : `I need to ${ent}`,
        note: 'تمت الترجمة بنمط الاحتياج الفعلي أوفلاين ⚡',
      },
      {
        regex: /^(?:احتاج الي|احتاج الى|احتاج)\s+(.+?)[.!؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `I need ${ent}` :
          targetLang === 'fr' ? `J'ai besoin de ${ent}` :
          targetLang === 'es' ? `Necesito ${ent}` :
          targetLang === 'de' ? `Ich brauche ${ent}` :
          targetLang === 'tr' ? `${ent} ihtiyacım var` :
          targetLang === 'it' ? `Ho bisogno di ${ent}` :
          targetLang === 'ru' ? `Мне нужно ${ent}` : `I need ${ent}`,
        note: 'تمت الترجمة بنمط الاحتياج أوفلاين ⚡',
      },
      {
        regex: /^(?:كم سعر|كم ثمن|بكم|كم تكلفه|كم تكلفة)\s+(.+?)[؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `How much is ${ent}?` :
          targetLang === 'fr' ? `Combien coûte ${ent} ?` :
          targetLang === 'es' ? `¿Cuánto cuesta ${ent}?` :
          targetLang === 'de' ? `Wie viel kostet ${ent}?` :
          targetLang === 'tr' ? `${ent} ne kadar?` :
          targetLang === 'it' ? `Quanto costa ${ent}?` :
          targetLang === 'ru' ? `Сколько стоит ${ent}?` : `How much is ${ent}?`,
        note: 'تمت الترجمة بنمط السؤال عن السعر أوفلاين ⚡',
      },
      {
        regex: /^(?:هل يمكنك|هل تستطيع|ممكن)\s+(.+?)[؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `Can you ${ent}?` :
          targetLang === 'fr' ? `Pouvez-vous ${ent} ?` :
          targetLang === 'es' ? `¿Puedes ${ent}?` :
          targetLang === 'de' ? `Können Sie ${ent}?` :
          targetLang === 'tr' ? `${ent} yapabilir misiniz?` : `Can you ${ent}?`,
        note: 'تمت الترجمة بنمط الطلب المهذب أوفلاين ⚡',
      },
      {
        regex: /^(?:هل لديك|هل عندك|هل يوجد)\s+(.+?)[؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `Do you have ${ent}?` :
          targetLang === 'fr' ? `Avez-vous ${ent} ?` :
          targetLang === 'es' ? `¿Tienes ${ent}?` :
          targetLang === 'de' ? `Haben Sie ${ent}?` :
          targetLang === 'tr' ? `${ent} var mı?` : `Do you have ${ent}?`,
        note: 'تمت الترجمة بنمط السؤال عن التوفر أوفلاين ⚡',
      },
      {
        regex: /^(?:اسمي هو|اسمي)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `My name is ${ent}` :
          targetLang === 'fr' ? `Je m'appelle ${ent}` :
          targetLang === 'es' ? `Me llamo ${ent}` :
          targetLang === 'de' ? `Mein Name ist ${ent}` :
          targetLang === 'tr' ? `Benim adım ${ent}` : `My name is ${ent}`,
        note: 'تمت الترجمة بنمط التعريف بالنفس أوفلاين ⚡',
      },
      {
        regex: /^(?:شكرا علي|شكرا على|شكرا ل)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `Thank you for ${ent}` :
          targetLang === 'fr' ? `Merci pour ${ent}` :
          targetLang === 'es' ? `Gracias por ${ent}` :
          targetLang === 'de' ? `Danke für ${ent}` :
          targetLang === 'tr' ? `${ent} için teşekkürler` : `Thank you for ${ent}`,
        note: 'تمت الترجمة بنمط الشكر أوفلاين ⚡',
      },
      {
        regex: /^(?:انا من|أنا من)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `I am from ${ent}` :
          targetLang === 'fr' ? `Je suis de ${ent}` :
          targetLang === 'es' ? `Soy de ${ent}` :
          targetLang === 'de' ? `Ich komme aus ${ent}` :
          targetLang === 'tr' ? `Ben ${ent} geliyorum` : `I am from ${ent}`,
        note: 'تمت الترجمة بنمط الجنسية والموطن أوفلاين ⚡',
      },
      {
        regex: /^(?:لا اريد ان|لا أريد أن)\s+(.+?)[.!؟?]?$/,
        build: (_m, ent) => {
          const cleanEnt = ent.replace(/^to\s+/i, '');
          return targetLang === 'en' ? `I don't want to ${cleanEnt}` :
            targetLang === 'fr' ? `Je ne veux pas ${cleanEnt}` :
            targetLang === 'es' ? `No quiero ${cleanEnt}` :
            targetLang === 'de' ? `Ich möchte nicht ${cleanEnt}` :
            targetLang === 'tr' ? `${cleanEnt} istemiyorum` : `I don't want to ${cleanEnt}`;
        },
        note: 'تمت الترجمة بنمط النفي الفعلي أوفلاين ⚡',
      },
      {
        regex: /^(?:لا اريد|لا أريد)\s+(.+?)[.!؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `I don't want ${ent}` :
          targetLang === 'fr' ? `Je ne veux pas ${ent}` :
          targetLang === 'es' ? `No quiero ${ent}` :
          targetLang === 'de' ? `Ich möchte kein ${ent}` :
          targetLang === 'tr' ? `${ent} istemiyorum` : `I don't want ${ent}`,
        note: 'تمت الترجمة بنمط النفي أوفلاين ⚡',
      },
      {
        regex: /^(?:لا احب|لا أحب)\s+(.+?)[.!؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `I don't like ${ent}` :
          targetLang === 'fr' ? `Je n'aime pas ${ent}` :
          targetLang === 'es' ? `No me gusta ${ent}` :
          targetLang === 'de' ? `Ich mag ${ent} nicht` :
          targetLang === 'tr' ? `${ent} sevmiyorum` : `I don't like ${ent}`,
        note: 'تمت الترجمة بنمط النفي أوفلاين ⚡',
      },
      {
        regex: /^(?:كيف يمكنني|كيف استطيع|كيف أستطيع)\s+(.+?)[؟?]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `How can I ${ent.replace(/^to\s+/i, '')}?` :
          targetLang === 'fr' ? `Comment puis-je ${ent} ?` :
          targetLang === 'es' ? `¿Cómo puedo ${ent}?` :
          targetLang === 'de' ? `Wie kann ich ${ent}?` : `How can I ${ent}?`,
        note: 'تمت الترجمة بنمط السؤال عن الكيفية أوفلاين ⚡',
      },
      {
        regex: /^(?:انا احب|احب|أحب)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'en' ? `I love ${ent}` :
          targetLang === 'fr' ? `J'aime ${ent}` :
          targetLang === 'es' ? `Me encanta ${ent}` :
          targetLang === 'de' ? `Ich liebe ${ent}` :
          targetLang === 'tr' ? `${ent} seviyorum` : `I love ${ent}`,
        note: 'تمت الترجمة بنمط التعبير عن الإعجاب أوفلاين ⚡',
      },
      {
        regex: /^(?:هل)\s+(.+?)[؟?]?$/,
        build: (m, ent) => {
          if (targetLang === 'en') {
            if (/^(?:هذا|هذه|ذلك|تلك|هو|هي|هم|هنا|هناك)\b/.test(m[1])) {
              return `Is ${ent.replace(/^(?:is|are)\s+/i, '')}?`;
            }
            return `Do you ${ent.replace(/^you\s+/i, '')}?`;
          }
          return targetLang === 'fr' ? `Est-ce que ${ent} ?` :
            targetLang === 'es' ? `¿${ent}?` :
            targetLang === 'de' ? `${ent}?` :
            targetLang === 'tr' ? `${ent} mı?` : `${ent}?`;
        },
        note: 'تمت الترجمة بنمط الاستفهام العام أوفلاين ⚡',
      },
    ];

    for (const pat of arPatterns) {
      const m = normAr.match(pat.regex);
      if (m && m[1]) {
        const inner = translatePhraseBody(m[1], 'ar', targetLang);
        return {
          translatedText: pat.build(m, inner),
          detectedLanguage: 'ar',
          explanation: pat.note,
        };
      }
    }
  }

  // 3. Grammar-Aware Sentence Templates (English -> Target)
  if (detected === 'en') {
    const enPatterns: Array<{
      regex: RegExp;
      build: (m: RegExpMatchArray, entityTranslated: string) => string;
    }> = [
      {
        regex: /^(?:where is|where are)\s+(.+?)\??$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `أين ${ent}؟` :
          targetLang === 'fr' ? `Où est ${ent} ?` :
          targetLang === 'es' ? `¿Dónde está ${ent}?` :
          targetLang === 'de' ? `Wo ist ${ent}?` :
          targetLang === 'tr' ? `${ent} nerede?` : `أين ${ent}؟`,
      },
      {
        regex: /^(?:how much is|how much does|what is the price of)\s+(.+?)(?:\s+cost)?\??$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `كم سعر ${ent}؟` :
          targetLang === 'fr' ? `Combien coûte ${ent} ?` :
          targetLang === 'es' ? `¿Cuánto cuesta ${ent}?` :
          targetLang === 'de' ? `Wie viel kostet ${ent}?` :
          targetLang === 'tr' ? `${ent} ne kadar?` : `كم سعر ${ent}؟`,
      },
      {
        regex: /^(?:i want to|i would like to)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `أريد أن ${conjugateArabicFirstPerson(ent)}` :
          targetLang === 'fr' ? `Je veux ${ent}` :
          targetLang === 'es' ? `Quiero ${ent}` :
          targetLang === 'de' ? `Ich möchte ${ent}` :
          targetLang === 'tr' ? `${ent} istiyorum` : `أريد أن ${conjugateArabicFirstPerson(ent)}`,
      },
      {
        regex: /^(?:i want|i would like)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `أريد ${ent}` :
          targetLang === 'fr' ? `Je veux ${ent}` :
          targetLang === 'es' ? `Quiero ${ent}` :
          targetLang === 'de' ? `Ich möchte ${ent}` :
          targetLang === 'tr' ? `${ent} istiyorum` : `أريد ${ent}`,
      },
      {
        regex: /^(?:i need to)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `أحتاج أن ${conjugateArabicFirstPerson(ent)}` : `I need to ${ent}`,
      },
      {
        regex: /^(?:i need)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `أحتاج إلى ${ent}` :
          targetLang === 'fr' ? `J'ai besoin de ${ent}` :
          targetLang === 'es' ? `Necesito ${ent}` :
          targetLang === 'de' ? `Ich brauche ${ent}` : `أحتاج إلى ${ent}`,
      },
      {
        regex: /^(?:i do not know|i don't know)\s*(.*)$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? (ent ? `أنا لا أعرف ${ent}` : 'أنا لا أعرف') : `I don't know ${ent}`.trim(),
      },
      {
        regex: /^(?:i do not understand|i don't understand)\s*(.*)$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? (ent ? `أنا لا أفهم ${ent}` : 'أنا لا أفهم') : `I don't understand ${ent}`.trim(),
      },
      {
        regex: /^(?:can you|could you)\s+(.+?)\??$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `هل يمكنك ${ent}؟` :
          targetLang === 'fr' ? `Pouvez-vous ${ent} ?` :
          targetLang === 'es' ? `¿Puedes ${ent}?` : `هل يمكنك ${ent}؟`,
      },
      {
        regex: /^(?:do you have)\s+(.+?)\??$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `هل لديك ${ent}؟` :
          targetLang === 'fr' ? `Avez-vous ${ent} ?` : `هل لديك ${ent}؟`,
      },
      {
        regex: /^(?:do you speak)\s+(.+?)\??$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `هل تتحدث ${ent}؟` : `Do you speak ${ent}?`,
      },
      {
        regex: /^(?:do you|did you)\s+(.+?)\??$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `هل ${conjugateArabicSecondPerson(ent)}؟` : `Do you ${ent}?`,
      },
      {
        regex: /^(?:can i|could i|may i)\s+(.+?)\??$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `هل يمكنني ${ent}؟` :
          targetLang === 'fr' ? `Puis-je ${ent} ?` : `Can I ${ent}?`,
      },
      {
        regex: /^(?:how can i|how do i)\s+(.+?)\??$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `كيف يمكنني ${conjugateArabicFirstPerson(ent)}؟` :
          targetLang === 'fr' ? `Comment puis-je ${ent} ?` : `How can I ${ent}?`,
      },
      {
        regex: /^(?:please)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `من فضلك ${ent}` :
          targetLang === 'fr' ? `S'il vous plaît ${ent}` : `Please ${ent}`,
      },
      {
        regex: /^(?:don't|do not)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `لا ${conjugateArabicSecondPerson(ent)}` : `Don't ${ent}`,
      },
      {
        regex: /^(?:there is|there are)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `يوجد ${ent}` :
          targetLang === 'fr' ? `Il y a ${ent}` : `There is ${ent}`,
      },
      {
        regex: /^(?:my name is)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `اسمي ${ent}` :
          targetLang === 'fr' ? `Je m'appelle ${ent}` :
          targetLang === 'es' ? `Me llamo ${ent}` : `اسمي ${ent}`,
      },
      {
        regex: /^(?:i am from)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `أنا من ${ent}` : `I am from ${ent}`,
      },
      {
        regex: /^(?:thank you for|thanks for)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `شكراً لك على ${ent}` : `Thank you for ${ent}`,
      },
      {
        regex: /^(?:welcome to)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `مرحباً بكم في ${ent}` : `Welcome to ${ent}`,
      },
      {
        regex: /^(?:i love|i like)\s+(.+?)[.!]?$/,
        build: (_m, ent) =>
          targetLang === 'ar' ? `أنا أحب ${ent}` :
          targetLang === 'fr' ? `J'aime ${ent}` : `أنا أحب ${ent}`,
      },
    ];

    for (const pat of enPatterns) {
      const m = lower.match(pat.regex);
      if (m) {
        const inner = m[1] ? translatePhraseBody(m[1], 'en', targetLang) : '';
        return {
          translatedText: pat.build(m, inner),
          detectedLanguage: 'en',
          explanation: 'تمت الترجمة الصياغية الكاملة من حزمة الأوفلاين ⚡',
        };
      }
    }
  }

  // 4. Sliding-Window Multi-Word & Grammar-Aware Token Translation Engine
  // Tokenize into words and spaces/punctuation cleanly
  const rawTokens = expanded.split(/(\s+)/);
  const wordsOnly: Array<{ raw: string; trailingPunct: string }> = [];

  for (const part of rawTokens) {
    if (!part || /^\s+$/.test(part)) continue;
    const match = part.match(/^([.,?!؛:،"']*?)([^\s.,?!؛:،"']+)([.,?!؛:،"']*)$/);
    if (match) {
      wordsOnly.push({
        raw: match[2],
        trailingPunct: match[3] || '',
      });
    } else {
      wordsOnly.push({ raw: part, trailingPunct: '' });
    }
  }

  const outputParts: string[] = [];
  let i = 0;

  while (i < wordsOnly.length) {
    let matchedPhrase = false;

    // Try 4-word, 3-word, then 2-word sliding window
    for (let winSize = 4; winSize >= 2; winSize--) {
      if (i + winSize <= wordsOnly.length) {
        const slice = wordsOnly.slice(i, i + winSize);
        const joined = slice.map(w => w.raw).join(' ');
        const rec = directIndexLookup(joined, detected, targetLang);
        if (rec && rec.translations[targetLang]) {
          let val = cleanTargetValue(rec.translations[targetLang]);
          const lastPunct = slice[slice.length - 1].trailingPunct;
          if (lastPunct && !/[.?!؛:،؟]$/.test(val)) {
            val += targetLang === 'ar' ? lastPunct.replace('?', '؟').replace(',', '،') : lastPunct;
          }
          outputParts.push(val);
          i += winSize;
          matchedPhrase = true;
          break;
        }
      }
    }

    if (matchedPhrase) continue;

    const current = wordsOnly[i];
    const wordLower = current.raw.toLowerCase();
    const punct = targetLang === 'ar'
      ? current.trailingPunct.replace('?', '؟').replace(',', '،')
      : current.trailingPunct;

    // Latin languages -> Arabic article & copula grammatical rules
    if (targetLang === 'ar' && ['en', 'fr', 'es', 'de', 'it'].includes(detected)) {
      const indefArticles = ['a', 'an', 'un', 'une', 'una', 'ein', 'eine'];
      const defArticles = ['the', 'le', 'la', 'les', 'el', 'los', 'las', 'der', 'die', 'das', 'il', 'lo'];

      // Skip indefinite articles in Arabic output
      if (indefArticles.includes(wordLower)) {
        i++;
        continue;
      }

      // Skip English present-tense copula 'is' / 'are' / 'am' in nominal sentences
      if (detected === 'en' && (wordLower === 'is' || wordLower === 'are' || wordLower === 'am') && i > 0) {
        i++;
        continue;
      }

      // Handle definite article + [noun] -> 'ال[noun]'
      if (defArticles.includes(wordLower) && i + 1 < wordsOnly.length) {
        const nextWord = wordsOnly[i + 1];
        const nextTranslated = lookupSingleTerm(nextWord.raw, detected, targetLang);
        const nextPunct = nextWord.trailingPunct.replace('?', '؟').replace(',', '،');
        if (nextTranslated) {
          const prefixed = nextTranslated.startsWith('ال') ? nextTranslated : `ال${nextTranslated}`;
          const finalPunct = nextPunct && !/[.?!؛:،؟]$/.test(prefixed) ? nextPunct : '';
          outputParts.push(prefixed + finalPunct);
          i += 2;
          continue;
        }
      }
    }

    // Lookup single token across ALL dictionaries + morphology + phonetic transliteration fallback
    const singleTranslated = lookupSingleTerm(current.raw, detected, targetLang);
    if (singleTranslated) {
      const finalPunct = punct && !/[.?!؛:،؟]$/.test(singleTranslated) ? punct : '';
      outputParts.push(singleTranslated + finalPunct);
    } else {
      const fallback = fallbackWordTranslate(current.raw, targetLang);
      outputParts.push(fallback + punct);
    }

    i++;
  }

  const finalResult = smoothTranslatedGrammar(outputParts.join(' '), detected, targetLang);

  return {
    translatedText: finalResult,
    detectedLanguage: detected,
    explanation: '⚡ تمت المعالجة عبر محرك الترجمة الأوفلاين الشامل من حزم اللغات المثبتة بجهازك.',
  };
}

// Main Offline Translation Entry Point
export function translateOffline(
  text: string,
  sourceLang: string = 'auto',
  targetLang: string = 'ar'
): TranslationResult {
  const trimmed = text.trim();
  const enrichment = getLinguisticEnrichment(trimmed, sourceLang, targetLang);

  if (!trimmed) {
    return {
      translatedText: '',
      detectedLanguage: sourceLang,
      sourceText: text,
      sourceLang,
      targetLang,
      ...enrichment,
    };
  }

  // First try full text as one unit (in case punctuation is part of an exact phrase like "How are you?")
  const detectedWhole = sourceLang === 'auto' ? detectLanguageOffline(trimmed) : sourceLang;
  const wholeExact = directIndexLookup(trimmed, detectedWhole, targetLang);
  if (wholeExact && wholeExact.translations[targetLang]) {
    const tText = cleanTargetValue(wholeExact.translations[targetLang]);
    return {
      translatedText: tText,
      detectedLanguage: detectedWhole,
      sourceText: text,
      sourceLang: detectedWhole,
      targetLang,
      alternatives: wholeExact.alternatives || Object.values(wholeExact.translations).filter(v => v !== tText).slice(0, 3),
      explanation: wholeExact.explanationAr || 'تمت الترجمة الفورية 100% عبر ملفات حزم الأوفلاين المنزّلة في جهازك ⚡',
      ...enrichment,
    };
  }

  // Split multi-sentence text by sentence terminators or newlines while keeping clean structure
  const lines = trimmed.split(/\n+/);
  const translatedLines: string[] = [];

  for (const line of lines) {
    const clauses = line.split(/(?<=[.!?؟])\s+/);
    const translatedClauses = clauses
      .map(c => translateSingleClause(c, sourceLang, targetLang).translatedText)
      .filter(Boolean);
    translatedLines.push(translatedClauses.join(' '));
  }

  const combined = translatedLines.join('\n').trim();
  const singleRes = translateSingleClause(trimmed, sourceLang, targetLang);

  return {
    translatedText: combined || singleRes.translatedText,
    detectedLanguage: detectedWhole,
    sourceText: text,
    sourceLang: detectedWhole,
    targetLang,
    alternatives: singleRes.alternatives || ['ترجمة فورية 100% من حزمة الأوفلاين المحلية'],
    explanation: singleRes.explanation || '⚡ تمت الترجمة محلياً بالكامل عبر حزم اللغات المثبتة في جهازك.',
    ...enrichment,
  };
}
