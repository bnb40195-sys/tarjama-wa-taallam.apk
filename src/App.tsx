import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { TextTranslator } from './components/TextTranslator.tsx';
import { CameraTranslator } from './components/CameraTranslator.tsx';
import { VideoTranslator } from './components/VideoTranslator.tsx';
import { ScreenTranslatorSim } from './components/ScreenTranslatorSim.tsx';
import { GrammarHub } from './components/GrammarHub.tsx';
import { OfflinePacksModal } from './components/OfflinePacksModal.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { HelpModal } from './components/HelpModal.tsx';
import { FloatingBall } from './components/FloatingBall.tsx';
import {
  AppNetworkMode,
  getAppNetworkMode,
  setAppNetworkMode,
  getForceOffline,
  setForceOffline,
} from './services/offlineEngine.ts';
import {
  AppLanguage,
  getStoredAppLanguage,
  setStoredAppLanguage,
  APP_TRANSLATIONS,
} from './services/appTranslations.ts';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [appLang, setAppLang] = useState<AppLanguage>(getStoredAppLanguage());
  const [networkMode, setNetworkMode] = useState<AppNetworkMode>(getAppNetworkMode());
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const isOffline = networkMode === 'offline' || !isBrowserOnline;
  const [activeTab, setActiveTab] = useState<'text' | 'camera' | 'video' | 'screen' | 'grammar' | 'packs'>('text');
  const [floatingBallEnabled, setFloatingBallEnabled] = useState<boolean>(true);
  const [packsModalOpen, setPacksModalOpen] = useState<boolean>(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [floatingBallResetKey, setFloatingBallResetKey] = useState<number>(0);

  // Sync document text direction (RTL / LTR) and HTML lang dynamically
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRtl = appLang === 'ar';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = appLang;
    }
  }, [appLang]);

  // Monitor online / offline network events
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggleMode = (newMode: AppNetworkMode) => {
    setNetworkMode(newMode);
    setAppNetworkMode(newMode);
  };

  const handleAppLangChange = (newLang: AppLanguage) => {
    setAppLang(newLang);
    setStoredAppLanguage(newLang);
  };

  const handleResetFloatingBall = () => {
    setFloatingBallResetKey((prev) => prev + 1);
  };

  const t = APP_TRANSLATIONS[appLang] || APP_TRANSLATIONS.ar;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top App Header with Online / Offline Mode Switcher */}
      <Header
        forceOffline={isOffline}
        networkMode={networkMode}
        onToggleMode={handleToggleMode}
        isBrowserOnline={isBrowserOnline}
        onOpenPacksModal={() => setPacksModalOpen(true)}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        floatingBallEnabled={floatingBallEnabled}
        onToggleFloatingBall={() => setFloatingBallEnabled((prev) => !prev)}
        onSetFloatingBallEnabled={(enabled) => setFloatingBallEnabled(enabled)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appLang={appLang}
      />

      {/* Network Offline Notification when device has physically lost connection */}
      {!isBrowserOnline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>انقطع الاتصال بالإنترنت. تم تفعيل وضع الأوفلاين تلقائياً (الترجمة تقتصر على الحزم المنزّلة فقط).</span>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'text' && (
          <TextTranslator
            forceOffline={isOffline}
            networkMode={networkMode}
            onToggleMode={handleToggleMode}
            onOpenPacksModal={() => setPacksModalOpen(true)}
          />
        )}

        {activeTab === 'camera' && (
          <CameraTranslator forceOffline={isOffline} />
        )}

        {activeTab === 'video' && (
          <VideoTranslator forceOffline={isOffline} />
        )}

        {activeTab === 'screen' && (
          <ScreenTranslatorSim forceOffline={isOffline} />
        )}

        {activeTab === 'grammar' && (
          <GrammarHub />
        )}

        {activeTab === 'packs' && (
          <OfflinePacksModal
            isStandaloneTab={true}
            forceOffline={isOffline}
            networkMode={networkMode}
            onToggleMode={handleToggleMode}
          />
        )}
      </main>

      {/* Draggable Floating Ball Widget */}
      {floatingBallEnabled && (
        <FloatingBall
          key={floatingBallResetKey}
          forceOffline={isOffline}
          onNavigateToSimulator={() => setActiveTab('screen')}
          onClose={() => setFloatingBallEnabled(false)}
        />
      )}

      {/* Offline Packs Modal */}
      <OfflinePacksModal
        isOpen={packsModalOpen}
        onClose={() => setPacksModalOpen(false)}
        forceOffline={isOffline}
        networkMode={networkMode}
        onToggleMode={handleToggleMode}
      />

      {/* History & Favorites Drawer */}
      <HistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        appLang={appLang}
        onAppLangChange={handleAppLangChange}
        onResetFloatingBall={handleResetFloatingBall}
      />

      {/* Help & User Guide Modal */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
