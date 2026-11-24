import React, { useState, useRef, useEffect } from 'react';
import {
  Globe2,
  Scan,
  Sparkles,
  Volume2,
  Copy,
  Check,
  X,
  Maximize2,
  ArrowRightLeft,
  ChevronDown,
  Layers,
  Search,
  CheckCircle2,
  PowerOff,
  Smartphone,
} from 'lucide-react';
import { executeTranslation, speakText } from '../services/translatorService.ts';
import { AVAILABLE_PACKS } from '../services/offlineData.ts';
import { isPackDownloaded } from '../services/offlineEngine.ts';
import {
  getExternalBallStatus,
  enableExternalFloatingBall,
  disableExternalFloatingBall,
  subscribeExternalBallChanged,
} from '../services/systemFloatingBall.ts';
import { useI18n } from '../services/i18nContext.tsx';

interface FloatingBallProps {
  forceOffline: boolean;
  onNavigateToSimulator: () => void;
  onClose: () => void;
}

export const FloatingBall: React.FC<FloatingBallProps> = ({
  forceOffline,
  onNavigateToSimulator,
  onClose,
}) => {
  const { appLang, t, isRtl, getLangName } = useI18n();
  const fb = t.floatingBall;

  // Position coordinates of the floating ball
  const [position, setPosition] = useState({ x: 24, y: 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // Floating popup state
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ar');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [externalRunning, setExternalRunning] = useState(false);
  const [externalMsg, setExternalMsg] = useState<string | null>(null);

  const ballRef = useRef<HTMLDivElement>(null);
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const movedRef = useRef<boolean>(false);

  useEffect(() => {
    const syncStatus = () => {
      getExternalBallStatus().then((st) => setExternalRunning(st.running));
    };
    syncStatus();
    const unsub = subscribeExternalBallChanged(syncStatus);
    window.addEventListener('focus', syncStatus);
    return () => {
      unsub();
      window.removeEventListener('focus', syncStatus);
    };
  }, []);

  // Pointer drag handling for mouse & touch
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setHasMoved(false);
    movedRef.current = false;
    pointerOriginRef.current = { x: e.clientX, y: e.clientY };
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const distance = Math.hypot(
      e.clientX - pointerOriginRef.current.x,
      e.clientY - pointerOriginRef.current.y
    );
    if (distance > 5) {
      setHasMoved(true);
      movedRef.current = true;
    }
    if (!movedRef.current) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 60, e.clientX - dragStart.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 60, e.clientY - dragStart.y));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (!movedRef.current) {
      setIsOpen((prev) => !prev);
    }
  };

  // Perform quick translation inside floating popup
  const handleQuickTranslate = async () => {
    if (!inputText.trim()) return;

    if (forceOffline && !isPackDownloaded(targetLang)) {
      setTranslatedText(`⚠️ ${t.common.missingPackTitle} (${getLangName(targetLang)})`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await executeTranslation(inputText, sourceLang, targetLang, false, forceOffline);
      setTranslatedText(res.result.translatedText);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.common.retry;
      setTranslatedText(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-translate on typing with debounce
  useEffect(() => {
    if (!inputText.trim()) {
      setTranslatedText('');
      return;
    }
    const timer = setTimeout(() => {
      handleQuickTranslate();
    }, 400);
    return () => clearTimeout(timer);
  }, [inputText, sourceLang, targetLang, forceOffline]);

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickTestPhrases = [
    'How can I help you today?',
    'Emergency exit only',
    'Where is the nearest pharmacy?',
    'Order confirmed successfully',
  ];

  return (
    <>
      {/* Draggable Floating Ball */}
      <div
        ref={ballRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          touchAction: 'none',
        }}
        className={`fixed top-0 left-0 z-50 select-none cursor-grab active:cursor-grabbing transition-shadow ${
          isDragging ? 'scale-105' : ''
        }`}
      >
        <div className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-full blur-sm opacity-70 group-hover:opacity-100 animate-pulse transition duration-500" />

          <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-950 border-2 border-cyan-400/80 shadow-2xl flex items-center justify-center text-white overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none" />

            <div className="flex flex-col items-center justify-center">
              <span className="text-xl">🔮</span>
              <span className="text-[8px] font-bold tracking-tight text-cyan-300">{fb.ballWord}</span>
            </div>

            <div
              className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                forceOffline ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              title={forceOffline ? t.common.offlineLabel : t.common.onlineLabel}
            />
          </div>

          {!isOpen && !hasMoved && (
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 bg-slate-900/95 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition">
              {fb.hoverHint}
            </div>
          )}
        </div>
      </div>

      {/* Floating Translation Popup Panel */}
      {isOpen && (
        <div
          style={{
            top: Math.min(position.y + 65, window.innerHeight - 440),
            left: Math.max(16, Math.min(position.x - 140, window.innerWidth - 360)),
          }}
          className="fixed z-50 w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 p-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5 flex-wrap">
                <span>{fb.popupTitle}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {forceOffline ? fb.offlineBadge : fb.onlineBadge}
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToSimulator();
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition text-xs flex items-center gap-1"
                title={fb.openSimTitle}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                aria-label={t.common.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Activate / Deactivate Choice Bar */}
          <div className="mt-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-300">{fb.ballStatusLabel}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/25 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.common.enable}</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/25 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-[11px] font-bold transition"
                >
                  <PowerOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.common.disable}</span>
                </button>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>{fb.externalLabel}</span>
              </span>
              <button
                onClick={async () => {
                  const res = externalRunning
                    ? await disableExternalFloatingBall(appLang)
                    : await enableExternalFloatingBall(targetLang, forceOffline, appLang);
                  setExternalRunning(res.running);
                  setExternalMsg(res.message);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                  externalRunning
                    ? 'bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30'
                    : 'bg-cyan-600/25 border-cyan-500/50 text-cyan-200 hover:bg-cyan-600/35'
                }`}
              >
                {externalRunning ? fb.stopExternal : fb.startExternal}
              </button>
            </div>

            {externalMsg && (
              <p className="text-[10px] text-slate-300 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 leading-relaxed">
                {externalMsg}
              </p>
            )}
          </div>

          {/* Language Selector Bar */}
          <div className="flex items-center justify-between gap-2 my-2.5 py-1.5 px-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-transparent text-slate-200 outline-none font-medium cursor-pointer max-w-[130px]"
            >
              <option value="auto" className="bg-slate-900">{t.common.autoDetectSmart}</option>
              {AVAILABLE_PACKS.map((p) => (
                <option key={p.code} value={p.code} className="bg-slate-900">
                  {p.flag} {getLangName(p.code, p.nameEn)}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (sourceLang === 'auto') return;
                const temp = sourceLang;
                setSourceLang(targetLang);
                setTargetLang(temp);
              }}
              className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-cyan-400 transition"
              title={t.common.swapLanguages}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer max-w-[130px]"
            >
              {AVAILABLE_PACKS.map((p) => (
                <option key={p.code} value={p.code} className="bg-slate-900">
                  {p.flag} {getLangName(p.code, p.nameEn)}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Input Area */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={fb.inputPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition"
                autoFocus
              />
              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setTranslatedText('');
                  }}
                  className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-2 text-slate-400 hover:text-white`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!inputText && (
              <div className="flex flex-wrap gap-1 pt-1">
                {quickTestPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(phrase)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-cyan-900/40 text-slate-300 hover:text-cyan-200 border border-slate-700/60 transition"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="py-4 text-center text-xs text-cyan-400 flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>{fb.translating}</span>
              </div>
            ) : translatedText ? (
              <div className="p-3 bg-gradient-to-br from-slate-950 to-blue-950/40 border border-cyan-500/20 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white leading-relaxed select-all">
                    {translatedText}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => speakText(translatedText, targetLang)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
                      title={t.common.listen}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                      title={t.common.copy}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom Shortcuts */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateToSimulator();
              }}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 hover:underline"
            >
              <span>{fb.tryFullSim}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300"
            >
              {fb.hideBall}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
