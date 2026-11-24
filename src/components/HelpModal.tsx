import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Smartphone,
  WifiOff,
  Camera,
  Tv,
  Languages,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react';

import { useI18n } from '../services/i18nContext.tsx';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'text' | 'camera' | 'video' | 'screen' | 'grammar' | 'appsFiles' | 'packs') => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { t } = useI18n();
  const h = t.helpModal;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const guideMeta: Array<{
    icon: React.ReactNode;
    actionTab: 'screen' | 'packs' | 'camera' | 'video' | 'grammar' | 'appsFiles';
  }> = [
    { icon: <Smartphone className="w-5 h-5 text-cyan-400" />, actionTab: 'screen' },
    { icon: <WifiOff className="w-5 h-5 text-amber-400" />, actionTab: 'packs' },
    { icon: <Camera className="w-5 h-5 text-blue-400" />, actionTab: 'camera' },
    { icon: <Tv className="w-5 h-5 text-indigo-400" />, actionTab: 'video' },
    { icon: <BookOpen className="w-5 h-5 text-emerald-400" />, actionTab: 'grammar' },
    { icon: <Languages className="w-5 h-5 text-cyan-400" />, actionTab: 'appsFiles' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-cyan-600/20 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-white">{h.title}</h3>
              <p className="text-xs text-slate-400">{h.subtitle}</p>
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

        {/* Feature Guides */}
        <div className="space-y-4">
          {h.guides.map((guide, idx) => {
            const meta = guideMeta[idx] || guideMeta[0];
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <span className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    {meta.icon}
                  </span>
                  <span>{guide.title}</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed ps-2">
                  {guide.steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab(meta.actionTab);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-600 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{guide.actionLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span>{h.faqTitle}</span>
          </h4>

          <div className="space-y-2">
            {h.faqs.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="w-full p-3.5 flex items-center justify-between text-start text-xs font-bold text-white hover:bg-slate-850 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-3.5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-850">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
