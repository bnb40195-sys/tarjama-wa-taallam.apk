import React, { useState } from 'react';
import {
  Settings,
  Languages,
  Sliders,
  Volume2,
  Copy,
  Trash2,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Smartphone,
  Eye,
} from 'lucide-react';
import {
  AppLanguage,
  APP_LANGUAGES_META,
  UI_LOCALES,
  setStoredAppLanguage,
} from '../services/appTranslations.ts';
import { clearHistory } from '../services/translatorService.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appLang: AppLanguage;
  onAppLangChange: (lang: AppLanguage) => void;
  onResetFloatingBall: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appLang,
  onAppLangChange,
  onResetFloatingBall,
}) => {
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showDirectionNotice, setShowDirectionNotice] = useState<boolean>(false);
  const [confirmingClear, setConfirmingClear] = useState<boolean>(false);
  const [clearedNotice, setClearedNotice] = useState<boolean>(false);
  const [resetBallNotice, setResetBallNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const t = UI_LOCALES[appLang] || UI_LOCALES.ar;
  const s = t.settingsModal;

  const handleSelectLanguage = (code: AppLanguage) => {
    setStoredAppLanguage(code);
    onAppLangChange(code);
    setShowDirectionNotice(true);
    setTimeout(() => setShowDirectionNotice(false), 2500);
  };

  const handleConfirmClear = () => {
    clearHistory();
    setConfirmingClear(false);
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-blue-600/20 text-blue-400">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-white">{s.title}</h3>
              <p className="text-xs text-slate-400">{s.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice on language & direction update */}
        {showDirectionNotice && (
          <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{s.langUpdatedNotice}</span>
          </div>
        )}

        {/* Section 1: App Interface Language & Direction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
              <Languages className="w-4 h-4" />
              <span>{s.appLangSectionTitle}</span>
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {appLang === 'ar' ? s.rtlLabel : s.ltrLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {APP_LANGUAGES_META.map((langMeta) => {
              const isSelected = appLang === langMeta.code;
              const localizedName = t.langNames[langMeta.code] || langMeta.nativeName;
              return (
                <button
                  key={langMeta.code}
                  onClick={() => handleSelectLanguage(langMeta.code)}
                  className={`p-3 rounded-2xl border text-start transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-950/40 ring-1 ring-blue-400'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{langMeta.flag}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{langMeta.nativeName}</span>
                      {localizedName !== langMeta.nativeName && (
                        <span className="text-[10px] text-slate-400 block truncate">{localizedName}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Speech & Audio Options */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>{s.speechSectionTitle}</span>
          </h4>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">{s.speechRateLabel}</span>
              <span className="font-mono text-cyan-400 font-bold">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{s.slow}</span>
              <span>{s.normal}</span>
              <span>{s.fast}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Floating Ball & Screen Options */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>{s.ballSectionTitle}</span>
          </h4>

          <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <span className="font-bold text-white block">{s.resetBallTitle}</span>
              <span className="text-slate-400 text-[11px]">{s.resetBallDesc}</span>
            </div>
            <button
              onClick={() => {
                onResetFloatingBall();
                setResetBallNotice(true);
                setTimeout(() => setResetBallNotice(false), 2500);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{s.resetBallBtn}</span>
            </button>
          </div>
          {resetBallNotice && (
            <p className="text-xs text-emerald-400 font-bold">{s.resetBallDone}</p>
          )}
        </div>

        {/* Section 4: Storage & History */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>{s.storageSectionTitle}</span>
          </h4>

          <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <span className="font-bold text-white block">{s.clearHistoryTitle}</span>
              <span className="text-slate-400 text-[11px]">{s.clearHistoryDesc}</span>
            </div>
            <button
              onClick={() => setConfirmingClear(true)}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{s.clearHistoryBtn}</span>
            </button>
          </div>

          {confirmingClear && (
            <div className="p-3 rounded-2xl bg-red-950/40 border border-red-700/60 flex items-center justify-between gap-3 text-xs animate-in fade-in">
              <span className="text-red-200 font-semibold">{s.confirmClearText}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleConfirmClear}
                  className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition"
                >
                  {s.confirmYes}
                </button>
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  {s.confirmCancel}
                </button>
              </div>
            </div>
          )}

          {clearedNotice && (
            <p className="text-xs text-emerald-400 font-bold">{s.clearedDone}</p>
          )}
        </div>
      </div>
    </div>
  );
};
