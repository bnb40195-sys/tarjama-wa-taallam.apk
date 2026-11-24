import React, { useState } from 'react';
import {
  History,
  Star,
  Trash2,
  X,
  Volume2,
  Copy,
  Check,
  Search,
  Zap,
  Sparkles,
} from 'lucide-react';
import {
  getHistory,
  clearHistory,
  toggleFavorite,
  HistoryItem,
  speakText,
} from '../services/translatorService.ts';
import { useI18n } from '../services/i18nContext.tsx';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose }) => {
  const { appLang, t, isRtl, getLangName } = useI18n();
  const h = t.historyDrawer;
  const [items, setItems] = useState<HistoryItem[]>(getHistory());
  const [filterFav, setFilterFav] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (!isOpen) return null;

  const refreshItems = () => {
    setItems(getHistory());
  };

  const handleToggleFav = (id: string) => {
    toggleFavorite(id);
    refreshItems();
  };

  const handleConfirmClear = () => {
    clearHistory();
    refreshItems();
    setConfirmingClear(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredItems = items.filter((item) => {
    if (filterFav && !item.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.sourceText.toLowerCase().includes(q) ||
        item.translatedText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-start animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-900 border-e border-slate-800 shadow-2xl flex flex-col p-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">{h.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="py-3 space-y-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={h.searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} top-2.5 text-slate-400 hover:text-white`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setFilterFav((prev) => !prev)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                filterFav
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>{h.favoritesOnly}</span>
            </button>

            {items.length > 0 && (
              <button
                onClick={() => setConfirmingClear(true)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{h.clearAll}</span>
              </button>
            )}
          </div>

          {confirmingClear && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-700/60 flex items-center justify-between gap-2 text-xs animate-in fade-in">
              <span className="text-red-200 font-semibold">{h.confirmClearPrompt}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleConfirmClear}
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  {h.confirmYes}
                </button>
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {h.confirmNo}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pe-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs italic">
              {filterFav ? h.emptyFavs : h.emptyHistory}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-2 group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-300">
                      {item.sourceLang === 'auto' ? t.common.autoDetectSmart : getLangName(item.sourceLang)} →{' '}
                      {getLangName(item.targetLang)}
                    </span>
                    {item.wasOffline ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> {h.offlineTag}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[9px] flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> {h.aiTag}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleFav(item.id)}
                    className="text-slate-500 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        item.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-medium line-clamp-2">
                  {item.sourceText}
                </p>

                <p className="text-sm font-bold text-cyan-300 line-clamp-2">
                  {item.translatedText}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <span>
                    {new Date(item.timestamp).toLocaleTimeString(appLang, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakText(item.translatedText, item.targetLang)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
                      title={t.common.listen}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(item.id, item.translatedText)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                      title={t.common.copy}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
