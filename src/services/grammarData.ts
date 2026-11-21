// Grammar Lessons, Verb Tenses, and Learning Quizzes Database
export interface GrammarLesson {
  id: string;
  title: string;
  titleEn: string;
  category: 'tenses' | 'structure' | 'verbs' | 'conversation';
  level: 'مبتدئ (A1-A2)' | 'متوسط (B1-B2)' | 'متقدم (C1)';
  summary: string;
  formula?: string;
  explanation: string;
  examples: Array<{
    target: string;
    translation: string;
    note?: string;
  }>;
  keyTips: string[];
}

export interface QuizQuestion {
  id: string;
  language: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LanguageGrammarCourse {
  langCode: string;
  langNameAr: string;
  langNameNative: string;
  flag: string;
  lessons: GrammarLesson[];
  quizzes: QuizQuestion[];
}

export const GRAMMAR_COURSES: LanguageGrammarCourse[] = [
  {
    langCode: 'en',
    langNameAr: 'قواعد اللغة الإنجليزية',
    langNameNative: 'English Grammar',
    flag: '🇬🇧',
    lessons: [
      {
        id: 'en-pres-simple',
        title: 'المضارع البسيط (Present Simple)',
        titleEn: 'Present Simple Tense',
        category: 'tenses',
        level: 'مبتدئ (A1-A2)',
        summary: 'يُستخدم للتعبير عن الحقائق الثابتة، العادات والروتين اليومي.',
        formula: 'Subject + Verb (base / +s/es with he/she/it)',
        explanation: 'نضيف s أو es لنهاية الفعل مع الضمائر المفردة الغائبة (He, She, It)، بينما يبقى الفعل في صورته الأصلية مع (I, You, We, They). في النفي نستخدم do not / does not.',
        examples: [
          { target: 'I drink coffee every morning.', translation: 'أنا أشرب القهوة كل صباح.', note: 'عادة يومية' },
          { target: 'She works at a global tech company.', translation: 'هي تعمل في شركة تقنية عالمية.', note: 'حقيقة ثابتة (+s مع She)' },
          { target: 'The sun rises in the east.', translation: 'الشمس تشرق من الشرق.', note: 'حقيقة علمية' },
          { target: 'They do not speak French.', translation: 'هم لا يتحدثون الفرنسية.', note: 'صيغة النفي' },
        ],
        keyTips: [
          'استخدم كلمات الدلالة: always (دائماً), usually (عادةً), every day (كل يوم), often (غالباً).',
          'مع السؤال: ابدأ بـ Do أو Does (مثال: Does she work here?).',
        ],
      },
      {
        id: 'en-past-simple',
        title: 'الماضي البسيط (Past Simple)',
        titleEn: 'Past Simple Tense',
        category: 'tenses',
        level: 'مبتدئ (A1-A2)',
        summary: 'يُستخدم للتعبير عن أفعال حدثت وانتهت في وقت محدد في الماضي.',
        formula: 'Subject + Verb-2 (Regular: +ed / Irregular: changed)',
        explanation: 'الأفعال المنتظمة تأخذ ed في النهاية، بينما تحفظ الأفعال الشاذة (Irregular) مثل go -> went, see -> saw. في النفي والسؤال نستخدم did مع الفعل المجرد.',
        examples: [
          { target: 'We visited the British Museum yesterday.', translation: 'زرنا المتحف البريطاني أمس.', note: 'فعل منتظم (+ed)' },
          { target: 'He bought a new laptop last week.', translation: 'هو اشترى حاسوباً محمولاً جديداً الأسبوع الماضي.', note: 'فعل شاذ buy -> bought' },
          { target: 'I did not see the email.', translation: 'أنا لم أشاهد البريد الإلكتروني.', note: 'نفي باستخدام did not + مجرد' },
        ],
        keyTips: [
          'كلمات الدلالة: yesterday (أمس), last night/week (الليلة/الأسبوع الماضي), ago (منذ).',
          'انتبه: بعد Did لا تضع الفعل في الماضي أبداً بل في المصدر المجرد.',
        ],
      },
      {
        id: 'en-pres-cont',
        title: 'المضارع المستمر (Present Continuous)',
        titleEn: 'Present Continuous Tense',
        category: 'tenses',
        level: 'مبتدئ (A1-A2)',
        summary: 'يُستخدم للتعبير عن أحداث تقع في لحظة التحدث الآن أو خطط مؤكدة قادمة.',
        formula: 'Subject + am/is/are + Verb-ing',
        explanation: 'يتكون من فعل الكينونة be (am/is/are) متبوعاً بالفعل مضافاً إليه ing.',
        examples: [
          { target: 'She is learning Arabic right now.', translation: 'هي تتعلم اللغة العربية الآن.', note: 'حدث في لحظة التكلم' },
          { target: 'They are traveling to Tokyo tomorrow.', translation: 'هم يسافرون إلى طوكيو غداً.', note: 'خطة مستقبلية محددة' },
        ],
        keyTips: [
          'كلمات الدلالة: now (الآن), at the moment (في هذه اللحظة), currently (حالياً).',
        ],
      },
      {
        id: 'en-modals',
        title: 'الأفعال الناقصة للمساعدة والطلب (Can, Could, Would, Should)',
        titleEn: 'Modal Verbs for Politeness & Advice',
        category: 'structure',
        level: 'متوسط (B1-B2)',
        summary: 'تُستخدم للطلب بأدب، إعطاء النصائح، والتعبير عن الإمكانية والقدرة.',
        formula: 'Subject + Modal + Base Verb',
        explanation: 'الأفعال الناقصة لا تتغير أبداً مع الضمائر (لا نضع لها s)، ويليها دائماً فعل في المصدر بدون to.',
        examples: [
          { target: 'Could you please help me with the luggage?', translation: 'هل يمكنك من فضلك مساعدتي في الحقائب؟', note: 'طلب مؤدب جداً' },
          { target: 'You should download the offline dictionary before flying.', translation: 'يجب عليك تنزيل قاموس الأوفلاين قبل السفر جواً.', note: 'نصيحة هامة' },
          { target: 'Would you like some tea or water?', translation: 'هل تود بعض الشاي أو الماء؟', note: 'عرض ضيافة مهذب' },
        ],
        keyTips: [
          'Could أكثر أدباً ورسمية من Can عند طلب مساعدة من الغرباء.',
          'استخدم Should للنصيحة الودية و Must للضرورة الإلزامية.',
        ],
      },
    ],
    quizzes: [
      {
        id: 'q-en-1',
        language: 'en',
        question: 'Choose the correct form: "She _____ coffee every single morning."',
        options: ['drink', 'drinks', 'drinking', 'is drink'],
        correctIndex: 1,
        explanation: 'مع الفاعل المفرد الغائب (She) في زمن المضارع البسيط، نضيف حرف s لنهاية الفعل فتصبح drinks.',
      },
      {
        id: 'q-en-2',
        language: 'en',
        question: 'Complete the sentence: "We _____ to Spain for our vacation last summer."',
        options: ['go', 'went', 'gone', 'going'],
        correctIndex: 1,
        explanation: 'الزمن ماضي بسيط بدلالة last summer، والتصريف الثاني للفعل الشاذ go هو went.',
      },
      {
        id: 'q-en-3',
        language: 'en',
        question: 'Polite request: "_____ you please pass me the salt?"',
        options: ['Must', 'Could', 'Should', 'Shall'],
        correctIndex: 1,
        explanation: 'كلمة Could هي الصيغة الأكثر أدباً واحتراماً لطلب شيء في اللغة الإنجليزية.',
      },
    ],
  },
  {
    langCode: 'fr',
    langNameAr: 'قواعد اللغة الفرنسية',
    langNameNative: 'Grammaire Française',
    flag: '🇫🇷',
    lessons: [
      {
        id: 'fr-articles',
        title: 'أدوات التعريف والتنكير (Les Articles)',
        titleEn: 'Definite & Indefinite Articles',
        category: 'structure',
        level: 'مبتدئ (A1-A2)',
        summary: 'الأسماء في الفرنسية إما مذكرة أو مؤنثة، وتحدد الأداة نوع الاسم.',
        formula: 'المذكر: le / un • المؤنث: la / une • الجمع: les / des',
        explanation: 'نستخدم (le / la / l\' / les) للتعريف بمعنى (الـ)، ونستخدم (un / une / des) للتنكير.',
        examples: [
          { target: 'Le passeport et la valise', translation: 'جواز السفر والحقيبة', note: 'passeport مذكر، valise مؤنث' },
          { target: 'Un café et une eau minérale, s\'il vous plaît.', translation: 'قهوة واحدة وماء معدني، من فضلك.', note: 'أدوات تنكير للطلب' },
          { target: 'Les enfants jouent dans le parc.', translation: 'الأطفال يلعبون في الحديقة العامة.', note: 'أداة جمع les' },
        ],
        keyTips: [
          'الأسماء المنتهية بـ -tion أو -té تكون عادة مؤنثة (la nation, la liberté).',
          'إذا بدأ الاسم بحرف صوتي نختصر le/la إلى l\' مثل: l\'hôtel, l\'aéroport.',
        ],
      },
      {
        id: 'fr-present',
        title: 'زمن الحاضر للمجموعة الأولى (Le Présent - Verbes en -ER)',
        titleEn: 'Present Tense for -ER Verbs',
        category: 'tenses',
        level: 'مبتدئ (A1-A2)',
        summary: 'أكثر من 80% من أفعال الفرنسية تنتهي بـ ER وتتبع نمطاً تصريفياً منتظماً.',
        formula: 'نحذف er ونضيف: -e, -es, -e, -ons, -ez, -ent',
        explanation: 'لتصريف فعل مثل parler (يتحدث): Je parle, Tu parles, Il/Elle parle, Nous parlons, Vous parlez, Ils/Elles parlent.',
        examples: [
          { target: 'Je parle arabe et un peu français.', translation: 'أنا أتحدث العربية وقليلاً من الفرنسية.', note: 'تصريف مع Je' },
          { target: 'Vous habitez à Paris ?', translation: 'هل تسكنون في باريس؟', note: 'صيغة الاحترام مع Vous' },
        ],
        keyTips: [
          'النهايات -e, -es, -ent لا تُنطق في نهاية الفعل وتبقى صامتة صوتياً.',
        ],
      },
    ],
    quizzes: [
      {
        id: 'q-fr-1',
        language: 'fr',
        question: 'Choisissez l\'article correct pour "gare" (محطة قطار - اسم مؤنث):',
        options: ['Le gare', 'La gare', 'Un gare', 'Les gare'],
        correctIndex: 1,
        explanation: 'كلمة gare مؤنثة في الفرنسية، وأداة التعريف المؤنثة هي la.',
      },
      {
        id: 'q-fr-2',
        language: 'fr',
        question: 'Conjuguez le verbe: "Nous _____ (parler) français."',
        options: ['parle', 'parlez', 'parlons', 'parlent'],
        correctIndex: 2,
        explanation: 'مع الضمير Nous في زمن الحاضر، تأخذ أفعال المجموعة الأولى اللاحقة -ons فتصبح parlons.',
      },
    ],
  },
  {
    langCode: 'es',
    langNameAr: 'قواعد اللغة الإسبانية',
    langNameNative: 'Gramática Española',
    flag: '🇪🇸',
    lessons: [
      {
        id: 'es-ser-estar',
        title: 'الفرق الجوهري بين Ser و Estar (أفعال الكينونة)',
        titleEn: 'Ser vs. Estar',
        category: 'structure',
        level: 'مبتدئ (A1-A2)',
        summary: 'كلاهما يعني "يكون"، لكن Ser للخصائص الدائمة و Estar للحالات المؤقتة والمكان.',
        formula: 'Ser: الهوية، الأصل، الوقت • Estar: المكان، المشاعر، الحالة المتغيرة',
        explanation: 'نستخدم Ser لوصف الجنسية أو المهنة أو الوقت: Soy médico (أنا طبيب). ونستخدم Estar للمكان أو الحالة المزاجية: Estoy feliz (أنا سعيد حالياً)، Está en Madrid (هو في مدريد).',
        examples: [
          { target: 'Yo soy de Marruecos.', translation: 'أنا من المغرب.', note: 'الأصل والموطن (Ser)' },
          { target: '¿Dónde está la estación de tren?', translation: 'أين تقع محطة القطار؟', note: 'الموقع الجغرافي (Estar)' },
          { target: 'El café está muy caliente.', translation: 'القهوة ساخنة جداً.', note: 'حالة مؤقتة (Estar)' },
        ],
        keyTips: [
          'قاعدة سهلة: PLACE (Position, Location, Action, Condition, Emotion) = Estar.',
        ],
      },
    ],
    quizzes: [
      {
        id: 'q-es-1',
        language: 'es',
        question: 'Complete: "Madrid _____ la capital de España."',
        options: ['está', 'es', 'son', 'están'],
        correctIndex: 1,
        explanation: 'عاصمة دولة هي حقيقة ثابتة وجوهرية، لذلك نستخدم الفعل Ser (es) وليس Estar.',
      },
    ],
  },
  {
    langCode: 'de',
    langNameAr: 'قواعد اللغة الألمانية',
    langNameNative: 'Deutsche Grammatik',
    flag: '🇩🇪',
    lessons: [
      {
        id: 'de-v2',
        title: 'قاعدة الفعل في المركز الثاني (V2 Word Order Rule)',
        titleEn: 'Verb in Position 2',
        category: 'structure',
        level: 'مبتدئ (A1-A2)',
        summary: 'في الجمل الخبرية الألمانية الرئيسية، يجب أن يأتي الفعل المصرّف في المركز الثاني دائماً.',
        formula: 'Element 1 + Verb + Subject (if not 1) + Rest',
        explanation: 'مهما كان العنصر الذي تبدأ به الجملة (سواء كان الفاعل، أو ظرف زمان، أو ظرف مكان)، يجب أن يكون الفعل المصرف هو الكلمة الثانية مباشرة.',
        examples: [
          { target: 'Ich lerne heute Deutsch.', translation: 'أنا أتعلم الألمانية اليوم.', note: 'الفاعل في المركز 1 والفعل في 2' },
          { target: 'Heute lerne ich Deutsch.', translation: 'اليوم أتعلم أنا الألمانية.', note: 'الظرف في المركز 1 والفعل بقي في 2' },
        ],
        keyTips: [
          'تذكر دائماً: الفعل المصرّف ملك المركز الثاني في الجملة الألمانية الرئيسية.',
        ],
      },
    ],
    quizzes: [
      {
        id: 'q-de-1',
        language: 'de',
        question: 'Welcher Satz ist grammatikalisch korrekt? (أي جملة صحيحة قواعدياً؟):',
        options: [
          'Morgen ich fahre nach Berlin.',
          'Morgen fahre ich nach Berlin.',
          'Morgen fahre nach Berlin ich.',
          'Ich morgen fahre nach Berlin.',
        ],
        correctIndex: 1,
        explanation: 'وفقاً لقاعدة V2، بما أننا بدأنا بظرف الزمان Morgen (1)، يجب أن يأتي الفعل المصرف fahre في المركز الثاني (2).',
      },
    ],
  },
  {
    langCode: 'tr',
    langNameAr: 'قواعد اللغة التركية',
    langNameNative: 'Türkçe Dilbilgisi',
    flag: '🇹🇷',
    lessons: [
      {
        id: 'tr-vowel-harmony',
        title: 'التوافق الصوتي (Ünlü Uyumu)',
        titleEn: 'Vowel Harmony in Turkish',
        category: 'structure',
        level: 'مبتدئ (A1-A2)',
        summary: 'أساس اللغة التركية: ترتبط لواحق الكلمات بالصوت الثقيل (a, ı, o, u) أو الخفيف (e, i, ö, ü).',
        formula: 'الأصوات الثقيلة (a, ı, o, u) -> لاحقة ثقيلة • الأصوات الخفيفة (e, i, ö, ü) -> لاحقة خفيفة',
        explanation: 'التركية لغة لواحق متراصة (Agglutinative). لتحديد لاحقة الجمع مثلاً (-lar أو -ler)، ننظر إلى آخر حرف صوتي في الكلمة.',
        examples: [
          { target: 'Kitap -> Kitaplar', translation: 'كتاب -> كتب', note: 'آخر صوت a (ثقيل) يأخذ lar' },
          { target: 'Ev -> Evler', translation: 'منزل -> منازل', note: 'آخر صوت e (خفيف) يأخذ ler' },
          { target: 'Göz -> Gözler', translation: 'عين -> عيون', note: 'آخر صوت ö (خفيف) يأخذ ler' },
        ],
        keyTips: [
          'إذا انتهت الكلمة بحرف صوتي منقوط (e, i, ö, ü) فالأرجح أن لاحقتها تحتوي على e أو i.',
        ],
      },
    ],
    quizzes: [
      {
        id: 'q-tr-1',
        language: 'tr',
        question: '"Araba" (سيارة) kelimesinin çoğul hali hangisidir? (جمع كلمة Araba):',
        options: ['Arabaler', 'Arabalar', 'Arabas', 'Arabaları'],
        correctIndex: 1,
        explanation: 'آخر حرف صوتي في Araba هو a (حرف صوتي ثقيل)، لذلك لاحقة الجمع المناسبة هي -lar فتصبح Arabalar.',
      },
    ],
  },
];
