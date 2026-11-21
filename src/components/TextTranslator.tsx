import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRightLeft,
  Volume2,
  Copy,
  Check,
  Mic,
  MicOff,
  Sparkles,
  Zap,
  Trash2,
  BookOpen,
  Languages,
  AlertTriangle,
  DownloadCloud,
  Globe,
  WifiOff,
  MessageSquare,
  Play,
  RotateCcw,
  VolumeX,
  Radio,
} from 'lucide-react';
import { AVAILABLE_PACKS } from '../services/offlineData.ts';
import { executeTranslation, speakText, toggleFavorite } from '../services/translatorService.ts';
import { TranslationResult } from '../../server/geminiService.ts';
import {
  canTranslateOffline,
  checkOfflineTranslationEligibility,
  downloadLanguagePack,
  isPackDownloaded,
  getInstalledPacks,
} from '../services/offlineEngine.ts';

interface TextTranslatorProps {
  forceOffline: boolean;
  networkMode?: 'online' | 'offline';
  onToggleMode?: (mode: 'online' | 'offline') => void;
  onOpenPacksModal: () => void;
}

// BCP-47 speech recognition codes mapping
const SPEECH_LANG_MAP: Record<string, string> = {
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

interface VoiceMessage {
  id: string;
  speaker: 'userA' | 'userB';
  speakerName: string;
  sourceLang: string;
  targetLang: string;
  originalText: string;
  translatedText: string;
  timestamp: number;
}

export const TextTranslator: React.FC<TextTranslatorProps> = ({
  forceOffline,
  networkMode,
  onToggleMode,
  onOpenPacksModal,
}) => {
  // Mode switch: Text translation vs Live Voice & Microphone Dialogue
  const [translatorSubTab, setTranslatorSubTab] = useState<'text' | 'voice'>('text');

  // Text translation states
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ar');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wasOffline, setWasOffline] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDownloadingQuick, setIsDownloadingQuick] = useState(false);
  const [quickDownloadPct, setQuickDownloadPct] = useState(0);
  const [autoSpeakTranslation, setAutoSpeakTranslation] = useState(true);

  // Voice Dialogue states
  const [voiceSpeakerALang, setVoiceSpeakerALang] = useState('ar');
  const [voiceSpeakerBLang, setVoiceSpeakerBLang] = useState('en');
  const [activeVoiceSpeaker, setActiveVoiceSpeaker] = useState<'userA' | 'userB' | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceConversation, setVoiceConversation] = useState<VoiceMessage[]>([
    {
      id: 'demo-1',
      speaker: 'userA',
      speakerName: 'المتحدث الأول (العربية)',
      sourceLang: 'ar',
      targetLang: 'en',
      originalText: 'مرحباً، أين يقع أقرب فندق من هنا؟',
      translatedText: 'Hello, where is the nearest hotel from here?',
      timestamp: Date.now() - 36000,
    },
    {
      id: 'demo-2',
      speaker: 'userB',
      speakerName: 'المتحدث الثاني (الإنجليزية)',
      sourceLang: 'en',
      targetLang: 'ar',
      originalText: 'It is just around the corner, about two hundred meters away.',
      translatedText: 'إنه عند المنعطف مباشرة، على بعد حوالي مئتي متر.',
      timestamp: Date.now() - 20000,
    },
  ]);
  const [voiceErrorBanner, setVoiceErrorBanner] = useState<string | null>(null);
  const [isVoiceTranslating, setIsVoiceTranslating] = useState(false);

  const recognitionRef = useRef<any>(null);
  const voiceDialogRecognitionRef = useRef<any>(null);
  const [packsVersion, setPacksVersion] = useState(0);

  useEffect(() => {
    const syncPacks = () => setPacksVersion((v) => v + 1);
    window.addEventListener('tarjuman-packs-changed', syncPacks);
    window.addEventListener('storage', syncPacks);
    return () => {
      window.removeEventListener('tarjuman-packs-changed', syncPacks);
      window.removeEventListener('storage', syncPacks);
    };
  }, []);

  // Quick download helper for currently selected target language
  const handleQuickDownload = async (code: string) => {
    setIsDownloadingQuick(true);
    setQuickDownloadPct(0);
    try {
      await downloadLanguagePack(code, (pct) => setQuickDownloadPct(pct));
      if (inputText.trim()) {
        handleTranslate(inputText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingQuick(false);
      setQuickDownloadPct(0);
    }
  };

  // Smart input change with automatic language direction detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const hasArabicChars = /[\u0600-\u06FF]/.test(val);
    if (hasArabicChars && targetLang === 'ar') {
      setTargetLang('en');
    } else if (!hasArabicChars && /^[a-zA-Z]/.test(val.trim()) && targetLang === 'en') {
      setTargetLang('ar');
    }
  };

  // Translate function with robust execution
  const handleTranslate = async (textToTranslate = inputText, shouldSpeak = false) => {
    const trimmed = textToTranslate.trim();
    if (!trimmed) {
      setResult(null);
      setErrorMsg(null);
      return;
    }

    // In offline mode: enforce that only downloaded packs can be translated
    if (forceOffline && !canTranslateOffline(sourceLang, targetLang)) {
      const eligibility = checkOfflineTranslationEligibility(sourceLang, targetLang);
      setErrorMsg(
        `حزمة لغة (${eligibility.missingNameAr || targetLang}) غير منزلة في ذاكرة جهازك. يمكنك تنزيلها بضغطة زر لاستخدامها بدون نت، أو التبديل إلى وضع أونلاين 🌐.`
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await executeTranslation(trimmed, sourceLang, targetLang, true, forceOffline);
      setResult(res.result);
      setWasOffline(res.usedOffline);

      if (shouldSpeak && res.result.translatedText) {
        speakText(res.result.translatedText, targetLang);
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setErrorMsg(err.message || 'حدث خطأ في عملية الترجمة، يُرجى المحاولة مجدداً');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey || (!e.shiftKey && inputText.length < 80)) {
        e.preventDefault();
        handleTranslate(inputText);
      }
    }
  };

  // Debounced auto-translate on typing
  useEffect(() => {
    if (!inputText.trim()) {
      setResult(null);
      setErrorMsg(null);
      return;
    }
    const timer = setTimeout(() => {
      handleTranslate(inputText);
    }, 550);
    return () => clearTimeout(timer);
  }, [inputText, sourceLang, targetLang, forceOffline, packsVersion]);

  // Language swap
  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      const detected = result?.detectedLanguage || 'en';
      setSourceLang(targetLang);
      setTargetLang(detected);
    } else {
      const prevSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(prevSource);
    }

    if (result && result.translatedText) {
      setInputText(result.translatedText);
      setResult(null);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- SPEECH RECOGNITION (VOICE DICTATION FOR TEXT BOX) ---
  const toggleRecording = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceErrorBanner('التعرف على الصوت غير مدعوم في هذا المتصفح. يُرجى تجربة متصفح حديث مثل Google Chrome أو Microsoft Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Map language
      const resolvedLang = sourceLang === 'auto' ? 'ar' : sourceLang;
      recognition.lang = SPEECH_LANG_MAP[resolvedLang] || 'ar-SA';

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceErrorBanner(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (e: any) => {
        setIsRecording(false);
        if (e.error === 'not-allowed') {
          setVoiceErrorBanner('تم رفض الإذن باستخدام الميكروفون. يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.');
        } else if (e.error !== 'no-speech') {
          setVoiceErrorBanner(`خطأ في الميكروفون: ${e.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (inputText.trim()) {
          handleTranslate(inputText, autoSpeakTranslation);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setIsRecording(false);
      setVoiceErrorBanner('تعذر بدء التسجيل الصوتي. تأكد من تفعيل إذن الميكروفون.');
    }
  };

  // --- DUAL-CONVERSATION VOICE & MICROPHONE MODE ---
  const startVoiceSpeakerRecording = (speaker: 'userA' | 'userB') => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceErrorBanner('التعرف الصوتي غير مدعوم في هذا المتصفح. يُرجى استخدام متصفح يدعم Web Speech API كـ Chrome.');
      return;
    }

    if (activeVoiceSpeaker) {
      voiceDialogRecognitionRef.current?.stop();
      setActiveVoiceSpeaker(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      const fromLang = speaker === 'userA' ? voiceSpeakerALang : voiceSpeakerBLang;
      const toLang = speaker === 'userA' ? voiceSpeakerBLang : voiceSpeakerALang;

      recognition.lang = SPEECH_LANG_MAP[fromLang] || 'ar-SA';

      recognition.onstart = () => {
        setActiveVoiceSpeaker(speaker);
        setVoiceTranscript('');
        setVoiceErrorBanner(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setVoiceTranscript(transcript);
      };

      recognition.onerror = (e: any) => {
        setActiveVoiceSpeaker(null);
        if (e.error === 'not-allowed') {
          setVoiceErrorBanner('تم حجب الميكروفون. يرجى تفعيل إذن الميكروفون للتحدث.');
        } else if (e.error !== 'no-speech') {
          setVoiceErrorBanner(`خطأ في الصوت: ${e.error}`);
        }
      };

      recognition.onend = async () => {
        setActiveVoiceSpeaker(null);
        const spoken = voiceTranscript.trim();
        if (spoken) {
          setIsVoiceTranslating(true);
          try {
            const res = await executeTranslation(spoken, fromLang, toLang, false, forceOffline);
            const speakerMeta = AVAILABLE_PACKS.find((p) => p.code === fromLang);
            const newMsg: VoiceMessage = {
              id: `vmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              speaker,
              speakerName: speaker === 'userA' ? `المتحدث الأول (${speakerMeta?.nameAr || fromLang})` : `المتحدث الثاني (${speakerMeta?.nameAr || fromLang})`,
              sourceLang: fromLang,
              targetLang: toLang,
              originalText: spoken,
              translatedText: res.result.translatedText,
              timestamp: Date.now(),
            };

            setVoiceConversation((prev) => [newMsg, ...prev]);

            if (autoSpeakTranslation && res.result.translatedText) {
              speakText(res.result.translatedText, toLang);
            }
          } catch (err: any) {
            setVoiceErrorBanner(err.message || 'تعذر ترجمة الجملة المنطوقة');
          } finally {
            setIsVoiceTranslating(false);
            setVoiceTranscript('');
          }
        }
      };

      voiceDialogRecognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setActiveVoiceSpeaker(null);
      setVoiceErrorBanner('تعذر تشغيل الميكروفون للحوار المباشر.');
    }
  };

  const handleSimulateVoicePrompt = async (
    speaker: 'userA' | 'userB',
    text: string
  ) => {
    const fromLang = speaker === 'userA' ? voiceSpeakerALang : voiceSpeakerBLang;
    const toLang = speaker === 'userA' ? voiceSpeakerBLang : voiceSpeakerALang;

    setIsVoiceTranslating(true);
    setVoiceErrorBanner(null);

    try {
      const res = await executeTranslation(text, fromLang, toLang, false, forceOffline);
      const speakerMeta = AVAILABLE_PACKS.find((p) => p.code === fromLang);
      const newMsg: VoiceMessage = {
        id: `vmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        speaker,
        speakerName: speaker === 'userA' ? `المتحدث الأول (${speakerMeta?.nameAr || fromLang})` : `المتحدث الثاني (${speakerMeta?.nameAr || fromLang})`,
        sourceLang: fromLang,
        targetLang: toLang,
        originalText: text,
        translatedText: res.result.translatedText,
        timestamp: Date.now(),
      };

      setVoiceConversation((prev) => [newMsg, ...prev]);

      if (autoSpeakTranslation && res.result.translatedText) {
        speakText(res.result.translatedText, toLang);
      }
    } catch (err: any) {
      setVoiceErrorBanner(err.message || 'تعذر محاكاة الترجمة الصوتية');
    } finally {
      setIsVoiceTranslating(false);
    }
  };

  const offlineReadyForSelected = canTranslateOffline(sourceLang, targetLang);
  const targetPackMeta = AVAILABLE_PACKS.find((p) => p.code === targetLang);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* --- ERROR BANNER (FOR SPEECH/NETWORK ISSUES, NO WINDOW.ALERT) --- */}
      {voiceErrorBanner && (
        <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{voiceErrorBanner}</span>
          </div>
          <button
            onClick={() => setVoiceErrorBanner(null)}
            className="px-2 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-white text-[11px] font-bold"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* --- SUB-NAVIGATION: TEXT TRANSLATION vs VOICE & MICROPHONE MODE --- */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-800/80">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setTranslatorSubTab('text')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              translatorSubTab === 'text'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>ترجمة النصوص والكتابة ✍️</span>
          </button>

          <button
            onClick={() => setTranslatorSubTab('voice')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              translatorSubTab === 'voice'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-900/40 ring-1 ring-red-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Mic className="w-4 h-4 text-red-300 animate-pulse" />
            <span>ترجمة صوت وميكروفون (حوار مباشر) 🎙️</span>
          </button>
        </div>

        {/* Auto Speak Audio Toggle */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <button
            onClick={() => setAutoSpeakTranslation(!autoSpeakTranslation)}
            className="flex items-center gap-2 cursor-pointer select-none"
            title="نطق الترجمة بصوت آلي فور انتهاء التحدث أو الترجمة"
          >
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
              autoSpeakTranslation ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold' : 'border-slate-600'
            }`}>
              {autoSpeakTranslation && '✓'}
            </span>
            <Volume2 className={`w-4 h-4 ${autoSpeakTranslation ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="font-medium text-[11px]">نطق الترجمة صوتياً تلقائياً 🔊</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TEXT TRANSLATOR TAB */}
      {/* ======================================================== */}
      {translatorSubTab === 'text' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-blue-950/20 space-y-4">
          {/* Languages Selection Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-800">
            {/* Source Language Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">من:</span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 hover:border-blue-500 focus:outline-none transition cursor-pointer"
              >
                <option value="auto">كشف تلقائي للغة ✨</option>
                {AVAILABLE_PACKS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.flag} {p.nameAr} ({p.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwapLanguages}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition shadow-sm active:scale-95"
              title="تبديل اتجاه الترجمة"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>

            {/* Target Language Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">إلى:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm font-bold text-cyan-400 hover:border-cyan-500 focus:outline-none transition cursor-pointer"
              >
                {AVAILABLE_PACKS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.flag} {p.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dual Input / Output Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Box */}
            <div className={`flex flex-col bg-slate-950/80 border rounded-2xl p-4 min-h-[240px] transition shadow-inner ${
              isRecording ? 'border-red-500/80 ring-2 ring-red-500/20' : 'border-slate-800 focus-within:border-blue-500/60'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold flex items-center gap-1.5 text-slate-300">
                  <span>النص أو الكلام المطلوب ترجمته</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {sourceLang === 'auto' ? 'كشف ذكي' : sourceLang}
                  </span>
                </span>
                {inputText && (
                  <button
                    onClick={() => {
                      setInputText('');
                      setResult(null);
                    }}
                    className="hover:text-red-400 transition flex items-center gap-1 text-[11px]"
                    title="مسح النص"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>
                )}
              </div>

              {/* Recording Animation Wave Bar */}
              {isRecording && (
                <div className="p-2 mb-2 rounded-xl bg-red-950/60 border border-red-500/60 flex items-center justify-between text-red-200 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold text-red-300">جاري الاستماع للميكروفون... تكلّم الآن بوضوح</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-red-400 animate-pulse" />
                    <span className="w-1 h-5 bg-red-400 animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-red-400 animate-pulse delay-150" />
                    <span className="w-1 h-4 bg-red-400 animate-pulse" />
                  </div>
                </div>
              )}

              <textarea
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="اكتب أو الصق النص هنا، أو اضغط زر الميكروفون للتحدث الصوتي المباشر..."
                className="flex-1 w-full bg-transparent resize-none text-slate-100 placeholder-slate-500 text-base leading-relaxed focus:outline-none"
                rows={6}
              />

              {/* Input Action Toolbar with Voice Mic & Translate Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
                <div className="flex items-center gap-2">
                  {/* Microphone Voice Input */}
                  <button
                    onClick={toggleRecording}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                      isRecording
                        ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-950/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50'
                    }`}
                    title={isRecording ? 'إيقاف التسجيل الصوتي' : 'التحدث بالصوت عبر الميكروفون'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-red-400" />}
                    <span>{isRecording ? 'إيقاف التسجيل' : 'تحدث بالصوت 🎙️'}</span>
                  </button>

                  {/* Listen to original input audio */}
                  {inputText && (
                    <button
                      onClick={() => speakText(inputText, sourceLang === 'auto' ? 'ar' : sourceLang)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="استماع للنطق الصوتي للنص الأصلي"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}

                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    {inputText.length} حرف
                  </span>
                </div>

                {/* Dedicated Primary Translate Button */}
                <button
                  onClick={() => handleTranslate(inputText, false)}
                  disabled={isLoading || !inputText.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-900/40 transition disabled:opacity-50 active:scale-95 cursor-pointer"
                  title="اضغط للترجمة الفورية (أو اضغط Enter)"
                >
                  <Zap className="w-4 h-4 text-cyan-300" />
                  <span>{isLoading ? 'جاري الترجمة...' : 'ترجمة فورية ⚡'}</span>
                </button>
              </div>
            </div>

            {/* Output Card */}
            <div className="flex flex-col bg-slate-950/80 border border-slate-800 rounded-2xl p-4 min-h-[240px]">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-400">الترجمة المعتمدة</span>
                  {wasOffline ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      حزمة أوفلاين (جهازك)
                    </span>
                  ) : result ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                      سحابي متصل AI 🌐
                    </span>
                  ) : null}
                </div>

                {result && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(result.translatedText)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                      title="نسخ الترجمة"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => speakText(result.translatedText, targetLang)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition"
                      title="نطق الترجمة بصوت واضح"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Translation Output Body */}
              <div className="flex-1 flex flex-col justify-start">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 gap-2 text-cyan-400">
                    <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">جاري الترجمة الفورية والتحليل اللغوي...</span>
                  </div>
                ) : forceOffline && !offlineReadyForSelected ? (
                  <div className="h-full flex flex-col justify-center p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs space-y-3">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>حزمة ({targetPackMeta?.nameAr || targetLang}) غير منزّلة في جهازك!</span>
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      أنت حالياً في <strong>وضع الأوفلاين (بدون إنترنت)</strong>. الترجمة بدون نت تعمل فقط للغات التي قمت بتنزيل ملفاتها مسبقاً (مثل الإنجليزية). لترجمة هذه اللغة بدون نت، يرجى تنزيل حزمتها، أو التبديل إلى وضع أونلاين.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleQuickDownload(targetLang)}
                        disabled={isDownloadingQuick}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/30 transition disabled:opacity-50"
                      >
                        <DownloadCloud className="w-4 h-4" />
                        <span>
                          {isDownloadingQuick
                            ? `جاري تنزيل الحزمة (${quickDownloadPct}%)...`
                            : `📥 تنزيل حزمة ${targetPackMeta?.nameAr || targetLang} الآن (${targetPackMeta?.sizeMb || 25} ميجابايت)`}
                        </span>
                      </button>
                      {onToggleMode && (
                        <button
                          onClick={() => onToggleMode('online')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition"
                        >
                          <Globe className="w-4 h-4 text-emerald-400" />
                          <span>التبديل إلى وضع أونلاين 🌐</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : errorMsg ? (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-red-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span>تنبيه أثناء الترجمة:</span>
                    </div>
                    <p>{errorMsg}</p>
                    <button
                      onClick={() => handleTranslate(inputText)}
                      className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-100 rounded-lg text-[11px] font-bold transition"
                    >
                      إعادة المحاولة 🔄
                    </button>
                  </div>
                ) : result ? (
                  <div className="space-y-3">
                    <p className="text-slate-100 text-lg sm:text-xl font-bold leading-relaxed select-all">
                      {result.translatedText}
                    </p>

                    {/* Transliteration / Phonetics if present */}
                    {result.pronunciation && (
                      <p className="text-xs text-slate-400 font-mono tracking-wide bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
                        <span className="text-slate-500">النطق الصوتي:</span>
                        <strong className="text-cyan-300">{result.pronunciation}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 py-8 gap-2">
                    <Languages className="w-8 h-8 text-slate-700" />
                    <span>اكتب أي نص أو اضغط الميكروفون للتحدث والترجمة الفورية</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Translations Chips Only */}
          {result && result.alternatives && result.alternatives.length > 0 && (
            <div className="pt-4 border-t border-slate-800/90 space-y-2 animate-in fade-in">
              <span className="text-xs font-bold text-slate-400 block">صيغ وبدائل إضافية للترجمة:</span>
              <div className="flex flex-wrap gap-2">
                {result.alternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopy(alt)}
                    className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 text-xs font-medium transition flex items-center gap-1.5"
                    title="انقر لنسخ هذا البديل"
                  >
                    <span>{alt}</span>
                    <Copy className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DEDICATED VOICE & MICROPHONE TRANSLATION (LIVE DIALOGUE) */}
      {/* ======================================================== */}
      {translatorSubTab === 'voice' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in">
          {/* Header & Instructions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                  <Mic className="w-5 h-5" />
                </span>
                <span>ترجمة صوتية وميكروفون للحوار المباشر</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تحدث بحرية بصوتك، وسيقوم التطبيق بترجمة حديثك صوتياً ونطقه مباشرة للشخص الآخر وجهاً لوجه!
              </p>
            </div>

            <button
              onClick={() => setVoiceConversation([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح المحادثة</span>
            </button>
          </div>

          {/* Dual Microphone Stations (Two Speakers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Speaker A Station */}
            <div className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
              activeVoiceSpeaker === 'userA'
                ? 'bg-gradient-to-b from-blue-950/80 to-slate-950 border-blue-500 shadow-xl shadow-blue-900/30 ring-2 ring-blue-500/30'
                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>المتحدث الأول:</span>
                </span>
                <select
                  value={voiceSpeakerALang}
                  onChange={(e) => setVoiceSpeakerALang(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {AVAILABLE_PACKS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.flag} {p.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Big Speaker A Mic Button */}
              <div className="flex flex-col items-center justify-center py-4">
                <button
                  onClick={() => startVoiceSpeakerRecording('userA')}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 shadow-xl ${
                    activeVoiceSpeaker === 'userA'
                      ? 'bg-red-600 text-white animate-bounce shadow-red-950/60 ring-8 ring-red-500/30'
                      : 'bg-gradient-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-950/50 hover:scale-105'
                  }`}
                  title="اضغط للتحدث بصوتك"
                >
                  {activeVoiceSpeaker === 'userA' ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                  <span className="text-[11px] font-black">
                    {activeVoiceSpeaker === 'userA' ? 'جاري الاستماع...' : 'تكلّم الآن'}
                  </span>
                </button>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  اضغط الزر وتحدث بـ (
                  <strong className="text-cyan-300">
                    {AVAILABLE_PACKS.find((p) => p.code === voiceSpeakerALang)?.nameAr || voiceSpeakerALang}
                  </strong>
                  )
                </p>
              </div>

              {/* Quick sample sentences for Speaker A */}
              <div className="pt-2 border-t border-slate-900 text-xs">
                <span className="text-[10px] text-slate-500 block mb-1.5">جمل سريعة للتجربة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['مرحباً كيف حالك؟', 'أين يقع المطار؟', 'كم سعر هذا الشيء؟', 'أنا بحاجة لمساعدة'].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => handleSimulateVoicePrompt('userA', sample)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Speaker B Station */}
            <div className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
              activeVoiceSpeaker === 'userB'
                ? 'bg-gradient-to-b from-indigo-950/80 to-slate-950 border-indigo-500 shadow-xl shadow-indigo-900/30 ring-2 ring-indigo-500/30'
                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>المتحدث الثاني:</span>
                </span>
                <select
                  value={voiceSpeakerBLang}
                  onChange={(e) => setVoiceSpeakerBLang(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
                >
                  {AVAILABLE_PACKS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.flag} {p.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Big Speaker B Mic Button */}
              <div className="flex flex-col items-center justify-center py-4">
                <button
                  onClick={() => startVoiceSpeakerRecording('userB')}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 shadow-xl ${
                    activeVoiceSpeaker === 'userB'
                      ? 'bg-red-600 text-white animate-bounce shadow-red-950/60 ring-8 ring-red-500/30'
                      : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-950/50 hover:scale-105'
                  }`}
                  title="Speak now"
                >
                  {activeVoiceSpeaker === 'userB' ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                  <span className="text-[11px] font-black">
                    {activeVoiceSpeaker === 'userB' ? 'Listening...' : 'Speak Now'}
                  </span>
                </button>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  Press to speak in (
                  <strong className="text-cyan-300">
                    {AVAILABLE_PACKS.find((p) => p.code === voiceSpeakerBLang)?.nameEn || voiceSpeakerBLang}
                  </strong>
                  )
                </p>
              </div>

              {/* Quick sample sentences for Speaker B */}
              <div className="pt-2 border-t border-slate-900 text-xs">
                <span className="text-[10px] text-slate-500 block mb-1.5">Quick sample phrases:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Where is the station?', 'How much is the ticket?', 'I am happy to meet you', 'Can you help me please?'].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => handleSimulateVoicePrompt('userB', sample)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Live Voice Recording Status Display */}
          {(activeVoiceSpeaker || isVoiceTranslating) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border border-red-500/60 flex items-center justify-between text-xs text-red-200 animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <div>
                  <span className="font-bold text-red-300">
                    {activeVoiceSpeaker
                      ? `جاري الاستماع للمتحدث (${activeVoiceSpeaker === 'userA' ? 'الأول' : 'الثاني'})...`
                      : 'جاري الترجمة الفورية ونطق الرد الصوتي...'}
                  </span>
                  {voiceTranscript && (
                    <p className="text-sm font-bold text-white mt-1">"{voiceTranscript}"</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-6 bg-red-400 animate-pulse" />
                <span className="w-1.5 h-8 bg-red-400 animate-pulse delay-75" />
                <span className="w-1.5 h-4 bg-red-400 animate-pulse delay-150" />
                <span className="w-1.5 h-7 bg-red-400 animate-pulse" />
              </div>
            </div>
          )}

          {/* Conversation History Dialogue Bubbles */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>سجل الحوار الصوتي المباشر:</span>
            </h4>

            {voiceConversation.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                لا توجد محادثات صوتية مسجلة بعد. اضغط على ميكروفون أي متحدث لبدء الحوار الصوتي المباشر!
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto no-scrollbar pr-1">
                {voiceConversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      msg.speaker === 'userA'
                        ? 'bg-blue-950/40 border-blue-800/60 mr-0 ml-auto'
                        : 'bg-indigo-950/40 border-indigo-800/60 ml-0 mr-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${msg.speaker === 'userA' ? 'bg-blue-400' : 'bg-cyan-400'}`} />
                        <span>{msg.speakerName}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(msg.translatedText)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          title="نسخ"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => speakText(msg.translatedText, msg.targetLang)}
                          className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition"
                          title="إعادة نطق الترجمة بصوت واضح"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      الأصل: <span className="text-slate-300">"{msg.originalText}"</span>
                    </p>

                    <div className="mt-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-cyan-300 leading-relaxed">
                        {msg.translatedText}
                      </p>
                      <button
                        onClick={() => speakText(msg.translatedText, msg.targetLang)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>نطق</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
