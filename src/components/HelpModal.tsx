import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Smartphone,
  WifiOff,
  Camera,
  Tv,
  Languages,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'text' | 'camera' | 'video' | 'screen' | 'grammar' | 'packs') => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const guides = [
    {
      icon: <Smartphone className="w-5 h-5 text-cyan-400" />,
      title: '1. كرة الترجمة العائمة لترجمة أي شيء في الهاتف',
      steps: [
        'تظهر كرة الترجمة كدائرة ذكية طافية على شاشة الهاتف الرئيسية فوق جميع التطبيقات (واتساب، تويتر، تليغرام، المتصفح).',
        'اسحب الكرة بيدك وضعها مباشرة فوق أي نص أو رسالة أجنبية لتظهر لك الترجمة فوراً في نافذة منبثقة سريعة دون مغادرة التطبيق.',
        'انقر على الكرة في أي وقت لاختيار "ترجمة كامل الشاشة"، حيث تُستبدل جميع النصوص الأجنبية في الشاشة بلغة عربية سلسة.',
      ],
      actionTab: 'screen' as const,
      actionLabel: 'تجربة محاكي الكرة العائمة الآن',
    },
    {
      icon: <WifiOff className="w-5 h-5 text-amber-400" />,
      title: '2. التشغيل بدون إنترنت (Offline Mode) وتنزيل الحزم مجاناً',
      steps: [
        'توجه إلى قسم "حزم الأوفلاين" واضغط على "تنزيل مجاني" للغة التي ترغب بها (مثل الإنجليزية، الفرنسية، الألمانية).',
        'تُحفظ الحزمة في ذاكرة جهازك لتعمل دائماً بسرعة فائقة دون استهلاك أي باقة إنترنت أو تجوال أثناء السفر.',
        'يمكنك تفعيل زر "وضع بدون نت" يدوياً من الشريط العلوي في أي وقت حتى مع وجود الإنترنت، لضمان السرعة وتوفير البيانات.',
      ],
      actionTab: 'packs' as const,
      actionLabel: 'تنزيل حزم اللغات المجانية',
    },
    {
      icon: <Camera className="w-5 h-5 text-blue-400" />,
      title: '3. ترجمة الصور، القوائم، والمستندات بالكاميرا',
      steps: [
        'افتح تبويب "ترجمة الصور والكاميرا"، وقم بتشغيل الكاميرا المباشرة أو ارفع أي صورة من جهازك.',
        'يدعم التطبيق ميزة "الواقع المعزز (AR)": حيث يقوم بوضع بطاقات الترجمة في نفس إحداثيات ومكان النصوص فوق الصورة الأصلية.',
        'يمكنك نسخ النصوص المترجمة أو الاستماع لنطقها الصوتي بضغطة زر واحدة.',
      ],
      actionTab: 'camera' as const,
      actionLabel: 'فتح ترجمة الكاميرا والصور',
    },
    {
      icon: <Tv className="w-5 h-5 text-indigo-400" />,
      title: '4. ترجمة الفيديوهات والمسلسلات الحية مع الترجمة المزدوجة',
      steps: [
        'اختر أحد المسلسلات التجريبية أو ارفع فيديو من جهازك (MP4 / WebM).',
        'تظهر الترجمة السينمائية المزدوجة أسفل الفيديو متزامنة مع حوارات الشخصيات ثانية بثانية.',
        'يمكنك النقر على أي سطر في شريط السيناريو الجانبي للقفز المباشر لتلك اللحظة، وتصدير ملف الترجمة الكامل بصيغة (.SRT).',
      ],
      actionTab: 'video' as const,
      actionLabel: 'مشاهدة وترجمة المسلسلات',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
      title: '5. قواعد وتعلّم اللغات العالمية والاختبارات التفاعلية',
      steps: [
        'ادخل إلى قسم "قواعد وتعلّم اللغات" واختر اللغة التي تود تعلّمها (الإنجليزية، الفرنسية، الألمانية، الإسبانية، التركية).',
        'تعلّم الأزمنة، تركيب الجمل، والأفعال الشائعة مع أمثلة صوتية ناطقة وشرح بالعربية.',
        'اختبر مهاراتك من خلال "اختبار القواعد التفاعلي" للحصول على تقييم وتصحيح فوري لإجاباتك.',
      ],
      actionTab: 'grammar' as const,
      actionLabel: 'استكشاف قواعد وتعلّم اللغات',
    },
  ];

  const faqs = [
    {
      q: 'هل حزم اللغات بدون إنترنت مجانية حقاً؟',
      a: 'نعم، جميع حزم اللغات (الإنجليزية، الفرنسية، الإسبانية، الألمانية، التركية، وغيرها) مجانية 100% ويتم تنزيلها وتخزينها محلياً على جهازك لتعمل دون أي اتصال بالإنترنت.',
    },
    {
      q: 'كيف يمكنني تشغيل التطبيق بدون نت حتى عندما يكون الإنترنت متاحاً؟',
      a: 'يمكنك النقر على زر "وضع بدون نت: مفعّل" في أعلى شريط التطبيق لتفعيل وضع الأوفلاين القسري، للاستمتاع بالسرعة القصوى وحماية رصيد باقة بياناتك.',
    },
    {
      q: 'كيف أغيّر لغة واجهة التطبيق واتجاه النصوص (RTL / LTR)؟',
      a: 'افتح أيقونة الإعدادات (⚙️) في الشريط العلوي واختر لغتك المفضلة (العربية، الإنجليزية، الفرنسية، الإسبانية، الألمانية، التركية)، وسيقوم التطبيق بضبط الاتجاه تلقائياً.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-cyan-600/20 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-white">المساعدة ودليل الاستخدام الشامل</h3>
              <p className="text-xs text-slate-400">كل ما تحتاج لمعرفته حول استخدام ميزات ترجمان بلس</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Guides */}
        <div className="space-y-4">
          {guides.map((guide, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <span className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  {guide.icon}
                </span>
                <span>{guide.title}</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed pr-2">
                {guide.steps.map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab(guide.actionTab);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-600 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{guide.actionLabel}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span>الأسئلة الشائعة (FAQ)</span>
          </h4>

          <div className="space-y-2">
            {faqs.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="w-full p-3.5 flex items-center justify-between text-right text-xs font-bold text-white hover:bg-slate-850 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-3.5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-850">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
