'use client';

import React, { useState, useMemo } from 'react';
import { QuestionQueueItem, CategoryId, CATEGORIES } from '@/types';
import {
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  Sparkles,
  Mic,
  Bot,
  X,
} from 'lucide-react';

interface QuestionIndexProps {
  questions: QuestionQueueItem[];
  selectedQuestion: QuestionQueueItem | null;
  onSelectQuestion: (question: QuestionQueueItem, autoStartInterview?: boolean) => void;
}

export const QuestionIndex: React.FC<QuestionIndexProps> = ({
  questions,
  selectedQuestion,
  onSelectQuestion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VOICE_ANSWERED' | 'AI_ONLY'>('ALL');
  const [openAccordions, setOpenAccordions] = useState<Record<CategoryId, boolean>>({
    'CAT-1': true,
    'CAT-2': true,
    'CAT-3': false,
    'CAT-4': false,
    'CAT-5': false,
    'CAT-6': false,
  });

  const toggleAccordion = (catId: CategoryId) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const voiceAnsweredCount = useMemo(() => questions.filter((q) => q.has_voice_answer).length, [questions]);
  const aiOnlyCount = questions.length - voiceAnsweredCount;

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filterStatus === 'VOICE_ANSWERED' && !q.has_voice_answer) return false;
      if (filterStatus === 'AI_ONLY' && q.has_voice_answer) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(query);
        const inRaw = q.raw_text?.toLowerCase().includes(query) || false;
        const inRefined = q.refined_question?.toLowerCase().includes(query) || false;
        const inNo = q.no.toString().includes(query);
        if (!inTitle && !inRaw && !inRefined && !inNo) return false;
      }

      return true;
    });
  }, [questions, filterStatus, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<CategoryId, QuestionQueueItem[]> = {
      'CAT-1': [],
      'CAT-2': [],
      'CAT-3': [],
      'CAT-4': [],
      'CAT-5': [],
      'CAT-6': [],
    };
    filteredQuestions.forEach((q) => {
      if (groups[q.category_id]) {
        groups[q.category_id].push(q);
      }
    });
    return groups;
  }, [filteredQuestions]);

  const categoryList: CategoryId[] = ['CAT-1', 'CAT-2', 'CAT-3', 'CAT-4', 'CAT-5', 'CAT-6'];

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
      {/* 検索 ＆ 絞り込みバー */}
      <div className="p-2.5 sm:p-3 border-b border-slate-800 bg-slate-950/60 space-y-2 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="No. または キーワード検索（例: 酸洗、白サビ、JIS、浴温）..."
            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 状態フィルタータブ */}
        <div className="flex items-center justify-between text-xs gap-1">
          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2 py-1 rounded-md font-medium text-[11px] transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全問 ({questions.length})
            </button>
            <button
              onClick={() => setFilterStatus('VOICE_ANSWERED')}
              className={`px-2 py-1 rounded-md font-medium text-[11px] transition-all flex items-center gap-1 ${
                filterStatus === 'VOICE_ANSWERED'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-amber-400 hover:text-amber-200'
              }`}
            >
              <span>👑 済</span>
              <span>({voiceAnsweredCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('AI_ONLY')}
              className={`px-2 py-1 rounded-md font-medium text-[11px] transition-all flex items-center gap-1 ${
                filterStatus === 'AI_ONLY'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-sky-400 hover:text-sky-200'
              }`}
            >
              <span>🤖 AI仮解説</span>
              <span>({aiOnlyCount})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {filteredQuestions.length}件
          </span>
        </div>
      </div>

      {/* 200問アコーディオンリスト */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {categoryList.map((catId) => {
          const cat = CATEGORIES[catId];
          const items = groupedByCategory[catId] || [];
          const isOpen = openAccordions[catId];
          const catVoiceCount = items.filter((q) => q.has_voice_answer).length;

          if (items.length === 0 && searchQuery) return null;

          return (
            <div
              key={catId}
              className="rounded-xl border border-slate-800/80 bg-slate-950/50 overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleAccordion(catId)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${cat.badgeBg} ${cat.badgeBorder} ${cat.badgeText}`}
                    >
                      {cat.id}
                    </span>
                    <span className="text-xs lg:text-sm font-bold text-slate-200">
                      {cat.name}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  {catVoiceCount > 0 && (
                    <span className="text-amber-400 font-bold text-[11px] flex items-center gap-0.5">
                      👑 {catVoiceCount}済
                    </span>
                  )}
                  <span>{items.length}問</span>
                </div>
              </button>

              {isOpen && (
                <div className="p-2 pt-0 space-y-1.5 border-t border-slate-800/60 bg-slate-900/30">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 text-center">該当する質問はありません</p>
                  ) : (
                    items.map((q) => {
                      const isSelected = selectedQuestion?.id === q.id;
                      return (
                        <div
                          key={q.id}
                          onClick={() => onSelectQuestion(q, false)}
                          className={`group relative p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-950/50 ring-2 ring-cyan-400/50'
                              : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0 mt-0.5">
                                No.{q.no}
                              </span>
                              <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 line-clamp-2 leading-snug">
                                {q.title}
                              </p>
                            </div>

                            <span className="shrink-0">
                              {q.has_voice_answer ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.5 rounded-md shadow-sm">
                                  <span>👑</span>
                                  <span>済</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/50 px-1.5 py-0.5 rounded-md">
                                  <Bot className="w-3 h-3" />
                                  仮解説
                                </span>
                              )}
                            </span>
                          </div>

                          {/* 選択中のカード用アクションバー */}
                          {isSelected && (
                            <div className="mt-2.5 pt-2 border-t border-cyan-900/60 flex items-center justify-between">
                              <span className="text-[11px] text-cyan-300 flex items-center gap-1 font-semibold">
                                <Bot className="w-3.5 h-3.5" />
                                {q.has_voice_answer ? '本部長の音声回答あり' : 'AI仮解説 ＆ 音声録音可能'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectQuestion(q, true);
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shadow-sm transition-transform active:scale-95"
                              >
                                <Mic className="w-3 h-3" />
                                <span>{q.has_voice_answer ? '追記録音' : '回答を録音'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
