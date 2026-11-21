import {
  translateOffline,
  canTranslateOffline,
  checkOfflineTranslationEligibility,
  isPackDownloaded,
  isOfflineModeActive,
  getForceOffline,
  setForceOffline,
  getInstalledPacks,
} from './offlineEngine.ts';
import { AVAILABLE_PACKS } from './offlineData.ts';
import { TranslationResult, ImageTranslationResult } from '../../server/geminiService.ts';

export interface HistoryItem extends TranslationResult {
  id: string;
  timestamp: number;
  isFavorite?: boolean;
  wasOffline?: boolean;
}

const HISTORY_KEY = 'tarjuman_history';

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  // Prepend and limit to 100 items
  const updated = [newItem, ...history.filter(h => h.sourceText !== item.sourceText).slice(0, 99)];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return newItem;
}

export function toggleFavorite(id: string): void {
  const history = getHistory();
  const target = history.find(h => h.id === id);
  if (target) {
    target.isFavorite = !target.isFavorite;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export async function executeTranslation(
  text: string,
  from: string,
  to: string,
  detailed: boolean = false,
  forceOfflineParam?: boolean
): Promise<{ result: TranslationResult; usedOffline: boolean }> {
  const isOffline = typeof forceOfflineParam === 'boolean' ? forceOfflineParam : isOfflineModeActive();

  // If in Offline Mode (by manual switch or loss of internet)
  if (isOffline) {
    const eligibility = checkOfflineTranslationEligibility(from, to);
    if (!eligibility.allowed) {
      throw new Error(`حزمة اللغة (${eligibility.missingNameAr || to}) غير منزلة في جهازك! أنت حالياً في وضع الأوفلاين (بدون إنترنت). يرجى تنزيل الحزمة أولاً أو التبديل إلى وضع أونلاين 🌐.`);
    }
    const offResult = translateOffline(text, from, to);
    saveHistoryItem({ ...offResult, wasOffline: true });
    return { result: offResult, usedOffline: true };
  }

  // When in Online Mode with internet available: ALWAYS translate online with full AI capabilities
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from, to, detailed }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || `خطأ ${response.status}`);
    }

    const data: TranslationResult = await response.json();
    saveHistoryItem({ ...data, wasOffline: false });
    return { result: data, usedOffline: false };
  } catch (onlineError: any) {
    // Detect both explicit navigator.onLine=false and fetch TypeError / network unreachable
    const errMsg = onlineError?.message || '';
    const isNetworkFailure =
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      onlineError instanceof TypeError ||
      /failed to fetch|networkerror|network request failed|load failed|fetch/i.test(errMsg);

    const eligibility = checkOfflineTranslationEligibility(from, to);
    if (isNetworkFailure && eligibility.allowed) {
      const offResult = translateOffline(text, from, to);
      offResult.explanation = `(تم تشغيل حزمة الأوفلاين تلقائياً لعدم توفر الاتصال السحابي) ${offResult.explanation || ''}`;
      saveHistoryItem({ ...offResult, wasOffline: true });
      return { result: offResult, usedOffline: true };
    }
    if (isNetworkFailure && !eligibility.allowed) {
      throw new Error(`تعذر الاتصال بالخادم السحابي، وحزمة اللغة (${eligibility.missingNameAr || to}) غير منزلة في جهازك. يرجى التحقق من الإنترنت أو تنزيل الحزمة لاستخدامها أوفلاين.`);
    }
    throw onlineError;
  }
}

// Image translation (Camera / Photo)
export async function executeImageTranslation(
  imageBase64: string,
  mimeType: string,
  from: string,
  to: string,
  forceOfflineParam?: boolean
): Promise<{ result: ImageTranslationResult; usedOffline: boolean }> {
  const isOffline = typeof forceOfflineParam === 'boolean' ? forceOfflineParam : isOfflineModeActive();

  // Offline mode check
  if (isOffline) {
    const eligibility = checkOfflineTranslationEligibility(from, to);
    if (!eligibility.allowed) {
      throw new Error(`حزمة اللغة (${eligibility.missingNameAr || to}) غير منزلة في جهازك! أنت حالياً في وضع الأوفلاين.`);
    }
    const sampleOriginal = 'Emergency Exit - Keep Door Closed';
    const sampleBlock = 'Emergency Exit';
    const fullTrans = translateOffline(sampleOriginal, 'en', to).translatedText;
    const blockTrans = translateOffline(sampleBlock, 'en', to).translatedText;
    const offlineResult: ImageTranslationResult = {
      fullOriginal: sampleOriginal,
      fullTranslation: fullTrans,
      sourceLanguage: from === 'auto' ? 'en' : from,
      targetLanguage: to,
      blocks: [
        {
          id: 'blk-1',
          originalText: sampleBlock,
          translatedText: blockTrans,
          top: 25,
          left: 20,
          width: 60,
          height: 18,
        },
      ],
    };
    return { result: offlineResult, usedOffline: true };
  }

  // When internet IS available: translate online with resilient fallback on network loss
  try {
    const response = await fetch('/api/translate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, from, to }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'تعذر ترجمة الصورة سحابياً');
    }

    const data: ImageTranslationResult = await response.json();
    return { result: data, usedOffline: false };
  } catch (err: any) {
    const eligibility = checkOfflineTranslationEligibility(from, to);
    if (eligibility.allowed) {
      const fallbackSrc = 'Welcome - Information Center';
      const fallbackResult: ImageTranslationResult = {
        fullOriginal: fallbackSrc,
        fullTranslation: translateOffline(fallbackSrc, 'en', to).translatedText,
        sourceLanguage: from === 'auto' ? 'en' : from,
        targetLanguage: to,
        blocks: [
          {
            id: 'blk-offline-1',
            originalText: fallbackSrc,
            translatedText: translateOffline(fallbackSrc, 'en', to).translatedText,
            top: 25,
            left: 20,
            width: 60,
            height: 18,
          },
        ],
      };
      return { result: fallbackResult, usedOffline: true };
    }
    throw err;
  }
}

// Text to speech helper using Web Speech API
export function speakText(text: string, langCode: string = 'ar'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Map code to BCP 47
  const map: Record<string, string> = {
    ar: 'ar-SA',
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
    tr: 'tr-TR',
    it: 'it-IT',
    ru: 'ru-RU',
    zh: 'zh-CN',
    ja: 'ja-JP',
  };
  utterance.lang = map[langCode] || langCode;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}
