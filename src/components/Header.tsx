import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  WifiOff,
  Wifi,
  DownloadCloud,
  CircleDot,
  History,
  Languages,
  Zap,
  Settings,
  HelpCircle,
  GraduationCap,
  CheckCircle2,
  PowerOff,
  ChevronDown,
  Smartphone,
  FileCode2,
} from 'lucide-react';
import { getInstalledPacks } from '../services/offlineEngine.ts';
import { AppLanguage, UI_LOCALES } from '../services/appTranslations.ts';
import {
  getExternalBallStatus,
  enableExternalFloatingBall,
  disableExternalFloatingBall,
  subscribeExternalBallChanged,
} from '../services/systemFloatingBall.ts';

interface HeaderProps {
  forceOffline: boolean;
  networkMode: 'online' | 'offline';
  onToggleMode: (mode: 'online' | 'offline') => void;
  onToggleForceOffline?: () => void;
  isBrowserOnline: boolean;
  onOpenPacksModal: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  floatingBallEnabled: boolean;
  onToggleFloatingBall: () => void;
  onSetFloatingBallEnabled?: (enabled: boolean) => void;
  activeTab: 'text' | 'camera' | 'video' | 'screen' | 'grammar' | 'appsFiles' | 'packs';
  setActiveTab: (tab: 'text' | 'camera' | 'video' | 'screen' | 'grammar' | 'appsFiles' | 'packs') => void;
  appLang: AppLanguage;
}

export const Header: React.FC<HeaderProps> = ({
  forceOffline,
  onToggleMode,
  isBrowserOnline,
  onOpenPacksModal,
  onOpenHistory,
  onOpenSettings,
  onOpenHelp,
  floatingBallEnabled,
  onToggleFloatingBall,
  onSetFloatingBallEnabled,
  activeTab,
  setActiveTab,
  appLang,
}) => {
  const [installedCount, setInstalledCount] = useState(() => getInstalledPacks().length);
  const [ballMenuOpen, setBallMenuOpen] = useState(false);
  const [externalBallRunning, setExternalBallRunning] = useState(false);
  const [externalNotice, setExternalNotice] = useState<string | null>(null);
  const ballMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncExternal = () => {
      getExternalBallStatus().then((st) => setExternalBallRunning(st.running));
    };
    syncExternal();
    const unsub = subscribeExternalBallChanged(syncExternal);
    window.addEventListener('focus', syncExternal);
    return () => {
      unsub();
      window.removeEventListener('focus', syncExternal);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ballMenuRef.current && !ballMenuRef.current.contains(e.target as Node)) {
        setBallMenuOpen(false);
      }
    };
    if (ballMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [ballMenuOpen]);

  useEffect(() => {
    const syncPacks = () => setInstalledCount(getInstalledPacks().length);
    window.addEventListener('tarjuman-packs-changed', syncPacks);
    window.addEventListener('storage', syncPacks);
    return () => {
      window.removeEventListener('tarjuman-packs-changed', syncPacks);
      window.removeEventListener('storage', syncPacks);
    };
  }, []);

  const isEffectivelyOffline = forceOffline || !isBrowserOnline;
  const t = UI_LOCALES[appLang] || UI_LOCALES.ar;
  const isRtl = appLang === 'ar';
  const logoBadgeChar = t.common.appName.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
              {logoBadgeChar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-wide">
                  {t.common.appName}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-bold">
                  {t.common.appTagline}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.common.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Interactive Online / Offline Mode Toggle */}
            <div className="flex items-center rounded-2xl bg-slate-950 border border-slate-800 p-1 shadow-inner gap-1">
              <button
                onClick={() => onToggleMode('online')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !isEffectivelyOffline
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title={t.header.onlineTitle}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-300" />
                <span>{t.header.onlineBtn}</span>
              </button>

              <button
                onClick={() => onToggleMode('offline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isEffectivelyOffline
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title={t.header.offlineTitle}
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                <span>{t.header.offlineBtn}</span>
              </button>
            </div>

            {/* Network / Connection Mode Status Badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                !isBrowserOnline
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : isEffectivelyOffline
                  ? 'bg-amber-950/40 border-amber-600/30 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isEffectivelyOffline ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              {!isBrowserOnline ? (
                <span>
                  {t.header.statusLostNet}{' '}
                  <strong className="text-amber-200">{t.header.statusAutoOffline}</strong>
                </span>
              ) : isEffectivelyOffline ? (
                <span>
                  {t.header.statusManualOffline}{' '}
                  <strong className="text-amber-200">{t.header.statusDevicePacksOnly}</strong>
                </span>
              ) : (
                <span>
                  {t.header.statusCloud}{' '}
                  <strong className="text-emerald-200">{t.header.statusEngineConnected}</strong>
                </span>
              )}
            </div>

            {/* Offline Packs Download Manager Button */}
            <button
              onClick={onOpenPacksModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
              title={t.header.offlinePacksTitle}
            >
              <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.header.offlinePacksBtn}</span>
              <span className="w-5 h-5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-[10px] flex items-center justify-center font-bold">
                {installedCount}
              </span>
            </button>

            {/* Floating Ball Toggle with Activate / Deactivate Menu */}
            <div className="relative" ref={ballMenuRef}>
              <button
                onClick={() => setBallMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                  floatingBallEnabled
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 ring-2 ring-cyan-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title={t.header.floatingBallTitle}
              >
                <CircleDot className={`w-3.5 h-3.5 ${floatingBallEnabled ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{t.header.floatingBallBtn}</span>
                <span className={`w-2 h-2 rounded-full ${floatingBallEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <ChevronDown className={`w-3 h-3 transition-transform ${ballMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {ballMenuOpen && (
                <div
                  className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2`}
                >
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-800 mb-1.5 flex items-center justify-between">
                      <span>{t.header.inAppBallTitle}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          floatingBallEnabled
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {floatingBallEnabled ? t.common.enabled : t.common.disabled}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          if (onSetFloatingBallEnabled) {
                            onSetFloatingBallEnabled(true);
                          } else if (!floatingBallEnabled) {
                            onToggleFloatingBall();
                          }
                          setBallMenuOpen(false);
                        }}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                          floatingBallEnabled
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-300 bg-slate-950/60 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.common.enable}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onSetFloatingBallEnabled) {
                            onSetFloatingBallEnabled(false);
                          } else if (floatingBallEnabled) {
                            onToggleFloatingBall();
                          }
                          setBallMenuOpen(false);
                        }}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                          !floatingBallEnabled
                            ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
                            : 'text-slate-300 bg-slate-950/60 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <PowerOff className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t.common.disable}</span>
                      </button>
                    </div>
                  </div>

                  {/* Outside-App / Phone Home Screen Floating Overlay */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="px-2 py-1 text-[11px] font-bold text-cyan-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.header.externalBallTitle}</span>
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          externalBallRunning
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {externalBallRunning ? t.header.running : t.header.stopped}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={async () => {
                          const res = await enableExternalFloatingBall(appLang, isEffectivelyOffline, appLang);
                          setExternalBallRunning(res.running);
                          setExternalNotice(res.message);
                        }}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                          externalBallRunning
                            ? 'bg-cyan-600/25 text-cyan-200 border border-cyan-500/50'
                            : 'text-slate-200 bg-slate-950/80 hover:bg-cyan-950/50 border border-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.common.enable}</span>
                      </button>

                      <button
                        onClick={async () => {
                          const res = await disableExternalFloatingBall(appLang);
                          setExternalBallRunning(res.running);
                          setExternalNotice(res.message);
                        }}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                          !externalBallRunning
                            ? 'bg-rose-600/15 text-rose-300 border border-rose-500/30'
                            : 'text-slate-300 bg-slate-950/80 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <PowerOff className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t.common.disable}</span>
                      </button>
                    </div>

                    {externalNotice && (
                      <p className="mt-2 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 leading-relaxed">
                        {externalNotice}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
              title={t.header.historyTitle}
            >
              <History className="w-4 h-4" />
            </button>

            {/* Help Button */}
            <button
              onClick={onOpenHelp}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-white transition"
              title={t.header.helpTitle}
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
              title={t.header.settingsTitle}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>{t.header.tabs.text}</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'camera'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>📸</span>
            <span>{t.header.tabs.camera}</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'video'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🎬</span>
            <span>{t.header.tabs.video}</span>
          </button>

          <button
            onClick={() => setActiveTab('screen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'screen'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>📱</span>
            <span>{t.header.tabs.screen}</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'grammar'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t.header.tabs.grammar}</span>
          </button>

          <button
            onClick={() => setActiveTab('appsFiles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'appsFiles'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>{t.header.tabs.appsFiles}</span>
          </button>

          <button
            onClick={() => setActiveTab('packs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'packs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>
              {t.header.tabs.packs} ({installedCount})
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
