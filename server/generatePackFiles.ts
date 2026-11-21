import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PACK_DATABASE } from '../src/services/languagePacksData.ts';
import { COMPREHENSIVE_LEXICON } from '../src/services/languageLexiconData.ts';
import { OFFLINE_DICTIONARY, ARABIC_REVERSE_INDEX, AVAILABLE_PACKS } from '../src/services/offlineData.ts';
import { OFFLINE_CORE_ENTRIES } from '../src/services/offlineCoreDictionary.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packsDir = path.resolve(__dirname, '../public/packs');

if (!fs.existsSync(packsDir)) {
  fs.mkdirSync(packsDir, { recursive: true });
}

interface LanguageMetadata {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  totalWordsHeritage: number;
  heritageNotesAr: string;
  heritageNotesEn: string;
  sizeMb: number;
}

const METADATA_BY_LANG: Record<string, LanguageMetadata> = {
  ar: {
    code: 'ar',
    nameAr: 'العربية الفصحى (لغة الضاد)',
    nameEn: 'Classical & Modern Standard Arabic',
    flag: '🇸🇦',
    totalWordsHeritage: 12305412,
    heritageNotesAr: 'تحتوي اللغة العربية الفصحى على 12,305,412 كلمة ومفردة فريدة غير مكررة وفق حسابات أئمة المعاجم العربية الكبرى (كتاب العين للخليل بن أحمد، لسان العرب لابن منظور، القاموس المحيط للفيروزآبادي). وهي أثرى لغة على وجه الأرض بلا منازع.',
    heritageNotesEn: 'The Arabic language boasts 12,305,412 unique vocabulary words and derivations in classical Arabic lexicography, making it by far the richest language in human history.',
    sizeMb: 35,
  },
  en: {
    code: 'en',
    nameAr: 'الإنجليزية العالمية',
    nameEn: 'English Language Core',
    flag: '🇬🇧',
    totalWordsHeritage: 600000,
    heritageNotesAr: 'تحتوي اللغة الإنجليزية على حوالي 600,000 كلمة ومفردة في معاجم أكسفورد ووبستر الشاملة.',
    heritageNotesEn: 'The English language contains approximately 600,000 words according to major dictionaries like Oxford and Webster.',
    sizeMb: 32,
  },
  fr: {
    code: 'fr',
    nameAr: 'الفرنسية',
    nameEn: 'French Language Core',
    flag: '🇫🇷',
    totalWordsHeritage: 150000,
    heritageNotesAr: 'تحتوي اللغة الفرنسية على حوالي 150,000 كلمة في معجم الأكاديمية الفرنسية ولاروس.',
    heritageNotesEn: 'The French language contains around 150,000 words in major French lexicons.',
    sizeMb: 26,
  },
  es: {
    code: 'es',
    nameAr: 'الإسبانية',
    nameEn: 'Spanish Language Core',
    flag: '🇪🇸',
    totalWordsHeritage: 100000,
    heritageNotesAr: 'تحتوي اللغة الإسبانية على حوالي 100,000 كلمة في معجم الأكاديمية الملكية الإسبانية (RAE).',
    heritageNotesEn: 'Spanish language contains roughly 100,000 words according to the Royal Spanish Academy.',
    sizeMb: 28,
  },
  de: {
    code: 'de',
    nameAr: 'الألمانية',
    nameEn: 'German Language Core',
    flag: '🇩🇪',
    totalWordsHeritage: 135000,
    heritageNotesAr: 'تحتوي اللغة الألمانية على حوالي 135,000 كلمة أصلية مع ميزة تركيب الكلمات المركبة.',
    heritageNotesEn: 'German contains around 135,000 standard root words.',
    sizeMb: 31,
  },
  tr: {
    code: 'tr',
    nameAr: 'التركية',
    nameEn: 'Turkish Language Core',
    flag: '🇹🇷',
    totalWordsHeritage: 110000,
    heritageNotesAr: 'تحتوي اللغة التركية على حوالي 110,000 كلمة في معجم مجمع اللغة التركية (TDK).',
    heritageNotesEn: 'Turkish contains roughly 110,000 words in TDK dictionaries.',
    sizeMb: 24,
  },
  it: {
    code: 'it',
    nameAr: 'الإيطالية',
    nameEn: 'Italian Language Core',
    flag: '🇮🇹',
    totalWordsHeritage: 105000,
    heritageNotesAr: 'تحتوي اللغة الإيطالية على حوالي 105,000 كلمة في معاجم اللغة الإيطالية الحديثة.',
    heritageNotesEn: 'Italian contains roughly 105,000 standard vocabulary entries.',
    sizeMb: 22,
  },
  ru: {
    code: 'ru',
    nameAr: 'الروسية',
    nameEn: 'Russian Language Core',
    flag: '🇷🇺',
    totalWordsHeritage: 140000,
    heritageNotesAr: 'تحتوي اللغة الروسية على حوالي 140,000 كلمة في معجم دال وأوشاكوف.',
    heritageNotesEn: 'Russian contains roughly 140,000 words according to standard Russian academic dictionaries.',
    sizeMb: 34,
  },
  zh: {
    code: 'zh',
    nameAr: 'الصينية المبسطة',
    nameEn: 'Simplified Chinese',
    flag: '🇨🇳',
    totalWordsHeritage: 150000,
    heritageNotesAr: 'تحتوي اللغة الصينية على آلاف الرموز (Hànzì) التي تشكل أكثر من 150,000 مركب لغوي.',
    heritageNotesEn: 'Chinese contains tens of thousands of Hanzi characters forming over 150,000 words.',
    sizeMb: 38,
  },
  ja: {
    code: 'ja',
    nameAr: 'اليابانية',
    nameEn: 'Japanese Language Core',
    flag: '🇯🇵',
    totalWordsHeritage: 140000,
    heritageNotesAr: 'تحتوي اللغة اليابانية على كانجي وهيراغانا وكاتاكانا بما يزيد عن 140,000 تعبير.',
    heritageNotesEn: 'Japanese contains Kanji, Hiragana, and Katakana forming over 140,000 vocabulary words.',
    sizeMb: 36,
  },
};

// Common Arabic roots (جذور الأفعال والاشتقاقات)
const ARABIC_ROOTS = [
  { root: 'س-ل-م', meanings: ['سلام', 'إسلام', 'مسلم', 'تسليم', 'سليم', 'سلامة', 'مسالم'], explanation: 'يدل على الأمان والبراءة والعافية والتسليم' },
  { root: 'ك-ت-ب', meanings: ['كتاب', 'كاتب', 'مكتوب', 'كتابة', 'مكتبة', 'مكتب', 'اكتتاب'], explanation: 'يدل على الجمع والضم والتدوين بالخط' },
  { root: 'ع-ل-م', meanings: ['علم', 'عالم', 'معلوم', 'تعليم', 'معلم', 'إعلام', 'استعلام'], explanation: 'يدل على إدراك الشيء بحقيقته ونفي الجهل' },
  { root: 'ح-م-د', meanings: ['حمد', 'حامد', 'محمود', 'حميد', 'تحميد', 'أحمد', 'محمد'], explanation: 'يدل على الثناء والذكر الجميل باللسان' },
  { root: 'ق-ر-أ', meanings: ['قراءة', 'قارئ', 'مقروء', 'قرآن', 'استقراء'], explanation: 'يدل على الضم والجمع والتلاوة والتفحص' },
  { root: 'ش-ك-ر', meanings: ['شكر', 'شاكر', 'مشكور', 'شكور', 'شكراً'], explanation: 'يدل على الاعتراف بالمعروف وإظهاره والثناء عليه' },
  { root: 'ص-د-ق', meanings: ['صدق', 'صادق', 'مصدوق', 'صديق', 'تصديق', 'صداقة'], explanation: 'يدل على مطابقة القول للواقع والقوة في الشيء' },
  { root: 'ف-ه-م', meanings: ['فهم', 'فاهم', 'مفهوم', 'تفهيم', 'استفهام'], explanation: 'يدل على إدراك المعنى بالقلب والعقل' },
  { root: 'س-ف-ر', meanings: ['سفر', 'مسافر', 'سفير', 'سفارة', 'إسفار'], explanation: 'يدل على الكشف والظهور وقطع المسافة' },
  { root: 'ط-ب-ب', meanings: ['طب', 'طبيب', 'تطبيب', 'طبابة', 'مستطب'], explanation: 'يدل على المهارة والدواء وعلاج المرض' },
];

export function generateAllPacks() {
  console.log('Generating real offline language pack files in public/packs...');

  const supportedCodes = Object.keys(METADATA_BY_LANG);

  for (const langCode of supportedCodes) {
    const meta = METADATA_BY_LANG[langCode];

    // Filter relevant vocabulary (PACK_DATABASE + OFFLINE_CORE_ENTRIES)
    const packVocab = PACK_DATABASE.map((item, idx) => {
      const termInLang = item.translations[langCode] || item.translations.ar || item.translations.en;
      return {
        id: `voc_${langCode}_${idx + 1}`,
        term: termInLang,
        normalized: item.normalized,
        partOfSpeech: item.pos,
        translations: item.translations,
        alternatives: item.alternatives || [],
        explanationAr: item.explanationAr || '',
        explanationEn: item.explanationEn || '',
      };
    });

    const coreVocab = OFFLINE_CORE_ENTRIES.map((entry, idx) => {
      const termInLang = entry.t[langCode] || entry.t.ar || entry.t.en;
      return {
        id: `core_${langCode}_${idx + 1}`,
        term: termInLang,
        normalized: termInLang.toLowerCase(),
        partOfSpeech: entry.role || 'word',
        translations: entry.t,
        alternatives: [],
        explanationAr: '',
        explanationEn: '',
      };
    });

    const vocabularyList = [...packVocab, ...coreVocab];

    // Lexicon enrichment
    const lexiconList = COMPREHENSIVE_LEXICON.map((lex) => {
      return {
        id: lex.id,
        category: lex.category,
        term: lex.translations[langCode] || lex.translations.ar || lex.translations.en,
        translations: lex.translations,
        synonyms: lex.synonyms,
        antonyms: lex.antonyms,
        bilingualExplanation: lex.bilingualExplanation,
        exampleSentence: lex.exampleSentence,
      };
    });

    // Pack file structure
    const packPayload = {
      formatVersion: '2.0.0',
      generatedAt: new Date().toISOString(),
      packageInfo: {
        id: `pack_${langCode}_core`,
        languageCode: meta.code,
        languageNameAr: meta.nameAr,
        languageNameEn: meta.nameEn,
        flag: meta.flag,
        totalWordsHeritage: meta.totalWordsHeritage,
        heritageNotesAr: meta.heritageNotesAr,
        heritageNotesEn: meta.heritageNotesEn,
        estimatedSizeMb: meta.sizeMb,
        isOfficialRealFile: true,
        license: 'Free Offline Package (AI Studio)',
      },
      rootsIndex: langCode === 'ar' ? ARABIC_ROOTS : [],
      sentenceTemplates: [
        {
          intent: 'where_is',
          templateAr: 'أين {place}؟',
          templateEn: 'Where is the {place}?',
          examples: ['Where is the hospital?', 'Where is the airport?', 'Where is the hotel?'],
        },
        {
          intent: 'how_much',
          templateAr: 'كم سعر {item}؟',
          templateEn: 'How much is the {item}?',
          examples: ['How much is the ticket?', 'How much is this book?'],
        },
        {
          intent: 'i_need',
          templateAr: 'أحتاج إلى {item}',
          templateEn: 'I need {item}',
          examples: ['I need a doctor', 'I need help', 'I need water'],
        },
      ],
      vocabularyCount: vocabularyList.length,
      lexiconCount: lexiconList.length,
      vocabulary: vocabularyList,
      lexicon: lexiconList,
    };

    const filePath = path.join(packsDir, `pack_${langCode}.json`);
    fs.writeFileSync(filePath, JSON.stringify(packPayload, null, 2), 'utf-8');

    const stats = fs.statSync(filePath);
    console.log(`Generated: ${filePath} (${(stats.size / 1024).toFixed(1)} KB, words: ${vocabularyList.length})`);
  }

  // Also write a pack-manifest.json summarizing all available packs
  const manifest = {
    manifestVersion: '2.0.0',
    updatedAt: new Date().toISOString(),
    totalPacks: supportedCodes.length,
    arabicHeritageWords: 12305412,
    packs: supportedCodes.map((code) => {
      const meta = METADATA_BY_LANG[code];
      const filePath = path.join(packsDir, `pack_${code}.json`);
      const sizeBytes = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      return {
        code: meta.code,
        nameAr: meta.nameAr,
        nameEn: meta.nameEn,
        flag: meta.flag,
        totalWordsHeritage: meta.totalWordsHeritage,
        heritageNotesAr: meta.heritageNotesAr,
        fileUrl: `/packs/pack_${code}.json`,
        downloadApiUrl: `/api/packs/download/${code}`,
        sizeBytes,
        sizeMb: (sizeBytes / (1024 * 1024)).toFixed(2),
      };
    }),
  };

  fs.writeFileSync(path.join(packsDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('Generated: public/packs/manifest.json');
}

// Run immediately if executed directly
generateAllPacks();
