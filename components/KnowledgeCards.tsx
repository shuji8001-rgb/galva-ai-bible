'use client';

import React, { useState, useMemo } from 'react';
import { KnowledgeRecord, CATEGORIES, CategoryId, QuestionQueueItem } from '@/types';
import {
  BookOpen,
  Download,
  AlertCircle,
  HelpCircle,
  Wrench,
  ShieldCheck,
  Tag,
  Volume2,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bot,
  UserCheck,
  Filter,
  Layers,
  RotateCcw,
  Mic,
  ImageIcon,
  Award,
  Lightbulb,
  Edit3,
  Trash2,
} from 'lucide-react';

interface KnowledgeCardsProps {
  knowledgeList: KnowledgeRecord[];
  selectedQuestion: QuestionQueueItem | null;
  onClearSelection?: () => void;
  onStartAppendVoice?: (questionId: string) => void;
  onOpenEditModal?: (questionId: string) => void;
  onDeleteKnowledge?: (questionId: string) => void;
}

export const KnowledgeCards: React.FC<KnowledgeCardsProps> = ({
  knowledgeList,
  selectedQuestion,
  onClearSelection,
  onStartAppendVoice,
  onOpenEditModal,
  onDeleteKnowledge,
}) => {
  const [bibleSearchQuery, setBibleSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [showOnlySelected, setShowOnlySelected] = useState(true);
  const [openTranscripts, setOpenTranscripts] = useState<Record<string, boolean>>({});

  const categoryList: CategoryId[] = ['CAT-1', 'CAT-2', 'CAT-3', 'CAT-4', 'CAT-5', 'CAT-6'];

  const toggleTranscript = (id: string) => {
    setOpenTranscripts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(knowledgeList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `galva-bible-export-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredKnowledge = useMemo(() => {
    return knowledgeList.filter((k) => {
      if (selectedQuestion && showOnlySelected) {
        if (k.question_id !== selectedQuestion.id) {
          return false;
        }
      }

      if (filterCategory !== 'ALL' && k.category_id !== filterCategory) {
        return false;
      }

      if (bibleSearchQuery.trim()) {
        const q = bibleSearchQuery.toLowerCase();
        const inTitle = k.question_title.toLowerCase().includes(q);
        const inPhenomenon = k.phenomenon.toLowerCase().includes(q);
        const inCause = k.cause.toLowerCase().includes(q);
        const inAction = k.action_and_criteria.toLowerCase().includes(q);
        const inTerminology = k.key_terminology && k.key_terminology.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inPhenomenon && !inCause && !inAction && !inTerminology) return false;
      }

      return true;
    });
  }, [knowledgeList, selectedQuestion, showOnlySelected, filterCategory, bibleSearchQuery]);

  const selectedQuestionKnowledge = useMemo(() => {
    if (!selectedQuestion) return null;
    return knowledgeList.find((k) => k.question_id === selectedQuestion.id);
  }, [selectedQuestion, knowledgeList]);

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* バイブル上部コントロールバー */}
      {/* ============================================================ */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  溶融亜鉛めっき 品管バイブル
                </h2>
                {selectedQuestion && showOnlySelected && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    No.{selectedQuestion.no}の回答を表示中
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                蓄積ノウハウ：全 {knowledgeList.length} 件（該当: {filteredKnowledge.length} 件）
              </p>
            </div>
          </div>

          {/* 検索 ＆ エクスポート */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bibleSearchQuery}
              onChange={(e) => setBibleSearchQuery(e.target.value)}
              placeholder="バイブル内を検索（用語・現象など）..."
              className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-44 sm:w-56"
            />
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors shrink-0"
              title="蓄積データをJSONで保存"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">エクスポート</span>
            </button>
          </div>
        </div>

        {/* フィルターバー */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold">
              <Filter className="w-3 h-3 text-cyan-400" />
              分野:
            </span>
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-2 py-1 rounded-md transition-all ${
                filterCategory === 'ALL'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              すべて
            </button>
            {categoryList.map((catId) => (
              <button
                key={catId}
                onClick={() => setFilterCategory(catId)}
                className={`px-2 py-1 rounded-md transition-all ${
                  filterCategory === catId
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {catId}
              </button>
            ))}
          </div>

          {selectedQuestion && (
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => setShowOnlySelected(!showOnlySelected)}
                className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 transition-all ${
                  showOnlySelected
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{showOnlySelected ? '全回答を表示' : '選択中の回答のみ表示'}</span>
              </button>

              {onClearSelection && (
                <button
                  onClick={onClearSelection}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center gap-1"
                  title="選択解除して全表示に戻す"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>選択解除</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ナレッジカード一覧（色分けハイライトデザイン） */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {selectedQuestion && !selectedQuestionKnowledge && showOnlySelected && (
          <div className="glass-card rounded-2xl p-6 text-center border border-amber-500/30 bg-amber-950/10 space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">
              「No.{selectedQuestion.no} {selectedQuestion.title}」は現在AI仮解説のみ登録されています
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              上部の「① AI仮解説」にJIS規格や標準確認ポイントが表示されています。本部長の現場知見を上乗せ録音すると、ここに確定カードが作成されます。
            </p>
            <button
              onClick={() => setShowOnlySelected(false)}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline pt-1 font-semibold"
            >
              他の登録済み全バイブル ({knowledgeList.length}件) を表示する
            </button>
          </div>
        )}

        {filteredKnowledge.length === 0 && (!selectedQuestion || !showOnlySelected || selectedQuestionKnowledge) ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
            <p className="text-sm font-medium">該当するナレッジはありません</p>
          </div>
        ) : (
          filteredKnowledge.map((item) => {
            const cat = CATEGORIES[item.category_id] || CATEGORIES['CAT-4'];
            const isTranscriptOpen = openTranscripts[item.id] || false;
            const isTargetOfSelection = selectedQuestion?.id === item.question_id;
            const formattedDate = new Date(item.created_at).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className={`glass-card rounded-2xl p-5 lg:p-6 shadow-xl transition-all duration-300 space-y-4 ${
                  isTargetOfSelection
                    ? 'border-2 border-cyan-400/80 ring-2 ring-cyan-500/30 shadow-cyan-950/50'
                    : 'border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* カード上部 */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border ${cat.badgeBg} ${cat.badgeBorder} ${cat.badgeText}`}
                    >
                      {cat.id}: {cat.name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onStartAppendVoice && (
                      <button
                        onClick={() => onStartAppendVoice(item.question_id)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition-transform active:scale-95 shadow-sm"
                        title="前回の回答や仮回答に、後から音声で補足・付け足し"
                      >
                        <Mic className="w-3.5 h-3.5 text-amber-400" />
                        <span>🎙️ 録音</span>
                      </button>
                    )}

                    {onOpenEditModal && (
                      <button
                        onClick={() => onOpenEditModal(item.question_id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition-transform active:scale-95 shadow-sm"
                        title="このナレッジの回答テキスト・処置・判定を直接編集"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>✏️ 編集</span>
                      </button>
                    )}

                    {onDeleteKnowledge && (
                      <button
                        onClick={() => onDeleteKnowledge(item.question_id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-bold transition-transform active:scale-95 shadow-sm"
                        title="このナレッジを削除または本部長回答をリセット"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span className="hidden sm:inline">削除</span>
                      </button>
                    )}

                    {isTargetOfSelection && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 shadow-sm">
                        選択中の質問
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base lg:text-lg font-bold text-white leading-snug">
                  {item.question_title}
                </h3>

                {/* ============================================================ */}
                {/* 質問と課題定義（何が質問だったのかを明確化） */}
                {/* ============================================================ */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                        【現場の疑問・質問背景】
                      </span>
                    </div>
                    {item.has_voice_answer ? (
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>👑</span>
                        <span>本部長 音声回答済</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-sky-300 bg-sky-950/80 border border-sky-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-sky-400" />
                        <span>AI標準仮解説（録音待ち）</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed pl-1">
                    💬 <span className="font-semibold text-white">{item.original_question || item.question_title}</span>
                  </p>

                  {item.refined_problem && (
                    <div className="text-[11px] text-cyan-300 bg-cyan-950/50 p-2 rounded-lg border border-cyan-900/60 font-mono">
                      {item.refined_problem}
                    </div>
                  )}
                </div>

                {/* 現場写真ギャラリー */}
                {item.images && item.images.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      現場確認 ＆ 手直し写真:
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {item.images.map((imgUrl, i) => (
                        <div
                          key={i}
                          className="relative rounded-xl overflow-hidden border-2 border-amber-500/40 max-w-sm max-h-56 shadow-lg group"
                        >
                          <img
                            src={imgUrl}
                            alt="現場確認写真"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* 🌟 色分けセクション 1：AIによる標準理論・JIS解説（青・シアン系） */}
                {/* ============================================================ */}
                {item.ai_standard_answer && (
                  <div className="bg-gradient-to-br from-slate-900/90 via-sky-950/30 to-slate-900/80 p-4 rounded-xl border border-sky-500/40 shadow-md space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                        <Bot className="w-4 h-4 text-sky-400" />
                        <span>【AI標準理論・JIS基準解説】</span>
                      </div>
                      <span className="text-[10px] text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60 font-semibold">
                        🤖 教科書・標準知見
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-sky-900/50">
                        <span className="text-[11px] font-bold text-sky-300 block mb-1">
                          標準メカニズム
                        </span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {item.ai_standard_answer.theory}
                        </p>
                      </div>
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-sky-900/50">
                        <span className="text-[11px] font-bold text-cyan-300 block mb-1">
                          JIS規格・合否ライン
                        </span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {item.ai_standard_answer.standard_criteria}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* 🌟 色分けセクション 2：村上本部長の肉声回答・現場構造化知見（ゴールド・アンバー系） */}
                {/* ============================================================ */}
                <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-orange-950/30 p-4 lg:p-5 rounded-xl border-2 border-amber-500/60 shadow-lg shadow-amber-950/30 space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Award className="w-5 h-5 text-amber-400 animate-pulse" />
                      <span className="text-sm font-black tracking-wide text-amber-300">
                        【{item.has_voice_answer ? '村上本部長 直伝ノウハウ ＆ 実践判断ライン' : '村上本部長 現場アドバイス（要約）'}】
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-900/60 px-2.5 py-0.5 rounded-full border border-amber-500/60 shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {item.has_voice_answer ? '🎖️ 職人肉声収録済' : '🎙️ 追記録音受付中'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 現象 */}
                    <div className="bg-slate-950/85 p-3 rounded-xl border border-amber-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>① 発生現象</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {item.phenomenon}
                      </p>
                    </div>

                    {/* 原因 */}
                    <div className="bg-slate-950/85 p-3 rounded-xl border border-amber-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                        <HelpCircle className="w-4 h-4 text-orange-400" />
                        <span>② 根本原因</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {item.cause}
                      </p>
                    </div>

                    {/* 処置・合否判定 */}
                    <div className="bg-slate-950/85 p-3 rounded-xl border border-amber-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Wrench className="w-4 h-4 text-emerald-400" />
                        <span>③ 現場処置・合否判定</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                        {item.action_and_criteria}
                      </p>
                    </div>

                    {/* 再発防止 */}
                    <div className="bg-slate-950/80 p-3.5 rounded-lg border border-emerald-900/60 md:col-span-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        再発防止策（次回製作への注意点）
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                        {item.prevention}
                      </p>
                    </div>
                  </div>

                  {/* 本部長の生音声プレイヤー */}
                  {item.audio_url && (
                    <div className="bg-slate-950/90 rounded-xl p-3 border border-amber-500/40 flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-amber-300 block mb-1">
                          村上本部長の生肉声録音（再生）
                        </span>
                        <audio src={item.audio_url} controls className="w-full h-8" />
                      </div>
                    </div>
                  )}

                  {/* 全文文字起こしアコーディオン（ゴールドハイライト） */}
                  <div className="border-t border-amber-900/50 pt-2.5">
                    <button
                      onClick={() => toggleTranscript(item.id)}
                      className="flex items-center justify-between w-full text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        村上本部長の語り全文文字起こし（誤変換補正済み）
                      </span>
                      {isTranscriptOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isTranscriptOpen && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/40 text-xs lg:text-sm text-amber-100/90 leading-relaxed italic border-l-4 border-l-amber-400 shadow-md">
                        {item.full_transcript}
                      </div>
                    )}
                  </div>
                </div>

                {/* 専門用語タグ */}
                {item.key_terminology && item.key_terminology.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                      <Tag className="w-3 h-3 text-amber-400" />
                      本部長音声から補正された専門用語:
                    </span>
                    {item.key_terminology.map((term, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-bold bg-amber-950/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded-md"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
