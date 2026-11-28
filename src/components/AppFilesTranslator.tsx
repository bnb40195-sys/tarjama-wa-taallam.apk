import React, { useState, useRef, useMemo } from 'react';
import {
  ArrowRightLeft,
  UploadCloud,
  Download,
  Copy,
  Check,
  FileText,
  Smartphone,
  Languages,
  Trash2,
  AlertTriangle,
  Loader2,
  StopCircle,
  Eye,
  Code2,
  PackageSearch,
  CheckSquare,
  Square,
  ShieldCheck,
  FolderArchive,
  X,
} from 'lucide-react';
import { AVAILABLE_PACKS } from '../services/offlineData.ts';
import {
  AppLanguage,
  APP_LANGUAGES_META,
  isUsingSystemDefaultLanguage,
} from '../services/appTranslations.ts';
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
import {
  AppAnalysisResult,
  ExtractedLanguageFile,
  TranslatedLanguageFileBundle,
  analyzeAppPackage,
  bundleTranslatedFilesZip,
  createDemoAppPackageFile,
} from '../services/appPackageAnalyzer.ts';

interface AppFilesTranslatorProps {
  forceOffline: boolean;
  appLang: AppLanguage;
  onAppLangChange: (lang: AppLanguage | 'default') => void;
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

  // App UI direct language switcher (includes 'default' system/app language option)
  const [isDefaultUiLang, setIsDefaultUiLang] = useState<boolean>(() => isUsingSystemDefaultLanguage());
  const [targetUiLang, setTargetUiLang] = useState<AppLanguage | 'default'>(appLang === 'ar' ? 'en' : 'default');
  const [uiSwitchNotice, setUiSwitchNotice] = useState<string | null>(null);

  // Files language conversion state
  const [fromLang, setFromLang] = useState<string>('en');
  const [toLang, setToLang] = useState<string>('ar');
  const [fileName, setFileName] = useState<string>(
    FORMAT_SAMPLES.find((s) => s.category === 'file')?.fileName || FORMAT_SAMPLES[0].fileName
  );
  const [rawContent, setRawContent] = useState<string>(
    FORMAT_SAMPLES.find((s) => s.category === 'file')?.content || FORMAT_SAMPLES[0].content
  );
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

  // App package analyzer & language-file-only translator state
  const [appAnalysis, setAppAnalysis] = useState<AppAnalysisResult | null>(null);
  const [selectedLangFileIds, setSelectedLangFileIds] = useState<Set<string>>(new Set());
  const [isAnalyzingApp, setIsAnalyzingApp] = useState(false);
  const [appAnalyzeError, setAppAnalyzeError] = useState<string | null>(null);
  const [isPkgMissingPackError, setIsPkgMissingPackError] = useState(false);
  const [isAppDragOver, setIsAppDragOver] = useState(false);
  const [pkgFromLang, setPkgFromLang] = useState<string>('auto');
  const [pkgToLang, setPkgToLang] = useState<string>('ar');
  const [pkgOutputMode, setPkgOutputMode] = useState<'locale' | 'replace-default'>('locale');
  const [isTranslatingPkg, setIsTranslatingPkg] = useState(false);
  const [pkgProgressPct, setPkgProgressPct] = useState(0);
  const [translatedBundles, setTranslatedBundles] = useState<TranslatedLanguageFileBundle[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appPackageInputRef = useRef<HTMLInputElement>(null);
  const pkgPreviewRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pkgAbortControllerRef = useRef<AbortController | null>(null);

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
    if (mode === 'files') {
      const firstFileSample = FORMAT_SAMPLES.find((s) => s.category === 'file');
      if (firstFileSample && !entries) {
        setFileName(firstFileSample.fileName);
        setRawContent(firstFileSample.content);
        setExplicitFormat(firstFileSample.format);
        setFromLang(firstFileSample.defaultFrom);
        setToLang(firstFileSample.defaultTo);
      }
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

  const handleSelectSourceUiLang = (val: AppLanguage | 'default') => {
    setIsDefaultUiLang(val === 'default');
    onAppLangChange(val);
  };

  const handleApplyUiLanguage = () => {
    setIsDefaultUiLang(targetUiLang === 'default');
    onAppLangChange(targetUiLang);
    setUiSwitchNotice(targetUiLang === 'default' ? af.defaultLangSavedNotice : af.uiSwitchedNotice);
    setTimeout(() => setUiSwitchNotice(null), 3500);
  };

  const handleSwapUiLangs = () => {
    const prevCurrent: AppLanguage | 'default' = isDefaultUiLang ? 'default' : appLang;
    const prevTarget = targetUiLang;
    setIsDefaultUiLang(prevTarget === 'default');
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
    const outName =
      sectionMode === 'apps' && pkgOutputMode === 'replace-default'
        ? fileName
        : buildConvertedFileName(fileName, toLang, activeFormat);
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

  // --- App Package Analyzer & Language-File-Only Handlers ---
  const triggerBlobDownload = (blob: Blob, downloadName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runAnalyzeAppFile = async (file: File) => {
    setIsAnalyzingApp(true);
    setAppAnalyzeError(null);
    setIsPkgMissingPackError(false);
    setTranslatedBundles([]);
    setPkgProgressPct(0);

    try {
      const result = await analyzeAppPackage(file, file.name);
      setAppAnalysis(result);
      setSelectedLangFileIds(new Set(result.extractedLanguageFiles.map((f) => f.id)));
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'APP_TOO_LARGE') {
        setAppAnalyzeError(af.appTooLargeError);
      } else if (code === 'INVALID_APP_ARCHIVE') {
        setAppAnalyzeError(af.invalidAppArchiveError);
      } else {
        setAppAnalyzeError(af.invalidAppArchiveError);
      }
      setAppAnalysis(null);
    } finally {
      setIsAnalyzingApp(false);
    }
  };

  const handleAppPackageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void runAnalyzeAppFile(file);
    e.target.value = '';
  };

  const handleAppPackageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsAppDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void runAnalyzeAppFile(file);
  };

  const handleTrySampleAppPackage = async () => {
    const demoFile = await createDemoAppPackageFile();
    await runAnalyzeAppFile(demoFile);
  };

  const toggleLangFileSelection = (id: string) => {
    setSelectedLangFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLoadExtractedIntoEditor = async (langFile: ExtractedLanguageFile) => {
    setFileName(langFile.fileName);
    setRawContent(langFile.content);
    setExplicitFormat(langFile.format);
    let sourceLang = pkgFromLang;
    if (langFile.detectedLangHint && langFile.detectedLangHint !== 'default' && langFile.detectedLangHint !== 'auto') {
      const baseCode = langFile.detectedLangHint.split('-')[0];
      if (AVAILABLE_PACKS.some((p) => p.code === baseCode)) {
        sourceLang = baseCode;
      }
    }
    setFromLang(sourceLang);
    setToLang(pkgToLang);
    setErrorMsg(null);
    setAppAnalyzeError(null);
    setIsPkgMissingPackError(false);

    // Parse and show entries immediately in inline preview/editor, or populate defaults
    const doc = parseDocumentForTranslation(langFile.content, langFile.fileName, langFile.format);
    if (doc.entries.length > 0) {
      setEntries(
        doc.entries.map((e) => ({
          ...e,
          translatedText: e.translatedText || e.originalText,
        }))
      );
      setUsedOfflineNote(forceOffline);
      setTimeout(() => {
        pkgPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  };

  const buildTargetPathInPackage = (
    originalPath: string,
    fileNameOnly: string,
    targetLang: string,
    format: SupportedFormat
  ): string => {
    const normalized = originalPath.replace(/\\/g, '/');
    if (pkgOutputMode === 'replace-default') {
      if (/res\/values[^/]*\/strings\.xml$/i.test(normalized)) {
        return normalized.replace(/res\/values[^/]*\/strings\.xml$/i, 'res/values/strings.xml');
      }
      return normalized;
    }
    if (/res\/values[^/]*\/strings\.xml$/i.test(normalized)) {
      return normalized.replace(/res\/values[^/]*\/strings\.xml$/i, `res/values-${targetLang}/strings.xml`);
    }
    const lastSlash = normalized.lastIndexOf('/');
    const outFile = buildConvertedFileName(fileNameOnly, targetLang, format);
    return lastSlash >= 0 ? `${normalized.slice(0, lastSlash + 1)}${outFile}` : outFile;
  };

  const handleTranslateOnlyExtractedLangFiles = async () => {
    if (!appAnalysis) return;
    const targets = appAnalysis.extractedLanguageFiles.filter((f) => selectedLangFileIds.has(f.id));
    if (targets.length === 0) {
      setAppAnalyzeError(af.selectAtLeastOneLangFile);
      return;
    }
    if (pkgFromLang !== 'auto' && pkgFromLang === pkgToLang) {
      setAppAnalyzeError(af.sameLangError);
      return;
    }

    pkgAbortControllerRef.current?.abort();
    const controller = new AbortController();
    pkgAbortControllerRef.current = controller;

    setIsTranslatingPkg(true);
    setPkgProgressPct(0);
    setAppAnalyzeError(null);
    setIsPkgMissingPackError(false);
    setTranslatedBundles([]);

    try {
      const parsedItems = targets.map((lf) => ({
        lf,
        doc: parseDocumentForTranslation(lf.content, lf.fileName, lf.format),
      }));
      const totalEntries = parsedItems.reduce((sum, item) => sum + item.doc.entries.length, 0) || 1;
      let completedEntries = 0;

      const results: TranslatedLanguageFileBundle[] = [];

      for (const { lf, doc } of parsedItems) {
        if (controller.signal.aborted) break;
        const sourceLangForFile = pkgFromLang;
        const res = await translateEntriesBatch(
          doc.entries,
          sourceLangForFile,
          pkgToLang,
          forceOffline,
          (filePct) => {
            const currentFileDone = Math.round((filePct / 100) * doc.entries.length);
            const overall = Math.min(100, Math.round(((completedEntries + currentFileDone) / totalEntries) * 100));
            setPkgProgressPct(overall);
          },
          controller.signal
        );

        completedEntries += doc.entries.length;
        const map = new Map<string, string>();
        for (const e of res.entries) map.set(e.id, e.translatedText);

        const rebuilt = doc.rebuild(map);
        const outPath = buildTargetPathInPackage(lf.path, lf.fileName, pkgToLang, lf.format);
        const outName = outPath.split('/').pop() || buildConvertedFileName(lf.fileName, pkgToLang, lf.format);

        results.push({
          originalPath: lf.path,
          outputFileName: outName,
          outputPath: outPath,
          format: lf.format,
          content: rebuilt,
          translatedCount: res.entries.length,
        });

        // Also sync the first translated language file into the preview/editor workspace below
        if (results.length === 1) {
          setFileName(lf.fileName);
          setRawContent(lf.content);
          setExplicitFormat(lf.format);
          setFromLang(pkgFromLang);
          setToLang(pkgToLang);
          setEntries(res.entries);
          setUsedOfflineNote(res.usedOffline);
        }
      }

      setTranslatedBundles(results);
      setPkgProgressPct(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.common.retry;
      setAppAnalyzeError(msg);
      setIsPkgMissingPackError(
        err instanceof MissingPackError || (err instanceof Error && err.name === 'MissingPackError')
      );
    } finally {
      setIsTranslatingPkg(false);
    }
  };

  const handleDownloadAllBundlesZip = async () => {
    if (!appAnalysis || translatedBundles.length === 0) return;
    const blob = await bundleTranslatedFilesZip(translatedBundles);
    const stem = appAnalysis.appName.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'app';
    triggerBlobDownload(blob, `${stem}_lang_${pkgToLang}.zip`);
  };

  const handleDownloadSingleBundle = (bundle: TranslatedLanguageFileBundle) => {
    const blob = new Blob([bundle.content], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, bundle.outputFileName);
  };

  const handleClearAppAnalysis = () => {
    pkgAbortControllerRef.current?.abort();
    setAppAnalysis(null);
    setSelectedLangFileIds(new Set());
    setTranslatedBundles([]);
    setAppAnalyzeError(null);
    setIsPkgMissingPackError(false);
    setPkgProgressPct(0);
  };

  const currentUiLangObj = APP_LANGUAGES_META.find((l) => l.code === appLang);
  const filteredSamples = FORMAT_SAMPLES.filter((s) => s.category === 'file');

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

      {/* Mode A Top Card: Instant Current App Language Converter (includes Default Language option) */}
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
                {isDefaultUiLang
                  ? `🌐 ${af.defaultOptionLabel}`
                  : `${currentUiLangObj?.flag} ${currentUiLangObj?.nativeName}`}
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
                value={isDefaultUiLang ? 'default' : appLang}
                onChange={(e) => handleSelectSourceUiLang(e.target.value as AppLanguage | 'default')}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="default">
                  🌐 {af.defaultOptionLabel}
                </option>
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
                onChange={(e) => setTargetUiLang(e.target.value as AppLanguage | 'default')}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="default">
                  🌐 {af.defaultOptionLabel}
                </option>
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

      {/* Mode A Middle Card: App Package Analyzer -> Extract & Translate ONLY Language Files */}
      {sectionMode === 'apps' && (
        <section className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PackageSearch className="w-5 h-5 text-cyan-400" />
                <span>{af.appPackageSectionTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {af.appPackageSectionSubtitle}
              </p>
            </div>

            {appAnalysis && (
              <button
                onClick={handleClearAppAnalysis}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.common.clear}</span>
              </button>
            )}
          </div>

          {/* Dropzone for .apk / .aab / .ipa / .zip */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsAppDragOver(true);
            }}
            onDragLeave={() => setIsAppDragOver(false)}
            onDrop={handleAppPackageDrop}
            className={`rounded-xl border-2 border-dashed p-5 transition-colors flex flex-col md:flex-row items-center justify-between gap-4 ${
              isAppDragOver
                ? 'border-cyan-400 bg-cyan-950/30'
                : 'border-slate-700 bg-slate-950/60 hover:border-cyan-500/60'
            }`}
          >
            <div className={`flex items-center gap-3 text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
              <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{af.uploadAppDropTitle}</p>
                <p className="text-xs text-slate-400 mt-0.5">{af.uploadAppDropHint}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <input
                ref={appPackageInputRef}
                type="file"
                accept=".apk,.aab,.ipa,.zip"
                onChange={handleAppPackageInput}
                className="hidden"
              />
              <button
                onClick={() => appPackageInputRef.current?.click()}
                disabled={isAnalyzingApp}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-bold transition-colors whitespace-nowrap"
              >
                {af.chooseAppPackageBtn}
              </button>
              <button
                onClick={handleTrySampleAppPackage}
                disabled={isAnalyzingApp}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors whitespace-nowrap"
              >
                {af.trySampleAppBtn}
              </button>
            </div>
          </div>

          {isAnalyzingApp && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs text-cyan-300">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{af.analyzingAppMsg}</span>
            </div>
          )}

          {appAnalyzeError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/70 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{appAnalyzeError}</span>
              </div>
              {isPkgMissingPackError && (
                <button
                  onClick={onOpenPacksModal}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold whitespace-nowrap shrink-0"
                >
                  {t.common.openOfflinePacks}
                </button>
              )}
            </div>
          )}

          {appAnalysis && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* App Identity & File Filter Breakdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">{appAnalysis.appName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-cyan-300 uppercase">
                      {appAnalysis.appKind}
                    </span>
                  </div>
                  {appAnalysis.packageId && (
                    <p className="text-xs font-mono text-slate-400">{appAnalysis.packageId}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono truncate max-w-full">
                  {appAnalysis.appFileName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">{af.totalFilesLabel}</div>
                  <div className="text-xl font-extrabold text-white tabular-nums mt-1">
                    {appAnalysis.totalFilesCount}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">{af.skippedNonLangLabel}</div>
                  <div className="text-xl font-extrabold text-amber-400 tabular-nums mt-1">
                    {appAnalysis.skippedFilesCount}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-700/40">
                  <div className="text-xs text-emerald-300">{af.extractedLangFilesLabel}</div>
                  <div className="text-xl font-extrabold text-emerald-400 tabular-nums mt-1">
                    {appAnalysis.extractedLanguageFiles.length}
                  </div>
                </div>
              </div>

              {appAnalysis.usedBinaryArsc && (
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-700/40 text-xs text-cyan-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{af.apkBinaryExtractedNote}</span>
                </div>
              )}

              {appAnalysis.extractedLanguageFiles.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  {af.noLangFilesFoundInApp}
                </div>
              ) : (
                <>
                  {/* Extracted Language Files List */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 divide-y divide-slate-800/80 max-h-[280px] overflow-y-auto">
                    {appAnalysis.extractedLanguageFiles.map((lf) => {
                      const isChecked = selectedLangFileIds.has(lf.id);
                      return (
                        <div
                          key={lf.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => toggleLangFileSelection(lf.id)}
                            className={`flex items-start gap-3 flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}
                          >
                            <span className="mt-0.5 text-cyan-400 shrink-0">
                              {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                            </span>
                            <div className="min-w-0 space-y-1">
                              <div className="text-xs font-mono font-bold text-white truncate" dir="ltr">
                                {lf.path}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 tabular-nums">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono uppercase">
                                  {lf.format}
                                </span>
                                {lf.detectedLangHint !== 'auto' && lf.detectedLangHint !== 'default' && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                    {lf.detectedLangHint}
                                  </span>
                                )}
                                <span>
                                  {lf.entryCount} {af.stringsCountSuffix}
                                </span>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => handleLoadExtractedIntoEditor(lf)}
                            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 whitespace-nowrap self-end sm:self-center"
                          >
                            {af.loadIntoEditorBtn}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Translate Extracted Language Files Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-end gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-400">{af.sourceLangLabel}</label>
                      <select
                        value={pkgFromLang}
                        onChange={(e) => setPkgFromLang(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
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
                        onClick={() => {
                          if (pkgFromLang === 'auto') {
                            setPkgFromLang(pkgToLang);
                            setPkgToLang('en');
                          } else {
                            const prev = pkgFromLang;
                            setPkgFromLang(pkgToLang);
                            setPkgToLang(prev);
                          }
                        }}
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 flex items-center justify-center transition-colors"
                        title={t.common.swapLanguages}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-400">{af.targetLangLabel}</label>
                      <select
                        value={pkgToLang}
                        onChange={(e) => setPkgToLang(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
                      >
                        {AVAILABLE_PACKS.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.flag} {getLangName(p.code, p.nameEn)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      {isTranslatingPkg ? (
                        <button
                          onClick={() => {
                            pkgAbortControllerRef.current?.abort();
                            setIsTranslatingPkg(false);
                          }}
                          className="w-full md:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                        >
                          <StopCircle className="w-4 h-4" />
                          <span>{af.stopBtn} ({pkgProgressPct}%)</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleTranslateOnlyExtractedLangFiles}
                          className="w-full md:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                        >
                          <Languages className="w-4 h-4" />
                          <span>{af.translateAllLangFilesBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Output Mode: Add new locale OR Replace App Default Language */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs font-medium text-slate-300">{af.outputModeLabel}</span>
                    <div className="inline-flex flex-wrap p-1 rounded-xl bg-slate-900 border border-slate-800 gap-1">
                      <button
                        type="button"
                        onClick={() => setPkgOutputMode('locale')}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          pkgOutputMode === 'locale'
                            ? 'bg-cyan-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {af.addAsLocaleFileLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPkgOutputMode('replace-default')}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          pkgOutputMode === 'replace-default'
                            ? 'bg-amber-600 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {af.replaceDefaultAppLangLabel}
                      </button>
                    </div>
                  </div>

                  {isTranslatingPkg && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-cyan-300 tabular-nums">
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{af.translatingOnlyLangFilesMsg}</span>
                        </span>
                        <span>{pkgProgressPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-200"
                          style={{ width: `${pkgProgressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Translated Language Files Output Bundle */}
                  {translatedBundles.length > 0 && (
                    <div className="rounded-xl bg-emerald-950/25 border border-emerald-700/40 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span>{af.translatedLangPackTitle}</span>
                        </h4>
                        <button
                          onClick={handleDownloadAllBundlesZip}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Download className="w-4 h-4" />
                          <span>{af.downloadAllZipBtn}</span>
                        </button>
                      </div>

                      <div className="divide-y divide-emerald-800/40 rounded-lg bg-slate-950/70 border border-emerald-800/30">
                        {translatedBundles.map((b) => (
                          <div
                            key={b.outputPath}
                            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-mono text-emerald-200 truncate" dir="ltr">
                                {b.outputPath}
                              </div>
                              <div className="text-[11px] text-slate-400 tabular-nums">
                                {b.translatedCount} {af.translatedItemsCount}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownloadSingleBundle(b)}
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 self-end sm:self-center whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{af.downloadSingleFileBtn}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Compare / Edit / Export for Extracted App Language File */}
                  {entries && entries.length > 0 && (
                    <div ref={pkgPreviewRef} className="pt-4 border-t border-slate-800 space-y-4">
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
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* Files Mode Only: Document & File Language Converter (removed from Apps mode per user request) */}
      {sectionMode === 'files' && (
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>{af.filesWorkspaceTitle}</span>
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
                {af.dropFilesTitle}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {af.dropFilesHint}
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
      )}
    </div>
  );
};
