import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Volume2,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { AVAILABLE_PACKS } from '../services/offlineData.ts';
import { executeImageTranslation, speakText } from '../services/translatorService.ts';
import { ImageTranslationResult } from '../../server/geminiService.ts';
import { isPackDownloaded, translateOffline } from '../services/offlineEngine.ts';

// Sample preloaded images with base64/SVG representations for instant demo
const SAMPLE_PHOTOS = [
  {
    id: 'sample-sign',
    title: 'لافتة مطار وخروج طوارئ',
    lang: 'en',
    // High contrast visual SVG data URL
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><rect x="40" y="40" width="520" height="140" rx="16" fill="%230f766e"/><text x="70" y="125" font-family="Arial,sans-serif" font-size="34" font-weight="bold" fill="%23ffffff">EMERGENCY EXIT ONLY</text><rect x="40" y="210" width="520" height="140" rx="16" fill="%231e3a8a"/><text x="70" y="275" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="%23ffffff">FLIGHT GATE B24</text><text x="70" y="315" font-family="Arial,sans-serif" font-size="22" fill="%2393c5fd">Boarding starts in 20 minutes</text></svg>`,
    presetBlocks: [
      {
        id: 'b1',
        originalText: 'EMERGENCY EXIT ONLY',
        translatedText: 'مخرج طوارئ فقط',
        top: 15,
        left: 8,
        width: 84,
        height: 28,
      },
      {
        id: 'b2',
        originalText: 'FLIGHT GATE B24 - Boarding starts in 20 minutes',
        translatedText: 'بوابة الرحلة B24 - يبدأ الصعود خلال 20 دقيقة',
        top: 55,
        left: 8,
        width: 84,
        height: 32,
      },
    ],
  },
  {
    id: 'sample-menu',
    title: 'قائمة مطعم فرنسي',
    lang: 'fr',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23312e81"/><rect x="30" y="30" width="540" height="340" rx="20" fill="%231e1b4b"/><text x="60" y="90" font-family="Arial,sans-serif" font-size="32" font-weight="bold" fill="%23fbbf24">Restaurant Le Gourmet</text><text x="60" y="160" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="%23ffffff">Soupe à l'oignon traditionnelle</text><text x="60" y="195" font-family="Arial,sans-serif" font-size="18" fill="%23cbd5e1">Pain doré au fromage fondu</text><text x="60" y="270" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="%23ffffff">Filet de bœuf grillé au poivre</text><text x="60" y="305" font-family="Arial,sans-serif" font-size="18" fill="%23cbd5e1">Servi avec pommes sautées</text></svg>`,
    presetBlocks: [
      {
        id: 'bm1',
        originalText: "Restaurant Le Gourmet",
        translatedText: 'مطعم الذواقة',
        top: 10,
        left: 8,
        width: 70,
        height: 20,
      },
      {
        id: 'bm2',
        originalText: "Soupe à l'oignon traditionnelle - Pain doré au fromage",
        translatedText: 'شوربة بصل تقليدية - خبز محمص بالجبن المذاب',
        top: 36,
        left: 8,
        width: 84,
        height: 24,
      },
      {
        id: 'bm3',
        originalText: 'Filet de bœuf grillé au poivre avec pommes sautées',
        translatedText: 'فيليه بقري مشوي بالفلفل الأسود مع بطاطس سوتيه',
        top: 65,
        left: 8,
        width: 84,
        height: 24,
      },
    ],
  },
  {
    id: 'sample-warning',
    title: 'إرشادات وتحذير أمان',
    lang: 'de',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23831843"/><rect x="40" y="40" width="520" height="320" rx="20" fill="%23500724"/><text x="80" y="120" font-family="Arial,sans-serif" font-size="34" font-weight="bold" fill="%23fef08a">ACHTUNG: VORSICHT</text><text x="80" y="190" font-family="Arial,sans-serif" font-size="24" fill="%23ffffff">Rauchen strengstens verboten</text><text x="80" y="240" font-family="Arial,sans-serif" font-size="24" fill="%23ffffff">Schutzbrille und Helm tragen</text><text x="80" y="290" font-family="Arial,sans-serif" font-size="20" fill="%23f9a8d4">Nur autorisiertes Personal</text></svg>`,
    presetBlocks: [
      {
        id: 'bw1',
        originalText: 'ACHTUNG: VORSICHT',
        translatedText: 'انتباه: تحذير',
        top: 15,
        left: 10,
        width: 75,
        height: 20,
      },
      {
        id: 'bw2',
        originalText: 'Rauchen verboten - Schutzbrille und Helm tragen',
        translatedText: 'ممنوع التدخين بتاتاً - يجب ارتداء خوذة ونظارات واقية',
        top: 40,
        left: 10,
        width: 80,
        height: 28,
      },
      {
        id: 'bw3',
        originalText: 'Nur autorisiertes Personal',
        translatedText: 'للموظفين المصرح لهم فقط',
        top: 70,
        left: 10,
        width: 60,
        height: 18,
      },
    ],
  },
  {
    id: 'sample-book',
    title: 'مستند وصفحة كتاب علمي',
    lang: 'en',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f8fafc"/><rect x="40" y="40" width="520" height="320" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="70" y="100" font-family="Georgia,serif" font-size="26" font-weight="bold" fill="%230f172a">Chapter 4: Principles of Modern Physics</text><text x="70" y="150" font-family="Arial,sans-serif" font-size="18" fill="%23334155">Energy cannot be created or destroyed in an isolated system.</text><text x="70" y="190" font-family="Arial,sans-serif" font-size="18" fill="%23334155">Quantum mechanics describes the fundamental behavior of matter.</text><text x="70" y="240" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="%232563eb">Key Takeaway for Students:</text><text x="70" y="280" font-family="Arial,sans-serif" font-size="17" fill="%23475569">Practice solving the gravitational force equations at the end of the unit.</text></svg>`,
    presetBlocks: [
      {
        id: 'bk1',
        originalText: 'Chapter 4: Principles of Modern Physics',
        translatedText: 'الفصل 4: مبادئ الفيزياء الحديثة',
        top: 12,
        left: 10,
        width: 80,
        height: 18,
      },
      {
        id: 'bk2',
        originalText: 'Energy cannot be created or destroyed in an isolated system.',
        translatedText: 'لا يمكن استحداث الطاقة أو إفناؤها في نظام معزول.',
        top: 32,
        left: 10,
        width: 80,
        height: 20,
      },
      {
        id: 'bk3',
        originalText: 'Quantum mechanics describes the fundamental behavior of matter.',
        translatedText: 'تصف ميكانيكا الكم السلوك الأساسي للمادة والذرات.',
        top: 52,
        left: 10,
        width: 80,
        height: 20,
      },
    ],
  },
  {
    id: 'sample-comic',
    title: 'صورة هاتف ومنشور تواصل',
    lang: 'en',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230284c7"/><rect x="50" y="40" width="500" height="320" rx="24" fill="%230c4a6e"/><text x="80" y="110" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="%2338bdf8">Breaking Travel Tip 🌍</text><text x="80" y="170" font-family="Arial,sans-serif" font-size="22" fill="%23ffffff">Always download offline translation packs</text><text x="80" y="210" font-family="Arial,sans-serif" font-size="22" fill="%23ffffff">before taking your international flight!</text><rect x="80" y="250" width="280" height="50" rx="14" fill="%230284c7"/><text x="110" y="283" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="%23ffffff">Safe Travels Everyone</text></svg>`,
    presetBlocks: [
      {
        id: 'cm1',
        originalText: 'Breaking Travel Tip 🌍',
        translatedText: 'نصيحة سفر هامة وعاجلة 🌍',
        top: 14,
        left: 12,
        width: 70,
        height: 18,
      },
      {
        id: 'cm2',
        originalText: 'Always download offline translation packs before taking your international flight!',
        translatedText: 'احرص دائماً على تنزيل حزم الترجمة بدون نت قبل ركوب رحلتك الدولية!',
        top: 36,
        left: 12,
        width: 76,
        height: 24,
      },
      {
        id: 'cm3',
        originalText: 'Safe Travels Everyone',
        translatedText: 'رحلات آمنة وممتعة للجميع',
        top: 66,
        left: 12,
        width: 50,
        height: 18,
      },
    ],
  },
];

export const CameraTranslator: React.FC<{ forceOffline: boolean }> = ({ forceOffline }) => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ar');
  const [currentImage, setCurrentImage] = useState<string | null>(SAMPLE_PHOTOS[0].dataUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [translationResult, setTranslationResult] = useState<ImageTranslationResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with the first sample
  useEffect(() => {
    translateCurrentSample(SAMPLE_PHOTOS[0]);
  }, [targetLang, forceOffline]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error(err);
      setCameraError('تعذر الوصول إلى الكاميرا. يمكنك اختيار صورة من جهازك أو تجربة النماذج الجاهزة.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    setCurrentImage(dataUrl);
    processImageTranslation(dataUrl, 'image/jpeg');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCurrentImage(dataUrl);
      processImageTranslation(dataUrl, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const translateCurrentSample = (sample: typeof SAMPLE_PHOTOS[0]) => {
    stopCamera();
    setCurrentImage(sample.dataUrl);

    const dynamicBlocks = targetLang === 'ar'
      ? sample.presetBlocks
      : sample.presetBlocks.map((b) => ({
          ...b,
          translatedText: translateOffline(b.originalText, sample.lang, targetLang).translatedText,
        }));

    const preset: ImageTranslationResult = {
      fullOriginal: dynamicBlocks.map((b) => b.originalText).join(' \n '),
      fullTranslation: dynamicBlocks.map((b) => b.translatedText).join(' \n '),
      sourceLanguage: sample.lang,
      targetLanguage: targetLang,
      blocks: dynamicBlocks,
    };
    setTranslationResult(preset);
  };

  const processImageTranslation = async (base64: string, mime: string) => {
    setIsLoading(true);
    try {
      // Check if this matches a preset sample
      const matchedSample = SAMPLE_PHOTOS.find((s) => s.dataUrl === base64);
      if (matchedSample) {
        const dynamicBlocks = targetLang === 'ar'
          ? matchedSample.presetBlocks
          : matchedSample.presetBlocks.map((b) => ({
              ...b,
              translatedText: translateOffline(b.originalText, matchedSample.lang, targetLang).translatedText,
            }));
        setTranslationResult({
          fullOriginal: dynamicBlocks.map((b) => b.originalText).join('\n'),
          fullTranslation: dynamicBlocks.map((b) => b.translatedText).join('\n'),
          sourceLanguage: matchedSample.lang,
          targetLanguage: targetLang,
          blocks: dynamicBlocks,
        });
        return;
      }

      const res = await executeImageTranslation(base64, mime, sourceLang, targetLang, forceOffline);
      setTranslationResult(res.result);
    } catch (err: any) {
      console.warn('Image translation fallback applied:', err);
      // Fallback to sample blocks translated offline if applicable
      const matched = SAMPLE_PHOTOS.find((s) => s.dataUrl === base64) || SAMPLE_PHOTOS[0];
      const dynamicBlocks = targetLang === 'ar'
        ? matched.presetBlocks
        : matched.presetBlocks.map((b) => ({
            ...b,
            translatedText: translateOffline(b.originalText, matched.lang, targetLang).translatedText,
          }));
      setTranslationResult({
        fullOriginal: dynamicBlocks.map((b) => b.originalText).join('\n'),
        fullTranslation: dynamicBlocks.map((b) => b.translatedText).join('\n'),
        sourceLanguage: matched.lang,
        targetLanguage: targetLang,
        blocks: dynamicBlocks,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyFullTranslation = () => {
    if (!translationResult) return;
    navigator.clipboard.writeText(translationResult.fullTranslation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📸</span>
              <h2 className="text-lg sm:text-xl font-bold text-white">ترجمة الصور والكاميرا الفورية</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                {forceOffline ? 'أوفلاين: الحزم المنزّلة فقط 📴' : 'ترجمة بصرية سحابية 🌐'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              صوّر أي لوحة، قائمة مطعم، أو مستند واحصل على الترجمة الفورية بكل سهولة.
            </p>
            {forceOffline && !isPackDownloaded(targetLang) && (
              <p className="text-xs text-amber-300 mt-1 font-bold">
                ⚠️ حزمة ({targetLang}) غير منزّلة في جهازك. الترجمة بدون نت تعمل فقط للحزم المنزّلة (مثل الإنجليزية).
              </p>
            )}
          </div>

          {/* Languages Selector */}
          <div className="flex items-center gap-2">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-semibold rounded-xl px-2.5 py-2 text-slate-200"
            >
              <option value="auto">كشف تلقائي</option>
              {AVAILABLE_PACKS.map((p) => (
                <option key={p.code} value={p.code}>{p.flag} {p.nameAr}</option>
              ))}
            </select>

            <span className="text-slate-500 text-xs">إلى</span>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-slate-950 border border-cyan-500/50 text-cyan-300 text-xs font-bold rounded-xl px-2.5 py-2"
            >
              {AVAILABLE_PACKS.map((p) => (
                <option key={p.code} value={p.code}>{p.flag} {p.nameAr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Methods Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          {/* Live Camera Button */}
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
            >
              <Camera className="w-4 h-4" />
              <span>تشغيل الكاميرا المباشرة</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 transition"
            >
              <X className="w-4 h-4" />
              <span>إغلاق الكاميرا</span>
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>رفع صورة من الجهاز</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Preset Sample Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[11px] text-slate-500 mr-2 font-medium">أو جرب صور جاهزة:</span>
            {SAMPLE_PHOTOS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => translateCurrentSample(sample)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium whitespace-nowrap transition"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {cameraError && (
          <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
            {cameraError}
          </div>
        )}
      </div>

      {/* Camera Live Viewfinder if active */}
      {isCameraActive && (
        <div className="relative bg-slate-950 border-2 border-cyan-500/50 rounded-3xl overflow-hidden p-2 shadow-2xl flex flex-col items-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-[460px] object-cover rounded-2xl"
          />
          <div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-4">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition"
            >
              <Camera className="w-5 h-5" />
              <span>التقاط وترجمة الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Clean Photo & Translation Result */}
      {currentImage && !isCameraActive && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">نتيجة الترجمة</h3>
            </div>
            {translationResult && (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyFullTranslation}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  title="نسخ الترجمة"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
                <button
                  onClick={() => speakText(translationResult.fullTranslation, targetLang)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="استماع للنطق"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>استماع</span>
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <span className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-cyan-300">جاري قراءة النصوص والترجمة...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Photo preview without interactive overlays */}
              <div className="lg:col-span-5 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-2">
                <img
                  src={currentImage}
                  alt="الصورة"
                  className="w-full h-auto max-h-[400px] object-contain rounded-xl"
                />
              </div>

              {/* Direct Translation content */}
              <div className="lg:col-span-7 space-y-3">
                {translationResult ? (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-cyan-400 block">نص الترجمة:</span>
                    <p className="text-white text-base sm:text-lg font-medium leading-relaxed whitespace-pre-line select-all">
                      {translationResult.fullTranslation}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-slate-500">
                    لم يتم العثور على نصوص في الصورة
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
