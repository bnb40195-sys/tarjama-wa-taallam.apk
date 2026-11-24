import React, { useState } from 'react';
import {
  Smartphone,
  Sparkles,
  MessageSquare,
  Twitter,
  FileText,
  Utensils,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  Send,
  PowerOff,
} from 'lucide-react';
import { executeTranslation, speakText } from '../services/translatorService.ts';
import { translateOffline } from '../services/offlineEngine.ts';
import {
  getExternalBallStatus,
  enableExternalFloatingBall,
  disableExternalFloatingBall,
  subscribeExternalBallChanged,
} from '../services/systemFloatingBall.ts';
import { useI18n } from '../services/i18nContext.tsx';

interface ScreenElement {
  id: string;
  originalText: string;
  translatedText: string;
  sender?: string;
  time?: string;
  isMe?: boolean;
}

export const ScreenTranslatorSim: React.FC<{ forceOffline: boolean }> = ({ forceOffline }) => {
  const { appLang, t } = useI18n();
  const s = t.screenTab;

  const [selectedApp, setSelectedApp] = useState<'chat' | 'social' | 'article' | 'menu'>('chat');
  const [isScreenTranslated, setIsScreenTranslated] = useState(false);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 260, y: 220 });
  const [isDraggingBall, setIsDraggingBall] = useState(false);
  const [ballMenuOpen, setBallMenuOpen] = useState(false);
  const [ballOrigin, setBallOrigin] = useState({ x: 0, y: 0 });
  const [ballMoved, setBallMoved] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [externalBallRunning, setExternalBallRunning] = useState(false);
  const [externalNotice, setExternalNotice] = useState<string | null>(null);

  React.useEffect(() => {
    const syncStatus = () => {
      getExternalBallStatus().then((st) => setExternalBallRunning(st.running));
    };
    syncStatus();
    const unsub = subscribeExternalBallChanged(syncStatus);
    window.addEventListener('focus', syncStatus);
    return () => {
      unsub();
      window.removeEventListener('focus', syncStatus);
    };
  }, []);

  // App 1: WhatsApp Chat Messages
  const [chatMessages, setChatMessages] = useState<ScreenElement[]>([
    {
      id: 'c1',
      originalText: 'Hello! Are we still meeting at the central airport tomorrow morning?',
      translatedText: 'مرحباً! هل ما زلنا سنلتقي في المطار المركزي صباح الغد؟',
      sender: 'David (London)',
      time: '10:14 AM',
      isMe: false,
    },
    {
      id: 'c2',
      originalText: "Yes, around 9:30 AM. Don't forget to bring your passport and travel tickets.",
      translatedText: 'نعم، حوالي الساعة 9:30 صباحاً. لا تنسَ إحضار جواز سفرك وتذاكر السفر.',
      sender: 'David',
      time: '10:15 AM',
      isMe: false,
    },
    {
      id: 'c3',
      originalText: 'Where is the hotel reservation confirmation?',
      translatedText: 'أين تأكيد حجز الفندق؟',
      sender: 'Me',
      time: '10:16 AM',
      isMe: true,
    },
    {
      id: 'c4',
      originalText: 'I sent the PDF to your email. Check it when you have time.',
      translatedText: 'لقد أرسلت ملف الـ PDF إلى بريدك الإلكتروني. تفقده عندما يتسنى لك الوقت.',
      sender: 'David',
      time: '10:18 AM',
      isMe: false,
    },
  ]);

  // App 2: Social Media Post
  const socialPost = {
    user: 'Tech Insider @GlobalTech',
    originalText:
      'Breaking: Offline neural translation is now officially supported on all mobile devices without internet connection!',
    translatedText:
      'عاجل: الترجمة العصبية بدون اتصال بالإنترنت مدعومة الآن رسمياً على جميع الهواتف المحمولة بدون الحاجة للإنترنت!',
    date: '2h ago',
    comments: [
      {
        id: 's1',
        user: 'Elena Vance',
        originalText: 'This is incredible for international travelers who have no data roaming.',
        translatedText: 'هذا أمر لا يصدق للمسافرين الدوليين الذين لا يملكون تجوال بيانات.',
      },
      {
        id: 's2',
        user: 'Markus Weber',
        originalText: 'The floating screen ball makes translating chat apps effortless!',
        translatedText: 'كرة الشاشة العائمة تجعل ترجمة تطبيقات الدردشة سهلة للغاية دون أي عناء!',
      },
    ],
  };

  // App 3: Restaurant Menu
  const menuItems: ScreenElement[] = [
    {
      id: 'm1',
      originalText: "Soupe à l'oignon gratinée avec fromage fondu",
      translatedText: 'شوربة بصل بالجبن المحمص والمذاب',
    },
    {
      id: 'm2',
      originalText: 'Filet de saumon grillé aux herbes fraîches et légumes',
      translatedText: 'فيليه سلمون مشوي بالأعشاب الطازجة والخضروات',
    },
    {
      id: 'm3',
      originalText: 'Tarte tatin aux pommes caramélisées et glace vanille',
      translatedText: 'فطيرة تفاح مقلوبة مكرملة مع آيس كريم فانيليا',
    },
  ];

  const handlePointerDownBall = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingBall(true);
    setBallMoved(false);
    setBallOrigin({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMoveBall = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingBall) return;
    if (Math.hypot(e.clientX - ballOrigin.x, e.clientY - ballOrigin.y) > 5) {
      setBallMoved(true);
    }
    const phoneContainer = document.getElementById('phone-screen-container');
    if (!phoneContainer) return;
    const rect = phoneContainer.getBoundingClientRect();

    const newX = Math.max(20, Math.min(rect.width - 60, e.clientX - rect.left - 24));
    const newY = Math.max(60, Math.min(rect.height - 80, e.clientY - rect.top - 24));
    setBallPosition({ x: newX, y: newY });
  };

  const handlePointerUpBall = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingBall(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Add custom message to chat (translates to active app language)
  const handleAddCustomMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    try {
      const res = await executeTranslation(customMsg, 'auto', appLang, false, forceOffline);
      const newElem: ScreenElement = {
        id: `custom_${Date.now()}`,
        originalText: customMsg,
        translatedText: res.result.translatedText,
        sender: t.textTab.speaker2,
        time: new Date().toLocaleTimeString(appLang, { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      };
      setChatMessages((prev) => [...prev, newElem]);
      setCustomMsg('');
    } catch {
      const offlineTranslated = translateOffline(customMsg, 'auto', appLang).translatedText;
      const newElem: ScreenElement = {
        id: `custom_${Date.now()}`,
        originalText: customMsg,
        translatedText: offlineTranslated || customMsg,
        sender: t.textTab.speaker2,
        time: new Date().toLocaleTimeString(appLang, { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      };
      setChatMessages((prev) => [...prev, newElem]);
      setCustomMsg('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Intro Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {s.techBadge}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  forceOffline
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                {forceOffline ? t.common.offlineBadge : t.common.onlineBadge}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {s.title}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {s.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                const res = externalBallRunning
                  ? await disableExternalFloatingBall(appLang)
                  : await enableExternalFloatingBall(appLang, forceOffline, appLang);
                setExternalBallRunning(res.running);
                setExternalNotice(res.message);
              }}
              className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition border ${
                externalBallRunning
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-200 hover:bg-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 border-cyan-500/40 text-cyan-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {externalBallRunning ? s.stopExternalBall : s.startExternalBall}
              </span>
            </button>

            <button
              onClick={() => setIsScreenTranslated((prev) => !prev)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition ${
                isScreenTranslated
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/30 ring-2 ring-emerald-400'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-900/30 hover:brightness-110'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isScreenTranslated ? s.restoreOriginal : s.translateFullScreen}</span>
            </button>
          </div>
        </div>

        {externalNotice && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between gap-2">
            <span>{externalNotice}</span>
            <button
              onClick={() => setExternalNotice(null)}
              className="text-slate-400 hover:text-white text-[11px] font-bold"
            >
              {t.common.close}
            </button>
          </div>
        )}

        {/* App Switcher Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-bold text-slate-400 self-center me-2">{s.chooseApp}</span>
          <button
            onClick={() => setSelectedApp('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              selectedApp === 'chat'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{s.appWhatsapp}</span>
          </button>

          <button
            onClick={() => setSelectedApp('social')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              selectedApp === 'social'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-700/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Twitter className="w-3.5 h-3.5" />
            <span>{s.appTwitter}</span>
          </button>

          <button
            onClick={() => setSelectedApp('menu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              selectedApp === 'menu'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-700/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{s.appMenu}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Phone Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Smartphone Shell */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[390px] h-[660px] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800/50">
            {/* Phone Speaker Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-30 flex items-center justify-center gap-2 border border-slate-800">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <div className="w-8 h-1 rounded-full bg-slate-800" />
            </div>

            {/* Inner Phone Screen */}
            <div
              id="phone-screen-container"
              onPointerMove={handlePointerMoveBall}
              className="relative w-full h-full bg-slate-950 rounded-[38px] overflow-hidden flex flex-col select-none border border-slate-800 text-slate-100"
            >
              {/* Phone Status Bar */}
              <div className="h-10 px-6 pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/60 z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Floating Ball INSIDE the Phone Screen */}
              <div
                onPointerDown={handlePointerDownBall}
                onPointerUp={handlePointerUpBall}
                style={{
                  transform: `translate3d(${ballPosition.x}px, ${ballPosition.y}px, 0)`,
                  touchAction: 'none',
                }}
                className="absolute top-0 left-0 z-40 cursor-grab active:cursor-grabbing transition-transform"
              >
                <div className="relative group">
                  <div className="absolute -inset-2 bg-cyan-500/60 rounded-full blur-md animate-pulse" />
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!ballMoved) {
                        setBallMenuOpen((prev) => !prev);
                      }
                    }}
                    className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 border-2 border-white/80 shadow-2xl flex flex-col items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition"
                  >
                    <span className="text-base">🔮</span>
                    <span className="text-[7px] font-black tracking-tighter">{s.ballLabel}</span>
                  </div>

                  {/* Activate / Deactivate Choice Popover on Click */}
                  {ballMenuOpen ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute left-1/2 -translate-x-1/2 top-14 w-36 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-2xl p-1.5 space-y-1 z-50"
                    >
                      <button
                        onClick={() => {
                          setIsScreenTranslated(true);
                          setBallMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                          isScreenTranslated
                            ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.common.enable}</span>
                        </span>
                        {isScreenTranslated && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </button>

                      <button
                        onClick={() => {
                          setIsScreenTranslated(false);
                          setBallMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                          !isScreenTranslated
                            ? 'bg-rose-600/25 text-rose-300 border border-rose-500/40'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <PowerOff className="w-3.5 h-3.5 text-rose-400" />
                          <span>{t.common.disable}</span>
                        </span>
                        {!isScreenTranslated && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                      </button>
                    </div>
                  ) : (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-6 bg-slate-900/90 text-[9px] text-cyan-300 font-bold px-1.5 py-0.5 rounded whitespace-nowrap border border-cyan-800 pointer-events-none">
                      {s.ballDragHint}
                    </div>
                  )}
                </div>
              </div>

              {/* App Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-16">
                {selectedApp === 'chat' && (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                          D
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">David (London, UK)</h4>
                          <span className="text-[10px] text-emerald-400">{s.onlineNow}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">WhatsApp</span>
                    </div>

                    {chatMessages.map((msg) => {
                      const showTrans = isScreenTranslated || hoveredElementId === msg.id;
                      return (
                        <div
                          key={msg.id}
                          onMouseEnter={() => setHoveredElementId(msg.id)}
                          onMouseLeave={() => setHoveredElementId(null)}
                          className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} group`}
                        >
                          <div
                            className={`relative max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed transition-all shadow-md ${
                              msg.isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/60'
                            } ${showTrans ? 'ring-2 ring-cyan-400 bg-slate-850' : ''}`}
                          >
                            {showTrans && (
                              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-cyan-500/30 text-[10px] text-cyan-300 font-bold">
                                <span>{s.instantTranslationTag}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakText(msg.translatedText, appLang);
                                  }}
                                  className="hover:text-white"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <p className="font-medium">
                              {showTrans ? msg.translatedText : msg.originalText}
                            </p>

                            {showTrans && (
                              <p className="text-[10px] text-slate-400 mt-1 italic border-t border-slate-700/50 pt-1">
                                {s.originalTag} {msg.originalText}
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                              <span>{msg.time}</span>
                              {msg.isMe && <span>✓✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedApp === 'social' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                          X
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{socialPost.user}</h4>
                          <span className="text-[10px] text-slate-400">{socialPost.date}</span>
                        </div>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl transition ${
                          isScreenTranslated ? 'bg-cyan-950/40 border border-cyan-500/40' : 'bg-slate-950/40'
                        }`}
                      >
                        <p className="text-xs font-semibold leading-relaxed">
                          {isScreenTranslated ? socialPost.translatedText : socialPost.originalText}
                        </p>
                        {isScreenTranslated && (
                          <p className="text-[10px] text-slate-400 mt-1 italic">
                            {s.originalTag} {socialPost.originalText}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>{s.commentsCount}</span>
                        <span>{s.likesCount}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400">{s.commentsLabel}</span>
                      {socialPost.comments.map((cm) => (
                        <div
                          key={cm.id}
                          className={`p-2.5 rounded-xl border border-slate-800/80 text-xs ${
                            isScreenTranslated ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-100' : 'bg-slate-900/60'
                          }`}
                        >
                          <span className="font-bold text-[10px] text-slate-400 block">{cm.user}:</span>
                          <p className="mt-0.5">
                            {isScreenTranslated ? cm.translatedText : cm.originalText}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp === 'menu' && (
                  <div className="space-y-3">
                    <div className="text-center p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40">
                      <span className="text-lg">🍷</span>
                      <h3 className="font-bold text-sm text-amber-200">Le Bistro Parisien</h3>
                      <p className="text-[10px] text-amber-300/70">{s.menuSubtitle}</p>
                    </div>

                    <div className="space-y-2">
                      {menuItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition ${
                            isScreenTranslated
                              ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                              : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-amber-400">
                                {s.dishPrefix} {idx + 1}
                              </span>
                              <h5 className="font-bold text-xs mt-0.5">
                                {isScreenTranslated ? item.translatedText : item.originalText}
                              </h5>
                              {isScreenTranslated && (
                                <p className="text-[10px] text-slate-400 italic mt-0.5">
                                  {item.originalText}
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-300">24€</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Simulated Phone Bottom Nav */}
              <div className="h-14 bg-slate-900/90 border-t border-slate-800 px-3 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">{s.bottomStatus}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono">
                  {t.common.appName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Custom Testing Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <MessageSquare className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-white">{s.injectTitle}</h3>
                <p className="text-xs text-slate-400">{s.injectSubtitle}</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomMsg} className="space-y-2">
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder={s.injectPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={!customMsg.trim()}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{s.injectBtn}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{s.howItWorksTitle}</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                <span>{s.step1}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                <span>{s.step2}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                <span>{s.step3}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
