'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CategoryId, CATEGORIES, QuestionQueueItem, KnowledgeRecord } from '@/types';
import {
  Camera,
  Sparkles,
  Loader2,
  X,
  Mic,
  Square,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Volume2,
  Bot,
  Wrench,
  ShieldAlert,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { findSimilarQuestions, SimilarMatchResult } from '@/lib/searchUtils';
import { generateRefinedGalvaData } from '@/lib/galvaAiEngine';
import { applyGalvaTerminology } from '@/lib/terminologyReplacer';

interface QuestionFormProps {
  onQuestionAdded: (newItem: QuestionQueueItem, newKnowledge?: KnowledgeRecord) => void;
  onOpenManual?: () => void;
  questions?: QuestionQueueItem[];
  knowledgeList?: KnowledgeRecord[];
  onSelectQuestion?: (q: QuestionQueueItem) => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  onQuestionAdded,
  onOpenManual,
  questions = [],
  knowledgeList = [],
  onSelectQuestion,
}) => {
  const [rawText, setRawText] = useState('');
  const [selectedCat, setSelectedCat] = useState<CategoryId | 'AUTO'>('AUTO');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // 🌟 AI生成結果の確認（プレビュー）用ステート
  const [previewData, setPreviewData] = useState<{
    question: QuestionQueueItem;
    knowledge?: KnowledgeRecord;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const isVoiceRecordingRef = useRef(false);
  const baseTextBeforeRecordingRef = useRef('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escキーでプレビューを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewData) {
        setPreviewData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewData]);

  const categoryList: CategoryId[] = ['CAT-1', 'CAT-2', 'CAT-3', 'CAT-4', 'CAT-5', 'CAT-6'];

  useEffect(() => {
    return () => {
      isVoiceRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // 💡 類似質問・重複防止サジェストのリアルタイム算出
  const similarMatches: SimilarMatchResult[] = useMemo(() => {
    if (!rawText || rawText.trim().length < 2 || questions.length === 0) {
      return [];
    }
    return findSimilarQuestions(rawText, questions, knowledgeList, 2, 0.18);
  }, [rawText, questions, knowledgeList]);

  // 📷 画像自動軽量化リサイズ処理（スマホ写真や高解像度写真を数十KBに圧縮）
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            resolve(compressedDataUrl);
          } else {
            resolve(readerEvent.target?.result as string);
          }
        };
        img.onerror = () => resolve(readerEvent.target?.result as string);
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file);
        setImagePreviews((prev) => [...prev, compressed]);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreviews((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 🎙️ 三浦さん向け音声入力の開始・停止（息継ぎ・無音でも勝手に切れない自動継続機能付き）
  const toggleVoiceRecording = () => {
    if (isVoiceRecordingRef.current) {
      // ユーザーが明示的に停止ボタンを押した場合
      isVoiceRecordingRef.current = false;
      setIsVoiceRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else {
      setVoiceError(null);
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        setVoiceError('ブラウザが音声認識に対応していません。Chrome / Edge推奨です。');
        return;
      }

      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = true;

        baseTextBeforeRecordingRef.current = rawText ? rawText.trim() + ' ' : '';
        isVoiceRecordingRef.current = true;
        setIsVoiceRecording(true);

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          const fullText = baseTextBeforeRecordingRef.current + transcript;
          // 🎙️ 専門用語辞書で「酸洗い」→「酸洗」等の誤変換をリアルタイム補正！
          const correctedText = applyGalvaTerminology(fullText);
          setRawText(correctedText);
        };

        recognition.onerror = (e: any) => {
          console.warn('Voice input error in QuestionForm:', e);
          if (e.error === 'no-speech' || e.error === 'aborted') {
            // 息継ぎや無音時はエラー扱いせず継続
            return;
          }
          if (e.error === 'not-allowed') {
            setVoiceError('マイクのアクセス許可が拒否されました。');
            isVoiceRecordingRef.current = false;
            setIsVoiceRecording(false);
          }
        };

        recognition.onend = () => {
          // ユーザーが停止を押していない場合は息継ぎ・タイムアウトしても自動再開
          if (isVoiceRecordingRef.current) {
            baseTextBeforeRecordingRef.current = rawText ? rawText.trim() + ' ' : '';
            try {
              recognition.start();
            } catch (err) {
              // 既に稼働中の場合は無視
            }
          } else {
            setIsVoiceRecording(false);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setVoiceError('音声認識を開始できませんでした。');
        isVoiceRecordingRef.current = false;
        setIsVoiceRecording(false);
      }
    }
  };

  // 1. AIで具体化と仮解説を生成し、確認プレビューを表示
  const handleRefineAndPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRawText = applyGalvaTerminology(rawText);
    setRawText(cleanRawText);

    if (!cleanRawText.trim() && imagePreviews.length === 0) return;

    if (isVoiceRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsVoiceRecording(false);
    }

    setIsSubmitting(true);
    try {
      let createdQuestion: QuestionQueueItem | null = null;
      let createdKnowledge: KnowledgeRecord | undefined = undefined;

      try {
        const storedKey = typeof window !== 'undefined' ? localStorage.getItem('galva_gemini_api_key') || undefined : undefined;
        const storedModel = typeof window !== 'undefined' ? localStorage.getItem('galva_gemini_model') || 'gemini-1.5-pro' : 'gemini-1.5-pro';

        const response = await fetch('/api/refine-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: rawText.trim(),
            categoryId: selectedCat === 'AUTO' ? undefined : selectedCat,
            images: imagePreviews,
            customApiKey: storedKey,
            modelName: storedModel,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const resData = await response.json();
          if (response.ok && resData.data) {
            createdQuestion = resData.data;
            createdKnowledge = resData.knowledge;
          }
        }
      } catch (apiErr) {
        console.warn('API refine call failed, using client fallback:', apiErr);
      }

      // クライアント側スマートフォールバック（API失敗時・オフライン時）
      if (!createdQuestion) {
        const text = rawText.trim();
        const refined = generateRefinedGalvaData(text, selectedCat === 'AUTO' ? undefined : selectedCat);

        const maxNo = questions.reduce((max, q) => Math.max(max, q.no || 0), 0);
        const newNo = maxNo + 1;
        const newId = `q-local-${Date.now()}`;

        createdQuestion = {
          id: newId,
          no: newNo,
          category_id: refined.detectedCategory,
          title: refined.title,
          refined_question: refined.refinedQuestion,
          raw_text: text,
          images: imagePreviews,
          created_at: new Date().toISOString(),
          is_answered: true,
          has_voice_answer: false,
          source_type: 'user',
          suggested_criteria: refined.suggestedCriteria,
          key_check_points: refined.keyCheckPoints,
          ai_standard_answer: refined.aiStandardAnswer,
          worker_summary: refined.workerSummary,
          cause_category: refined.causeCategory,
          action_category: refined.actionCategory,
        };

        createdKnowledge = {
          id: `k-local-${Date.now()}`,
          question_id: newId,
          category_id: refined.detectedCategory,
          question_title: refined.title,
          original_question: text,
          full_transcript: refined.aiStandardAnswer.theory || '',
          phenomenon: `【現場確認事象】：${refined.title}`,
          cause: `【推定原因】：${refined.aiStandardAnswer.theory}`,
          action_and_criteria: `【推奨合否基準・手直し】：\n${refined.aiStandardAnswer.standard_criteria}`,
          prevention: `【推奨再発防止策】：\n1. 現場確認ポイント（${refined.keyCheckPoints.join('、')}）の日常点検徹底`,
          key_terminology: [refined.title.slice(0, 8), 'JIS H 8641', '溶融亜鉛めっき'],
          cause_category: refined.causeCategory,
          action_category: refined.actionCategory,
          worker_summary: refined.workerSummary,
          has_voice_answer: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // 🌟 直接登録せず、プレビュー確認画面をセット
      setPreviewData({
        question: createdQuestion,
        knowledge: createdKnowledge,
      });
    } catch (err: any) {
      alert(err.message || '質問生成中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. ユーザーが確認して「登録」を押したときの確定処理
  const handleConfirmRegistration = () => {
    if (!previewData) return;

    onQuestionAdded(previewData.question, previewData.knowledge);

    // リセット
    setPreviewData(null);
    setRawText('');
    setImagePreviews([]);
    setSelectedCat('AUTO');
    setVoiceError(null);
  };

  // 3. プレビューを閉じて入力に戻る
  const handleCancelPreview = () => {
    setPreviewData(null);
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 p-3 sm:p-3.5 space-y-2.5 shadow-lg shrink-0">
      {/* フォームヘッダー */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
          <h2 className="text-xs sm:text-sm font-black text-sky-300 line-clamp-1">
            三浦さんの現場質問メモ（音声 / 殴り書き）
          </h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenManual && (
            <button
              type="button"
              onClick={onOpenManual}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-bold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/60"
              title="三浦さん向けマニュアル"
            >
              ❓使い方
            </button>
          )}
          <button
            onClick={() => setIsFormExpanded(!isFormExpanded)}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
          >
            {isFormExpanded ? '閉じる' : '開く'}
          </button>
        </div>
      </div>

      {isFormExpanded && (
        <form onSubmit={handleRefineAndPreview} className="space-y-2.5">
          {/* テキスト入力エリア */}
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onBlur={() => setRawText(applyGalvaTerminology(rawText))}
              placeholder="マイクで話すか、殴り書き入力（例: パイプ端っこが黒ずんでる。酸洗やり直し？ジンクリッチ塗っていい？）"
              rows={2}
              className={`w-full text-xs bg-slate-900/90 border rounded-xl p-2.5 ${
                rawText || isVoiceRecording ? 'pr-24' : 'pr-3'
              } text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 resize-none transition-all leading-relaxed ${
                isVoiceRecording
                  ? 'border-red-500 ring-2 ring-red-500/50 bg-red-950/20'
                  : 'border-slate-700/80 focus:ring-sky-500/50 focus:border-sky-500'
              }`}
            />

            {/* 右上操作ボタン群（録音中バッジ ＆ ×全削除クリアボタン） */}
            <div className="absolute right-2 top-2 flex items-center gap-1.5 z-20">
              {isVoiceRecording && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/95 border border-red-400 text-xs text-white font-bold animate-pulse shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>録音中（息継ぎOK）</span>
                </div>
              )}

              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    baseTextBeforeRecordingRef.current = '';
                    setVoiceError(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-900/90 hover:bg-rose-600 border border-rose-500/80 text-rose-100 hover:text-white text-xs font-black transition-all shadow-lg active:scale-90 cursor-pointer"
                  title="入力テキストを全削除して一からやり直す"
                >
                  <X className="w-3.5 h-3.5 stroke-[3] text-rose-300 group-hover:text-white" />
                  <span>× 全消去</span>
                </button>
              )}
            </div>
          </div>

          {/* 💡 類似質問・重複防止サジェスト表示 */}
          {similarMatches.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-2.5 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] text-amber-300 font-black">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>💡 似た質問・既存回答が見つかりました（重複防止）</span>
                </div>
                <span className="text-[10px] text-amber-400/80 font-normal">
                  {similarMatches.length}件合致
                </span>
              </div>

              <div className="space-y-1.5">
                {similarMatches.map((m) => (
                  <div
                    key={m.question.id}
                    className="bg-slate-900/90 hover:bg-slate-850 p-2 rounded-lg border border-amber-500/20 flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-bold px-1 rounded bg-amber-500/20 text-amber-300">
                          No.{m.question.no}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {m.matchedReason}
                        </span>
                        {m.question.has_voice_answer && (
                          <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/40 font-bold shrink-0">
                            👑回答済
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-200 truncate">
                        {m.question.title}
                      </p>
                      {m.question.worker_summary?.immediate_action && (
                        <p className="text-[10px] text-slate-400 truncate">
                          処置: {m.question.worker_summary.immediate_action}
                        </p>
                      )}
                    </div>

                    {onSelectQuestion && (
                      <button
                        type="button"
                        onClick={() => onSelectQuestion(m.question)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shrink-0 transition-all shadow"
                        title="この既存回答を開いて確認する"
                      >
                        <span>既存回答を見る</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {voiceError && (
            <p className="text-[10px] text-rose-400 leading-tight">
              ⚠️ {voiceError}
            </p>
          )}

          {/* 写真プレビュー（添付時のみ） */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {imagePreviews.map((img, i) => (
                <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700">
                  <img src={img} alt="現場写真" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-black/80 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 🌟 ボタン配置の最適化：写真の横スペースに「AIで具体化して登録」ボタンを配置！ */}
          <div className="grid grid-cols-12 gap-1.5 items-center">
            {/* 1. 音声で話すボタン（幅3/12） */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`col-span-3 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                isVoiceRecording
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/40'
                  : 'bg-sky-950/80 hover:bg-sky-900 border border-sky-600/60 text-sky-300'
              }`}
              title={isVoiceRecording ? '停止' : 'マイクで音声入力'}
            >
              {isVoiceRecording ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>停止</span>
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 text-sky-400" />
                  <span>🎙️ 音声</span>
                </>
              )}
            </button>

            {/* 2. 写真追加ボタン（幅3/12） */}
            <label className="col-span-3 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 font-semibold cursor-pointer transition-colors shadow-sm">
              <Camera className="w-3 h-3 text-sky-400" />
              <span>📷 写真</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* 3. 🌟 写真のすぐ横：AIで具体化して登録ボタン（幅6/12） */}
            <button
              type="submit"
              disabled={isSubmitting || (!rawText.trim() && imagePreviews.length === 0)}
              className="col-span-6 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:to-blue-500 text-white text-[11px] font-black shadow-md shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>具体化中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  <span className="truncate">✨ AI具体化プレビュー</span>
                </>
              )}
            </button>
          </div>

          {/* 分野選択（コンパクトな下段配置） */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span className="shrink-0">カテゴリ:</span>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value as any)}
              className="text-[11px] bg-slate-900 border border-slate-700 text-slate-300 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500 max-w-[200px]"
            >
              <option value="AUTO">分野: AI自動判定</option>
              {categoryList.map((catId) => (
                <option key={catId} value={catId}>
                  {catId}: {CATEGORIES[catId].name}
                </option>
              ))}
            </select>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 🌟 AI仮回答プレビュー ＆ 「こちらを登録しますか？」確認モーダル */}
      {/* ========================================================================= */}
      {previewData &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border-2 border-cyan-500/70 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-500/20 overflow-hidden">
              {/* モーダルヘッダー */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>✨ AIによる質問具体化 ＆ 仮回答の確認</span>
                    </h3>
                    <p className="text-xs text-cyan-300/90 mt-0.5 font-medium">
                      AIが以下の内容で具体化・仮解説を作成しました。こちらをバイブルに登録しますか？
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCancelPreview}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* モーダル本文（AI生成プレビュー内容） */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-200 custom-scrollbar text-xs">
                {/* 1. 具体化された質問タイトル */}
                <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-cyan-500/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      【具体化された質問タイトル（登録予定: No.{previewData.question.no}）】
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 font-mono">
                      {previewData.question.category_id}: {CATEGORIES[previewData.question.category_id]?.name}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white leading-snug">
                    {previewData.question.title}
                  </h4>
                  {previewData.question.raw_text && (
                    <p className="text-[11px] text-slate-400 font-mono pt-1">
                      💬 元の現場メモ: {previewData.question.raw_text}
                    </p>
                  )}
                </div>

                {/* 2. AI標準理論・教科書仮解説 */}
                <div className="bg-slate-950/90 p-3.5 sm:p-4 rounded-2xl border border-blue-500/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-sky-300 font-bold text-xs">
                    <Bot className="w-4 h-4 text-sky-400" />
                    <span>🤖 【AI標準理論・技術解説（教科書）】</span>
                  </div>
                  <p className="text-slate-100 leading-relaxed whitespace-pre-line text-xs">
                    {previewData.question.ai_standard_answer?.theory ||
                      previewData.knowledge?.cause ||
                      '標準理論データを生成中...'}
                  </p>

                  {(previewData.question.ai_standard_answer?.standard_criteria ||
                    previewData.question.suggested_criteria ||
                    previewData.knowledge?.action_and_criteria) && (
                    <div className="mt-2 p-2.5 rounded-xl bg-sky-950/60 border border-sky-800/60 text-sky-200 text-[11px]">
                      <strong className="text-cyan-300 block mb-0.5">⚖️ JIS H 8641 合否基準：</strong>
                      {previewData.question.ai_standard_answer?.standard_criteria ||
                        previewData.question.suggested_criteria ||
                        previewData.knowledge?.action_and_criteria}
                    </div>
                  )}
                </div>

                {/* 3. 現場作業員要約（3秒即断）プレビュー */}
                {previewData.question.worker_summary && (
                  <div className="bg-slate-950/90 p-3.5 sm:p-4 rounded-2xl border border-amber-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-amber-400" />
                        <span>👷 【現場作業員サマリー（3秒即断カード）】</span>
                      </span>
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ${
                          previewData.question.worker_summary.verdict_ok_ng === 'OK（合格/許容）'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : previewData.question.worker_summary.verdict_ok_ng === '危険（作業即停止）'
                            ? 'bg-red-950 text-red-300 border-red-500 animate-pulse'
                            : 'bg-rose-950 text-rose-300 border-rose-500'
                        }`}
                      >
                        判定: {previewData.question.worker_summary.verdict_ok_ng}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-slate-100">
                        <strong className="text-emerald-400 block mb-0.5">【今すぐやる処置】</strong>
                        {previewData.question.worker_summary.immediate_action}
                      </div>
                      <div className="p-2 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200">
                        <strong className="text-red-400 block mb-0.5">⚠️ 絶対やってはいけないNG行動</strong>
                        {previewData.question.worker_summary.forbidden_action}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* モーダルフッター（確定登録 / 修正 / キャンセル） */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 text-center sm:text-left">
                  ※ 登録後も、村上本部長による音声回答の上書きや直接編集が可能です。
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    ✏️ 修正する
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmRegistration}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>✅ この内容で登録する</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

