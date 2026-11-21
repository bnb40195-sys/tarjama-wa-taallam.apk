// Multilingual UI translations and application direction configuration
export type AppLanguage = 'ar' | 'en' | 'fr' | 'es' | 'de' | 'tr';

export interface TranslationDictionary {
  appName: string;
  appSubtitle: string;
  offlineMode: string;
  offlineActive: string;
  offlineDisabled: string;
  onlineActive: string;
  offlinePacks: string;
  floatingBall: string;
  history: string;
  settings: string;
  help: string;
  tabText: string;
  tabCamera: string;
  tabVideo: string;
  tabScreen: string;
  tabGrammar: string;
  tabPacks: string;
  sourceLang: string;
  targetLang: string;
  autoDetect: string;
  enterTextPlaceholder: string;
  translateBtn: string;
  translating: string;
  copy: string;
  copied: string;
  listen: string;
  dictate: string;
  clear: string;
  swapLanguages: string;
  alternatives: string;
  wordBreakdown: string;
  downloadFree: string;
  installed: string;
  deletePack: string;
  videoSubtitleTrans: string;
  dualSubtitles: string;
  grammarHubTitle: string;
  grammarHubDesc: string;
  quizTitle: string;
  practiceNow: string;
}

export const APP_TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  ar: {
    appName: 'ترجمان بلس',
    appSubtitle: 'ترجمة فورية وتعلّم اللغات • تشغيل بدون نت • كرة الشاشة العائمة',
    offlineMode: 'وضع بدون نت',
    offlineActive: 'مفعّل',
    offlineDisabled: 'تفعيل',
    onlineActive: 'متصل سحابي',
    offlinePacks: 'حزم الأوفلاين',
    floatingBall: 'كرة الشاشة',
    history: 'السجل والمفضلة',
    settings: 'الإعدادات',
    help: 'المساعدة ودليل الاستخدام',
    tabText: 'ترجمة النصوص والكتابة',
    tabCamera: 'ترجمة الصور والكاميرا',
    tabVideo: 'ترجمة الفيديوهات والمسلسلات',
    tabScreen: 'كرة الشاشة ومحاكي التطبيقات',
    tabGrammar: 'قواعد وتعلّم اللغات',
    tabPacks: 'حزم بدون نت مجاناً',
    sourceLang: 'اللغة المصدر',
    targetLang: 'اللغة الهدف',
    autoDetect: 'كشف تلقائي للغة',
    enterTextPlaceholder: 'اكتب أو الصق النص هنا للترجمة...',
    translateBtn: 'ترجم الآن',
    translating: 'جاري الترجمة الفورية...',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    listen: 'استماع للنطق',
    dictate: 'إملاء صوتي',
    clear: 'مسح',
    swapLanguages: 'تبديل اتجاه الترجمة',
    alternatives: 'صيغ وترجمات بديلة',
    wordBreakdown: 'قاموس الكلمات والمفردات',
    downloadFree: 'تنزيل مجاني',
    installed: 'مثبتة بدون نت',
    deletePack: 'حذف الحزمة',
    videoSubtitleTrans: 'ترجمة الفيديوهات والمسلسلات الحية',
    dualSubtitles: 'ترجمة مزدوجة',
    grammarHubTitle: 'مركز قواعد وتعلّم اللغات',
    grammarHubDesc: 'تعلّم قواعد اللغات العالمية، تصريف الأفعال، المحادثات، واختبر معلوماتك باختبارات تفاعلية',
    quizTitle: 'اختبار القواعد التفاعلي',
    practiceNow: 'تدرّب الآن',
  },
  en: {
    appName: 'Tarjuman Plus',
    appSubtitle: 'Smart AI Translator • 100% Offline • Screen Floating Ball',
    offlineMode: 'Offline Mode',
    offlineActive: 'Active',
    offlineDisabled: 'Enable',
    onlineActive: 'Online Cloud AI',
    offlinePacks: 'Offline Packs',
    floatingBall: 'Floating Ball',
    history: 'History & Saved',
    settings: 'Settings',
    help: 'User Guide & Help',
    tabText: 'Text & Typing',
    tabCamera: 'Camera & Photos',
    tabVideo: 'Videos & Series',
    tabScreen: 'Screen Ball & Apps Sim',
    tabGrammar: 'Grammar & Learning',
    tabPacks: 'Free Offline Packs',
    sourceLang: 'Source Language',
    targetLang: 'Target Language',
    autoDetect: 'Auto Detect Language',
    enterTextPlaceholder: 'Type or paste text here to translate...',
    translateBtn: 'Translate Now',
    translating: 'Translating in real-time...',
    copy: 'Copy',
    copied: 'Copied!',
    listen: 'Listen Pronunciation',
    dictate: 'Voice Dictation',
    clear: 'Clear',
    swapLanguages: 'Swap Languages',
    alternatives: 'Alternative Phrasings',
    wordBreakdown: 'Vocabulary Dictionary',
    downloadFree: 'Free Download',
    installed: 'Offline Ready',
    deletePack: 'Delete Pack',
    videoSubtitleTrans: 'Live Video & Series Subtitles',
    dualSubtitles: 'Dual Subtitles',
    grammarHubTitle: 'Grammar & Language Learning Hub',
    grammarHubDesc: 'Master grammar rules, verb tenses, everyday dialogues, and take interactive quizzes',
    quizTitle: 'Interactive Grammar Quiz',
    practiceNow: 'Practice Now',
  },
  fr: {
    appName: 'Tarjuman Plus',
    appSubtitle: 'Traducteur IA Intelligent • 100% Hors Ligne • Balle Flottante',
    offlineMode: 'Mode Hors Ligne',
    offlineActive: 'Actif',
    offlineDisabled: 'Activer',
    onlineActive: 'En Ligne Cloud IA',
    offlinePacks: 'Packs Hors Ligne',
    floatingBall: 'Balle Écran',
    history: 'Historique & Favoris',
    settings: 'Paramètres',
    help: 'Aide & Mode d\'emploi',
    tabText: 'Texte & Saisie',
    tabCamera: 'Caméra & Photos',
    tabVideo: 'Vidéos & Séries',
    tabScreen: 'Balle Écran & Simulateur',
    tabGrammar: 'Grammaire & Apprentissage',
    tabPacks: 'Packs Hors Ligne Gratuits',
    sourceLang: 'Langue source',
    targetLang: 'Langue cible',
    autoDetect: 'Détection automatique',
    enterTextPlaceholder: 'Tapez ou collez le texte ici...',
    translateBtn: 'Traduire maintenant',
    translating: 'Traduction instantanée...',
    copy: 'Copier',
    copied: 'Copié !',
    listen: 'Écouter',
    dictate: 'Dictée vocale',
    clear: 'Effacer',
    swapLanguages: 'Inverser les langues',
    alternatives: 'Traductions alternatives',
    wordBreakdown: 'Dictionnaire & Mots-clés',
    downloadFree: 'Téléchargement gratuit',
    installed: 'Prêt Hors Ligne',
    deletePack: 'Supprimer',
    videoSubtitleTrans: 'Sous-titres Vidéos & Séries',
    dualSubtitles: 'Sous-titres bilingues',
    grammarHubTitle: 'Centre de Grammaire & Apprentissage',
    grammarHubDesc: 'Apprenez la grammaire, la conjugaison des verbes, et testez vos connaissances',
    quizTitle: 'Quiz Interactif de Grammaire',
    practiceNow: 'S\'entraîner',
  },
  es: {
    appName: 'Tarjuman Plus',
    appSubtitle: 'Traductor Inteligente IA • 100% Sin Conexión • Bola Flotante',
    offlineMode: 'Modo Offline',
    offlineActive: 'Activado',
    offlineDisabled: 'Activar',
    onlineActive: 'En línea Cloud IA',
    offlinePacks: 'Paquetes Offline',
    floatingBall: 'Bola Flotante',
    history: 'Historial',
    settings: 'Ajustes',
    help: 'Ayuda y Tutoriales',
    tabText: 'Texto y Escritura',
    tabCamera: 'Cámara y Fotos',
    tabVideo: 'Vídeos y Series',
    tabScreen: 'Bola de Pantalla',
    tabGrammar: 'Gramática y Aprendizaje',
    tabPacks: 'Paquetes Offline Gratis',
    sourceLang: 'Idioma de origen',
    targetLang: 'Idioma de destino',
    autoDetect: 'Detección automática',
    enterTextPlaceholder: 'Escriba o pegue el texto aquí...',
    translateBtn: 'Traducir ahora',
    translating: 'Traduciendo...',
    copy: 'Copiar',
    copied: '¡Copiado!',
    listen: 'Escuchar',
    dictate: 'Dictado de voz',
    clear: 'Borrar',
    swapLanguages: 'Intercambiar idiomas',
    alternatives: 'Alternativas',
    wordBreakdown: 'Vocabulario clave',
    downloadFree: 'Descarga Gratis',
    installed: 'Listo Offline',
    deletePack: 'Eliminar paquete',
    videoSubtitleTrans: 'Subtítulos de Vídeos y Series',
    dualSubtitles: 'Subtítulos duales',
    grammarHubTitle: 'Centro de Gramática y Aprendizaje',
    grammarHubDesc: 'Aprende gramática, conjugación de verbos y practica con cuestionarios interactivos',
    quizTitle: 'Cuestionario de Gramática',
    practiceNow: 'Practicar ahora',
  },
  de: {
    appName: 'Tarjuman Plus',
    appSubtitle: 'Smarter KI-Übersetzer • 100% Offline • Schwebender Bildschirmball',
    offlineMode: 'Offline-Modus',
    offlineActive: 'Aktiv',
    offlineDisabled: 'Aktivieren',
    onlineActive: 'Online Cloud KI',
    offlinePacks: 'Offline-Pakete',
    floatingBall: 'Schwebender Ball',
    history: 'Verlauf',
    settings: 'Einstellungen',
    help: 'Hilfe & Anleitung',
    tabText: 'Text & Tippen',
    tabCamera: 'Kamera & Fotos',
    tabVideo: 'Videos & Serien',
    tabScreen: 'Bildschirm-Ball Simulator',
    tabGrammar: 'Grammatik & Lernen',
    tabPacks: 'Kostenlose Offline-Pakete',
    sourceLang: 'Ausgangssprache',
    targetLang: 'Zielsprache',
    autoDetect: 'Automatisch erkennen',
    enterTextPlaceholder: 'Hier Text eingeben oder einfügen...',
    translateBtn: 'Jetzt übersetzen',
    translating: 'Wird übersetzt...',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    listen: 'Anhören',
    dictate: 'Spracheingabe',
    clear: 'Löschen',
    swapLanguages: 'Sprachen tauschen',
    alternatives: 'Alternative Formulierungen',
    wordBreakdown: 'Wortschatz-Lexikon',
    downloadFree: 'Kostenlos herunterladen',
    installed: 'Offline bereit',
    deletePack: 'Paket löschen',
    videoSubtitleTrans: 'Untertitel für Videos & Serien',
    dualSubtitles: 'Zweisprachige Untertitel',
    grammarHubTitle: 'Grammatik- & Lernzentrum',
    grammarHubDesc: 'Meistern Sie Grammatikregeln, Zeiten und Verbformen mit interaktiven Tests',
    quizTitle: 'Interaktiver Grammatik-Test',
    practiceNow: 'Jetzt üben',
  },
  tr: {
    appName: 'Tarjuman Plus',
    appSubtitle: 'Akıllı Yapay Zeka Çevirmen • %100 Çevrimdışı • Kayan Ekran Topu',
    offlineMode: 'Çevrimdışı Mod',
    offlineActive: 'Etkin',
    offlineDisabled: 'Etkinleştir',
    onlineActive: 'Çevrimiçi Bulut AI',
    offlinePacks: 'Çevrimdışı Paketler',
    floatingBall: 'Kayan Top',
    history: 'Geçmiş',
    settings: 'Ayarlar',
    help: 'Yardım ve Kılavuz',
    tabText: 'Metin ve Yazma',
    tabCamera: 'Kamera ve Fotoğraf',
    tabVideo: 'Video ve Dizi Çevirisi',
    tabScreen: 'Ekran Topu Simülatörü',
    tabGrammar: 'Gramer ve Dil Öğrenimi',
    tabPacks: 'Ücretsiz Çevrimdışı Paketler',
    sourceLang: 'Kaynak Dil',
    targetLang: 'Hedef Dil',
    autoDetect: 'Otomatik Algıla',
    enterTextPlaceholder: 'Çevrilecek metni buraya yazın veya yapıştırın...',
    translateBtn: 'Şimdi Çevir',
    translating: 'Çevriliyor...',
    copy: 'Kopyala',
    copied: 'Kopyalandı!',
    listen: 'Dinle',
    dictate: 'Sesli Yazma',
    clear: 'Temizle',
    swapLanguages: 'Dilleri Değiştir',
    alternatives: 'Alternatif Çeviriler',
    wordBreakdown: 'Kelime Dağarcığı',
    downloadFree: 'Ücretsiz İndir',
    installed: 'Çevrimdışı Hazır',
    deletePack: 'Paketi Sil',
    videoSubtitleTrans: 'Video ve Dizi Altyazıları',
    dualSubtitles: 'Çift Dilli Altyazı',
    grammarHubTitle: 'Gramer ve Dil Öğrenim Merkezi',
    grammarHubDesc: 'Gramer kurallarını, fiil çekimlerini ve günlük konuşmaları interaktif testlerle öğrenin',
    quizTitle: 'İnteraktif Gramer Testi',
    practiceNow: 'Şimdi Alıştırma Yap',
  },
};

const APP_LANG_KEY = 'tarjuman_app_language';

export function getStoredAppLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(APP_LANG_KEY) as AppLanguage;
    if (saved && APP_TRANSLATIONS[saved]) return saved;
    return 'ar';
  } catch {
    return 'ar';
  }
}

export function setStoredAppLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(APP_LANG_KEY, lang);
    // Automatically update HTML document direction
    if (typeof document !== 'undefined') {
      const isRtl = lang === 'ar';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  } catch (e) {
    console.error('Failed to set app language', e);
  }
}
