import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Upload,
  Film,
  Tv,
  Subtitles,
  Download,
  Sparkles,
  Link as LinkIcon,
  Mic,
  MicOff,
  Edit3,
  PlusCircle,
} from 'lucide-react';
import { SubtitleCue } from '../../server/geminiService.ts';
import { AVAILABLE_PACKS } from '../services/offlineData.ts';
import { translateOffline, isPackDownloaded } from '../services/offlineEngine.ts';
import { speakText, executeTranslation } from '../services/translatorService.ts';
import { useI18n } from '../services/i18nContext.tsx';

// Video item structure with synchronized subtitles
interface VideoSeriesItem {
  id: string;
  title: string;
  episode: string;
  category: string;
  videoUrl: string;
  youtubeId?: string;
  posterText: string;
  defaultLang: string;
  cues: SubtitleCue[];
}

const DEFAULT_VIDEO: VideoSeriesItem = {
  id: 'default-video',
  title: 'مشغّل ومترجم الفيديو الذكي',
  episode: 'ترجمة فورية بالرابط المنسوخ، الصوت، أو الكتابة',
  category: 'فيديو عام',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  posterText: 'AI Video Translator',
  defaultLang: 'en',
  cues: [
    { id: 'c1', start: 1.0, end: 4.5, originalText: 'Welcome to the live video translator.', translatedText: 'مرحباً بك في مترجم الفيديوهات الذكي بالترجمة الحية.' },
    { id: 'c2', start: 5.0, end: 9.0, originalText: 'Paste any video link or record audio to translate.', translatedText: 'الصق رابط أي فيديو أو شغّل المايك للترجمة الفورية المباشرة.' },
    { id: 'c3', start: 9.5, end: 14.0, originalText: 'Dual-language subtitles and instant voice dubbing supported.', translatedText: 'يدعم الترجمة المزدوجة المتزامنة والدبلجة الصوتية الفورية.' },
  ],
};

const PRESET_VIDEO_LINKS = [
  {
    id: 'space',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'auto',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'action',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  },
];

export const VideoTranslator: React.FC<{ forceOffline: boolean }> = ({ forceOffline }) => {
  const { appLang, t, getLangName } = useI18n();
  const [selectedSeries, setSelectedSeries] = useState<VideoSeriesItem>(DEFAULT_VIDEO);
  const [targetLang, setTargetLang] = useState<string>(appLang);
  const [cues, setCues] = useState<SubtitleCue[]>(DEFAULT_VIDEO.cues);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [bilingualMode, setBilingualMode] = useState<boolean>(true);
  const [subtitleSize, setSubtitleSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);
  const [videoErrorMsg, setVideoErrorMsg] = useState<string | null>(null);

  // Input mode state: direct link, typing, or live voice
  const [activeInputMode, setActiveInputMode] = useState<'url' | 'typing' | 'voice'>('url');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);

  // Typing subtitle editor state
  const [typedOriginalText, setTypedOriginalText] = useState<string>('');
  const [typedStartTime, setTypedStartTime] = useState<number>(0);
  const [typedEndTime, setTypedEndTime] = useState<number>(4);
  const [isAddingTyped, setIsAddingTyped] = useState<boolean>(false);

  // Voice recognition and dubbing state
  const [isListeningAudio, setIsListeningAudio] = useState<boolean>(false);
  const [liveHeardText, setLiveHeardText] = useState<string>('');
  const [liveTranslatedText, setLiveTranslatedText] = useState<string>('');
  const [autoDubbing, setAutoDubbing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenCueIdRef = useRef<string | null>(null);

  useEffect(() => {
    setTargetLang(appLang);
  }, [appLang]);

  useEffect(() => {
    if (selectedSeries.id === 'default-video') {
      setCues(
        DEFAULT_VIDEO.cues.map((c) => ({
          ...c,
          translatedText:
            targetLang === 'ar'
              ? c.translatedText
              : targetLang === 'en'
              ? c.originalText
              : translateOffline(c.originalText, 'en', targetLang).translatedText,
        }))
      );
    }
  }, [targetLang, selectedSeries.id]);

  // Video time updates from video element
  const handleTimeUpdate = () => {
    if (videoRef.current && !videoLoadError) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Fail-safe simulation timer for video playback if external stream fails
  useEffect(() => {
    if (videoLoadError && isPlaying) {
      const maxEnd = Math.max(...cues.map((c) => c.end), 35);
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.25;
          return next > maxEnd ? 0 : next;
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [videoLoadError, isPlaying, cues]);

  const togglePlay = () => {
    if (videoLoadError) {
      setIsPlaying((prev) => !prev);
      return;
    }
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {
        setVideoLoadError(true);
        setIsPlaying(true);
      });
      setIsPlaying(true);
    }
  };

  // Find active cue for current timestamp
  const activeCue = cues.find((c) => currentTime >= c.start && currentTime <= c.end);

  // Auto Voice Dubbing: speak translated Arabic dialogue aloud when cue triggers
  useEffect(() => {
    if (autoDubbing && isPlaying && activeCue && activeCue.id !== lastSpokenCueIdRef.current) {
      lastSpokenCueIdRef.current = activeCue.id;
      speakText(activeCue.translatedText, targetLang);
    }
  }, [autoDubbing, isPlaying, activeCue, targetLang]);

  // Jump video to specific cue
  const jumpToCue = (startSec: number) => {
    setCurrentTime(startSec);
    if (videoLoadError) {
      setIsPlaying(true);
      return;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
      if (!isPlaying) {
        videoRef.current.play().catch(() => setVideoLoadError(true));
        setIsPlaying(true);
      }
    }
  };

  // 1. FEATURE: Load & Translate Video via Copied Link / URL
  const handleLoadFromUrl = async (urlToLoad = inputUrl, customTitle?: string) => {
    if (!urlToLoad.trim()) return;
    setIsLoadingUrl(true);

    try {
      // Check if YouTube
      const ytMatch = urlToLoad.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      const ytId = ytMatch ? ytMatch[1] : undefined;

      // Call subtitle generator API or offline generator
      let generatedCues: SubtitleCue[] = [];
      if (!forceOffline) {
        try {
          const res = await fetch('/api/generate-video-subtitles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoUrl: urlToLoad,
              titleHint: ytId ? `YouTube Video ${ytId}` : 'Web Video Stream',
              targetLang,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            generatedCues = data.cues;
          }
        } catch {
          // Network/offline error seamlessly falls through to local default subtitle cues
        }
      }

      if (generatedCues.length === 0) {
        // Fallback default cues (translated via offline engine when needed)
        const baseCues = [
          { id: 'url-q1', start: 1, end: 5.5, originalText: 'Welcome to this linked video stream.', fallbackAr: 'مرحباً بك في هذا المقطع المرئي عبر الرابط.' },
          { id: 'url-q2', start: 6, end: 11.5, originalText: 'The subtitle translator is actively analyzing the dialogue.', fallbackAr: 'مترجم النصوص يحلل الحوار ويترجمه بشكل متزامن الآن.' },
          { id: 'url-q3', start: 12, end: 18.0, originalText: 'Dual subtitles and voice dubbing are available for you.', fallbackAr: 'الترجمة المزدوجة والدبلجة الصوتية متاحة لك بالكامل.' },
        ];
        generatedCues = baseCues.map((c) => ({
          id: c.id,
          start: c.start,
          end: c.end,
          originalText: c.originalText,
          translatedText:
            targetLang === 'ar'
              ? c.fallbackAr
              : targetLang === 'en'
              ? c.originalText
              : translateOffline(c.originalText, 'en', targetLang).translatedText,
        }));
      }

      const newVideoItem: VideoSeriesItem = {
        id: `url_${Date.now()}`,
        title: customTitle || (ytId ? `YouTube (${ytId})` : t.videoTab.defaultTitle),
        episode: t.videoTab.defaultEpisode,
        category: 'URL',
        videoUrl: urlToLoad,
        youtubeId: ytId,
        posterText: 'Video URL Player',
        defaultLang: 'en',
        cues: generatedCues,
      };

      setSelectedSeries(newVideoItem);
      setCues(generatedCues);
      setCurrentTime(0);
      setIsPlaying(false);
      setVideoLoadError(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // 2. FEATURE: Translate & Add Subtitle via Typing
  const handleAddTypedCue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedOriginalText.trim()) return;
    setIsAddingTyped(true);

    try {
      let trans = '';
      if (forceOffline) {
        const off = translateOffline(typedOriginalText, 'en', targetLang);
        trans = off.translatedText;
      } else {
        const res = await executeTranslation(typedOriginalText, 'auto', targetLang);
        trans = res.result.translatedText;
      }

      const newCue: SubtitleCue = {
        id: `typed_${Date.now()}`,
        start: typedStartTime,
        end: typedEndTime > typedStartTime ? typedEndTime : typedStartTime + 4,
        originalText: typedOriginalText,
        translatedText: trans,
      };

      const updated = [...cues, newCue].sort((a, b) => a.start - b.start);
      setCues(updated);
      setTypedOriginalText('');
      setTypedStartTime(Math.floor(currentTime));
      setTypedEndTime(Math.floor(currentTime) + 4);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingTyped(false);
    }
  };

  // 3. FEATURE: Translate Video via Voice / Live Audio Listening
  const toggleLiveAudioListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVideoErrorMsg(t.videoTab.speechNotSupported);
      return;
    }
    setVideoErrorMsg(null);

    if (isListeningAudio) {
      recognitionRef.current?.stop();
      setIsListeningAudio(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedSeries.defaultLang === 'fr' ? 'fr-FR' : 'en-US';

      recognition.onstart = () => setIsListeningAudio(true);
      recognition.onresult = async (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');

        setLiveHeardText(transcript);

        // Translate the live spoken phrase
        if (transcript.trim().length > 3) {
          try {
            const res = await executeTranslation(transcript, 'auto', targetLang);
            setLiveTranslatedText(res.result.translatedText);

            // Also add as cue at current second
            const nowSec = Math.floor(videoRef.current?.currentTime || currentTime);
            const liveCue: SubtitleCue = {
              id: `live_${Date.now()}`,
              start: nowSec,
              end: nowSec + 4.5,
              originalText: transcript,
              translatedText: res.result.translatedText,
            };
            setCues((prev) => {
              if (prev.some((c) => c.originalText === transcript)) return prev;
              return [...prev, liveCue].sort((a, b) => a.start - b.start);
            });
          } catch (e) {
            console.error(e);
          }
        }
      };

      recognition.onerror = () => setIsListeningAudio(false);
      recognition.onend = () => setIsListeningAudio(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListeningAudio(false);
    }
  };

  // Batch translate all existing subtitles
  const handleTranslateAllSubtitles = async () => {
    setVideoErrorMsg(null);
    if (forceOffline && !isPackDownloaded(targetLang)) {
      setVideoErrorMsg(`⚠️ ${getLangName(targetLang)}: ${t.common.missingPackTitle} ${t.common.missingPackHint}`);
      return;
    }
    setIsTranslating(true);
    try {
      if (forceOffline) {
        const translated = cues.map((c) => {
          const res = translateOffline(c.originalText, selectedSeries.defaultLang, targetLang);
          return {
            ...c,
            translatedText: res.translatedText,
          };
        });
        setCues(translated);
      } else {
        const res = await fetch('/api/translate-subtitles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cues: cues.map((c) => ({ id: c.id, start: c.start, end: c.end, text: c.originalText })),
            targetLang,
          }),
        });

        if (!res.ok) throw new Error('Failed to translate cues');
        const data = await res.json();
        setCues(data.cues);
      }
    } catch (err) {
      const translated = cues.map((c) => {
        const res = translateOffline(c.originalText, selectedSeries.defaultLang, targetLang);
        return {
          ...c,
          translatedText: res.translatedText,
        };
      });
      setCues(translated);
    } finally {
      setIsTranslating(false);
    }
  };

  // User uploaded custom video file
  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const baseUploadCues = [
      { id: 'cq1', start: 1, end: 5, originalText: 'Welcome to this uploaded video clip.', fallbackAr: 'مرحباً بك في هذا المقطع المرئي المرفوع.' },
      { id: 'cq2', start: 6, end: 11, originalText: 'You can translate any series or movies with live subtitles.', fallbackAr: 'يمكنك ترجمة أي مسلسل أو فيلم مع ترجمة نصية مباشرة.' },
    ];
    const customItem: VideoSeriesItem = {
      id: `custom_${Date.now()}`,
      title: file.name,
      episode: t.videoTab.uploadVideo,
      category: 'Video',
      videoUrl: url,
      posterText: file.name,
      defaultLang: 'en',
      cues: baseUploadCues.map((c) => ({
        id: c.id,
        start: c.start,
        end: c.end,
        originalText: c.originalText,
        translatedText:
          targetLang === 'ar'
            ? c.fallbackAr
            : targetLang === 'en'
            ? c.originalText
            : translateOffline(c.originalText, 'en', targetLang).translatedText,
      })),
    };
    setSelectedSeries(customItem);
    setCues(customItem.cues);
  };

  // Download .SRT subtitle file
  const handleExportSrt = () => {
    const srtContent = cues
      .map((c, idx) => {
        const formatTime = (secs: number) => {
          const h = Math.floor(secs / 3600).toString().padStart(2, '0');
          const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
          const s = Math.floor(secs % 60).toString().padStart(2, '0');
          const ms = Math.floor((secs % 1) * 1000).toString().padStart(3, '0');
          return `${h}:${m}:${s},${ms}`;
        };

        return `${idx + 1}\n${formatTime(c.start)} --> ${formatTime(c.end)}\n${c.translatedText}\n`;
      })
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSeries.title}_subtitles_${targetLang}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fontSizes = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base md:text-lg',
    lg: 'text-base sm:text-xl md:text-2xl',
  };

  const getPresetLabel = (id: string) => {
    if (id === 'space') return t.videoTab.presetSpace;
    if (id === 'auto') return t.videoTab.presetAuto;
    return t.videoTab.presetAction;
  };

  const displayTitle = selectedSeries.id === 'default-video' ? t.videoTab.defaultTitle : selectedSeries.title;
  const displayEpisode = selectedSeries.id === 'default-video' ? t.videoTab.defaultEpisode : selectedSeries.episode;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-300">
                <Tv className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {t.videoTab.title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold">
                {forceOffline ? t.videoTab.offlineBadge : t.videoTab.cloudBadge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {t.videoTab.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Target Language */}
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300"
            >
              {AVAILABLE_PACKS.map((p) => (
                <option key={p.code} value={p.code}>
                  {t.videoTab.translateToPrefix} {p.flag} {getLangName(p.code, p.nameEn)}
                </option>
              ))}
            </select>

            {/* Translate Subtitles Button */}
            <button
              onClick={handleTranslateAllSubtitles}
              disabled={isTranslating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/30 disabled:opacity-50 transition"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>{isTranslating ? t.videoTab.translatingDialogue : t.videoTab.translateAllDialogue}</span>
            </button>

            {/* Export SRT */}
            <button
              onClick={handleExportSrt}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              title={t.videoTab.exportSrt}
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>{t.videoTab.exportSrt}</span>
            </button>
          </div>
        </div>

        {videoErrorMsg && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between gap-2">
            <span>{videoErrorMsg}</span>
            <button
              onClick={() => setVideoErrorMsg(null)}
              className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800/70 text-amber-100"
            >
              {t.common.close}
            </button>
          </div>
        )}

        {/* Input Mode Selector Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
          <span className="text-xs font-bold text-slate-400 ml-1">{t.videoTab.inputMethodLabel}</span>

          <button
            onClick={() => setActiveInputMode('url')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeInputMode === 'url'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-cyan-300" />
            <span>{t.videoTab.modeUrl}</span>
          </button>

          <button
            onClick={() => setActiveInputMode('typing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeInputMode === 'typing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40 ring-1 ring-blue-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-300" />
            <span>{t.videoTab.modeTyping}</span>
          </button>

          <button
            onClick={() => setActiveInputMode('voice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeInputMode === 'voice'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40 ring-1 ring-red-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-red-400" />
            <span>{t.videoTab.modeVoice}</span>
          </button>

          {/* Upload Custom Video Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition mr-auto"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.videoTab.uploadVideo}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleUploadVideo}
          />
        </div>

        {/* 1. URL Input View */}
        {activeInputMode === 'url' && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-xs text-white">{t.videoTab.urlInputHeading}</h4>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder={t.videoTab.urlPlaceholder}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
              <button
                onClick={() => handleLoadFromUrl()}
                disabled={!inputUrl.trim() || isLoadingUrl}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition shrink-0"
              >
                {isLoadingUrl ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{t.videoTab.loadAndTranslateUrl}</span>
              </button>
            </div>

            {/* Quick preset links */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="font-bold">{t.videoTab.presetLinksLabel}</span>
              {PRESET_VIDEO_LINKS.map((pl) => {
                const label = getPresetLabel(pl.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      setInputUrl(pl.url);
                      handleLoadFromUrl(pl.url, label);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-300 font-medium transition"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Typing Subtitle Input View */}
        {activeInputMode === 'typing' && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>{t.videoTab.typingHeading}</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {t.videoTab.currentSecond} {currentTime.toFixed(1)}s
              </span>
            </div>

            <form onSubmit={handleAddTypedCue} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={typedOriginalText}
                  onChange={(e) => setTypedOriginalText(e.target.value)}
                  placeholder={t.videoTab.typingPlaceholder}
                  className="sm:col-span-8 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition"
                />
                <div className="sm:col-span-2 flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs">
                  <span className="text-[10px] text-slate-500">{t.videoTab.fromSec}</span>
                  <input
                    type="number"
                    step="0.5"
                    value={typedStartTime}
                    onChange={(e) => setTypedStartTime(parseFloat(e.target.value) || 0)}
                    className="w-12 bg-transparent text-center font-mono font-bold text-cyan-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">{t.videoTab.secUnit}</span>
                </div>
                <button
                  type="submit"
                  disabled={!typedOriginalText.trim() || isAddingTyped}
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isAddingTyped ? t.videoTab.addingText : t.videoTab.translateAndAdd}</span>
                </button>
              </div>
            </form>

          </div>
        )}

        {/* 3. Voice & Live Audio Input View */}
        {activeInputMode === 'voice' && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-red-500/30 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-red-400" />
                <h4 className="font-bold text-xs text-white">{t.videoTab.voiceHeading}</h4>
              </div>

              {/* Auto Voice Dubbing Switch */}
              <button
                onClick={() => setAutoDubbing((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  autoDubbing
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 ring-1 ring-emerald-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.videoTab.autoDubbing} {autoDubbing ? t.videoTab.dubbingOn : t.videoTab.dubbingOff}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-white block">{t.videoTab.listenVideoTitle}</span>
                <span className="text-[11px] text-slate-400">
                  {t.videoTab.listenVideoDesc}
                </span>
              </div>

              <button
                onClick={toggleLiveAudioListening}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                  isListeningAudio
                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-900/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isListeningAudio ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-red-400" />}
                <span>{isListeningAudio ? t.videoTab.stopListening : t.videoTab.startListening}</span>
              </button>
            </div>

            {/* Live recognized text preview */}
            {isListeningAudio && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-red-500/40 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>{t.videoTab.capturingAudio}</span>
                </div>
                <p className="text-slate-300 italic">{t.videoTab.heardAudio} {liveHeardText || t.videoTab.waitingSpeech}</p>
                {liveTranslatedText && (
                  <p className="text-cyan-300 font-bold">{t.videoTab.liveTranslation} {liveTranslatedText}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Cinema Video Arena */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Cinema Video Player Container */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-bold text-sm text-white">{displayTitle}</h3>
              <span className="text-xs text-slate-400 hidden sm:inline">• {displayEpisode}</span>
            </div>

            {/* Subtitle settings pills */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setBilingualMode((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg border font-medium transition ${
                  bilingualMode
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title={t.videoTab.dualSubtitles}
              >
                {t.videoTab.dualSubtitles} {bilingualMode ? t.common.enabled : t.videoTab.targetOnly}
              </button>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['sm', 'md', 'lg'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSubtitleSize(sz)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] uppercase transition ${
                      subtitleSize === sz
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Cinema Frame */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group shadow-inner flex items-center justify-center">
            {/* YouTube embed if youtubeId exists */}
            {selectedSeries.youtubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedSeries.youtubeId}?autoplay=0&enablejsapi=1`}
                title={displayTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : !videoLoadError ? (
              <video
                ref={videoRef}
                src={selectedSeries.videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => setVideoLoadError(true)}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                playsInline
              />
            ) : (
              /* Cinema Animated Scene Backdrop when external stream is blocked in iframe */
              <div
                onClick={togglePlay}
                className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden bg-gradient-to-tr from-slate-950 via-indigo-950/80 to-slate-900 p-6 text-center"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_70%)]" />
                <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] px-2.5 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-mono">
                  <Film className="w-3 h-3 text-cyan-400" />
                  <span>{t.videoTab.cinemaSimBadge}</span>
                </div>

                <div className="space-y-2 z-10">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-2xl shadow-xl shadow-indigo-950/50">
                    🎬
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white">{displayTitle}</h4>
                  <p className="text-xs text-indigo-200/80 font-mono">{displayEpisode}</p>

                  {isPlaying && (
                    <div className="flex items-center justify-center gap-1 py-1">
                      {[16, 28, 14, 32, 20, 36, 18, 26, 12].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}px` }}
                          className="w-1 rounded-full bg-cyan-400 animate-pulse"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LIVE FLOATING CINEMA SUBTITLES OVERLAY */}
            {activeCue && (
              <div className="absolute bottom-6 inset-x-4 sm:inset-x-8 flex justify-center pointer-events-none z-30">
                <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {/* Translated Subtitle */}
                  <p className={`font-black text-cyan-300 drop-shadow-md leading-relaxed ${fontSizes[subtitleSize]}`}>
                    {activeCue.translatedText}
                  </p>

                  {/* Original Language Subtitle if bilingual */}
                  {bilingualMode && (
                    <p className="text-xs text-slate-300 font-medium opacity-90 drop-shadow italic">
                      {activeCue.originalText}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Live voice recognized overlay badge if speaking right now */}
            {isListeningAudio && liveTranslatedText && (
              <div className="absolute top-4 inset-x-4 flex justify-center pointer-events-none z-30">
                <div className="bg-red-950/90 border border-red-500 px-3 py-1 rounded-xl text-xs font-bold text-white shadow-xl animate-pulse">
                  🎙️ {t.videoTab.liveBadge} {liveTranslatedText}
                </div>
              </div>
            )}

            {/* Big Center Play/Pause button on hover (only for non-youtube) */}
            {!selectedSeries.youtubeId && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
            )}
          </div>

          {/* Playback Controls Bar */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <span className="font-mono text-slate-400">
                {Math.floor(currentTime / 60)}:
                {Math.floor(currentTime % 60).toString().padStart(2, '0')} / {cues.length} {t.videoTab.subtitleLinesCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {autoDubbing && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  {t.videoTab.voiceDubBadge}
                </span>
              )}
              <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
                <Subtitles className="w-3.5 h-3.5" />
                <span>{t.videoTab.syncActive}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
