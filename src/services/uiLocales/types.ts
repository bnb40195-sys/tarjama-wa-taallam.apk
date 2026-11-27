export type AppLanguage = 'ar' | 'en' | 'fr' | 'es' | 'de' | 'tr' | 'it' | 'ru' | 'zh' | 'ja';

export interface AppLanguageMeta {
  code: AppLanguage;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const APP_LANGUAGES_META: AppLanguageMeta[] = [
  { code: 'ar', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'en', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'tr', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'it', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'ru', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'zh', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr' },
];

export interface UiTranslations {
  // Localized names for the 10 language codes
  langNames: Record<AppLanguage, string>;

  common: {
    appName: string;
    appTagline: string;
    appSubtitle: string;
    autoDetect: string;
    autoDetectSmart: string;
    from: string;
    to: string;
    swapLanguages: string;
    copy: string;
    copied: string;
    listen: string;
    clear: string;
    close: string;
    retry: string;
    delete: string;
    download: string;
    enable: string;
    disable: string;
    enabled: string;
    disabled: string;
    onlineLabel: string;
    offlineLabel: string;
    offlineBadge: string;
    onlineBadge: string;
    offlineBannerLost: string;
    missingPackTitle: string;
    missingPackHint: string;
    switchToOnline: string;
    openOfflinePacks: string;
    charsCount: string;
    words: string;
    mb: string;
    translateNow: string;
    translating: string;
  };

  header: {
    onlineBtn: string;
    onlineTitle: string;
    offlineBtn: string;
    offlineTitle: string;
    statusLostNet: string;
    statusAutoOffline: string;
    statusManualOffline: string;
    statusDevicePacksOnly: string;
    statusCloud: string;
    statusEngineConnected: string;
    offlinePacksBtn: string;
    offlinePacksTitle: string;
    floatingBallBtn: string;
    floatingBallTitle: string;
    inAppBallTitle: string;
    externalBallTitle: string;
    running: string;
    stopped: string;
    historyTitle: string;
    helpTitle: string;
    settingsTitle: string;
    tabs: {
      text: string;
      camera: string;
      video: string;
      screen: string;
      grammar: string;
      appsFiles: string;
      packs: string;
    };
  };

  textTab: {
    subTabText: string;
    subTabVoice: string;
    autoSpeak: string;
    autoSpeakTitle: string;
    inputHeader: string;
    listeningBanner: string;
    inputPlaceholder: string;
    speakVoiceBtn: string;
    stopRecordingBtn: string;
    instantTranslateBtn: string;
    approvedTranslation: string;
    offlineDevicePack: string;
    cloudConnectedAi: string;
    translatingAnalyzing: string;
    downloadPackNow: string;
    downloadingPct: string;
    translationAlert: string;
    phoneticsLabel: string;
    emptyPrompt: string;
    alternativesTitle: string;
    voiceHeaderTitle: string;
    voiceHeaderDesc: string;
    clearConversation: string;
    speaker1: string;
    speaker2: string;
    listeningNow: string;
    speakNow: string;
    pressToSpeakIn: string;
    quickSamples: string;
    listeningToSpeaker: string;
    translatingVoiceReply: string;
    liveVoiceLog: string;
    emptyVoiceLog: string;
    originalPrefix: string;
    speakBtn: string;
    micNotSupported: string;
    micDenied: string;
    micErrorPrefix: string;
    micStartFailed: string;
  };

  cameraTab: {
    title: string;
    subtitle: string;
    offlineBadge: string;
    cloudBadge: string;
    missingPackWarn: string;
    startLiveCamera: string;
    closeCamera: string;
    uploadImage: string;
    orTrySamples: string;
    sampleSign: string;
    sampleMenu: string;
    sampleWarning: string;
    sampleBook: string;
    sampleSocial: string;
    cameraError: string;
    captureAndTranslate: string;
    resultTitle: string;
    readingText: string;
    translatedTextLabel: string;
    noTextFound: string;
  };

  videoTab: {
    title: string;
    subtitle: string;
    offlineBadge: string;
    cloudBadge: string;
    translateToPrefix: string;
    translateAllDialogue: string;
    translatingDialogue: string;
    exportSrt: string;
    inputMethodLabel: string;
    modeUrl: string;
    modeTyping: string;
    modeVoice: string;
    uploadVideo: string;
    urlInputHeading: string;
    urlPlaceholder: string;
    loadAndTranslateUrl: string;
    presetLinksLabel: string;
    presetSpace: string;
    presetAuto: string;
    presetAction: string;
    typingHeading: string;
    currentSecond: string;
    typingPlaceholder: string;
    fromSec: string;
    secUnit: string;
    translateAndAdd: string;
    addingText: string;
    voiceHeading: string;
    autoDubbing: string;
    dubbingOn: string;
    dubbingOff: string;
    listenVideoTitle: string;
    listenVideoDesc: string;
    stopListening: string;
    startListening: string;
    capturingAudio: string;
    heardAudio: string;
    waitingSpeech: string;
    liveTranslation: string;
    dualSubtitles: string;
    targetOnly: string;
    cinemaSimBadge: string;
    liveBadge: string;
    subtitleLinesCount: string;
    voiceDubBadge: string;
    syncActive: string;
    defaultTitle: string;
    defaultEpisode: string;
    speechNotSupported: string;
  };

  screenTab: {
    techBadge: string;
    title: string;
    subtitle: string;
    stopExternalBall: string;
    startExternalBall: string;
    restoreOriginal: string;
    translateFullScreen: string;
    chooseApp: string;
    appWhatsapp: string;
    appTwitter: string;
    appMenu: string;
    ballLabel: string;
    ballDragHint: string;
    onlineNow: string;
    instantTranslationTag: string;
    originalTag: string;
    commentsLabel: string;
    commentsCount: string;
    likesCount: string;
    dishPrefix: string;
    menuSubtitle: string;
    bottomStatus: string;
    injectTitle: string;
    injectSubtitle: string;
    injectPlaceholder: string;
    injectBtn: string;
    howItWorksTitle: string;
    step1: string;
    step2: string;
    step3: string;
  };

  grammarTab: {
    title: string;
    badge: string;
    subtitle: string;
    sectionsLabel: string;
    catAll: string;
    catTenses: string;
    catStructure: string;
    catQuiz: string;
    lessonsListTitle: string;
    rulePrefix: string;
    examplesHeading: string;
    notePrefix: string;
    tipsHeading: string;
    quizTitle: string;
    quizSubtitle: string;
    scoreLabel: string;
    excellent: string;
    great: string;
    correctAnswer: string;
    wrongAnswer: string;
    submitQuiz: string;
    retakeQuiz: string;
  };

  appsFilesTab: {
    title: string;
    subtitle: string;
    modeApps: string;
    modeFiles: string;
    uiSwitchTitle: string;
    uiSwitchSubtitle: string;
    currentLangLabel: string;
    fromAppLang: string;
    toAppLang: string;
    applyToApp: string;
    uiSwitchedNotice: string;
    appsWorkspaceTitle: string;
    filesWorkspaceTitle: string;
    translatableItemsCount: string;
    awaitingInput: string;
    samplePrefix: string;
    sourceLangLabel: string;
    targetLangLabel: string;
    dropAppsTitle: string;
    dropFilesTitle: string;
    dropAppsHint: string;
    dropFilesHint: string;
    chooseFileBtn: string;
    sourceContentLabel: string;
    sourcePlaceholder: string;
    offlineHint: string;
    onlineHint: string;
    convertBtn: string;
    stopBtn: string;
    convertingMsg: string;
    convertedResultTitle: string;
    translatedItemsCount: string;
    modeOfflineShort: string;
    modeCloudShort: string;
    editableHint: string;
    compareEditBtn: string;
    finalFileBtn: string;
    copyResultBtn: string;
    downloadResultBtn: string;
    noTranslatableEntries: string;
    sameLangError: string;
    fileTooLarge: string;
    fileEmptyError: string;
    fileReadError: string;
    copyError: string;
    appPackageSectionTitle: string;
    appPackageSectionSubtitle: string;
    uploadAppDropTitle: string;
    uploadAppDropHint: string;
    chooseAppPackageBtn: string;
    trySampleAppBtn: string;
    analyzingAppMsg: string;
    analysisSummaryTitle: string;
    totalFilesLabel: string;
    skippedNonLangLabel: string;
    extractedLangFilesLabel: string;
    stringsCountSuffix: string;
    apkBinaryExtractedNote: string;
    noLangFilesFoundInApp: string;
    loadIntoEditorBtn: string;
    translateAllLangFilesBtn: string;
    translatingOnlyLangFilesMsg: string;
    translatedLangPackTitle: string;
    downloadAllZipBtn: string;
    downloadSingleFileBtn: string;
    appTooLargeError: string;
    invalidAppArchiveError: string;
    selectAtLeastOneLangFile: string;
    defaultAppLangLabel: string;
    setAsDefaultLangBtn: string;
    defaultLangSavedNotice: string;
    outputModeLabel: string;
    replaceDefaultAppLangLabel: string;
    addAsLocaleFileLabel: string;
    defaultOptionLabel: string;
    formatLabels: {
      xml: string;
      json: string;
      arb: string;
      strings: string;
      srt: string;
      vtt: string;
      csv: string;
      properties: string;
      html: string;
      md: string;
      txt: string;
    };
  };

  packsModal: {
    fileSizeLabel: string;
    installedBadge: string;
    availableBadge: string;
    downloadingPack: string;
    downloadJsonBtn: string;
    detailsBtn: string;
    installOfflineBtn: string;
    packDetailsPrefix: string;
    filePathLabel: string;
    totalWordsLabel: string;
    licenseLabel: string;
    licenseOpenFree: string;
    downloadJsonDevice: string;
    openInBrowser: string;
    howItWorksTitle: string;
    howItWorksDesc: string;
  };

  historyDrawer: {
    title: string;
    searchPlaceholder: string;
    favoritesOnly: string;
    clearAll: string;
    confirmClearPrompt: string;
    confirmYes: string;
    confirmNo: string;
    emptyFavs: string;
    emptyHistory: string;
    offlineTag: string;
    aiTag: string;
  };

  settingsModal: {
    title: string;
    subtitle: string;
    langUpdatedNotice: string;
    appLangSectionTitle: string;
    rtlLabel: string;
    ltrLabel: string;
    speechSectionTitle: string;
    speechRateLabel: string;
    slow: string;
    normal: string;
    fast: string;
    ballSectionTitle: string;
    resetBallTitle: string;
    resetBallDesc: string;
    resetBallBtn: string;
    resetBallDone: string;
    storageSectionTitle: string;
    clearHistoryTitle: string;
    clearHistoryDesc: string;
    clearHistoryBtn: string;
    confirmClearText: string;
    confirmYes: string;
    confirmCancel: string;
    clearedDone: string;
  };

  helpModal: {
    title: string;
    subtitle: string;
    faqTitle: string;
    guides: Array<{
      title: string;
      steps: string[];
      actionLabel: string;
    }>;
    faqs: Array<{
      q: string;
      a: string;
    }>;
  };

  floatingBall: {
    ballWord: string;
    hoverHint: string;
    popupTitle: string;
    offlineBadge: string;
    onlineBadge: string;
    openSimTitle: string;
    ballStatusLabel: string;
    externalLabel: string;
    stopExternal: string;
    startExternal: string;
    inputPlaceholder: string;
    translating: string;
    tryFullSim: string;
    hideBall: string;
  };
}
