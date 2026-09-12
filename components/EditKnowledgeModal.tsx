'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KnowledgeRecord, QuestionQueueItem, CATEGORIES, CategoryId } from '@/types';
import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  Award,
  Bot,
  Wrench,
  ShieldCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface EditKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeRecord: KnowledgeRecord | null;
  questionItem?: QuestionQueueItem | null;
  onSave: (updatedRecord: KnowledgeRecord, updatedQuestion?: QuestionQueueItem) => void;
  onDelete?: (questionId: string) => void;
  onResetVoiceAnswer?: (questionId: string) => void;
}

export const EditKnowledgeModal: React.FC<EditKnowledgeModalProps> = ({
  isOpen,
  onClose,
  knowledgeRecord,
  questionItem,
  onSave,
  onDelete,
  onResetVoiceAnswer,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !knowledgeRecord) return null;

  const [questionTitle, setQuestionTitle] = useState(knowledgeRecord.question_title);
  const [originalQuestion, setOriginalQuestion] = useState(knowledgeRecord.original_question || '');
  const [fullTranscript, setFullTranscript] = useState(knowledgeRecord.full_transcript || '');
  const [phenomenon, setPhenomenon] = useState(knowledgeRecord.phenomenon || '');
  const [cause, setCause] = useState(knowledgeRecord.cause || '');
  const [actionAndCriteria, setActionAndCriteria] = useState(knowledgeRecord.action_and_criteria || '');
  const [prevention, setPrevention] = useState(knowledgeRecord.prevention || '');
  const [verdictOkNg, setVerdictOkNg] = useState<string>(
    knowledgeRecord.worker_summary?.verdict_ok_ng || '判定要注意（膜厚測定要）'
  );
  const [immediateAction, setImmediateAction] = useState(
    knowledgeRecord.worker_summary?.immediate_action || ''
  );
  const [forbiddenAction, setForbiddenAction] = useState(
    knowledgeRecord.worker_summary?.forbidden_action || ''
  );
  const [causeCategory, setCauseCategory] = useState(knowledgeRecord.cause_category || '前処理薬品・洗浄');
  const [actionCategory, setActionCategory] = useState(knowledgeRecord.action_category || '酸洗・前処理手直し');
  const [hasVoiceAnswer, setHasVoiceAnswer] = useState(knowledgeRecord.has_voice_answer);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (knowledgeRecord) {
      setQuestionTitle(knowledgeRecord.question_title);
      setOriginalQuestion(knowledgeRecord.original_question || '');
      setFullTranscript(knowledgeRecord.full_transcript || '');
      setPhenomenon(knowledgeRecord.phenomenon || '');
      setCause(knowledgeRecord.cause || '');
      setActionAndCriteria(knowledgeRecord.action_and_criteria || '');
      setPrevention(knowledgeRecord.prevention || '');
      setVerdictOkNg(knowledgeRecord.worker_summary?.verdict_ok_ng || '判定要注意（膜厚測定要）');
      setImmediateAction(knowledgeRecord.worker_summary?.immediate_action || '');
      setForbiddenAction(knowledgeRecord.worker_summary?.forbidden_action || '');
      setCauseCategory(knowledgeRecord.cause_category || '前処理薬品・洗浄');
      setActionCategory(knowledgeRecord.action_category || '酸洗・前処理手直し');
      setHasVoiceAnswer(knowledgeRecord.has_voice_answer);
      setShowDeleteConfirm(false);
    }
  }, [knowledgeRecord]);

  const handleSave = () => {
    const updatedRecord: KnowledgeRecord = {
      ...knowledgeRecord,
      question_title: questionTitle,
      original_question: originalQuestion,
      full_transcript: fullTranscript,
      phenomenon,
      cause,
      action_and_criteria: actionAndCriteria,
      prevention,
      has_voice_answer: hasVoiceAnswer,
      cause_category: causeCategory,
      action_category: actionCategory,
      worker_summary: {
        summary_phenomenon: `${questionTitle.slice(0, 24)}の現場確認`,
        verdict_ok_ng: verdictOkNg as any,
        immediate_action: immediateAction,
        forbidden_action: forbiddenAction,
      },
    };

    let updatedQ: QuestionQueueItem | undefined = undefined;
    if (questionItem) {
      updatedQ = {
        ...questionItem,
        title: questionTitle,
        raw_text: originalQuestion,
        has_voice_answer: hasVoiceAnswer,
        is_answered: true,
        cause_category: causeCategory,
        action_category: actionCategory,
        worker_summary: {
          summary_phenomenon: `${questionTitle.slice(0, 24)}の現場確認`,
          verdict_ok_ng: verdictOkNg as any,
          immediate_action: immediateAction,
          forbidden_action: forbiddenAction,
        },
      };
    }

    onSave(updatedRecord, updatedQ);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(knowledgeRecord.question_id);
      onClose();
    }
  };

  const handleResetVoice = () => {
    if (onResetVoiceAnswer) {
      onResetVoiceAnswer(knowledgeRecord.question_id);
      onClose();
    }
  };

  const catObj = CATEGORIES[knowledgeRecord.category_id] || CATEGORIES['CAT-4'];

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* モーダルヘッダー */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  ナレッジ編集・テキスト修正
                </h3>
                <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded border ${catObj.badgeBg} ${catObj.badgeBorder} ${catObj.badgeText}`}>
                  {catObj.id}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">
                本部長回答・処置・絶対NG行動・JIS合否判定を直接編集できます
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* モーダルボディ（スクロールエリア） */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs text-slate-200 custom-scrollbar">
          {/* 削除確認ダイアログ */}
          {showDeleteConfirm && (
            <div className="bg-red-950/80 border-2 border-red-500 p-4 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>削除またはリセットの確認</span>
              </div>
              <p className="text-xs text-red-200">
                このナレッジに対して実行する操作を選択してください。
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>質問とバイブルを完全削除</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetVoice}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>本部長回答をリセット（AI仮解説に戻す）</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* 1. 質問タイトル ＆ 現場疑問 */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <label className="block">
              <span className="text-xs font-bold text-cyan-300 block mb-1">質問タイトル（テーマ）:</span>
              <input
                type="text"
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-slate-400 block mb-1">三浦さんの質問・現場の疑問:</span>
              <textarea
                value={originalQuestion}
                onChange={(e) => setOriginalQuestion(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </label>
          </div>

          {/* 2. 村上本部長の語り・アドバイス全文 */}
          <div className="space-y-2 bg-amber-950/20 p-4 rounded-2xl border-2 border-amber-500/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>村上本部長の語り・回答テキスト全文:</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-200">
                <input
                  type="checkbox"
                  checked={hasVoiceAnswer}
                  onChange={(e) => setHasVoiceAnswer(e.target.checked)}
                  className="rounded border-amber-600 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold">「👑 済」マークを有効にする</span>
              </label>
            </div>
            <textarea
              value={fullTranscript}
              onChange={(e) => setFullTranscript(e.target.value)}
              rows={4}
              placeholder="村上本部長の現場での具体的なアドバイス・語りを記入..."
              className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-amber-100 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* 3. 構造化分析（現象・原因・処置・予防） */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                ① 発生現象:
              </span>
              <textarea
                value={phenomenon}
                onChange={(e) => setPhenomenon(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                ② 根本原因:
              </span>
              <textarea
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" />
                ③ 現場処置・合否判定:
              </span>
              <textarea
                value={actionAndCriteria}
                onChange={(e) => setActionAndCriteria(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                恒久予防策（次回への注意点）:
              </span>
              <textarea
                value={prevention}
                onChange={(e) => setPrevention(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* 4. 現場作業員要約（クイック判定・即時処置・絶対NG行動） */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-800/60 space-y-3">
            <span className="text-xs font-bold text-cyan-300 block">
              👷 現場作業員クイック判断（サマリー表示用）:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">3秒即断判定:</span>
                <select
                  value={verdictOkNg}
                  onChange={(e) => setVerdictOkNg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="OK（合格/許容）">🟩 OK（合格/許容）</option>
                  <option value="NG（手直し必須）">🟥 NG（手直し必須）</option>
                  <option value="判定要注意（膜厚測定要）">🟨 判定要注意（膜厚測定要）</option>
                  <option value="危険（作業即停止）">🚨 危険（作業即停止）</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold text-cyan-300 block mb-1">⚡ 即時対応処置（3行以内）:</span>
                <input
                  type="text"
                  value={immediateAction}
                  onChange={(e) => setImmediateAction(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[11px] font-bold text-rose-400 block mb-1">🚨 絶対やってはいけないNG行動（赤字）:</span>
              <input
                type="text"
                value={forbiddenAction}
                onChange={(e) => setForbiddenAction(e.target.value)}
                className="w-full bg-slate-900 border border-rose-500/50 rounded-xl px-3 py-2 text-xs text-rose-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </label>
          </div>
        </div>

        {/* モーダルフッター */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>削除 / リセット</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>変更を保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
