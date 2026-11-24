import React, { useState, useRef, useMemo } from 'react';
import {
  ArrowRightLeft,
  UploadCloud,
  Download,
  Copy,
  Check,
  FileCode2,
  FileText,
  Smartphone,
  Languages,
  Trash2,
  AlertTriangle,
  Loader2,
  StopCircle,
  Eye,
  Code2,
} from 'lucide-react';
import { AVAILABLE_PACKS } from '../services/offlineData.ts';
import { AppLanguage, APP_LANGUAGES_META } from '../services/appTranslations.ts';
import { useI18n } from '../services/i18nContext.tsx';
import {
  FORMAT_SAMPLES,
  MissingPackError,
  SupportedFormat,
  TranslatableEntry,
  parseDocumentForTranslation,
  translateEntriesBatch,
  buildConvertedFileName,
  detectFormat,
} from '../services/appFileTranslator.ts';

interface AppFilesTranslatorProps {
  forceOffline: boolean;
  appLang: AppLanguage;
  onAppLangChange: (lang: AppLanguage) => void;
  onOpenPacksModal: () => void;
}

export const AppFilesTranslator: React.FC<AppFilesTranslatorProps> = ({
  forceOffline,
  appLang,
  onAppLangChange,
  onOpenPacksModal,
}) => {
  const { t, isRtl, getLangName } = useI18n();
  const af = t.appsFilesTab;

  const [sectionMode, setSectionMode] = useState<'apps' | 'files'>('apps');

  // App UI direct language switcher (From current app language -> To target app language)
  const [targetUiLang, setTargetUiLang] = useState<AppLanguage>(appLang === 'ar' ? 'en' : 'ar');
  const [uiSwitchNotice, setUiSwitchNotice] = useState<string | null>(null);

  // Apps & Files language conversion state
  const [fromLang, setFromLang] = useState<string>('auto');
  const [toLang, setToLang] = useState<string>('ar');
  const [fileName, setFileName] = useState<string>(FORMAT_SAMPLES[0].fileName);
  const [rawContent, setRawContent] = useState<string>(FORMAT_SAMPLES[0].content);
  const [explicitFormat, setExplicitFormat] = useState<SupportedFormat | undefined>(undefined);
  const [entries, setEntries] = useState<TranslatableEntry[] | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMissingPackError, setIsMissingPackError] = useState(false);
  const [usedOfflineNote, setUsedOfflineNote] = useState<boolean | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const parsedDoc = useMemo(() => {
    if (!rawContent.trim()) return null;
    return parseDocumentForTranslation(rawContent, fileName, explicitFormat);
  }, [rawContent, fileName, explicitFormat]);

  const activeFormat: SupportedFormat = parsedDoc?.format || detectFormat(fileName, rawContent);

  const rebuiltOutput = useMemo(() => {
    if (!parsedDoc || !entries) return '';
    const map = new Map<string, string>();
    for (const e of entries) {
      map.set(e.id, e.translatedText);
    }
    return parsedDoc.rebuild(map);
  }, [parsedDoc, entries]);

  const handleModeSwitch = (mode: 'apps' | 'files') => {
    setSectionMode(mode);
    setErrorMsg(null);
    const firstSample = FORMAT_SAMPLES.find((s) => s.category === (mode === 'apps' ? 'app' : 'file'));
    if (firstSample && !entries) {
      setFileName(firstSample.fileName);
      setRawContent(firstSample.content);
      setExplicitFormat(firstSample.format);
      setFromLang(firstSample.defaultFrom);
      setToLang(firstSample.defaultTo);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = FORMAT_SAMPLES.find((s) => s.id === sampleId);
    if (!sample) return;
    setFileName(sample.fileName);
    setRawContent(sample.content);
    setExplicitFormat(sample.format);
    setFromLang(sample.defaultFrom);
    setToLang(sample.defaultTo);
    setEntries(null);
    setErrorMsg(null);
    setUsedOfflineNote(null);
  };

  const handleSwapLanguages = () => {
    if (fromLang === 'auto') {
      setFromLang(toLang);
      setToLang('en');
    } else {
      const prevFrom = fromLang;
      setFromLang(toLang);
      setToLang(prevFrom);
    }
    setEntries(null);
  };

  const handleApplyUiLanguage = () => {
    onAppLangChange(targetUiLang);
    setUiSwitchNotice(af.uiSwitchedNotice);
    setTimeout(() => setUiSwitchNotice(null), 3500);
  };

  const handleSwapUiLangs = () => {
    const prevCurrent = appLang;
    const prevTarget = targetUiLang;
    onAppLangChange(prevTarget);
    setTargetUiLang(prevCurrent);
  };

  const readSelectedFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg(af.fileTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = typeof ev.target?.result === 'string' ? ev.target.result : '';
      if (!text.trim()) {
        setErrorMsg(af.fileEmptyError);
        return;
      }
      setFileName(file.name);
      setRawContent(text);
      setExplicitFormat(undefined);
      setEntries(null);
      setErrorMsg(null);
      setUsedOfflineNote(null);
    };
    reader.onerror = () => {
      setErrorMsg(af.fileReadError);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readSelectedFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readSelectedFile(file);
  };

  const handleConvertLanguage = async () => {
    if (!parsedDoc || parsedDoc.entries.length === 0) {
      setErrorMsg(af.noTranslatableEntries);
      return;
    }
    if (fromLang !== 'auto' && fromLang === toLang) {
      setErrorMsg(af.sameLangError);
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsTranslating(true);
    setProgressPct(0);
    setErrorMsg(null);
    setIsMissingPackError(false);
    setUsedOfflineNote(null);

    try {
      const res = await translateEntriesBatch(
        parsedDoc.entries,
        fromLang,
        toLang,
        forceOffline,
        (pct) => setProgressPct(pct),
        controller.signal
      );
      setEntries(res.entries);
      setUsedOfflineNote(res.usedOffline);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.common.retry;
      setErrorMsg(msg);
      setIsMissingPackError(err instanceof MissingPackError || (err instanceof Error && err.name === 'MissingPackError'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCancelTranslation = () => {
    abortControllerRef.current?.abort();
    setIsTranslating(false);
  };

  const handleEditTranslatedEntry = (id: string, nextValue: string) => {
    setEntries((prev) =>
      prev ? prev.map((item) => (item.id === id ? { ...item, translatedText: nextValue } : item)) : prev
    );
  };

  const handleCopyOutput = async () => {
    if (!rebuiltOutput) return;
    try {
      await navigator.clipboard.writeText(rebuiltOutput);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    } catch {
      setErrorMsg(af.copyError);
    }
  };

  const handleDownloadOutput = () => {
    if (!rebuiltOutput) return;
    const outName = buildConvertedFileName(fileName, toLang, activeFormat);
    const bom = activeFormat === 'csv' ? '\uFEFF' : '';
    const blob = new Blob([bom + rebuiltOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setRawContent('');
    setEntries(null);
    setErrorMsg(null);
    setUsedOfflineNote(null);
    setProgressPct(0);
  };

  const currentUiLangObj = APP_LANGUAGES_META.find((l) => l.code === appLang);
  const filteredSamples = FORMAT_SAMPLES.filter((s) =>
    sectionMode === 'apps' ? s.category === 'app' : s.category === 'file'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Section Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {af.title}
          </h2>
          <p className="text-sm text-slate-400">
            {af.subtitle}
          </p>
        </div>

        {/* Segmented Mode Control */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start lg:self-auto">
          <button
            onClick={() => handleModeSwitch('apps')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
              sectionMode === 'apps'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{af.modeApps}</span>
          </button>
          <button
            onClick={() => handleModeSwitch('files')}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
              sectionMode === 'files'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{af.modeFiles}</span>
          </button>
        </div>
      </div>

      {/* Mode A Top Card: Instant Current App Language Converter (From -> To) */}
      {sectionMode === 'apps' && (
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Languages className="w-4 h-4 text-cyan-400" />
                <span>{af.uiSwitchTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {af.uiSwitchSubtitle}
              </p>
            </div>
            <div className="text-xs text-slate-400 tabular-nums">
              {af.currentLangLabel}{' '}
              <strong className="text-cyan-300">
                {currentUiLangObj?.flag} {currentUiLangObj?.nativeName}
              </strong>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>{appLang === 'ar' ? 'RTL' : 'LTR'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-center gap-3">
            {/* Current App Language (Source) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">{af.fromAppLang}</label>
              <select
                value={appLang}
                onChange={(e) => onAppLangChange(e.target.value as AppLanguage)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                {APP_LANGUAGES_META.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} ({getLangName(l.code, l.nativeName)})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Current & Target App UI Languages */}
            <div className="flex justify-center md:pt-5">
              <button
                onClick={handleSwapUiLangs}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 flex items-center justify-center transition-colors"
                title={t.common.swapLanguages}
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Target App Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">{af.toAppLang}</label>
              <select
                value={targetUiLang}
                onChange={(e) => setTargetUiLang(e.target.value as AppLanguage)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                {APP_LANGUAGES_META.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} ({getLangName(l.code, l.nativeName)})
                  </option>
                ))}
              </select>
            </div>

            {/* Apply Button */}
            <div className="md:pt-5">
              <button
                onClick={handleApplyUiLanguage}
                className="w-full md:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-colors whitespace-nowrap"
              >
                {af.applyToApp}
              </button>
            </div>
          </div>

          {uiSwitchNotice && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-xs text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uiSwitchNotice}</span>
            </div>
          )}
        </section>
      )}

      {/* Main Workspace: From Language -> To Language Converter for App Localization & Files */}
      <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {sectionMode === 'apps' ? (
                <FileCode2 className="w-4 h-4 text-blue-400" />
              ) : (
                <FileText className="w-4 h-4 text-blue-400" />
              )}
              <span>
                {sectionMode === 'apps' ? af.appsWorkspaceTitle : af.filesWorkspaceTitle}
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 tabular-nums">
              <span>{af.formatLabels[activeFormat]}</span>
              <span aria-hidden="true">·</span>
              <span>
                {parsedDoc ? `${parsedDoc.entries.length} ${af.translatableItemsCount}` : af.awaitingInput}
              </span>
              {fileName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-300">{fileName}</span>
                </>
              )}
            </div>
          </div>

          {/* Sample Templates */}
          <div className="flex flex-wrap items-center gap-2">
            {filteredSamples.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample.id)}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {af.samplePrefix} {sample.format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Language Direction Bar: From -> To */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">{af.sourceLangLabel}</label>
            <select
              value={fromLang}
              onChange={(e) => {
                setFromLang(e.target.value);
                setEntries(null);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
            >
              <option value="auto">{t.common.autoDetect}</option>
              {AVAILABLE_PACKS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.flag} {getLangName(p.code, p.nameEn)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSwapLanguages}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 flex items-center justify-center transition-colors"
              title={t.common.swapLanguages}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">{af.targetLangLabel}</label>
            <select
              value={toLang}
              onChange={(e) => {
                setToLang(e.target.value);
                setEntries(null);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
            >
              {AVAILABLE_PACKS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.flag} {getLangName(p.code, p.nameEn)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Area & Format Picker */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-5 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
          }`}
        >
          <div className={`flex items-center gap-3 text-center ${isRtl ? 'sm:text-right' : 'sm:text-left'}`}>
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {sectionMode === 'apps' ? af.dropAppsTitle : af.dropFilesTitle}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {sectionMode === 'apps' ? af.dropAppsHint : af.dropFilesHint}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.xml,.json,.arb,.strings,.srt,.vtt,.csv,.md,.html,.htm,.properties,.ini,.env"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-colors whitespace-nowrap"
            >
              {af.chooseFileBtn}
            </button>

            <select
              value={activeFormat}
              onChange={(e) => {
                setExplicitFormat(e.target.value as SupportedFormat);
                setEntries(null);
              }}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {(Object.keys(af.formatLabels) as SupportedFormat[]).map((fmt) => (
                <option key={fmt} value={fmt}>
                  {af.formatLabels[fmt]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Source Input Editor & Action Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-300">
              {af.sourceContentLabel}
            </label>
            {rawContent && (
              <button
                onClick={handleClear}
                className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.common.clear}</span>
              </button>
            )}
          </div>

          <textarea
            value={rawContent}
            onChange={(e) => {
              setRawContent(e.target.value);
              setEntries(null);
            }}
            dir="ltr"
            rows={8}
            placeholder={af.sourcePlaceholder}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none p-4 font-mono text-xs text-slate-200 leading-relaxed resize-y"
          />

          {/* Primary Convert CTA + Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-400">
              {forceOffline ? af.offlineHint : af.onlineHint}
            </div>

            <div className="flex items-center gap-2">
              {isTranslating ? (
                <button
                  onClick={handleCancelTranslation}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>
                    {af.stopBtn} ({progressPct}%)
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleConvertLanguage}
                  disabled={!rawContent.trim()}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Languages className="w-4 h-4" />
                  <span>{af.convertBtn}</span>
                </button>
              )}
            </div>
          </div>

          {isTranslating && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-cyan-300 tabular-nums">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{af.convertingMsg}</span>
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/70 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              {isMissingPackError && (
                <button
                  onClick={onOpenPacksModal}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold whitespace-nowrap shrink-0"
                >
                  {t.common.openOfflinePacks}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Area */}
        {entries && entries.length > 0 && (
          <div className="pt-5 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">
                  {af.convertedResultTitle} ({buildConvertedFileName(fileName, toLang, activeFormat)})
                </h4>
                <p className="text-xs text-slate-400 tabular-nums">
                  {entries.length} {af.translatedItemsCount}
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{usedOfflineNote ? af.modeOfflineShort : af.modeCloudShort}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{af.editableHint}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{af.compareEditBtn}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'raw' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{af.finalFileBtn}</span>
                  </button>
                </div>

                <button
                  onClick={handleCopyOutput}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {copiedOutput ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedOutput ? t.common.copied : af.copyResultBtn}</span>
                </button>

                <button
                  onClick={handleDownloadOutput}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>{af.downloadResultBtn}</span>
                </button>
              </div>
            </div>

            {viewMode === 'table' ? (
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-800/80">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-1 lg:grid-cols-[180px_1fr_1fr] gap-3 p-3.5 items-start"
                    >
                      <div className="text-xs font-mono text-cyan-400 break-all pt-1">
                        {entry.label}
                      </div>
                      <div className="text-xs text-slate-300 bg-slate-900/70 rounded-lg p-2.5 border border-slate-800/80 leading-relaxed">
                        {entry.originalText}
                      </div>
                      <input
                        type="text"
                        value={entry.translatedText}
                        onChange={(e) => handleEditTranslatedEntry(entry.id, e.target.value)}
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <textarea
                readOnly
                value={rebuiltOutput}
                dir="ltr"
                rows={12}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-200 leading-relaxed"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
};
