import React, { useState, useEffect } from 'react';
import {
  DownloadCloud,
  CheckCircle2,
  Trash2,
  Info,
  X,
  RefreshCw,
  Download,
  ExternalLink,
} from 'lucide-react';
import { AVAILABLE_PACKS, LanguagePackMeta } from '../services/offlineData.ts';
import {
  getInstalledPacks,
  downloadLanguagePack,
  downloadPackFileToDevice,
  deleteLanguagePack,
} from '../services/offlineEngine.ts';
import { useI18n } from '../services/i18nContext.tsx';

interface OfflinePacksModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandaloneTab?: boolean;
  forceOffline: boolean;
  networkMode?: 'online' | 'offline';
  onToggleMode?: (mode: 'online' | 'offline') => void;
  onToggleForceOffline?: () => void;
}

export const OfflinePacksModal: React.FC<OfflinePacksModalProps> = ({
  isOpen = true,
  onClose,
  isStandaloneTab = false,
}) => {
  const { appLang, t, isRtl, getLangName } = useI18n();
  const p = t.packsModal;
  const [installedPacks, setInstalledPacks] = useState<string[]>(getInstalledPacks());
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [selectedPackForPreview, setSelectedPackForPreview] = useState<LanguagePackMeta | null>(null);

  useEffect(() => {
    const syncPacks = () => setInstalledPacks(getInstalledPacks());
    window.addEventListener('tarjuman-packs-changed', syncPacks);
    window.addEventListener('storage', syncPacks);
    return () => {
      window.removeEventListener('tarjuman-packs-changed', syncPacks);
      window.removeEventListener('storage', syncPacks);
    };
  }, []);

  if (!isOpen && !isStandaloneTab) return null;

  const handleDownload = async (code: string) => {
    setDownloadingCode(code);
    setDownloadProgress(0);
    try {
      await downloadLanguagePack(code, (pct) => {
        setDownloadProgress(pct);
      });
      setInstalledPacks(getInstalledPacks());
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingCode(null);
      setDownloadProgress(0);
    }
  };

  const handleSaveFileToDisk = (code: string) => {
    downloadPackFileToDevice(code);
  };

  const handleDelete = (code: string) => {
    deleteLanguagePack(code);
    setInstalledPacks(getInstalledPacks());
  };

  const content = (
    <div className="space-y-6">
      {/* Language Packs List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_PACKS.map((pack) => {
          const isInstalled = installedPacks.includes(pack.code);
          const isDownloading = downloadingCode === pack.code;
          const isArabic = pack.code === 'ar';
          const isEnglish = pack.code === 'en';
          const localizedName = getLangName(pack.code, pack.nameEn);
          const formattedWords = `+${pack.wordCount.toLocaleString()} ${t.common.words}`;

          return (
            <div
              key={pack.code}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                isArabic
                  ? 'bg-gradient-to-b from-amber-950/30 to-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-950/20'
                  : isEnglish
                  ? 'bg-gradient-to-b from-blue-950/30 to-slate-900/90 border-blue-500/40 shadow-lg shadow-blue-950/20'
                  : isInstalled
                  ? 'bg-slate-900/90 border-emerald-500/30 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0">{pack.flag}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-white">{localizedName}</h4>
                        <span className="text-xs text-slate-400 font-medium">({pack.nameEn})</span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {appLang === 'ar'
                          ? pack.descriptionAr || `${localizedName} (${pack.nameEn})`
                          : pack.nameEn}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-mono">
                        <span className="text-cyan-400 font-bold">{formattedWords}</span>
                        <span>•</span>
                        <span>
                          {p.fileSizeLabel} {pack.sizeMb} {t.common.mb}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isInstalled ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{p.installedBadge}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                        {p.availableBadge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar during download */}
              {isDownloading && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      style={{ width: `${downloadProgress}%` }}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-150"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block text-end">
                    {p.downloadingPack} ({downloadProgress}%)...
                  </span>
                </div>
              )}

              {/* Actions Toolbar */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveFileToDisk(pack.code)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 hover:border-cyan-500/50"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{p.downloadJsonBtn}</span>
                  </button>

                  <button
                    onClick={() => setSelectedPackForPreview(pack)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>{p.detailsBtn}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isInstalled ? (
                    <>
                      {pack.code !== 'ar' && (
                        <button
                          onClick={() => handleDelete(pack.code)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  ) : isDownloading ? (
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{downloadProgress}%</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDownload(pack.code)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/20 transition active:scale-95"
                    >
                      <DownloadCloud className="w-3.5 h-3.5" />
                      <span>{p.installOfflineBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Inspector Modal Preview */}
      {selectedPackForPreview && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-cyan-500/40 text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedPackForPreview.flag}</span>
              <strong className="text-sm font-bold text-white">
                {p.packDetailsPrefix} {getLangName(selectedPackForPreview.code, selectedPackForPreview.nameEn)} ({selectedPackForPreview.nameEn})
              </strong>
            </div>
            <button
              onClick={() => setSelectedPackForPreview(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-slate-300 leading-relaxed">
            {appLang === 'ar' ? selectedPackForPreview.descriptionAr : selectedPackForPreview.nameEn}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-[10px] text-slate-500">{p.filePathLabel}</span>
              <span className="font-mono text-cyan-300 text-[11px]">{selectedPackForPreview.fileUrl}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-[10px] text-slate-500">{p.totalWordsLabel}</span>
              <span className="font-bold text-white">
                {selectedPackForPreview.wordCount.toLocaleString()} {t.common.words}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-[10px] text-slate-500">{p.fileSizeLabel}</span>
              <span className="font-bold text-emerald-400">
                {selectedPackForPreview.sizeMb} {t.common.mb}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-[10px] text-slate-500">{p.licenseLabel}</span>
              <span className="font-bold text-cyan-300">{p.licenseOpenFree}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => handleSaveFileToDisk(selectedPackForPreview.code)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{p.downloadJsonDevice}</span>
            </button>
            <a
              href={selectedPackForPreview.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{p.openInBrowser}</span>
            </a>
          </div>
        </div>
      )}

      {/* Offline Instructions Card */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>{p.howItWorksTitle}</span>
        </div>
        <p className="leading-relaxed">{p.howItWorksDesc}</p>
      </div>
    </div>
  );

  if (isStandaloneTab) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-cyan-950/40">
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition`}
          aria-label={t.common.close}
        >
          <X className="w-5 h-5" />
        </button>
        {content}
      </div>
    </div>
  );
};
