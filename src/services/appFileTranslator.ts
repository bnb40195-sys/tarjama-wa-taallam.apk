import {
  checkOfflineTranslationEligibility,
  translateOffline,
  isOfflineModeActive,
} from './offlineEngine.ts';
import { getLocalizedLangName, getStoredAppLanguage, UI_LOCALES } from './appTranslations.ts';

export class MissingPackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingPackError';
  }
}

export type SupportedFormat =
  | 'xml'
  | 'json'
  | 'arb'
  | 'strings'
  | 'srt'
  | 'vtt'
  | 'csv'
  | 'properties'
  | 'html'
  | 'md'
  | 'txt';

export interface TranslatableEntry {
  id: string;
  label: string;
  originalText: string;
  translatedText: string;
}

export interface ParsedDocument {
  format: SupportedFormat;
  fileName: string;
  entries: TranslatableEntry[];
  rebuild: (translatedMap: Map<string, string>) => string;
}

export interface FormatSample {
  id: string;
  category: 'app' | 'file';
  title: string;
  subtitle: string;
  fileName: string;
  format: SupportedFormat;
  defaultFrom: string;
  defaultTo: string;
  content: string;
}

export const FORMAT_SAMPLES: FormatSample[] = [
  {
    id: 'android-strings',
    category: 'app',
    title: 'Android strings.xml',
    subtitle: 'ملف موارد تطبيق أندرويد',
    fileName: 'strings.xml',
    format: 'xml',
    defaultFrom: 'en',
    defaultTo: 'ar',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Smart Travel Assistant</string>
    <string name="welcome_title">Welcome back, %1$s!</string>
    <string name="search_hint">Search hotels, restaurants, or airports</string>
    <string name="btn_continue">Continue</string>
    <string name="btn_cancel">Cancel</string>
    <string name="settings_language">App Language</string>
    <string name="offline_ready">Offline mode is active</string>
    <string name="error_no_internet">No internet connection. Please check your network.</string>
</resources>`,
  },
  {
    id: 'app-json',
    category: 'app',
    title: 'App i18n JSON',
    subtitle: 'حزمة واجهة تطبيق ويب / Flutter',
    fileName: 'en.json',
    format: 'json',
    defaultFrom: 'en',
    defaultTo: 'ar',
    content: `{
  "navigation": {
    "home": "Home",
    "explore": "Explore",
    "notifications": "Notifications",
    "settings": "Settings"
  },
  "auth": {
    "signIn": "Sign in to your account",
    "forgotPassword": "Forgot password?",
    "welcomeMessage": "Hello, glad to see you again!"
  },
  "actions": {
    "save": "Save changes",
    "delete": "Delete",
    "download": "Download file"
  }
}`,
  },
  {
    id: 'ios-strings',
    category: 'app',
    title: 'iOS Localizable.strings',
    subtitle: 'ملف تعريب تطبيقات آيفون',
    fileName: 'Localizable.strings',
    format: 'strings',
    defaultFrom: 'en',
    defaultTo: 'fr',
    content: `/* Main Screen */
"home_title" = "Good morning";
"profile_edit" = "Edit profile";
"help_question" = "How can I help you today?";
"logout_confirm" = "Are you sure you want to log out?";`,
  },
  {
    id: 'subtitles-srt',
    category: 'file',
    title: 'ملف ترجمة فيديو (.SRT)',
    subtitle: 'يحافظ على التوقيت والترقيم',
    fileName: 'episode_01.srt',
    format: 'srt',
    defaultFrom: 'en',
    defaultTo: 'ar',
    content: `1
00:00:01,500 --> 00:00:04,200
Hello everyone, welcome to the central station.

2
00:00:04,800 --> 00:00:08,100
Where is the airport train ticket office?

3
00:00:08,600 --> 00:00:12,000
Thank you very much for your help today.`,
  },
  {
    id: 'csv-catalog',
    category: 'file',
    title: 'جدول بيانات (.CSV)',
    subtitle: 'ترجمة خلايا الجداول مع الحفاظ على الأعمدة',
    fileName: 'products.csv',
    format: 'csv',
    defaultFrom: 'en',
    defaultTo: 'ar',
    content: `Item,Category,Status,Price
Hotel Room,Travel,Open,120
Airport Taxi,Transport,Available,35
Coffee Shop,Food,Closed,5`,
  },
  {
    id: 'text-doc',
    category: 'file',
    title: 'مستند نصي (.TXT)',
    subtitle: 'ترجمة المستندات والمقالات سطراً بسطر',
    fileName: 'travel_guide.txt',
    format: 'txt',
    defaultFrom: 'en',
    defaultTo: 'ar',
    content: `Welcome to our city travel guide.
Please keep your passport and hotel reservation ready.
You can ask at the information center if you need help.
Have a good day!`,
  },
];

export function detectFormat(fileName: string, content: string): SupportedFormat {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'xml') return 'xml';
  if (ext === 'arb') return 'arb';
  if (ext === 'json') return 'json';
  if (ext === 'strings') return 'strings';
  if (ext === 'srt') return 'srt';
  if (ext === 'vtt') return 'vtt';
  if (ext === 'csv') return 'csv';
  if (ext === 'properties' || ext === 'ini' || ext === 'env') return 'properties';
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'md' || ext === 'markdown') return 'md';
  if (ext === 'txt') return 'txt';

  const trimmed = content.trim();
  if (trimmed.startsWith('<?xml') || /<resources[\s>]/i.test(trimmed)) return 'xml';
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {}
  }
  if (/^WEBVTT/m.test(trimmed)) return 'vtt';
  if (/^\d+\s*\r?\n\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/m.test(trimmed)) return 'srt';
  if (/^"[^"]+"\s*=\s*"[^"]*";/m.test(trimmed)) return 'strings';
  if (/<(html|body|p|div|h1|h2|span)\b/i.test(trimmed)) return 'html';
  return 'txt';
}

function unescapeXml(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function shouldSkipNonTranslatableString(value: string): boolean {
  const s = value.trim();
  if (!s) return true;
  if (/^https?:\/\/\S+$/i.test(s)) return true;
  if (/^[0-9.,:%+\-/*\s]+$/.test(s)) return true;
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return true;
  return false;
}

function parseXmlDocument(content: string, fileName: string): ParsedDocument {
  const entries: TranslatableEntry[] = [];
  const tokenMap = new Map<string, string>();
  let idx = 0;

  // Match <string name="..." ...>value</string> and <item ...>value</item>
  const regex = /(<(string|item)\b([^>]*)>)([\s\S]*?)(<\/\2>)/g;
  const template = content.replace(regex, (fullMatch, openTag, tagName, attrs, inner, closeTag) => {
    if (/translatable\s*=\s*["']false["']/i.test(attrs)) {
      return fullMatch;
    }
    const cleanText = unescapeXml(inner.trim());
    if (shouldSkipNonTranslatableString(cleanText)) {
      return fullMatch;
    }
    const nameMatch = attrs.match(/\bname\s*=\s*["']([^"']+)["']/i);
    const id = `xml_${idx++}`;
    const label = nameMatch ? nameMatch[1] : `${tagName}#${idx}`;
    entries.push({
      id,
      label,
      originalText: cleanText,
      translatedText: '',
    });
    const placeholder = `__TARJAMA_XML_SLOT_${id}__`;
    tokenMap.set(placeholder, id);
    return `${openTag}${placeholder}${closeTag}`;
  });

  // Fallback for generic XML elements with text if no <string>/<item> found
  if (entries.length === 0) {
    const genericRegex = /(<([a-zA-Z0-9_:-]+)\b[^>]*>)([^<>]+)(<\/\2>)/g;
    const genericTemplate = content.replace(genericRegex, (fullMatch, openTag, tagName, inner, closeTag) => {
      const cleanText = unescapeXml(inner.trim());
      if (shouldSkipNonTranslatableString(cleanText)) return fullMatch;
      const id = `xml_${idx++}`;
      entries.push({ id, label: tagName, originalText: cleanText, translatedText: '' });
      const placeholder = `__TARJAMA_XML_SLOT_${id}__`;
      tokenMap.set(placeholder, id);
      return `${openTag}${placeholder}${closeTag}`;
    });

    return {
      format: 'xml',
      fileName,
      entries,
      rebuild: (translatedMap) => {
        let out = genericTemplate;
        for (const [slot, id] of tokenMap.entries()) {
          const entry = entries.find((e) => e.id === id);
          const val = translatedMap.get(id) ?? entry?.originalText ?? '';
          out = out.replace(slot, escapeXml(val));
        }
        return out;
      },
    };
  }

  return {
    format: 'xml',
    fileName,
    entries,
    rebuild: (translatedMap) => {
      let out = template;
      for (const [slot, id] of tokenMap.entries()) {
        const entry = entries.find((e) => e.id === id);
        const val = translatedMap.get(id) ?? entry?.originalText ?? '';
        out = out.replace(slot, escapeXml(val));
      }
      return out;
    },
  };
}

function parseJsonDocument(content: string, fileName: string, format: 'json' | 'arb'): ParsedDocument {
  let root: any;
  try {
    root = JSON.parse(content);
  } catch {
    return parseLineTextDocument(content, fileName, 'txt');
  }

  const entries: TranslatableEntry[] = [];
  const pathById = new Map<string, Array<string | number>>();
  let idx = 0;

  const walk = (node: any, currentPath: Array<string | number>) => {
    if (typeof node === 'string') {
      if (!shouldSkipNonTranslatableString(node)) {
        const id = `json_${idx++}`;
        const label = currentPath.join('.') || `item_${idx}`;
        entries.push({
          id,
          label,
          originalText: node,
          translatedText: '',
        });
        pathById.set(id, currentPath);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, [...currentPath, i]));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        // In Flutter .arb files, keys starting with @ or @@ are metadata
        if (format === 'arb' && k.startsWith('@')) continue;
        walk(v, [...currentPath, k]);
      }
    }
  };

  walk(root, []);

  return {
    format,
    fileName,
    entries,
    rebuild: (translatedMap) => {
      const cloned = JSON.parse(JSON.stringify(root));
      for (const [id, p] of pathById.entries()) {
        const translated = translatedMap.get(id);
        if (typeof translated !== 'string') continue;
        if (p.length === 0) {
          return JSON.stringify(translated, null, 2);
        }
        let cursor = cloned;
        for (let i = 0; i < p.length - 1; i++) {
          cursor = cursor[p[i]];
        }
        cursor[p[p.length - 1]] = translated;
      }
      return JSON.stringify(cloned, null, 2);
    },
  };
}

function parseIosStringsDocument(content: string, fileName: string): ParsedDocument {
  const entries: TranslatableEntry[] = [];
  const lines = content.split(/\r?\n/);
  const lineBindings = new Map<number, { prefix: string; id: string; suffix: string }>();
  let idx = 0;

  lines.forEach((line, lineIdx) => {
    const match = line.match(/^(\s*"([^"]+)"\s*=\s*")((?:\\.|[^"\\])*)(";\s*(?:\/\/.*)?)$/);
    if (match) {
      const key = match[2];
      const rawVal = match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      if (!shouldSkipNonTranslatableString(rawVal)) {
        const id = `ios_${idx++}`;
        entries.push({
          id,
          label: key,
          originalText: rawVal,
          translatedText: '',
        });
        lineBindings.set(lineIdx, { prefix: match[1], id, suffix: match[4] });
      }
    }
  });

  return {
    format: 'strings',
    fileName,
    entries,
    rebuild: (translatedMap) =>
      lines
        .map((line, lineIdx) => {
          const binding = lineBindings.get(lineIdx);
          if (!binding) return line;
          const entry = entries.find((e) => e.id === binding.id);
          const val = (translatedMap.get(binding.id) ?? entry?.originalText ?? '')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');
          return `${binding.prefix}${val}${binding.suffix}`;
        })
        .join('\n'),
  };
}

function parseSubtitleDocument(content: string, fileName: string, format: 'srt' | 'vtt'): ParsedDocument {
  const lines = content.split(/\r?\n/);
  const entries: TranslatableEntry[] = [];
  const blockSlots = new Map<number, string>();
  let idx = 0;

  const isTimestamp = (l: string) =>
    /\d{2}:\d{2}(?::\d{2})?[,.]\d{3}\s*-->\s*\d{2}:\d{2}(?::\d{2})?[,.]\d{3}/.test(l);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (
      !line ||
      line === 'WEBVTT' ||
      line.startsWith('NOTE') ||
      /^\d+$/.test(line) ||
      isTimestamp(line)
    ) {
      i++;
      continue;
    }

    // Group contiguous dialogue lines inside the same cue
    const startIdx = i;
    const blockLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !isTimestamp(lines[i].trim())) {
      blockLines.push(lines[i].trim());
      i++;
    }
    const text = blockLines.join(' ');
    const id = `sub_${idx++}`;
    entries.push({
      id,
      label: `سطر ${idx}`,
      originalText: text,
      translatedText: '',
    });
    blockSlots.set(startIdx, `${id}:${startIdx}:${i - 1}`);
  }

  return {
    format,
    fileName,
    entries,
    rebuild: (translatedMap) => {
      const out: string[] = [];
      let lineIndex = 0;
      while (lineIndex < lines.length) {
        const slot = blockSlots.get(lineIndex);
        if (slot) {
          const [id, startStr, endStr] = slot.split(':');
          const start = Number(startStr);
          const end = Number(endStr);
          const entry = entries.find((e) => e.id === id);
          out.push(translatedMap.get(id) ?? entry?.originalText ?? lines[lineIndex]);
          lineIndex = end + 1;
          void start;
        } else {
          out.push(lines[lineIndex]);
          lineIndex++;
        }
      }
      return out.join('\n');
    },
  };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function serializeCsvCell(val: string): string {
  if (/[",\n\r]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function parseCsvDocument(content: string, fileName: string): ParsedDocument {
  const lines = content.split(/\r?\n/);
  const rows = lines.map((l) => (l.trim() ? parseCsvLine(l) : []));
  const entries: TranslatableEntry[] = [];
  const cellBindings = new Map<string, { row: number; col: number }>();
  let idx = 0;

  rows.forEach((cells, rIdx) => {
    cells.forEach((cell, cIdx) => {
      const trimmed = cell.trim();
      if (!shouldSkipNonTranslatableString(trimmed)) {
        const id = `csv_${idx++}`;
        entries.push({
          id,
          label: `صف ${rIdx + 1} · عمود ${cIdx + 1}`,
          originalText: trimmed,
          translatedText: '',
        });
        cellBindings.set(id, { row: rIdx, col: cIdx });
      }
    });
  });

  return {
    format: 'csv',
    fileName,
    entries,
    rebuild: (translatedMap) => {
      const cloned = rows.map((r) => [...r]);
      for (const [id, pos] of cellBindings.entries()) {
        const entry = entries.find((e) => e.id === id);
        cloned[pos.row][pos.col] = translatedMap.get(id) ?? entry?.originalText ?? '';
      }
      return cloned
        .map((r) => (r.length === 0 ? '' : r.map(serializeCsvCell).join(',')))
        .join('\n');
    },
  };
}

function parsePropertiesDocument(content: string, fileName: string): ParsedDocument {
  const lines = content.split(/\r?\n/);
  const entries: TranslatableEntry[] = [];
  const bindings = new Map<number, { prefix: string; id: string }>();
  let idx = 0;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed.startsWith('[')) {
      return;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).trim();
      const value = line.slice(eqIdx + 1).trim();
      if (!shouldSkipNonTranslatableString(value)) {
        const id = `prop_${idx++}`;
        entries.push({
          id,
          label: key,
          originalText: value,
          translatedText: '',
        });
        bindings.set(lineIdx, { prefix: line.slice(0, eqIdx + 1) + (line[eqIdx + 1] === ' ' ? ' ' : ''), id });
      }
    }
  });

  return {
    format: 'properties',
    fileName,
    entries,
    rebuild: (translatedMap) =>
      lines
        .map((line, lineIdx) => {
          const b = bindings.get(lineIdx);
          if (!b) return line;
          const entry = entries.find((e) => e.id === b.id);
          return `${b.prefix}${translatedMap.get(b.id) ?? entry?.originalText ?? ''}`;
        })
        .join('\n'),
  };
}

function parseHtmlDocument(content: string, fileName: string): ParsedDocument {
  const entries: TranslatableEntry[] = [];
  const slotMap = new Map<string, string>();
  let idx = 0;

  const template = content.replace(/(>)([^<>]+)(<)/g, (full, gt, textNode, lt) => {
    const trimmed = textNode.trim();
    if (shouldSkipNonTranslatableString(trimmed)) return full;
    const id = `html_${idx++}`;
    entries.push({
      id,
      label: `نص ${idx}`,
      originalText: trimmed,
      translatedText: '',
    });
    const slot = `__TARJAMA_HTML_SLOT_${id}__`;
    slotMap.set(slot, id);
    const leadingWs = textNode.match(/^\s*/)?.[0] || '';
    const trailingWs = textNode.match(/\s*$/)?.[0] || '';
    return `${gt}${leadingWs}${slot}${trailingWs}${lt}`;
  });

  return {
    format: 'html',
    fileName,
    entries,
    rebuild: (translatedMap) => {
      let out = template;
      for (const [slot, id] of slotMap.entries()) {
        const entry = entries.find((e) => e.id === id);
        out = out.replace(slot, translatedMap.get(id) ?? entry?.originalText ?? '');
      }
      return out;
    },
  };
}

function parseLineTextDocument(content: string, fileName: string, format: 'txt' | 'md'): ParsedDocument {
  const lines = content.split(/\r?\n/);
  const entries: TranslatableEntry[] = [];
  const lineSlots = new Map<number, { prefix: string; id: string }>();
  let idx = 0;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (format === 'md' && /^```/.test(trimmed)) return;

    let prefix = '';
    let body = trimmed;
    if (format === 'md') {
      const mdMatch = line.match(/^(\s*(?:#{1,6}|[-*+]|\d+\.)\s+)(.+)$/);
      if (mdMatch) {
        prefix = mdMatch[1];
        body = mdMatch[2].trim();
      }
    } else {
      prefix = line.match(/^\s*/)?.[0] || '';
    }

    if (shouldSkipNonTranslatableString(body)) return;
    const id = `line_${idx++}`;
    entries.push({
      id,
      label: `سطر ${lineIdx + 1}`,
      originalText: body,
      translatedText: '',
    });
    lineSlots.set(lineIdx, { prefix, id });
  });

  return {
    format,
    fileName,
    entries,
    rebuild: (translatedMap) =>
      lines
        .map((line, lineIdx) => {
          const slot = lineSlots.get(lineIdx);
          if (!slot) return line;
          const entry = entries.find((e) => e.id === slot.id);
          return `${slot.prefix}${translatedMap.get(slot.id) ?? entry?.originalText ?? ''}`;
        })
        .join('\n'),
  };
}

export function parseDocumentForTranslation(
  content: string,
  fileName: string,
  explicitFormat?: SupportedFormat
): ParsedDocument {
  const format = explicitFormat || detectFormat(fileName, content);
  switch (format) {
    case 'xml':
      return parseXmlDocument(content, fileName);
    case 'json':
    case 'arb':
      return parseJsonDocument(content, fileName, format);
    case 'strings':
      return parseIosStringsDocument(content, fileName);
    case 'srt':
    case 'vtt':
      return parseSubtitleDocument(content, fileName, format);
    case 'csv':
      return parseCsvDocument(content, fileName);
    case 'properties':
      return parsePropertiesDocument(content, fileName);
    case 'html':
      return parseHtmlDocument(content, fileName);
    case 'md':
    case 'txt':
    default:
      return parseLineTextDocument(content, fileName, format === 'md' ? 'md' : 'txt');
  }
}

// Protect placeholders (%s, %1$s, %d, {name}, {{var}}) when translating offline
function translateOfflineWithPlaceholders(text: string, from: string, to: string): string {
  const tokens: string[] = [];
  const masked = text.replace(/(%\d+\$[sdif]|%[sdif]|\{\{[^}]+\}\}|\{[a-zA-Z0-9_]+\})/g, (m) => {
    const idx = tokens.length;
    tokens.push(m);
    return ` PH${idx} `;
  });

  const result = translateOffline(masked, from, to).translatedText;
  let restored = result;
  tokens.forEach((tok, idx) => {
    const rx = new RegExp(`\\s*PH${idx}\\s*`, 'gi');
    restored = restored.replace(rx, ` ${tok} `);
  });
  return restored.replace(/\s+/g, ' ').trim();
}

export async function translateEntriesBatch(
  entries: TranslatableEntry[],
  fromLang: string,
  toLang: string,
  forceOfflineParam?: boolean,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<{ entries: TranslatableEntry[]; usedOffline: boolean }> {
  const isOffline =
    typeof forceOfflineParam === 'boolean' ? forceOfflineParam : isOfflineModeActive();

  const uiLang = getStoredAppLanguage();
  const ui = UI_LOCALES[uiLang] || UI_LOCALES.ar;

  if (entries.length === 0) {
    return { entries: [], usedOffline: isOffline };
  }

  if (isOffline) {
    const eligibility = checkOfflineTranslationEligibility(fromLang, toLang);
    if (!eligibility.allowed) {
      const missingName = getLocalizedLangName(eligibility.missingCode || toLang, uiLang, eligibility.missingNameAr);
      throw new MissingPackError(`${missingName}: ${ui.common.missingPackTitle} ${ui.common.missingPackHint}`);
    }

    const out: TranslatableEntry[] = [];
    for (let i = 0; i < entries.length; i++) {
      if (signal?.aborted) throw new Error(ui.appsFilesTab.stopBtn);
      const e = entries[i];
      const translatedText = translateOfflineWithPlaceholders(e.originalText, fromLang, toLang);
      out.push({ ...e, translatedText });
      if (onProgress) onProgress(Math.round(((i + 1) / entries.length) * 100));
    }
    return { entries: out, usedOffline: true };
  }

  const chunkSize = 20;
  const resultEntries: TranslatableEntry[] = [];
  let usedOfflineAny = false;

  for (let start = 0; start < entries.length; start += chunkSize) {
    if (signal?.aborted) throw new Error(ui.appsFilesTab.stopBtn);
    const chunk = entries.slice(start, start + chunkSize);

    try {
      const response = await fetch('/api/translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: chunk.map((c) => ({ id: c.id, text: c.originalText })),
          from: fromLang,
          to: toLang,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.usedOffline) usedOfflineAny = true;

      const translatedById = new Map<string, string>();
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          if (item && typeof item.id === 'string') {
            translatedById.set(item.id, item.translatedText || item.originalText);
          }
        }
      }

      for (const c of chunk) {
        resultEntries.push({
          ...c,
          translatedText: translatedById.get(c.id) ?? c.originalText,
        });
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error(ui.appsFilesTab.stopBtn);

      const eligibility = checkOfflineTranslationEligibility(fromLang, toLang);
      if (eligibility.allowed) {
        usedOfflineAny = true;
        for (const c of chunk) {
          resultEntries.push({
            ...c,
            translatedText: translateOfflineWithPlaceholders(c.originalText, fromLang, toLang),
          });
        }
      } else {
        const missingName = getLocalizedLangName(eligibility.missingCode || toLang, uiLang, eligibility.missingNameAr);
        throw new MissingPackError(`${missingName}: ${ui.common.missingPackTitle} ${ui.common.missingPackHint}`);
      }
    }

    if (onProgress) {
      onProgress(Math.min(100, Math.round(((start + chunk.length) / entries.length) * 100)));
    }
  }

  return { entries: resultEntries, usedOffline: usedOfflineAny };
}

export function buildConvertedFileName(originalName: string, targetLang: string, format: SupportedFormat): string {
  const cleanName = (originalName || `converted.${format}`).trim();
  const dotIdx = cleanName.lastIndexOf('.');
  if (cleanName.toLowerCase() === 'strings.xml') {
    return `strings-${targetLang}.xml`;
  }
  if (dotIdx > 0) {
    const base = cleanName.slice(0, dotIdx);
    const ext = cleanName.slice(dotIdx);
    return `${base}_${targetLang}${ext}`;
  }
  return `${cleanName}_${targetLang}.${format}`;
}
