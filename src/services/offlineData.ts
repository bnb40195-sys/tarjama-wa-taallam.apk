// Comprehensive offline dictionary & phrases database
// Supports Arabic, English, French, Spanish, German, Turkish, etc.

export interface LanguagePackMeta {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  sizeMb: number;
  wordCount: number;
  heritageWords?: number;
  heritageWordsFormatted?: string;
  fileUrl?: string;
  downloadApiUrl?: string;
  descriptionAr?: string;
  isDefault?: boolean;
}

export const AVAILABLE_PACKS: LanguagePackMeta[] = [
  {
    code: 'ar',
    nameAr: 'العربية',
    nameEn: 'Arabic',
    flag: '🇸🇦',
    sizeMb: 35,
    wordCount: 145000,
    fileUrl: '/packs/pack_ar.json',
    downloadApiUrl: '/api/packs/download/ar',
    descriptionAr: 'قاموس اللغة العربية الشامل والمفردات والجمل اليومية بدون إنترنت',
    isDefault: true,
  },
  {
    code: 'en',
    nameAr: 'الإنجليزية',
    nameEn: 'English Language Core',
    flag: '🇬🇧',
    sizeMb: 32,
    wordCount: 160000,
    fileUrl: '/packs/pack_en.json',
    downloadApiUrl: '/api/packs/download/en',
    descriptionAr: 'قاموس أكسفورد ووبستر الشامل - المفردات والأفعال الشاذة وجمل السفر والحوار اليومي',
    isDefault: true,
  },
  {
    code: 'fr',
    nameAr: 'الفرنسية',
    nameEn: 'French Language Core',
    flag: '🇫🇷',
    sizeMb: 26,
    wordCount: 120000,
    heritageWords: 150000,
    heritageWordsFormatted: '150,000 كلمة',
    fileUrl: '/packs/pack_fr.json',
    downloadApiUrl: '/api/packs/download/fr',
    descriptionAr: 'معجم الأكاديمية الفرنسية ولاروس - قواعد وقاموس متكامل بدون إنترنت',
  },
  {
    code: 'es',
    nameAr: 'الإسبانية',
    nameEn: 'Spanish Language Core',
    flag: '🇪🇸',
    sizeMb: 28,
    wordCount: 130000,
    heritageWords: 100000,
    heritageWordsFormatted: '100,000 كلمة',
    fileUrl: '/packs/pack_es.json',
    downloadApiUrl: '/api/packs/download/es',
    descriptionAr: 'معجم الأكاديمية الملكية الإسبانية (RAE) - مفردات وجمل السفر والتواصل',
  },
  {
    code: 'de',
    nameAr: 'الألمانية',
    nameEn: 'German Language Core',
    flag: '🇩🇪',
    sizeMb: 31,
    wordCount: 135000,
    heritageWords: 135000,
    heritageWordsFormatted: '135,000 كلمة',
    fileUrl: '/packs/pack_de.json',
    downloadApiUrl: '/api/packs/download/de',
    descriptionAr: 'قاموس دودن الشامل وتراكيب الجمل الألمانية الدقيقة بدون إنترنت',
  },
  {
    code: 'tr',
    nameAr: 'التركية',
    nameEn: 'Turkish Language Core',
    flag: '🇹🇷',
    sizeMb: 24,
    wordCount: 110000,
    heritageWords: 110000,
    heritageWordsFormatted: '110,000 كلمة',
    fileUrl: '/packs/pack_tr.json',
    downloadApiUrl: '/api/packs/download/tr',
    descriptionAr: 'معجم مجمع اللغة التركية (TDK) - لواحق الكلمات والترجمة السياقية',
  },
  {
    code: 'it',
    nameAr: 'الإيطالية',
    nameEn: 'Italian Language Core',
    flag: '🇮🇹',
    sizeMb: 22,
    wordCount: 105000,
    heritageWords: 105000,
    heritageWordsFormatted: '105,000 كلمة',
    fileUrl: '/packs/pack_it.json',
    downloadApiUrl: '/api/packs/download/it',
    descriptionAr: 'قاموس اللغة الإيطالية وقواعد المحادثة اليومية في السياحة والمطاعم',
  },
  {
    code: 'ru',
    nameAr: 'الروسية',
    nameEn: 'Russian Language Core',
    flag: '🇷🇺',
    sizeMb: 34,
    wordCount: 140000,
    heritageWords: 140000,
    heritageWordsFormatted: '140,000 كلمة',
    fileUrl: '/packs/pack_ru.json',
    downloadApiUrl: '/api/packs/download/ru',
    descriptionAr: 'معجم اللغة الروسية الشامل بالحروف الكيريلية وقواعد الحالات الإعرابية',
  },
  {
    code: 'zh',
    nameAr: 'الصينية المبسطة',
    nameEn: 'Simplified Chinese',
    flag: '🇨🇳',
    sizeMb: 38,
    wordCount: 150000,
    heritageWords: 150000,
    heritageWordsFormatted: '150,000 مركب لغوي',
    fileUrl: '/packs/pack_zh.json',
    downloadApiUrl: '/api/packs/download/zh',
    descriptionAr: 'معجم رموز الهانزي والبينيين مع جمل السفر والتبادل التجاري',
  },
  {
    code: 'ja',
    nameAr: 'اليابانية',
    nameEn: 'Japanese Language Core',
    flag: '🇯🇵',
    sizeMb: 36,
    wordCount: 140000,
    heritageWords: 140000,
    heritageWordsFormatted: '140,000 تعبير',
    fileUrl: '/packs/pack_ja.json',
    downloadApiUrl: '/api/packs/download/ja',
    descriptionAr: 'قاموس كانجي وهيراغانا وكاتاكانا مع نطق روماجي الصوتي',
  },
];

// Rich bidirectional phrase & vocabulary table for offline instant lookup
export const OFFLINE_DICTIONARY: Record<string, Record<string, string>> = {
  // English to Arabic & reverse
  'hello': { ar: 'مرحباً', fr: 'bonjour', es: 'hola', de: 'hallo', tr: 'merhaba' },
  'hi': { ar: 'أهلاً', fr: 'salut', es: 'hola', de: 'hi', tr: 'selam' },
  'welcome': { ar: 'أهلاً وسهلاً', fr: 'bienvenue', es: 'bienvenido', de: 'willkommen', tr: 'hoş geldiniz' },
  'good morning': { ar: 'صباح الخير', fr: 'bonjour', es: 'buenos días', de: 'guten morgen', tr: 'günaydın' },
  'good evening': { ar: 'مساء الخير', fr: 'bonsoir', es: 'buenas tardes', de: 'guten abend', tr: 'iyi akşamlar' },
  'good night': { ar: 'تصبح على خير', fr: 'bonne nuit', es: 'buenas noches', de: 'gute nacht', tr: 'iyi geceler' },
  'how are you': { ar: 'كيف حالك؟', fr: 'comment allez-vous?', es: '¿cómo estás?', de: 'wie geht es dir?', tr: 'nasılsınız?' },
  'how are you?': { ar: 'كيف حالك؟', fr: 'comment allez-vous?', es: '¿cómo estás?', de: 'wie geht es dir?', tr: 'nasılsınız?' },
  'i am fine': { ar: 'أنا بخير', fr: 'je vais bien', es: 'estoy bien', de: 'mir geht es gut', tr: 'iyiyim' },
  'thank you': { ar: 'شكراً لك', fr: 'merci', es: 'gracias', de: 'danke', tr: 'teşekkür ederim' },
  'thanks': { ar: 'شكراً', fr: 'merci', es: 'gracias', de: 'danke', tr: 'sağ ol' },
  'thank you very much': { ar: 'شكراً جزيلاً', fr: 'merci beaucoup', es: 'muchas gracias', de: 'vielen dank', tr: 'çok teşekkürler' },
  'please': { ar: 'من فضلك', fr: 's\'il vous plaît', es: 'por favor', de: 'bitte', tr: 'lütfen' },
  'excuse me': { ar: 'عفواً / معذرة', fr: 'excusez-moi', es: 'disculpe', de: 'entschuldigung', tr: 'afedersiniz' },
  'sorry': { ar: 'آسف', fr: 'pardon', es: 'lo siento', de: 'es tut mir leid', tr: 'özür dilerim' },
  'yes': { ar: 'نعم', fr: 'oui', es: 'sí', de: 'ja', tr: 'evet' },
  'no': { ar: 'لا', fr: 'non', es: 'no', de: 'nein', tr: 'hayır' },
  'maybe': { ar: 'ربما', fr: 'peut-être', es: 'tal vez', de: 'vielleicht', tr: 'belki' },
  'where is': { ar: 'أين هو / أين يقع', fr: 'où est', es: 'dónde está', de: 'wo ist', tr: 'nerede' },
  'where is the airport': { ar: 'أين المطار؟', fr: 'où est l\'aéroport?', es: '¿dónde está el aeropuerto?', de: 'wo ist der flughafen?', tr: 'havalimanı nerede?' },
  'where is the hotel': { ar: 'أين الفندق؟', fr: 'où est l\'hôtel?', es: '¿dónde está el hotel?', de: 'wo ist das hotel?', tr: 'otel nerede?' },
  'where is the hospital': { ar: 'أين المستشفى؟', fr: 'où est l\'hôpital?', es: '¿dónde está el hospital?', de: 'wo ist das krankenhaus?', tr: 'hastane nerede?' },
  'where is the bathroom': { ar: 'أين دورة المياه؟', fr: 'où sont les toilettes?', es: '¿dónde está el baño?', de: 'wo ist die toilette?', tr: 'tuvalet nerede?' },
  'where is the restaurant': { ar: 'أين المطعم؟', fr: 'où est le restaurant?', es: '¿dónde está el restaurante?', de: 'wo ist das restaurant?', tr: 'restoran nerede?' },
  'help me': { ar: 'ساعدني', fr: 'aidez-moi', es: 'ayúdame', de: 'hilf mir', tr: 'bana yardım et' },
  'emergency': { ar: 'طوارئ', fr: 'urgence', es: 'emergencia', de: 'notfall', tr: 'acil' },
  'call the police': { ar: 'اتصل بالشرطة', fr: 'appelez la police', es: 'llame a la policía', de: 'rufen sie die polizei', tr: 'polisi arayın' },
  'call an ambulance': { ar: 'اتصل بالإسعاف', fr: 'appelez une ambulance', es: 'llame a una ambulancia', de: 'rufen sie einen krankenwagen', tr: 'ambulans çağırın' },
  'how much does it cost': { ar: 'كم تكلفة هذا؟', fr: 'combien ça coûte?', es: '¿cuánto cuesta?', de: 'wie viel kostet das?', tr: 'bu ne kadar?' },
  'how much is this': { ar: 'بكم هذا؟', fr: 'combien ça coûte?', es: '¿cuánto cuesta esto?', de: 'wie viel kostet das?', tr: 'bu ne kadar?' },
  'too expensive': { ar: 'غالٍ جداً', fr: 'trop cher', es: 'demasiado caro', de: 'zu teuer', tr: 'çok pahalı' },
  'bill please': { ar: 'الحساب من فضلك', fr: 'l\'addition s\'il vous plaît', es: 'la cuenta por favor', de: 'die rechnung bitte', tr: 'hesap lütfen' },
  'menu': { ar: 'قائمة الطعام', fr: 'le menu', es: 'el menú', de: 'die speisekarte', tr: 'menü' },
  'water': { ar: 'ماء', fr: 'eau', es: 'agua', de: 'wasser', tr: 'su' },
  'food': { ar: 'طعام', fr: 'nourriture', es: 'comida', de: 'essen', tr: 'yemek' },
  'coffee': { ar: 'قهوة', fr: 'café', es: 'café', de: 'kaffee', tr: 'kahve' },
  'tea': { ar: 'شاي', fr: 'thé', es: 'té', de: 'tee', tr: 'çay' },
  'breakfast': { ar: 'فطور', fr: 'petit-déjeuner', es: 'desayuno', de: 'frühstück', tr: 'kahvaltı' },
  'lunch': { ar: 'غداء', fr: 'déjeuner', es: 'almuerzo', de: 'mittagessen', tr: 'öğle yemeği' },
  'dinner': { ar: 'عشاء', fr: 'dîner', es: 'cena', de: 'abendessen', tr: 'akşam yemeği' },
  'bread': { ar: 'خبز', fr: 'pain', es: 'pan', de: 'brot', tr: 'ekmek' },
  'meat': { ar: 'لحم', fr: 'viande', es: 'carne', de: 'fleisch', tr: 'et' },
  'chicken': { ar: 'دجاج', fr: 'poulet', es: 'pollo', de: 'hähnchen', tr: 'tavuk' },
  'fish': { ar: 'سمك', fr: 'poisson', es: 'pescado', de: 'fisch', tr: 'balık' },
  'vegetables': { ar: 'خضار', fr: 'légumes', es: 'verduras', de: 'gemüse', tr: 'sebzeler' },
  'fruit': { ar: 'فواكه', fr: 'fruits', es: 'frutas', de: 'früchte', tr: 'meyve' },
  'do you speak english': { ar: 'هل تتحدث الإنجليزية؟', fr: 'parlez-vous anglais?', es: '¿hablas inglés?', de: 'sprechen sie englisch?', tr: 'ingilizce biliyor musunuz?' },
  'do you speak arabic': { ar: 'هل تتحدث العربية؟', fr: 'parlez-vous arabe?', es: '¿hablas árabe?', de: 'sprechen sie arabisch?', tr: 'arapça biliyor musunuz?' },
  'i don\'t understand': { ar: 'أنا لا أفهم', fr: 'je ne comprends pas', es: 'no entiendo', de: 'ich verstehe nicht', tr: 'anlamıyorum' },
  'i do not understand': { ar: 'أنا لا أفهم', fr: 'je ne comprends pas', es: 'no entiendo', de: 'ich verstehe nicht', tr: 'anlamıyorum' },
  'speak slowly please': { ar: 'تحدث ببطء من فضلك', fr: 'parlez lentement s\'il vous plaît', es: 'hable despacio por favor', de: 'bitte sprechen sie langsam', tr: 'lütfen yavaş konuşun' },
  'what is your name': { ar: 'ما اسمك؟', fr: 'comment vous appelez-vous?', es: '¿cómo te llamas?', de: 'wie heißen sie?', tr: 'adınız nedir?' },
  'my name is': { ar: 'اسمي هو', fr: 'je m\'appelle', es: 'me llamo', de: 'mein name ist', tr: 'benim adım' },
  'nice to meet you': { ar: 'فرصة سعيدة / تشرفت بمعرفتك', fr: 'enchanté', es: 'mucho gusto', de: 'freut mich', tr: 'tanıştığıma memnun oldum' },
  'goodbye': { ar: 'مع السلامة', fr: 'au revoir', es: 'adiós', de: 'auf wiedersehen', tr: 'güle güle' },
  'see you later': { ar: 'أراك لاحقاً', fr: 'à plus tard', es: 'hasta luego', de: 'bis später', tr: 'sonra görüşürüz' },
  'open': { ar: 'مفتوح', fr: 'ouvert', es: 'abierto', de: 'offen', tr: 'açık' },
  'closed': { ar: 'مغلق', fr: 'fermé', es: 'cerrado', de: 'geschlossen', tr: 'kapalı' },
  'entrance': { ar: 'مدخل', fr: 'entrée', es: 'entrada', de: 'eingang', tr: 'giriş' },
  'exit': { ar: 'مخرج', fr: 'sortie', es: 'salida', de: 'ausgang', tr: 'çıkış' },
  'push': { ar: 'ادفع', fr: 'pousser', es: 'empujar', de: 'drücken', tr: 'itin' },
  'pull': { ar: 'اسحب', fr: 'tirer', es: 'tirar', de: 'ziehen', tr: 'çekin' },
  'danger': { ar: 'خطر', fr: 'danger', es: 'peligro', de: 'gefahr', tr: 'tehlike' },
  'caution': { ar: 'انتباه / تحذير', fr: 'attention', es: 'precaución', de: 'vorsicht', tr: 'dikkat' },
  'no smoking': { ar: 'ممنوع التدخين', fr: 'défense de fumer', es: 'prohibido fumar', de: 'rauchen verboten', tr: 'sigara içilmez' },
  'stop': { ar: 'قف', fr: 'arrêt', es: 'alto / parar', de: 'halt / stop', tr: 'dur' },
  'wifi': { ar: 'واي فاي / شبكة لاسلكية', fr: 'wi-fi', es: 'wifi', de: 'wlan', tr: 'wifi' },
  'password': { ar: 'كلمة المرور', fr: 'mot de passe', es: 'contraseña', de: 'passwort', tr: 'şifre' },
  'passport': { ar: 'جواز السفر', fr: 'passeport', es: 'pasaporte', de: 'pass', tr: 'pasaport' },
  'ticket': { ar: 'تذكرة', fr: 'billet', es: 'boleto', de: 'fahrkarte', tr: 'bilet' },
  'train': { ar: 'قطار', fr: 'train', es: 'tren', de: 'zug', tr: 'tren' },
  'bus': { ar: 'حافلة / باص', fr: 'bus', es: 'autobús', de: 'bus', tr: 'otobüs' },
  'taxi': { ar: 'سيارة أجرة / تاكسي', fr: 'taxi', es: 'taxi', de: 'taxi', tr: 'taksi' },
  'car': { ar: 'سيارة', fr: 'voiture', es: 'coche', de: 'auto', tr: 'araba' },
  'plane': { ar: 'طائرة', fr: 'avion', es: 'avión', de: 'flugzeug', tr: 'uçak' },
  'hotel': { ar: 'فندق', fr: 'hôtel', es: 'hotel', de: 'hotel', tr: 'otel' },
  'room': { ar: 'غرفة', fr: 'chambre', es: 'habitación', de: 'zimmer', tr: 'oda' },
  'key': { ar: 'مفتاح', fr: 'clé', es: 'llave', de: 'schlüssel', tr: 'anahtar' },
  'money': { ar: 'نقود / مال', fr: 'argent', es: 'dinero', de: 'geld', tr: 'para' },
  'credit card': { ar: 'بطاقة ائتمان', fr: 'carte de crédit', es: 'tarjeta de crédito', de: 'kreditkarte', tr: 'kredi kartı' },
  'cash': { ar: 'نقداً / كاش', fr: 'espèces', es: 'efectivo', de: 'bargeld', tr: 'nakit' },
  'bank': { ar: 'بنك / مصرف', fr: 'banque', es: 'banco', de: 'bank', tr: 'banka' },
  'pharmacy': { ar: 'صيدلية', fr: 'pharmacie', es: 'farmacia', de: 'apotheke', tr: 'eczane' },
  'doctor': { ar: 'طبيب / دكتور', fr: 'médecin', es: 'médico', de: 'arzt', tr: 'doktor' },
  'medicine': { ar: 'دواء', fr: 'médicament', es: 'medicina', de: 'medizin', tr: 'ilaç' },
  'pain': { ar: 'ألم / وجع', fr: 'douleur', es: 'dolor', de: 'schmerz', tr: 'ağrı' },
  'sick': { ar: 'مريض', fr: 'malade', es: 'enfermo', de: 'krank', tr: 'hasta' },
  'today': { ar: 'اليوم', fr: 'aujourd\'hui', es: 'hoy', de: 'heute', tr: 'bugün' },
  'tomorrow': { ar: 'غداً', fr: 'demain', es: 'mañana', de: 'morgen', tr: 'yarın' },
  'yesterday': { ar: 'أمس / البارحة', fr: 'hier', es: 'ayer', de: 'gestern', tr: 'dün' },
  'time': { ar: 'الوقت / الزمن', fr: 'temps / heure', es: 'tiempo / hora', de: 'zeit', tr: 'zaman' },
  'now': { ar: 'الآن', fr: 'maintenant', es: 'ahora', de: 'jetzt', tr: 'şimdi' },
  'later': { ar: 'لاحقاً', fr: 'plus tard', es: 'más tarde', de: 'später', tr: 'sonra' },
  'good': { ar: 'جيد / ممتاز', fr: 'bon', es: 'bueno', de: 'gut', tr: 'iyi' },
  'bad': { ar: 'سيء', fr: 'mauvais', es: 'malo', de: 'schlecht', tr: 'kötü' },
  'big': { ar: 'كبير', fr: 'grand', es: 'grande', de: 'groß', tr: 'büyük' },
  'small': { ar: 'صغير', fr: 'petit', es: 'pequeño', de: 'klein', tr: 'küçük' },
  'beautiful': { ar: 'جميل', fr: 'beau / belle', es: 'hermoso', de: 'schön', tr: 'güzel' },
  'love': { ar: 'حب', fr: 'amour', es: 'amor', de: 'liebe', tr: 'sevgi' },
  'friend': { ar: 'صديق', fr: 'ami', es: 'amigo', de: 'freund', tr: 'arkadaş' },
  'family': { ar: 'عائلة', fr: 'famille', es: 'familia', de: 'familie', tr: 'aile' },
  'work': { ar: 'عمل / وظيفة', fr: 'travail', es: 'trabajo', de: 'arbeit', tr: 'iş' },
  'phone': { ar: 'هاتف / جوال', fr: 'téléphone', es: 'teléfono', de: 'telefon', tr: 'telefon' },
  'message': { ar: 'رسالة', fr: 'message', es: 'mensaje', de: 'nachricht', tr: 'mesaj' },
  'screen': { ar: 'شاشة', fr: 'écran', es: 'pantalla', de: 'bildschirm', tr: 'ekran' },
  'translation': { ar: 'ترجمة', fr: 'traduction', es: 'traducción', de: 'übersetzung', tr: 'çeviri' },
  'offline': { ar: 'بدون إنترنت / غير متصل', fr: 'hors ligne', es: 'sin conexión', de: 'offline', tr: 'çevrimdışı' },
  'online': { ar: 'متصل بالإنترنت', fr: 'en ligne', es: 'en línea', de: 'online', tr: 'çevrimiçi' },
  'download': { ar: 'تنزيل / تحميل', fr: 'télécharger', es: 'descargar', de: 'herunterladen', tr: 'indir' },
  'free': { ar: 'مجاني', fr: 'gratuit', es: 'gratis', de: 'kostenlos', tr: 'ücretsiz' },
  'settings': { ar: 'الإعدادات', fr: 'paramètres', es: 'configuración', de: 'einstellungen', tr: 'ayarlar' },
  'home': { ar: 'الرئيسية / المنزل', fr: 'accueil / maison', es: 'inicio / casa', de: 'startseite / haus', tr: 'ana sayfa / ev' },
  'search': { ar: 'بحث', fr: 'rechercher', es: 'buscar', de: 'suchen', tr: 'ara' },
  'camera': { ar: 'كاميرا / تصوير', fr: 'caméra / appareil photo', es: 'cámara', de: 'kamera', tr: 'kamera' },
  'photo': { ar: 'صورة', fr: 'photo', es: 'foto', de: 'foto', tr: 'fotoğraf' },
  'ball': { ar: 'كرة', fr: 'boule / ballon', es: 'bola / pelota', de: 'ball', tr: 'top' },
  'floating': { ar: 'عائم / طافٍ', fr: 'flottant', es: 'flotante', de: 'schwebend', tr: 'yüzen' },
  // Everyday questions, requests, and conversational phrases
  'i want': { ar: 'أريد', fr: 'je veux', es: 'quiero', de: 'ich möchte', tr: 'istiyorum' },
  'i need': { ar: 'أحتاج / أحتاج إلى', fr: 'j\'ai besoin de', es: 'necesito', de: 'ich brauche', tr: 'ihtiyacım var' },
  'how much': { ar: 'كم / كم السعر', fr: 'combien', es: 'cuánto', de: 'wie viel', tr: 'ne kadar' },
  'i am': { ar: 'أنا', fr: 'je suis', es: 'yo soy / estoy', de: 'ich bin', tr: 'ben' },
  'you are': { ar: 'أنت', fr: 'tu es', es: 'tú eres', de: 'du bist', tr: 'sen' },
  'can you help me': { ar: 'هل يمكنك مساعدتي؟', fr: 'pouvez-vous m\'aider?', es: '¿puedes ayudarme?', de: 'können sie mir helfen?', tr: 'bana yardım edebilir misiniz?' },
  'i want water': { ar: 'أريد ماء', fr: 'je veux de l\'eau', es: 'quiero agua', de: 'ich möchte wasser', tr: 'su istiyorum' },
  'i want a room': { ar: 'أريد غرفة', fr: 'je veux une chambre', es: 'quiero una habitación', de: 'ich möchte ein zimmer', tr: 'bir oda istiyorum' },
  'i want a taxi': { ar: 'أريد تاكسي / سيارة أجرة', fr: 'je veux un taxi', es: 'quiero un taxi', de: 'ich möchte ein taxi', tr: 'bir taksi istiyorum' },
  'i need a doctor': { ar: 'أحتاج إلى طبيب', fr: 'j\'ai besoin d\'un médecin', es: 'necesito un médico', de: 'ich brauche einen arzt', tr: 'bir doktora ihtiyacım var' },
  'i need help': { ar: 'أحتاج مساعدة', fr: 'j\'ai besoin d\'aide', es: 'necesito ayuda', de: 'ich brauche hilfe', tr: 'yardıma ihtiyacım var' },
  'where is the station': { ar: 'أين المحطة؟', fr: 'où est la gare?', es: '¿dónde está la estación?', de: 'wo ist der bahnhof?', tr: 'istasyon nerede?' },
  'where is the pharmacy': { ar: 'أين الصيدلية؟', fr: 'où est la pharmacie?', es: '¿dónde está la farmacia?', de: 'wo ist die apotheke?', tr: 'eczane nerede?' },
  'i am sick': { ar: 'أنا مريض', fr: 'je suis malade', es: 'estoy enfermo', de: 'ich bin krank', tr: 'hastayım' },
  'i am hungry': { ar: 'أنا جائع', fr: 'j\'ai faim', es: 'tengo hambre', de: 'ich habe hunger', tr: 'açım' },
  'what time is it': { ar: 'كم الساعة؟', fr: 'quelle heure est-il?', es: '¿qué hora es?', de: 'wie spät ist es?', tr: 'saat kaç?' },
  'congratulations': { ar: 'مبروك / تهانينا', fr: 'félicitations', es: 'felicidades', de: 'herzlichen glückwunsch', tr: 'tebrikler' },
  'welcome back': { ar: 'مرحباً بعودتك', fr: 'bon retour', es: 'bienvenido de nuevo', de: 'willkommen zurück', tr: 'tekrar hoş geldiniz' },
  'have a good day': { ar: 'أتمنى لك يوماً سعيداً', fr: 'bonne journée', es: 'que tengas un buen día', de: 'schönen tag noch', tr: 'iyi günler' },
};

import { normalizeArabic } from './languageLexiconData.ts';

// Comprehensive reverse Arabic index with normalization and prefix support
export const ARABIC_REVERSE_INDEX: Record<string, Record<string, string>> = {};

for (const [enWord, translations] of Object.entries(OFFLINE_DICTIONARY)) {
  const ar = translations.ar;
  if (ar) {
    const parts = ar.split('/').map((p) => p.trim());
    for (const part of parts) {
      const cleanPart = part.replace(/[؟.,!]/g, '').toLowerCase().trim();
      if (!cleanPart) continue;

      const record = { en: enWord, ...translations };
      ARABIC_REVERSE_INDEX[cleanPart] = record;

      // Also index normalized Arabic without diacritics / hamzas
      const norm = normalizeArabic(cleanPart);
      if (norm) {
        ARABIC_REVERSE_INDEX[norm] = record;
      }

      // Handle definite article 'ال' (e.g. 'الفندق' and 'فندق')
      if (norm.startsWith('ال') && norm.length > 3) {
        const withoutAl = norm.substring(2);
        if (!ARABIC_REVERSE_INDEX[withoutAl]) {
          ARABIC_REVERSE_INDEX[withoutAl] = record;
        }
      } else if (!norm.startsWith('ال')) {
        const withAl = 'ال' + norm;
        if (!ARABIC_REVERSE_INDEX[withAl]) {
          ARABIC_REVERSE_INDEX[withAl] = record;
        }
      }
    }
  }
}
