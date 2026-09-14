'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QuestionQueueItem, KnowledgeRecord, CATEGORIES } from '@/types';
import {
  Volume2,
  Square,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Bot,
  Wrench,
  HelpCircle,
  Lightbulb,
  ImageIcon,
  Camera,
  X,
  Award,
  Edit3,
  Trash2,
  Keyboard,
  Mic,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioVisualizer } from './AudioVisualizer';

interface InterviewWorkspaceProps {
  selectedQuestion: QuestionQueueItem | null;
  autoStartTrigger?: boolean;
  onKnowledgeSaved: (newRecord: KnowledgeRecord) => void;
  onOpenManual?: () => void;
  onOpenEditModal?: (questionId: string) => void;
}

type InterviewState = 'IDLE' | 'SPEAKING_QUESTION' | 'RECORDING' | 'ANALYZING' | 'DONE';
type InputMode = 'VOICE' | 'TEXT';

export const InterviewWorkspace: React.FC<InterviewWorkspaceProps> = ({
  selectedQuestion,
  autoStartTrigger,
  onKnowledgeSaved,
  onOpenManual,
  onOpenEditModal,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('VOICE');
  const [interviewState, setInterviewState] = useState<InterviewState>('IDLE');
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [manualAnswerText, setManualAnswerText] = useState('');
  const [answerImagePreviews, setAnswerImagePreviews] = useState<string[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setInterviewState('IDLE');
    setSpokenTranscript('');
    setManualAnswerText('');
    setAnswerImagePreviews([]);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setErrorMsg(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (autoStartTrigger && selectedQuestion) {
      setInputMode('VOICE');
      handleStartInterview();
    }
  }, [selectedQuestion?.id, autoStartTrigger]);

  const handleAnswerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAnswerImagePreviews((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAnswerImage = (index: number) => {
    setAnswerImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartInterview = () => {
    if (!selectedQuestion) return;
    setErrorMsg(null);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const questionTextToRead = selectedQuestion.refined_question || selectedQuestion.title;
    const prefix = selectedQuestion.is_answered ? '本部長、この質問への追加・補足のノウハウについて' : '本部長、';
    const speechPrompt = `${prefix}${questionTextToRead} について教えてください。`;

    if ('speechSynthesis' in window) {
      setInterviewState('SPEAKING_QUESTION');
      const utterance = new SpeechSynthesisUtterance(speechPrompt);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      let timerStarted = false;
      let keepAliveInterval: NodeJS.Timeout | null = null;
      let watchdogTimer: NodeJS.Timeout | null = null;

      const cleanupAndProceed = () => {
        if (timerStarted) return;
        timerStarted = true;
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        if (watchdogTimer) clearTimeout(watchdogTimer);
        startRecording();
      };

      // 🛡️ Keep-Alive & Watchdog (最大8秒または文字数に応じた安全タイムアウトで確実にマイク起動へ移行)
      const timeoutMs = Math.max(6000, speechPrompt.length * 400 + 2000);
      watchdogTimer = setTimeout(cleanupAndProceed, timeoutMs);

      keepAliveInterval = setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 4000);

      utterance.onend = () => {
        cleanupAndProceed();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error, starting mic directly:', e);
        cleanupAndProceed();
      };

      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setInterviewState('RECORDING');

      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setSpokenTranscript(current);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err: any) {
      console.error('Audio recording failed:', err);
      setErrorMsg('マイクへのアクセスが許可されていないか、録音機器が見つかりません。「テキストで入力」をご利用ください。');
      setInterviewState('IDLE');
    }
  };

  const handleStopAndProcess = async () => {
    if (interviewState !== 'RECORDING' && !manualAnswerText.trim() && answerImagePreviews.length === 0) return;

    setInterviewState('ANALYZING');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      let audioBase64 = '';
      let mimeType = 'audio/webm';

      if (recordedAudioBlob) {
        const reader = new FileReader();
        audioBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(recordedAudioBlob);
        });
      }

      const spokenFinal = manualAnswerText.trim() || spokenTranscript.trim();

      const allImages = [
        ...(selectedQuestion?.images || []),
        ...answerImagePreviews,
      ];

      let createdRecord: KnowledgeRecord | null = null;

      try {
        const response = await fetch('/api/process-knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: selectedQuestion?.id,
            questionTitle: selectedQuestion?.title,
            categoryId: selectedQuestion?.category_id,
            audioBase64: audioBase64 || undefined,
            audioMimeType: mimeType,
            spokenText: spokenFinal,
            images: allImages,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const resData = await response.json();
          if (response.ok && resData.data) {
            createdRecord = resData.data;
          }
        }
      } catch (apiErr) {
        console.warn('API knowledge process call failed, using client fallback:', apiErr);
      }

      // クライアント側スマートフォールバック（API失敗時・オフライン時）
      if (!createdRecord) {
        const q = selectedQuestion;
        const finalTxt = spokenFinal || '（現場職長の口頭回答・指導録音）';

        let verdict: any = '判定要注意（膜厚測定要）';
        if (finalTxt.includes('OK') || finalTxt.includes('大丈夫') || finalTxt.includes('問題ない') || finalTxt.includes('合格')) {
          verdict = 'OK（合格/許容）';
        } else if (finalTxt.includes('危険') || finalTxt.includes('即停止') || finalTxt.includes('絶対ダメ') || finalTxt.includes('爆発')) {
          verdict = '危険（作業即停止）';
        } else if (finalTxt.includes('NG') || finalTxt.includes('やり直し') || finalTxt.includes('手直し')) {
          verdict = '手直し要（再酸洗/再めっき）';
        }

        createdRecord = {
          id: `k-answer-${Date.now()}`,
          question_id: q?.id || `q-${Date.now()}`,
          category_id: q?.category_id || 'CAT-1',
          question_title: q?.title || 'めっき技術相談',
          original_question: q?.raw_text || q?.refined_question || '',
          full_transcript: finalTxt,
          phenomenon: q?.worker_summary?.summary_phenomenon || q?.title || '',
          cause: '現場における素地条件・前処理状態または亜鉛浴条件',
          action_and_criteria: finalTxt,
          prevention: '前処理ラインの定期点検および作業手順の再徹底',
          key_terminology: ['JIS H 8641', '現場判断', '溶融亜鉛めっき'],
          cause_category: '前処理薬品・洗浄',
          action_category: '酸洗・前処理手直し',
          worker_summary: {
            verdict_ok_ng: verdict,
            summary_phenomenon: q?.worker_summary?.summary_phenomenon || q?.title || '',
            immediate_action: finalTxt.length > 60 ? finalTxt.slice(0, 60) + '...' : finalTxt,
            forbidden_action: q?.worker_summary?.forbidden_action || '自己判断で不適切な補修を行わないこと。',
          },
          images: allImages,
          has_voice_answer: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      onKnowledgeSaved(createdRecord);

      setInterviewState('DONE');

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#0ea5e9', '#f59e0b', '#10b981'],
      });
    } catch (err: any) {
      console.error('Error processing knowledge:', err);
      setErrorMsg(err.message || 'ナレッジ解析中にエラーが発生しました');
      setInterviewState('IDLE');
    }
  };

  const selectedCatInfo = selectedQuestion
    ? CATEGORIES[selectedQuestion.category_id]
    : null;

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5 lg:p-6 shadow-2xl relative overflow-hidden space-y-5">
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>ワークスペース：2本立てナレッジ伝承</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-950 border border-sky-600/60 text-sky-300 font-bold flex items-center gap-1 shadow-sm">
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            ① AI仮解説（青）
          </span>
          <span className="text-slate-500 font-bold">＋</span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-500/80 text-amber-300 font-bold flex items-center gap-1 shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            ② 本部長回答（金）
          </span>
          {onOpenManual && (
            <button
              onClick={onOpenManual}
              className="ml-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 border border-amber-600/50 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
              title="村上本部長向け回答操作ガイドを開く"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>本部長ガイド</span>
            </button>
          )}
        </div>
      </div>

      {selectedQuestion ? (
        <div className="space-y-4">
          {/* 選択質問のタイトルカード */}
          <div className="bg-slate-950/90 rounded-2xl p-4 lg:p-5 border border-cyan-500/40 shadow-inner space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  No.{selectedQuestion.no}
                </span>
                {selectedCatInfo && (
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded border ${selectedCatInfo.badgeBg} ${selectedCatInfo.badgeBorder} ${selectedCatInfo.badgeText}`}
                  >
                    {selectedCatInfo.id}: {selectedCatInfo.name}
                  </span>
                )}
                {selectedQuestion.has_voice_answer ? (
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-600/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    👑 本部長回答済み
                  </span>
                ) : (
                  <span className="text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-600/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    🤖 AI標準仮解説（録音・追記待ち）
                  </span>
                )}
              </div>

              {/* ✏️ 編集・削除ボタン（上部クイックアクセス） */}
              {onOpenEditModal && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(selectedQuestion.id)}
                    className="px-3 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="この質問・回答の全内容を直接テキスト編集・修正"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>✏️ 編集</span>
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-lg lg:text-xl font-extrabold text-white leading-snug">
              {selectedQuestion.title}
            </h3>

            {/* 質問側の添付写真 */}
            {selectedQuestion.images && selectedQuestion.images.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  三浦さんの質問写真（現物サンプル）:
                </span>
                <div className="flex gap-2">
                  {selectedQuestion.images.map((imgUrl, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border-2 border-slate-700 w-28 h-20 shadow-md">
                      <img src={imgUrl} alt="現場サンプル" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedQuestion.refined_question && (
              <p className="text-xs lg:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {selectedQuestion.refined_question}
              </p>
            )}
          </div>

          {/* ============================================================ */}
          {/* 🌟 色分け 1：AIによる仮解説（青・スカイブルー系テーマ） */}
          {/* ============================================================ */}
          <div className="bg-gradient-to-br from-slate-900/90 via-sky-950/40 to-slate-900/90 rounded-2xl p-4 lg:p-5 border-2 border-sky-500/50 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                <Bot className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-extrabold text-sky-300">【柱1：AIによる標準理論・仮解説】</span>
              </div>
              <span className="text-[10px] text-sky-200 bg-sky-900/70 px-2 py-0.5 rounded-full border border-sky-500/60 font-semibold">
                🤖 JIS H 8641 標準教科書知見
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs lg:text-sm">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-sky-900/60 space-y-1">
                <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-sky-400" />
                  標準合否ライン・手直し基準
                </span>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {selectedQuestion.ai_standard_answer?.standard_criteria ||
                    selectedQuestion.suggested_criteria ||
                    '軽微な欠陥は規定ジンクリッチペイント（JIS K 5553）でタッチアップ。素地露出大または密着不良時は酸剥離再処理。'}
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-sky-900/60 space-y-1">
                <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                  現場確認チェックポイント
                </span>
                <div className="space-y-1">
                  {(selectedQuestion.ai_standard_answer?.points_to_check || selectedQuestion.key_check_points || []).map((pt, i) => (
                    <div key={i} className="text-slate-200 text-xs flex items-center gap-1">
                      <span className="text-sky-400 font-bold">✓</span> {pt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 🌟 色分け 2：村上本部長の現場回答（ゴールド・アンバー系テーマ） */}
          {/* ============================================================ */}
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-orange-950/40 rounded-2xl p-4 lg:p-5 border-2 border-amber-500/70 shadow-xl shadow-amber-950/30 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* ヘッダー ＆ 入力モードタブ（🎙️ 音声 vs ✍️ テキスト） */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2 text-amber-300">
                <Award className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-sm font-black text-amber-300 tracking-wide">
                  【柱2：村上本部長の現場回答・ノウハウ登録】
                </span>
              </div>

              {/* 音声 / テキスト 切り替えタブ */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-amber-500/40">
                <button
                  type="button"
                  onClick={() => setInputMode('VOICE')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                    inputMode === 'VOICE'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-amber-300 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>🎙️ 音声で入力</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('TEXT')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                    inputMode === 'TEXT'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-amber-300 hover:text-white'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>✍️ テキストで入力</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-amber-100/90 leading-relaxed">
              {inputMode === 'VOICE'
                ? 'マイクを使って口頭で回答を吹き込んでください。音声から自動で文字起こし ＆ 構造化されます。'
                : 'キーボードで本部長の現場アドバイス・手直しのコツ・絶対禁止事項を直接入力して保存できます。'}
            </p>

            {/* 回答側の写真添付エリア */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  本部長の手直し写真・現場事例写真（任意）:
                </span>
                <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold cursor-pointer transition-colors shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  <span>写真を追加</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAnswerImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {answerImagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {answerImagePreviews.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-amber-500/60 shadow-md">
                      <img src={img} alt="回答写真" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeAnswerImage(i)}
                        className="absolute top-0.5 right-0.5 bg-black/80 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* MODE 1: 音声入力 */}
            {inputMode === 'VOICE' && (
              <div className="space-y-3">
                <AudioVisualizer isRecording={interviewState === 'RECORDING'} />

                {interviewState === 'RECORDING' && spokenTranscript && (
                  <div className="p-3.5 bg-slate-950/90 rounded-xl border border-amber-500/40 text-xs lg:text-sm text-amber-200 shadow-inner">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      リアルタイム音声認識中:
                    </span>
                    {spokenTranscript}
                  </div>
                )}

                <div className="pt-1">
                  {interviewState === 'IDLE' && (
                    <button
                      onClick={handleStartInterview}
                      className="w-full py-4 lg:py-5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base lg:text-lg shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Volume2 className="w-5 h-5 animate-bounce" />
                      </div>
                      <span>
                        {selectedQuestion.has_voice_answer
                          ? '🎙️ 質問を聞いて回答を補足・追記する'
                          : '🔊 質問を聞いて口頭で回答する（録音スタート）'}
                      </span>
                    </button>
                  )}

                  {interviewState === 'SPEAKING_QUESTION' && (
                    <div className="w-full py-4 lg:py-5 px-6 rounded-2xl bg-sky-950/80 border border-sky-500/50 text-sky-200 font-bold text-base flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                      <span>質問を自動読み上げ中...（終了後に自動でマイクが起動します）</span>
                    </div>
                  )}

                  {interviewState === 'RECORDING' && (
                    <button
                      onClick={handleStopAndProcess}
                      className="w-full py-4 lg:py-5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-base lg:text-lg shadow-xl shadow-rose-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 animate-pulse"
                    >
                      <Square className="w-5 h-5 fill-current" />
                      <span>話し終わったらタップしてAI登録（録音停止）</span>
                    </button>
                  )}

                  {interviewState === 'ANALYZING' && (
                    <div className="w-full py-4 lg:py-5 px-6 rounded-2xl bg-slate-900 border border-cyan-500/50 text-cyan-300 font-bold text-base flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                      <span>めっき現場辞書で誤変換補正 ＆ 写真・ナレッジ構造化中...</span>
                    </div>
                  )}

                  {interviewState === 'DONE' && (
                    <div className="w-full py-4 px-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-sm lg:text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>本部長の回答・写真がAIバイブルに正常保存されました！</span>
                      </div>
                      <button
                        onClick={() => setInterviewState('IDLE')}
                        className="text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        さらに追記する
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE 2: テキスト直接入力 */}
            {inputMode === 'TEXT' && (
              <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-amber-500/40">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Keyboard className="w-4 h-4 text-amber-400" />
                    <span>村上本部長の回答メモ・実践指導テキスト:</span>
                  </label>
                  <textarea
                    value={manualAnswerText}
                    onChange={(e) => setManualAnswerText(e.target.value)}
                    placeholder="本部長の回答を入力（例: 戻り錆は薄い黄色ならフラックスで溶けるから大丈夫。黒ずんだら再酸洗。水洗後3分以上放置しないのが鉄則だ...）"
                    rows={4}
                    className="w-full text-xs lg:text-sm bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">
                    ※ 入力したテキストからAIが「現象・原因・JIS処置・絶対NG」を自動構造化してバイブルに即時保存します
                  </span>

                  <button
                    type="button"
                    onClick={handleStopAndProcess}
                    disabled={interviewState === 'ANALYZING' || (!manualAnswerText.trim() && answerImagePreviews.length === 0)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/30 active:scale-95 ml-auto"
                  >
                    {interviewState === 'ANALYZING' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>AI構造化保存中...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>テキスト ＆ 写真からAIバイブルに登録・保存</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-medium text-slate-300">
            左ペインの「200問インデックス」から質問を選択してください
          </p>
        </div>
      )}
    </div>
  );
};
