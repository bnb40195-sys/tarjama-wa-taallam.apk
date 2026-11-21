// Comprehensive Multilingual Lexicon, Phrases, Synonyms, Antonyms, and Bilingual Explanations
// Supports: Arabic (ar), English (en), French (fr), Spanish (es), German (de), Turkish (tr), Italian (it), Russian (ru), Chinese (zh), Japanese (ja)

export interface LexiconEntry {
  id: string;
  category: 'greetings' | 'travel' | 'hotels' | 'dining' | 'shopping' | 'emergency' | 'work_study' | 'daily_life' | 'traits_emotions' | 'verbs';
  type: 'word' | 'phrase' | 'sentence';
  translations: Record<string, string>;
  pronunciations?: Record<string, string>;
  synonyms?: Record<string, string[]>;
  antonyms?: Record<string, string[]>;
  bilingualExplanation?: {
    ar: string;
    en: string;
    grammar: string;
  };
  exampleSentence?: {
    ar: string;
    en: string;
    fr?: string;
    es?: string;
  };
}

export const LEXICON_CATEGORIES = [
  { id: 'all', nameAr: 'الكل', icon: '🌟' },
  { id: 'greetings', nameAr: 'التحيات والتعارف', icon: '👋' },
  { id: 'travel', nameAr: 'السفر والمطارات', icon: '✈️' },
  { id: 'dining', nameAr: 'المطاعم والطعام', icon: '🍽️' },
  { id: 'hotels', nameAr: 'الفنادق والإقامة', icon: '🏨' },
  { id: 'shopping', nameAr: 'التسوق والأسعار', icon: '🛍️' },
  { id: 'emergency', nameAr: 'الطوارئ والصحة', icon: '🚨' },
  { id: 'work_study', nameAr: 'العمل والدراسة', icon: '💼' },
  { id: 'traits_emotions', nameAr: 'الصفات والمشاعر والأضداد', icon: '🎭' },
  { id: 'daily_life', nameAr: 'الحياة اليومية', icon: '☕' },
  { id: 'verbs', nameAr: 'الأفعال الشائعة', icon: '⚡' },
];

export const COMPREHENSIVE_LEXICON: LexiconEntry[] = [
  // --- GREETINGS & ESSENTIALS ---
  {
    id: 'lex_hello',
    category: 'greetings',
    type: 'word',
    translations: {
      ar: 'مرحباً / أهلاً',
      en: 'Hello / Hi',
      fr: 'Bonjour / Salut',
      es: 'Hola',
      de: 'Hallo / Guten Tag',
      tr: 'Merhaba / Selam',
      it: 'Ciao / Buongiorno',
      ru: 'Здравствуйте / Привет',
      zh: '你好 (Nǐ hǎo)',
      ja: 'こんにちは (Konnichiwa)',
    },
    pronunciations: {
      ar: 'Marhaban',
      en: 'heh-LOH',
      fr: 'bon-ZHOOR',
      es: 'OH-lah',
      de: 'HAH-loh',
      tr: 'mair-hah-BAH',
    },
    synonyms: {
      ar: ['أهلاً', 'أهلاً وسهلاً', 'تحياتي', 'سلام'],
      en: ['Hi', 'Greetings', 'Good day', 'Welcome'],
      fr: ['Salut', 'Bienvenue', 'Coucou'],
      es: ['Buenas', 'Saludos', 'Buen día'],
      de: ['Guten Tag', 'Grüß Gott', 'Hi'],
      tr: ['Selam', 'Esenlikler', 'İyi günler'],
    },
    antonyms: {
      ar: ['وداعاً', 'إلى اللقاء', 'مع السلامة'],
      en: ['Goodbye', 'Bye', 'Farewell', 'See you later'],
      fr: ['Au revoir', 'Adieu'],
      es: ['Adiós', 'Hasta luego'],
      de: ['Auf Wiedersehen', 'Tschüss'],
      tr: ['Güle güle', 'Hoşça kal'],
    },
    bilingualExplanation: {
      ar: 'تحية ترحيبية أساسية وشائعة تُقال عند لقاء شخص في أي وقت من اليوم تعبيراً عن الود والاحترام.',
      en: 'A standard universal greeting used when meeting someone or starting a friendly conversation at any time of day.',
      grammar: 'Interjection / Greeting (اسم فعل ترحيب)',
    },
    exampleSentence: {
      ar: 'مرحباً يا صديقي، كيف حالك اليوم؟',
      en: 'Hello my friend, how are you doing today?',
      fr: 'Bonjour mon ami, comment vas-tu aujourd\'hui ?',
      es: '¡Hola amigo mío! ¿Cómo estás hoy?',
    },
  },

  {
    id: 'lex_peace',
    category: 'greetings',
    type: 'word',
    translations: {
      ar: 'سلام / سلام وأمان',
      en: 'Peace',
      fr: 'Paix',
      es: 'Paz',
      de: 'Frieden',
      tr: 'Barış / Huzur',
      it: 'Pace',
      ru: 'Мир (Mir)',
      zh: '和平 (Hépíng)',
      ja: '平和 (Heiwa)',
    },
    synonyms: {
      ar: ['طمأنينة', 'وئام', 'سكينة', 'أمان', 'هدوء'],
      en: ['Serenity', 'Tranquility', 'Harmony', 'Calmness', 'Concord'],
      fr: ['Tranquillité', 'Sérénité', 'Harmonie', 'Calme'],
      es: ['Tranquilidad', 'Armonía', 'Sosiego', 'Calma'],
      de: ['Ruhe', 'Harmonie', 'Stille', 'Eintracht'],
      tr: ['Huzur', 'Sükunet', 'Dirlik', 'Uyum'],
    },
    antonyms: {
      ar: ['حرب', 'نزاع', 'صراع', 'عداوة', 'فوضى'],
      en: ['War', 'Conflict', 'Hostility', 'Chaos', 'Turmoil'],
      fr: ['Guerre', 'Conflit', 'Chaos', 'Hostilité'],
      es: ['Guerra', 'Conflicto', 'Caos', 'Enemistad'],
      de: ['Krieg', 'Konflikt', 'Streit', 'Chaos'],
      tr: ['Savaş', 'Çatışma', 'Kavga', 'Kaos'],
    },
    bilingualExplanation: {
      ar: 'حالة من السكينة والوئام والأمان وغياب النزاع أو الحروب، وترمز أيضاً إلى التحية الإسلامية العريقة.',
      en: 'A state of tranquility, security, and mutual harmony free from civil disturbance or war.',
      grammar: 'Noun (اسم دال على معنى معنوي)',
    },
    exampleSentence: {
      ar: 'يعمل العالم معاً من أجل إحلال السلام والازدهار لجميع الشعوب.',
      en: 'The world strives together to establish peace and prosperity for all nations.',
      fr: 'Le monde travaille ensemble pour instaurer la paix et la prospérité pour tous.',
      es: 'El mundo trabaja unido para lograr la paz y la prosperidad para todos.',
    },
  },

  {
    id: 'lex_good_morning',
    category: 'greetings',
    type: 'phrase',
    translations: {
      ar: 'صباح الخير',
      en: 'Good morning',
      fr: 'Bonjour',
      es: 'Buenos días',
      de: 'Guten Morgen',
      tr: 'Günaydın',
      it: 'Buongiorno',
      ru: 'Доброе утро',
      zh: '早上好 (Zǎoshang hǎo)',
      ja: 'おはようございます (Ohayō gozaimasu)',
    },
    synonyms: {
      ar: ['صباح النور', 'صباح الورد', 'أسعد الله صباحك'],
      en: ['Morning', 'Top of the morning', 'Good day'],
      fr: ['Bon réveil', 'Douce matinée'],
      es: ['Buen día', 'Hermosa mañana'],
      de: ['Schönen Morgen', 'Einen guten Start in den Tag'],
      tr: ['Hayırlı sabahlar', 'İyi sabahlar'],
    },
    antonyms: {
      ar: ['مساء الخير', 'تصبح على خير', 'ليلة سعيدة'],
      en: ['Good night', 'Good evening', 'Sweet dreams'],
      fr: ['Bonne nuit', 'Bonsoir'],
      es: ['Buenas noches', 'Que descanses'],
      de: ['Gute Nacht', 'Guten Abend'],
      tr: ['İyi geceler', 'İyi akşamlar'],
    },
    bilingualExplanation: {
      ar: 'تحية صباحية لطيفة تُقال من شروق الشمس حتى منتصف النهار لتمني بداية يوم موفقة ومشرقة.',
      en: 'A polite morning salutation spoken upon meeting someone between dawn and noon to wish them a pleasant day.',
      grammar: 'Phrase / Politeness Salutation (مركب ترحيبي)',
    },
    exampleSentence: {
      ar: 'صباح الخير! أتمنى لك يوماً مليئاً بالإنجاز والنجاح.',
      en: 'Good morning! I wish you a day full of productivity and joy.',
    },
  },

  {
    id: 'lex_thank_you',
    category: 'greetings',
    type: 'phrase',
    translations: {
      ar: 'شكراً لك / شكراً جزيلاً',
      en: 'Thank you / Thanks a lot',
      fr: 'Merci / Merci beaucoup',
      es: 'Gracias / Muchas gracias',
      de: 'Danke / Vielen Dank',
      tr: 'Teşekkür ederim / Çok teşekkürler',
      it: 'Grazie / Mille grazie',
      ru: 'Спасибо / Большое спасибо',
      zh: '谢谢 (Xièxiè)',
      ja: 'ありがとうございます (Arigatō gozaimasu)',
    },
    synonyms: {
      ar: ['ممتن لك', 'جزاك الله خيراً', 'لك فائق التقدير', 'تسلم'],
      en: ['Much obliged', 'I appreciate it', 'Many thanks', 'Grateful'],
      fr: ['Je vous remercie', 'Mille mercis', 'C\'est très aimable'],
      es: ['Muy agradecido', 'Te lo agradezco', 'Mil gracias'],
      de: ['Herzlichen Dank', 'Besten Dank', 'Ich danke dir'],
      tr: ['Sağ olun', 'Elinize sağlık', 'Minnettarım'],
    },
    antonyms: {
      ar: ['جاحد / نكران الجميل', 'لا شكر'],
      en: ['Ingratitude', 'Unthankful', 'Ungrateful'],
      fr: ['Ingratitude', 'Méconnaissance'],
      es: ['Ingratitud', 'Desagradecimiento'],
      de: ['Undankbarkeit', 'Undank'],
      tr: ['Nankörlük', 'Kadir bilmezlik'],
    },
    bilingualExplanation: {
      ar: 'تعبير امتنان وتقدير يُقال لشخص عند تقديم مساعدة أو إبداء معروف ولطف.',
      en: 'An expression of gratitude used to show appreciation for kindness, help, or gifts received.',
      grammar: 'Politeness Expression (تعبير شكر وامتنان)',
    },
    exampleSentence: {
      ar: 'شكراً جزيلاً لمساعدتك القيّمة في إتمام هذا العمل.',
      en: 'Thank you very much for your valuable assistance in finishing this project.',
    },
  },

  // --- TRAITS, EMOTIONS & OPPOSITES (الصفات والمشاعر والأضداد) ---
  {
    id: 'lex_happy',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'سعيد / مسرور',
      en: 'Happy / Joyful',
      fr: 'Heureux / Joyeux',
      es: 'Feliz / Contento',
      de: 'Glücklich / Froh',
      tr: 'Mutlu / Sevinçli',
      it: 'Felice / Contento',
      ru: 'Счастливый / Радостный',
      zh: '快乐 (Kuàilè)',
      ja: '幸せ (Shiawase)',
    },
    synonyms: {
      ar: ['فرحان', 'مبتهج', 'مستبشر', 'منشرح الصدر', 'راضٍ'],
      en: ['Glad', 'Cheerful', 'Delighted', 'Content', 'Joyful', 'Ecstatic'],
      fr: ['Content', 'Joyeux', 'Ravi', 'Épanoui'],
      es: ['Alegre', 'Gozoso', 'Satisfecho', 'Radiante'],
      de: ['Froh', 'Heiter', 'Vergnügt', 'Zufrieden'],
      tr: ['Neşeli', 'Memnun', 'Keyifli', 'Mesut'],
    },
    antonyms: {
      ar: ['حزين', 'كئيب', 'بائس', 'مغموم', 'تعيس'],
      en: ['Sad', 'Unhappy', 'Miserable', 'Depressed', 'Gloomy', 'Sorrowful'],
      fr: ['Triste', 'Malheureux', 'Sombre', 'Morose'],
      es: ['Triste', 'Desdichado', 'Afligido', 'Deprimido'],
      de: ['Traurig', 'Unglücklich', 'Betrübt', 'Niedergeschlagen'],
      tr: ['Üzgün', 'Kederli', 'Mutsuz', 'Hüzünlü'],
    },
    bilingualExplanation: {
      ar: 'صفة تُعبر عن الشعور بالبهجة والرضا والسرور وانشراح القلب.',
      en: 'Feeling or showing pleasure, contentment, or fortunate satisfaction in life.',
      grammar: 'Adjective (صفة مشبهة)',
    },
    exampleSentence: {
      ar: 'كانت العائلة سعيدة جداً بنجاح ابنهم في الجامعة.',
      en: 'The family was extremely happy with their son\'s university graduation.',
    },
  },

  {
    id: 'lex_big',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'كبير / ضخم',
      en: 'Big / Large',
      fr: 'Grand / Énorme',
      es: 'Grande / Enorme',
      de: 'Groß / Riesig',
      tr: 'Büyük / İri',
      it: 'Grande / Enorme',
      ru: 'Большой / Огромный',
      zh: '大 (Dà)',
      ja: '大きい (Ōkii)',
    },
    synonyms: {
      ar: ['عظيم', 'واسع', 'هائل', 'جسيم', 'ضخم'],
      en: ['Huge', 'Giant', 'Massive', 'Immense', 'Gigantic', 'Enormous'],
      fr: ['Immense', 'Vaste', 'Colossal', 'Majestueux'],
      es: ['Inmenso', 'Vasto', 'Colosal', 'Monumental'],
      de: ['Riesig', 'Gewaltig', 'Massiv', 'Umfangreich'],
      tr: ['Kocaman', 'Geniş', 'Devasa', 'Heybetli'],
    },
    antonyms: {
      ar: ['صغير', 'ضئيل', 'قزم', 'محدود الحجم'],
      en: ['Small', 'Tiny', 'Little', 'Miniature', 'Petite', 'Minute'],
      fr: ['Petit', 'Minuscule', 'Étroit'],
      es: ['Pequeño', 'Diminuto', 'Chico'],
      de: ['Klein', 'Winzig', 'Zierlich'],
      tr: ['Küçük', 'Ufak', 'Minyatür'],
    },
    bilingualExplanation: {
      ar: 'صفة تدل على الحجم أو المقدار الذي يفوق المعتاد سواء كان شيئاً مادياً أو معنىً معنوياً.',
      en: 'Of considerable size, extent, or intensity; greater than the average.',
      grammar: 'Adjective of size (صفة قياس وحجم)',
    },
    exampleSentence: {
      ar: 'بنت المدينة مكتبة عامة كبيرة جداً تضم آلاف الكتب.',
      en: 'The city built a very big public library holding thousands of books.',
    },
  },

  {
    id: 'lex_fast',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'سريع / عاجل',
      en: 'Fast / Quick',
      fr: 'Rapide / Vite',
      es: 'Rápido / Veloz',
      de: 'Schnell / Rasch',
      tr: 'Hızlı / Çabuk',
      it: 'Veloce / Rapido',
      ru: 'Быстрый / Скорый',
      zh: '快 (Kuài)',
      ja: '速い (Hayai)',
    },
    synonyms: {
      ar: ['خاطف', 'عاجل', 'رشيق', 'مبادر', 'فوري'],
      en: ['Swift', 'Speedy', 'Rapid', 'Brisk', 'Instantaneous', 'Prompt'],
      fr: ['Vif', 'Prompt', 'Véloce', 'Instantané'],
      es: ['Ágil', 'Expedito', 'Pronto', 'Instantáneo'],
      de: ['Flott', 'Zügig', 'Geschwind', 'Prompt'],
      tr: ['Seri', 'Süratli', 'Tez', 'Çevik'],
    },
    antonyms: {
      ar: ['بطيء', 'متثاقل', 'متأخر', 'متمهل'],
      en: ['Slow', 'Sluggish', 'Leisurely', 'Delayed', 'Unhurried'],
      fr: ['Lent', 'Tardif', 'Posé'],
      es: ['Lento', 'Pausado', 'Tardo'],
      de: ['Langsam', 'Träge', 'Schläfrig'],
      tr: ['Yavaş', 'Ağır', 'Gevşek'],
    },
    bilingualExplanation: {
      ar: 'صفة تدل على سرعة الحركة أو الإنجاز في زمن وجيز ودون إبطاء.',
      en: 'Moving or capable of moving at high speed, or taking only a short time to complete.',
      grammar: 'Adjective / Adverb (صفة وظرف سرعة)',
    },
    exampleSentence: {
      ar: 'القطار الكهربائي السريع يربط بين العاصمتين في ساعة واحدة.',
      en: 'The fast bullet train connects both capitals in only one hour.',
    },
  },

  {
    id: 'lex_beautiful',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'جميل / رائع',
      en: 'Beautiful / Gorgeous',
      fr: 'Beau / Magnifique',
      es: 'Hermoso / Bello',
      de: 'Schön / Wunderschön',
      tr: 'Güzel / Harika',
      it: 'Bello / Splendido',
      ru: 'Красивый / Прекрасный',
      zh: '美丽 (Měilì)',
      ja: '美しい (Utsukushii)',
    },
    synonyms: {
      ar: ['وسيم', 'بديع', 'فاتن', 'خلاب', 'حسن', 'أنيق'],
      en: ['Pretty', 'Attractive', 'Lovely', 'Stunning', 'Charming', 'Exquisite'],
      fr: ['Joli', 'Splendide', 'Ravissant', 'Élégant'],
      es: ['Lindo', 'Precioso', 'Atractivo', 'Espléndido'],
      de: ['Attraktiv', 'Hübsch', 'Reizend', 'Prächtig'],
      tr: ['Sevimli', 'Göz alıcı', 'Muazzam', 'Zarif'],
    },
    antonyms: {
      ar: ['قبيح', 'دميم', 'منفر', 'بشع'],
      en: ['Ugly', 'Hideous', 'Unattractive', 'Repulsive', 'Unsightly'],
      fr: ['Laid', 'Affreux', 'Repoussant'],
      es: ['Feo', 'Horrible', 'Desagradable'],
      de: ['Hässlich', 'Unansehnlich', 'Scheußlich'],
      tr: ['Çirkin', 'Kaba', 'İtici'],
    },
    bilingualExplanation: {
      ar: 'صفة تُطلق على ما يسر الناظر ويحقق كمال التناسق والجاذبية في المنظر أو الخلق.',
      en: 'Pleasing the senses or mind aesthetically; having qualities that delight the eye.',
      grammar: 'Adjective (صفة جمالية)',
    },
    exampleSentence: {
      ar: 'شاهدنا غروباً جميلاً للشمس على شاطئ البحر الهادئ.',
      en: 'We watched a beautiful sunset over the peaceful ocean shore.',
    },
  },

  {
    id: 'lex_strong',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'قوي / متين',
      en: 'Strong / Powerful',
      fr: 'Fort / Puissant',
      es: 'Fuerte / Poderoso',
      de: 'Stark / Kräftig',
      tr: 'Güçlü / Kuvvetli',
      it: 'Forte / Robusto',
      ru: 'Сильный / Мощный',
      zh: '强壮 (Qiángzhuàng)',
      ja: '強い (Tsuyoi)',
    },
    synonyms: {
      ar: ['شديد', 'صلب', 'راسخ', 'جبار', 'حصين'],
      en: ['Tough', 'Robust', 'Vigorous', 'Firm', 'Mighty', 'Resilient'],
      fr: ['Robuste', 'Solide', 'Vigoureux'],
      es: ['Robusto', 'Sólido', 'Vigoroso'],
      de: ['Robust', 'Massiv', 'Mächtig'],
      tr: ['Sağlam', 'Dayanıklı', 'Metin'],
    },
    antonyms: {
      ar: ['ضعيف', 'هش', 'واهن', 'عاجز'],
      en: ['Weak', 'Fragile', 'Frail', 'Feeble', 'Delicate'],
      fr: ['Faible', 'Fragile', 'Vulnérable'],
      es: ['Débil', 'Frágil', 'Enclenque'],
      de: ['Schwach', 'Zerbrechlich', 'Machtlos'],
      tr: ['Zayıf', 'Çelimsiz', 'Kırılgan'],
    },
    bilingualExplanation: {
      ar: 'صفة تدل على امتلاك قدرة جسدية أو معنوية عالية لمواجهة الصعاب والصمود.',
      en: 'Possessing physical or moral power, endurance, and firm structural resilience.',
      grammar: 'Adjective (صفة قوة ومتانة)',
    },
    exampleSentence: {
      ar: 'الإرادة القوية هي مفتاح التغلب على أصعب التحديات.',
      en: 'A strong willpower is the key to overcoming the hardest challenges.',
    },
  },

  // --- TRAVEL & AIRPORT (السفر والمطارات) ---
  {
    id: 'lex_airport',
    category: 'travel',
    type: 'word',
    translations: {
      ar: 'مطار',
      en: 'Airport',
      fr: 'Aéroport',
      es: 'Aeropuerto',
      de: 'Flughafen',
      tr: 'Havalimanı',
      it: 'Aeroporto',
      ru: 'Аэропорт',
      zh: '机场 (Jīchǎng)',
      ja: '空港 (Kūkō)',
    },
    synonyms: {
      ar: ['محطة الطيران', 'ميناء جوي', 'مهبط الطائرات'],
      en: ['Airfield', 'Airstrip', 'Terminal', 'Aerodrome'],
      fr: ['Aérodrome', 'Gare aérienne'],
      es: ['Aeródromo', 'Terminal aérea'],
      de: ['Flugplatz', 'Airport'],
      tr: ['Hava meydanı', 'Havaalanı'],
    },
    antonyms: {
      ar: ['ميناء بحري', 'محطة قطار برية'],
      en: ['Seaport', 'Harbor', 'Train station'],
    },
    bilingualExplanation: {
      ar: 'مجمع منشآت مجهز لإقلاع وهبوط الطائرات وصعود واستقبال المسافرين وشحن البضائع الجوية.',
      en: 'A complex of runways and buildings for the takeoff, landing, and maintenance of aircraft with passenger terminals.',
      grammar: 'Noun (اسم مكان ملاحي)',
    },
    exampleSentence: {
      ar: 'وصلنا إلى المطار الدولي قبل موعد إقلاع الرحلة بثلاث ساعات.',
      en: 'We arrived at the international airport three hours before departure flight time.',
    },
  },

  {
    id: 'lex_passport',
    category: 'travel',
    type: 'word',
    translations: {
      ar: 'جواز سفر',
      en: 'Passport',
      fr: 'Passeport',
      es: 'Pasaporte',
      de: 'Reisepass',
      tr: 'Pasaport',
      it: 'Passaporto',
      ru: 'Паспорт',
      zh: '护照 (Hùzhào)',
      ja: 'パスポート (Pasupōto)',
    },
    synonyms: {
      ar: ['وثيقة سفر', 'هوية دولية'],
      en: ['Travel document', 'Identity credential'],
      fr: ['Document de voyage', 'Titre de voyage'],
      es: ['Documento de viaje'],
      de: ['Ausweis', 'Reisedokument'],
      tr: ['Seyahat belgesi'],
    },
    bilingualExplanation: {
      ar: 'وثيقة رسمية تصدرها الدولة للمواطن لتسهيل سفره عبر الحدود الدولية وإثبات هويته وجنسيته.',
      en: 'An official government document certifying identity and citizenship, permitting travel across national frontiers.',
      grammar: 'Compound Noun (اسم مركب رسمي)',
    },
    exampleSentence: {
      ar: 'تأكد من صلاحية جواز سفرك قبل حجز تذكرة الطيران الدولية.',
      en: 'Ensure your passport is valid before booking an international flight ticket.',
    },
  },

  {
    id: 'lex_ticket',
    category: 'travel',
    type: 'word',
    translations: {
      ar: 'تذكرة',
      en: 'Ticket',
      fr: 'Billet',
      es: 'Billete / Boleto',
      de: 'Fahrkarte / Ticket',
      tr: 'Bilet',
      it: 'Biglietto',
      ru: 'Билет',
      zh: '车票 / 门票 (Piào)',
      ja: '切符 / チケット (Kippu)',
    },
    synonyms: {
      ar: ['بطاقة عبور', 'قسيمة سفر', 'تصريح دخول'],
      en: ['Pass', 'Boarding coupon', 'Voucher'],
      fr: ['Titre de transport', 'Pass'],
      es: ['Pasaje', 'Pase'],
      de: ['Bordkarte', 'Fahrschein'],
      tr: ['Geçiş kartı'],
    },
    bilingualExplanation: {
      ar: 'وثيقة أو بطاقة ورقية أو رقمية تمنح حاملها حق ركوب وسيلة نقل أو دخول فعالية معينة.',
      en: 'A voucher, receipt, or token showing that the holder has paid for admission or travel rights.',
      grammar: 'Noun (اسم وثيقة)',
    },
    exampleSentence: {
      ar: 'حجزت تذكرة القطار عبر الإنترنت وحفظتها في هاتفي الذكي.',
      en: 'I booked the train ticket online and saved it directly to my smartphone.',
    },
  },

  // --- RESTAURANT & DINING (المطاعم والطعام) ---
  {
    id: 'lex_restaurant',
    category: 'dining',
    type: 'word',
    translations: {
      ar: 'مطعم',
      en: 'Restaurant',
      fr: 'Restaurant',
      es: 'Restaurante',
      de: 'Restaurant / Gaststätte',
      tr: 'Restoran / Lokanta',
      it: 'Ristorante',
      ru: 'Ресторан',
      zh: '餐厅 (Cāntīng)',
      ja: 'レストラン (Resutoran)',
    },
    synonyms: {
      ar: ['مأدبة', 'كافيتريا', 'استراحة طعام', 'حانة طعام'],
      en: ['Eatery', 'Bistro', 'Diner', 'Cafe', 'Brasserie'],
      fr: ['Bistrot', 'Brasserie', 'Auberge'],
      es: ['Comedor', 'Mesón', 'Taberna'],
      de: ['Lokal', 'Wirtshaus', 'Bistro'],
      tr: ['Lokanta', 'Yemekhane'],
    },
    bilingualExplanation: {
      ar: 'مكان مجهز يُعد ويُقدم فيه الطعام والوجبات والمشروبات للزبائن والضيوف مقابل ثمن.',
      en: 'A commercial establishment where meals and drinks are prepared and served to customers.',
      grammar: 'Noun of place (اسم مكان خدمي)',
    },
    exampleSentence: {
      ar: 'ذهبنا لتناول وجبة العشاء في مطعم تقليدي شهير وسط المدينة.',
      en: 'We went to have dinner at a famous traditional restaurant downtown.',
    },
  },

  {
    id: 'lex_delicious',
    category: 'dining',
    type: 'word',
    translations: {
      ar: 'لذيذ / شهي',
      en: 'Delicious / Tasty',
      fr: 'Délicieux / Savoureux',
      es: 'Delicioso / Sabroso',
      de: 'Lecker / Köstlich',
      tr: 'Lezzetli / Nefis',
      it: 'Delizioso / Squisito',
      ru: 'Вкусный / Аппетитный',
      zh: '美味 (Měiwèi)',
      ja: '美味しい (Oishii)',
    },
    synonyms: {
      ar: ['طيب المذاق', 'رائع الطعم', 'فاخر', 'مستطاب'],
      en: ['Yummy', 'Delectable', 'Flavorful', 'Mouthwatering', 'Scrumptious'],
      fr: ['Succulent', 'Exquis', 'Appétissant'],
      es: ['Rico', 'Exquisito', 'Apetitoso'],
      de: ['Schmackhaft', 'Delikat', 'Fein'],
      tr: ['Tadında', 'Enfes', 'İştah açıcı'],
    },
    antonyms: {
      ar: ['رديء الطعم', 'حامض أو فاسد', 'مر', 'غير مستساغ'],
      en: ['Tasteless', 'Disgusting', 'Bland', 'Unpalatable', 'Foul'],
      fr: ['Insipide', 'Fade', 'Dégoûtant'],
      es: ['Desabrido', 'Insípido', 'Repugnante'],
      de: ['Geschmacklos', 'Fade', 'Ungenießbar'],
      tr: ['Tatsız', 'Lezzetsiz', 'Yavan'],
    },
    bilingualExplanation: {
      ar: 'صفة تدل على طيب طعم الأكل والشراب وملاءمته التامة لحاسة التذوق.',
      en: 'Highly pleasant and satisfying to the sense of taste or smell.',
      grammar: 'Adjective of taste (صفة ذوقية)',
    },
    exampleSentence: {
      ar: 'كان حساء الخضار الطازج لذيذاً ومغذياً جداً.',
      en: 'The fresh vegetable soup was delicious and highly nourishing.',
    },
  },

  // --- EMERGENCY & HEALTH (الطوارئ والصحة) ---
  {
    id: 'lex_hospital',
    category: 'emergency',
    type: 'word',
    translations: {
      ar: 'مستشفى',
      en: 'Hospital',
      fr: 'Hôpital',
      es: 'Hospital',
      de: 'Krankenhaus',
      tr: 'Hastane',
      it: 'Ospedale',
      ru: 'Больница',
      zh: '医院 (Yīyuàn)',
      ja: '病院 (Byōin)',
    },
    synonyms: {
      ar: ['مركز صحي', 'مستوصف', 'دار الشفاء', 'مجمع طبي'],
      en: ['Infirmary', 'Medical center', 'Clinic', 'Sanatorium'],
      fr: ['Clinique', 'Centre médical'],
      es: ['Clínica', 'Centro de salud'],
      de: ['Klinik', 'Sanatorium'],
      tr: ['Klinik', 'Sağlık ocağı'],
    },
    bilingualExplanation: {
      ar: 'مؤسسة طبية متخصصة ومجهزة بالكوادر والأجهزة لتقديم العلاج والرعاية للمرضى والمصابين.',
      en: 'An institution providing medical and surgical treatment and nursing care for sick or injured people.',
      grammar: 'Noun (اسم مؤسسة طبية)',
    },
    exampleSentence: {
      ar: 'نقل المسعفون المصاب بسرعة إلى أقرب مستشفى لتلقي الرعاية العاجلة.',
      en: 'Paramedics rushed the patient to the nearest hospital for immediate emergency care.',
    },
  },

  {
    id: 'lex_help_me',
    category: 'emergency',
    type: 'phrase',
    translations: {
      ar: 'ساعدني / النجدة',
      en: 'Help me / Assist me',
      fr: 'Aidez-moi / Au secours',
      es: 'Ayúdame / Socorro',
      de: 'Hilf mir / Zu Hilfe',
      tr: 'Bana yardım et / İmdat',
      it: 'Aiutami / Soccorso',
      ru: 'Помогите мне',
      zh: '救我 / 帮帮我 (Bāng bāng wǒ)',
      ja: '助けてください (Tasukete kudasai)',
    },
    synonyms: {
      ar: ['أغثني', 'أنقذني', 'مد لي يد العون'],
      en: ['Give me a hand', 'Rescue me', 'Save me', 'Lend a hand'],
      fr: ['Secourez-moi', 'Venez à mon aide'],
      es: ['Échame una mano', 'Sálvame'],
      de: ['Rette mich', 'Unterstütze mich'],
      tr: ['Bana el uzat', 'Kurtar beni'],
    },
    antonyms: {
      ar: ['تخلَّ عني', 'خذلني'],
      en: ['Abandon me', 'Leave me alone', 'Ignore me'],
      fr: ['Laissez-moi', 'Abandonnez-moi'],
      es: ['Déjame en paz', 'Abandóname'],
      de: ['Lass mich in Ruhe', 'Verlass mich'],
      tr: ['Beni yalnız bırak'],
    },
    bilingualExplanation: {
      ar: 'طلب استغاثة أو عون فوري يُقال عند مواجهة ورطة أو موقف طارئ يتطلب التدخل.',
      en: 'An urgent plea asking for someone to assist, rescue, or provide immediate support in a crisis.',
      grammar: 'Imperative verb phrase (صيغة أمر واستغاثة)',
    },
    exampleSentence: {
      ar: 'من فضلك ساعدني في حمل هذه الحقيبة الثقيلة إلى الغرفة.',
      en: 'Please help me carry this heavy luggage up to the room.',
    },
  },

  // --- WORK, STUDY & ACTIONS (العمل والتعليم والأفعال) ---
  {
    id: 'lex_work',
    category: 'work_study',
    type: 'word',
    translations: {
      ar: 'عمل / وظيفة',
      en: 'Work / Job',
      fr: 'Travail / Métier',
      es: 'Trabajo / Empleo',
      de: 'Arbeit / Beruf',
      tr: 'İş / Meslek',
      it: 'Lavoro / Impiego',
      ru: 'Работа / Труд',
      zh: '工作 (Gōngzuò)',
      ja: '仕事 (Shigoto)',
    },
    synonyms: {
      ar: ['مهنة', 'حرفة', 'نشاط', 'مشروع', 'مهمة', 'شاغر'],
      en: ['Occupation', 'Employment', 'Career', 'Labor', 'Task', 'Vocation'],
      fr: ['Emploi', 'Profession', 'Activité', 'Tâche'],
      es: ['Puesto', 'Oficio', 'Labor', 'Carrera'],
      de: ['Tätigkeit', 'Beschäftigung', 'Gewerbe'],
      tr: ['Uğraş', 'Görev', 'Kariyer', 'Hizmet'],
    },
    antonyms: {
      ar: ['بطالة', 'فراغ', 'كسل', 'راحة'],
      en: ['Unemployment', 'Idleness', 'Inactivity', 'Rest', 'Vacation'],
      fr: ['Chômage', 'Inactivité', 'Repos'],
      es: ['Desempleo', 'Ocio', 'Paro'],
      de: ['Arbeitslosigkeit', 'Untätigkeit', 'Ruhe'],
      tr: ['İşsizlik', 'Aylaklık', 'Tembellik'],
    },
    bilingualExplanation: {
      ar: 'الجهد البدني أو الفكري المبذول لإنتاج قيمة أو تقديم خدمة مقابل أجر ومهنة مستقرة.',
      en: 'Activity involving mental or physical effort done in order to achieve a result or earn a livelihood.',
      grammar: 'Noun / Verb (اسم ومصدر دال على مهنة)',
    },
    exampleSentence: {
      ar: 'يتطلب العمل في تقنية المعلومات تعلماً مستمراً ومواكبة للجديد.',
      en: 'Working in information technology requires continuous learning and keeping up with innovation.',
    },
  },

  {
    id: 'lex_learn',
    category: 'verbs',
    type: 'word',
    translations: {
      ar: 'يتعلم / اكتسب المعرفة',
      en: 'Learn / Study',
      fr: 'Apprendre / Étudier',
      es: 'Aprender / Estudiar',
      de: 'Lernen / Studieren',
      tr: 'Öğrenmek / İncelemek',
      it: 'Imparare / Studiare',
      ru: 'Учиться / Изучать',
      zh: '学习 (Xuéxí)',
      ja: '学ぶ / 勉強する (Manabu)',
    },
    synonyms: {
      ar: ['يدرس', 'يتدرب', 'يستوعب', 'يفهم', 'يتثقف'],
      en: ['Acquire', 'Master', 'Grasp', 'Absorb', 'Comprehend'],
      fr: ['Assimiler', 'Retenir', 'Comprendre'],
      es: ['Adquirir', 'Asimilar', 'Instruirse'],
      de: ['Begreifen', 'Sich aneignen', 'Erfassen'],
      tr: ['Kavramak', 'Bellemek', 'Eğitilmek'],
    },
    antonyms: {
      ar: ['ينسى', 'يجهل', 'يتجاهل'],
      en: ['Forget', 'Ignore', 'Unlearn', 'Neglect'],
      fr: ['Oublier', 'Ignorer'],
      es: ['Olvidar', 'Desaprender'],
      de: ['Vergessen', 'Verlernen'],
      tr: ['Unutmak', 'Cahil kalmak'],
    },
    bilingualExplanation: {
      ar: 'فعل يدل على اكتساب المعارف والمهارات أو الفهم من خلال الدراسة أو الخبرة والتدريب.',
      en: 'To gain or acquire knowledge of or skill in something through study, experience, or being taught.',
      grammar: 'Action Verb (فعل مضارع متعدٍ)',
    },
    exampleSentence: {
      ar: 'يسعى الطلاب لتعلم لغات جديدة لتوسيع آفاقهم الثقافية والمهنية.',
      en: 'Students strive to learn new languages to broaden their cultural and career horizons.',
    },
  },

  {
    id: 'lex_love',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'حب / مودة',
      en: 'Love / Affection',
      fr: 'Amour / Affection',
      es: 'Amor / Cariño',
      de: 'Liebe / Zuneigung',
      tr: 'Sevgi / Aşk',
      it: 'Amore / Affetto',
      ru: 'Любовь (Lyubov)',
      zh: '爱 (Ài)',
      ja: '愛 (Ai)',
    },
    synonyms: {
      ar: ['عشق', 'وداد', 'غرام', 'ألفة', 'شغف', 'إخاء'],
      en: ['Adoration', 'Passion', 'Fondness', 'Devotion', 'Attachment'],
      fr: ['Tendresse', 'Passion', 'Attachement'],
      es: ['Afecto', 'Pasión', 'Apego'],
      de: ['Zärtlichkeit', 'Hingabe', 'Verehrung'],
      tr: ['Muhabbet', 'Bağlılık', 'Tutku'],
    },
    antonyms: {
      ar: ['كره', 'بغضاء', 'عداوة', 'مقت', 'نفور'],
      en: ['Hate', 'Hatred', 'Loathing', 'Enmity', 'Detestation'],
      fr: ['Haine', 'Aversion', 'Dédain'],
      es: ['Odio', 'Rencor', 'Aversión'],
      de: ['Hass', 'Abscheu', 'Abneigung'],
      tr: ['Nefret', 'Kin', 'Düşmanlık'],
    },
    bilingualExplanation: {
      ar: 'شعور قلبي نبيل عميق من الإعزاز والتعلق والارتباط الإيجابي بالآخرين أو بالقيم والخير.',
      en: 'An intense feeling of deep affection, warmth, devotion, and positive attachment.',
      grammar: 'Noun & Verb (اسم معنى ومصدر)',
    },
    exampleSentence: {
      ar: 'ينشر الحب والتعاون السلام والتكافل بين أفراد المجتمع.',
      en: 'Love and cooperation spread peace and solidarity among all members of society.',
    },
  },

  {
    id: 'lex_water',
    category: 'dining',
    type: 'word',
    translations: {
      ar: 'ماء / مياه',
      en: 'Water',
      fr: 'Eau',
      es: 'Agua',
      de: 'Wasser',
      tr: 'Su',
      it: 'Acqua',
      ru: 'Вода (Voda)',
      zh: '水 (Shuǐ)',
      ja: '水 (Mizu)',
    },
    synonyms: {
      ar: ['مياه', 'سائل الحياة', 'غيث', 'شراب'],
      en: ['H2O', 'Aqua', 'Liquid', 'Fluid', 'Drinking water'],
      fr: ['Eau potable', 'Aqua', 'Boisson'],
      es: ['Agua potable', 'Líquido vital'],
      de: ['Trinkwasser', 'Mineralwasser'],
      tr: ['İçme suyu', 'Kevser'],
    },
    antonyms: {
      ar: ['عطش', 'ظمأ', 'جفاف', 'قحط'],
      en: ['Thirst', 'Drought', 'Dehydration', 'Aridity'],
      fr: ['Soif', 'Sécheresse', 'Aridité'],
      es: ['Sed', 'Sequía', 'Aridez'],
      de: ['Durst', 'Trockenheit', 'Dürre'],
      tr: ['Susuzluk', 'Kuraklık', 'Kıtlık'],
    },
    bilingualExplanation: {
      ar: 'السائل الشفاف الأساسي للحياة عديم اللون والرائحة، وهو شريان بقاء الكائنات الحية.',
      en: 'A transparent, odorless, tasteless liquid forming the seas, lakes, rivers, and rain, essential for all living organisms.',
      grammar: 'Uncountable Noun (اسم جنس لا يُعد)',
    },
    exampleSentence: {
      ar: 'شرب كمية كافية من الماء يومياً ضروري للحفاظ على صحة الجسم.',
      en: 'Drinking sufficient water daily is essential for maintaining good body health.',
    },
  },

  {
    id: 'lex_rich_poor',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'غني / ثري',
      en: 'Rich / Wealthy',
      fr: 'Riche',
      es: 'Rico / Adinerado',
      de: 'Reich / Wohlhabend',
      tr: 'Zengin / Varlıklı',
      it: 'Ricco',
      ru: 'Богатый',
      zh: '富有 (Fùyǒu)',
      ja: '金持ち (Kanemochi)',
    },
    synonyms: {
      ar: ['ثري', 'مقتدر', 'موسر', 'كثير المال', 'منعم'],
      en: ['Wealthy', 'Affluent', 'Prosperous', 'Well-off', 'Opulent'],
      fr: ['Aisé', 'Fortuné', 'Prospère'],
      es: ['Acaudalado', 'Próspero', 'Pudiente'],
      de: ['Vermögend', 'Begütert', 'Wohlhabend'],
      tr: ['Varlıklı', 'Paralı', 'Müreffeh'],
    },
    antonyms: {
      ar: ['فقير', 'محتاج', 'معدم', 'مسكين', 'معسر'],
      en: ['Poor', 'Impoverished', 'Destitute', 'Needy', 'Penniless'],
      fr: ['Pauvre', 'Démuni', 'Misérable'],
      es: ['Pobre', 'Indigente', 'Necesitado'],
      de: ['Arm', 'Mittellos', 'Bedürftig'],
      tr: ['Fakir', 'Yoksul', 'Muhtaç'],
    },
    bilingualExplanation: {
      ar: 'صفة تُطلق على من يملك وفرة من المال أو الموارد، أو على الشيء الغني بالقيم والمعارف.',
      en: 'Having a great deal of money, assets, or natural resources; prosperous.',
      grammar: 'Adjective of state (صفة هيئة ومقدار)',
    },
    exampleSentence: {
      ar: 'الغنى الحقيقي هو غنى النفس والروح والقيم الكريمة.',
      en: 'True richness lies in the contentment of soul, spirit, and noble values.',
    },
  },

  {
    id: 'lex_easy_hard',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'سهل / يسير',
      en: 'Easy / Simple',
      fr: 'Facile / Simple',
      es: 'Fácil / Sencillo',
      de: 'Einfach / Leicht',
      tr: 'Kolay / Basit',
      it: 'Facile',
      ru: 'Легкий / Простой',
      zh: '容易 (Róngyì)',
      ja: '簡単 (Kantan)',
    },
    synonyms: {
      ar: ['يسير', 'بسيط', 'هين', 'سلس', 'ميسر'],
      en: ['Simple', 'Effortless', 'Straightforward', 'Uncomplicated', 'Smooth'],
      fr: ['Aisé', 'Élémentaire', 'Fluide'],
      es: ['Sencillo', 'Accesible', 'Claro'],
      de: ['Mühelos', 'Unkompliziert', 'Klar'],
      tr: ['Zahmetsiz', 'Anlaşılır', 'Yalın'],
    },
    antonyms: {
      ar: ['صعب', 'عسير', 'معقد', 'شاق', 'مستعصٍ'],
      en: ['Hard', 'Difficult', 'Challenging', 'Complex', 'Tough', 'Arduous'],
      fr: ['Difficile', 'Compliqué', 'Pénible'],
      es: ['Difícil', 'Complicado', 'Duro'],
      de: ['Schwer', 'Schwierig', 'Kompliziert'],
      tr: ['Zor', 'Güç', 'Karmaşık'],
    },
    bilingualExplanation: {
      ar: 'صفة لما لا يتطلب جهداً كبيراً أو مشقة في أدائه أو فهمه.',
      en: 'Achieved without great effort; presenting few or no difficulties.',
      grammar: 'Adjective of difficulty (صفة درجة وسهولة)',
    },
    exampleSentence: {
      ar: 'هذا التطبيق يجعل الترجمة وتعلّم اللغات أمراً سهلاً وممتعاً.',
      en: 'This app makes translation and language learning easy and delightful.',
    },
  },

  {
    id: 'lex_hot_cold',
    category: 'traits_emotions',
    type: 'word',
    translations: {
      ar: 'حار / ساخن',
      en: 'Hot / Warm',
      fr: 'Chaud',
      es: 'Caliente / Cálido',
      de: 'Heiß / Warm',
      tr: 'Sıcak',
      it: 'Caldo',
      ru: 'Горячий / Жаркий',
      zh: '热 (Rè)',
      ja: '熱い / 暑い (Atsui)',
    },
    synonyms: {
      ar: ['ساخن', 'دافئ', 'ملتهب', 'شديد الحرارة'],
      en: ['Warm', 'Boiling', 'Scorching', 'Fiery', 'Heated'],
      fr: ['Bouillant', 'Brûlant', 'Chaleureux'],
      es: ['Ardiente', 'Templado', 'Caluroso'],
      de: ['Kochend', 'Glühend', 'Erwärmt'],
      tr: ['Kaynar', 'Ilık', 'Kavurucu'],
    },
    antonyms: {
      ar: ['بارد', 'مثلج', 'قارص', 'جليدي'],
      en: ['Cold', 'Freezing', 'Chilly', 'Icy', 'Cool', 'Frosty'],
      fr: ['Froid', 'Glacial', 'Frais'],
      es: ['Frío', 'Helado', 'Gélido'],
      de: ['Kalt', 'Eisig', 'Frostig'],
      tr: ['Soğuk', 'Buz gibi', 'Serin'],
    },
    bilingualExplanation: {
      ar: 'صفة للحرارة العالية سواء في الطقس أو السوائل أو الطعام.',
      en: 'Having a high degree of heat or a high temperature.',
      grammar: 'Adjective of temperature (صفة حرارية)',
    },
    exampleSentence: {
      ar: 'أفضل شرب الشاي الساخن في أيام الشتاء الباردة.',
      en: 'I prefer drinking hot tea during cold winter days.',
    },
  },

  {
    id: 'lex_hotel',
    category: 'hotels',
    type: 'word',
    translations: {
      ar: 'فندق / نُزُل',
      en: 'Hotel',
      fr: 'Hôtel',
      es: 'Hotel',
      de: 'Hotel',
      tr: 'Otel',
      it: 'Hotel / Albergo',
      ru: 'Отель / Гостиница',
      zh: '酒店 (Jiǔdiàn)',
      ja: 'ホテル (Hoteru)',
    },
    synonyms: {
      ar: ['نُزُل', 'مكان إقامة', 'منتجع', 'ضيافة'],
      en: ['Inn', 'Lodge', 'Resort', 'Accommodation', 'Hostel'],
      fr: ['Auberge', 'Gîte', 'Résidence'],
      es: ['Hospedaje', 'Posada', 'Alojamiento'],
      de: ['Gasthof', 'Herberge', 'Unterkunft'],
      tr: ['Pansiyon', 'Konaklama yeri', 'Han'],
    },
    antonyms: {
      ar: ['منزل دائم / موطن أصلي'],
      en: ['Permanent home', 'Permanent residence'],
    },
    bilingualExplanation: {
      ar: 'مؤسسة تجارية توفر غرف نوم وإقامة وخدمات طعام للضيوف والمسافرين والسياح.',
      en: 'An establishment providing accommodation, meals, and other services for travelers and tourists.',
      grammar: 'Noun of place (اسم مكان / مرفق سياحي)',
    },
    exampleSentence: {
      ar: 'حجزنا غرفة مريحة في فندق هادئ بالقرب من شاطئ البحر.',
      en: 'We booked a cozy room in a quiet hotel near the seaside.',
    },
  },

  {
    id: 'lex_airport_hub',
    category: 'travel',
    type: 'word',
    translations: {
      ar: 'مطار / ميناء جوي',
      en: 'Airport',
      fr: 'Aéroport',
      es: 'Aeropuerto',
      de: 'Flughafen',
      tr: 'Havalimanı',
      it: 'Aeroporto',
      ru: 'Аэропорт',
      zh: '机场 (Jīchǎng)',
      ja: '空港 (Kūkō)',
    },
    synonyms: {
      ar: ['ميناء جوي', 'محطة طيران', 'مهبط طائرات'],
      en: ['Airfield', 'Aerodrome', 'Air terminal', 'Airstrip'],
      fr: ['Aérodrome', 'Gare aérienne'],
      es: ['Aeródromo', 'Terminal aérea'],
      de: ['Flugplatz', 'Airport'],
      tr: ['Havaalanı', 'Hava meydanı'],
    },
    antonyms: {
      ar: ['ميناء بحري', 'محطة قطار برية'],
      en: ['Seaport', 'Train station'],
    },
    bilingualExplanation: {
      ar: 'مكان مجهز بمدرجات ومرافق مخصصة لإقلاع وهبوط الطائرات واستقبال المسافرين وشحن البضائع.',
      en: 'A complex of runways and buildings for the takeoff, landing, and maintenance of aircraft, with facilities for passengers.',
      grammar: 'Compound Noun of location (اسم مكان جوي)',
    },
    exampleSentence: {
      ar: 'وصلنا إلى المطار قبل ساعتين من موعد إقلاع الرحلة الدولية.',
      en: 'We arrived at the airport two hours before the international flight departure.',
    },
  },
];

// Arabic text normalizer
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove harakat/tashkeel/tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[؟?.,!؛:،"']/g, '')
    .trim()
    .toLowerCase();
}

// General text normalizer
export function normalizeGeneral(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[؟?.,!؛:،"']/g, '')
    .trim();
}

// High-accuracy tiered lookup for words and phrases in the lexicon
export function findLexiconMatch(query: string, langHint?: string): LexiconEntry | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const normGen = normalizeGeneral(trimmed);
  const normAr = normalizeArabic(trimmed);

  // Pass 1: Exact string match on full translation
  for (const item of COMPREHENSIVE_LEXICON) {
    for (const val of Object.values(item.translations)) {
      if (val.toLowerCase() === normGen || normalizeArabic(val) === normAr) {
        return item;
      }
      // Check slash-separated parts (e.g. "ماء / مياه", "Hello / Hi")
      const parts = val.split('/').map((p) => p.trim());
      for (const part of parts) {
        if (
          part.toLowerCase() === normGen ||
          normalizeGeneral(part) === normGen ||
          normalizeArabic(part) === normAr
        ) {
          return item;
        }
      }
    }
  }

  // Pass 2: Exact match on synonyms
  for (const item of COMPREHENSIVE_LEXICON) {
    if (item.synonyms) {
      for (const synList of Object.values(item.synonyms)) {
        for (const s of synList) {
          if (
            s.toLowerCase() === normGen ||
            normalizeGeneral(s) === normGen ||
            normalizeArabic(s) === normAr
          ) {
            return item;
          }
        }
      }
    }
  }

  // Pass 3: Exact match on antonyms
  for (const item of COMPREHENSIVE_LEXICON) {
    if (item.antonyms) {
      for (const antList of Object.values(item.antonyms)) {
        for (const a of antList) {
          if (
            a.toLowerCase() === normGen ||
            normalizeGeneral(a) === normGen ||
            normalizeArabic(a) === normAr
          ) {
            return item;
          }
        }
      }
    }
  }

  // Pass 4: Word boundary / containment for longer phrases (> 3 letters)
  if (normGen.length >= 4 || normAr.length >= 3) {
    for (const item of COMPREHENSIVE_LEXICON) {
      for (const val of Object.values(item.translations)) {
        const vGen = normalizeGeneral(val);
        const vAr = normalizeArabic(val);
        if (
          (vGen.length > 3 && (vGen === normGen || vGen.startsWith(normGen) || normGen.startsWith(vGen))) ||
          (vAr.length > 2 && (vAr === normAr || vAr.startsWith(normAr) || normAr.startsWith(vAr)))
        ) {
          return item;
        }
      }
    }
  }

  return null;
}

// Generate rich linguistic breakdown for a translated word/phrase
export function getLinguisticEnrichment(text: string, sourceLang: string, targetLang: string) {
  const match = findLexiconMatch(text);

  if (match) {
    const srcSyns =
      (match.synonyms && match.synonyms[sourceLang]) ||
      match.synonyms?.en ||
      match.synonyms?.ar ||
      [];
    const tgtSyns =
      (match.synonyms && match.synonyms[targetLang]) ||
      match.synonyms?.ar ||
      match.synonyms?.en ||
      [];

    const srcAnts =
      (match.antonyms && match.antonyms[sourceLang]) ||
      match.antonyms?.en ||
      match.antonyms?.ar ||
      [];
    const tgtAnts =
      (match.antonyms && match.antonyms[targetLang]) ||
      match.antonyms?.ar ||
      match.antonyms?.en ||
      [];

    return {
      synonyms: {
        sourceLang: srcSyns.slice(0, 5),
        targetLang: tgtSyns.slice(0, 5),
      },
      antonyms: {
        sourceLang: srcAnts.slice(0, 5),
        targetLang: tgtAnts.slice(0, 5),
      },
      bilingualExplanation: {
        sourceLangExplanation:
          match.bilingualExplanation?.en ||
          'Lexicographical context and definition for this term.',
        targetLangExplanation:
          match.bilingualExplanation?.ar || 'شرح وتوضيح المعنى والسياق اللغوي للعبارة.',
        grammaticalContext:
          match.bilingualExplanation?.grammar || 'صيغة نحوية ومفردة لغوية',
      },
      exampleSentences: match.exampleSentence
        ? [
            {
              source: match.exampleSentence.en || '',
              translated: match.exampleSentence.ar || '',
            },
          ]
        : [],
    };
  }

  // Fallback default structure
  return {
    synonyms: {
      sourceLang: [],
      targetLang: [],
    },
    antonyms: {
      sourceLang: [],
      targetLang: [],
    },
    bilingualExplanation: {
      sourceLangExplanation: `Contextual meaning and usage of "${text}" in everyday communication.`,
      targetLangExplanation: `شرح وتوضيح استخدام وتركيب العبارة سياقياً في الجمل والحديث اليومي.`,
      grammaticalContext: 'تعبير لغوي / مفردة',
    },
    exampleSentences: [],
  };
}
