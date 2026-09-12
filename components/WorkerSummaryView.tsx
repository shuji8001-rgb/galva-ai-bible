'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { QuestionQueueItem, KnowledgeRecord, CATEGORIES, CategoryId } from '@/types';
import {
  HardHat,
  Search,
  Volume2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Wrench,
  ShieldAlert,
  ChevronRight,
  Filter,
  Camera,
  X,
  Mic,
  Square,
  Sparkles,
  Radio,
} from 'lucide-react';
import { findSimilarQuestions, SimilarMatchResult } from '@/lib/searchUtils';

interface WorkerSummaryViewProps {
  questions: QuestionQueueItem[];
  knowledgeList: KnowledgeRecord[];
  onSelectQuestionForDetails: (question: QuestionQueueItem) => void;
  onOpenManual?: () => void;
}

export const WorkerSummaryView: React.FC<WorkerSummaryViewProps> = ({
  questions,
  knowledgeList,
  onSelectQuestionForDetails,
  onOpenManual,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // 🎙️ 音声対話・音声検索ステート
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [voiceQueryText, setVoiceQueryText] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<{ query: string; matchedTitle: string; matchedNo: number } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthIntervalRef = useRef<any>(null);

  // 自然で流暢な日本語ボイスを優先検索する関数
  const getBestJapaneseVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const jaVoices = voices.filter(
      (v) =>
        v.lang === 'ja-JP' ||
        v.lang === 'ja_JP' ||
        v.lang.startsWith('ja') ||
        v.name.includes('Japanese') ||
        v.name.includes('日本語')
    );

    if (jaVoices.length === 0) return null;

    // 高品質なニューラル・自然音声（Google, Microsoft Natural, Apple Premium）を優先
    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const name = v.name.toLowerCase();
      if (name.includes('google') && (name.includes('日本語') || name.includes('ja'))) score += 100;
      if (name.includes('natural') || name.includes('online')) score += 90;
      if (name.includes('nanami')) score += 80;
      if (name.includes('keita')) score += 75;
      if (name.includes('haruka') || name.includes('ayumi') || name.includes('ichiro')) score += 70;
      if (name.includes('kyoko') || name.includes('otoya') || name.includes('siri') || name.includes('premium')) score += 60;
      return score;
    };

    jaVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return jaVoices[0];
  };

  // ボイスの非同期ロード対応
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 自然で聞き取りやすいナレーション原稿を生成
  const formatSpeechNarration = (q: QuestionQueueItem): string => {
    const no = q.no;
    const title = q.title
      .replace(/[（\(].*?[）\)]/g, '')
      .replace(/[【】「」『』［］\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let verdictRaw = q.worker_summary?.verdict_ok_ng || '';
    let verdictSpeech = '要確認です';
    if (verdictRaw.includes('OK') || verdictRaw.includes('合格') || verdictRaw.includes('許容')) {
      verdictSpeech = 'オーケー、許容範囲です';
    } else if (verdictRaw.includes('危険') || verdictRaw.includes('停止')) {
      verdictSpeech = '危険、作業を直ちに停止してください';
    } else if (verdictRaw.includes('NG') || verdictRaw.includes('手直し')) {
      verdictSpeech = 'エヌジー、手直しが必要です';
    }

    const cleanAction = (q.worker_summary?.immediate_action || '品質管理担当に確認してください')
      .replace(/[\r\n]+/g, '。')
      .replace(/[・\-\*①②③④⑤■◆●]/g, '')
      .replace(/[（\(].*?[）\)]/g, '')
      .replace(/[：:]/g, '、')
      .replace(/。+/g, '。')
      .trim();

    const cleanForbidden = (q.worker_summary?.forbidden_action || '')
      .replace(/[\r\n]+/g, '。')
      .replace(/[・\-\*①②③④⑤■◆●]/g, '')
      .replace(/[（\(].*?[）\)]/g, '')
      .replace(/[：:]/g, '、')
      .replace(/。+/g, '。')
      .trim();

    let script = `${no}番、${title}。判定は、${verdictSpeech}。今すぐ行う処置は、${cleanAction}。`;
    if (cleanForbidden && cleanForbidden !== '特になし' && !cleanForbidden.includes('なし')) {
      script += `なお、絶対にやってはいけないNG行動は、${cleanForbidden}です。`;
    }

    return script;
  };

  // 音声読み上げ
  const handleSpeakSummary = (q: QuestionQueueItem) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('お使いのブラウザは音声読み上げに対応していません。');
      return;
    }

    // すでに同じカードを再生中の場合は停止
    if (speakingId === q.id) {
      window.speechSynthesis.cancel();
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      setSpeakingId(null);
      currentUtteranceRef.current = null;
      return;
    }

    // いったん停止＆キュー詰まり解除
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);

    const narrationText = formatSpeechNarration(q);
    const uttr = new SpeechSynthesisUtterance(narrationText);
    uttr.lang = 'ja-JP';
    uttr.rate = 1.02; // 聞き取りやすく自然な速度
    uttr.pitch = 1.0;

    const jaVoice = getBestJapaneseVoice();
    if (jaVoice) {
      uttr.voice = jaVoice;
    }

    // GC対策: refに保持
    currentUtteranceRef.current = uttr;

    uttr.onstart = () => {
      setSpeakingId(q.id);
    };

    uttr.onend = () => {
      setSpeakingId(null);
      currentUtteranceRef.current = null;
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    };

    uttr.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setSpeakingId(null);
      currentUtteranceRef.current = null;
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    };

    setSpeakingId(q.id);

    // Chromeの15秒フリーズバグ対策（定期的にresumeを実行）
    synthIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 4000);

    // ユーザー操作の同期的コンテキスト内で直接speakを実行（ブラウザのautoplayブロック回避）
    try {
      window.speechSynthesis.speak(uttr);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.error('speak failed:', err);
      setSpeakingId(null);
    }
  };

  // 🎙️ 音声で質問・ハンズフリー即断の開始
  const handleStartVoiceSearch = () => {
    if (isVoiceSearching) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsVoiceSearching(false);
      return;
    }

    setVoiceError(null);
    setVoiceFeedback(null);
    setVoiceQueryText('');

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setVoiceError('ブラウザが音声認識に対応していません。Google ChromeまたはEdgeをご利用ください。');
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsVoiceSearching(true);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setSpeakingId(null);
        }
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceQueryText(transcript);

        if (event.results[0].isFinal) {
          processVoiceQuery(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Worker voice search error:', e);
        if (e.error !== 'no-speech') {
          setVoiceError('音声が聞き取れませんでした。もう一度お試しください。');
        }
        setIsVoiceSearching(false);
      };

      recognition.onend = () => {
        setIsVoiceSearching(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Failed to start worker speech recognition:', err);
      setVoiceError('マイクの起動に失敗しました。');
      setIsVoiceSearching(false);
    }
  };

  // 音声クエリから最適合致する事象を特定して自動読み上げ
  const processVoiceQuery = (query: string) => {
    if (!query || query.trim().length === 0) return;

    const matches = findSimilarQuestions(query, questions, knowledgeList, 1, 0.15);
    if (matches.length > 0) {
      const best = matches[0].question;
      setVoiceFeedback({
        query: query,
        matchedTitle: best.title,
        matchedNo: best.no,
      });
      setSearchQuery(''); // 検索フィルターを解除して全件中からフォーカス
      setVerdictFilter('ALL');
      setHighlightedCardId(best.id);

      // 該当カードへスクロール
      setTimeout(() => {
        const el = document.getElementById(`worker-card-${best.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // 自動音声読み上げを発火
      handleSpeakSummary(best);
    } else {
      setVoiceFeedback({
        query: query,
        matchedTitle: '該当する事象が見つかりませんでした。キーワードを変えてお話しください。',
        matchedNo: 0,
      });
    }
  };

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (selectedCat !== 'ALL' && q.category_id !== selectedCat) return false;
      if (verdictFilter !== 'ALL' && q.worker_summary?.verdict_ok_ng !== verdictFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(query);
        const inPhenom = q.worker_summary?.summary_phenomenon?.toLowerCase().includes(query) || false;
        const inAction = q.worker_summary?.immediate_action?.toLowerCase().includes(query) || false;
        const inNo = q.no.toString().includes(query);
        if (!inTitle && !inPhenom && !inAction && !inNo) return false;
      }

      return true;
    });
  }, [questions, selectedCat, verdictFilter, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-5 pb-16 px-1 sm:px-0">
      {/* 現場要約ヘッダー */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-4 sm:p-5 lg:p-6 rounded-2xl border-2 border-amber-500/50 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner shrink-0">
              <HardHat className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg lg:text-xl font-black text-white">
                  現場作業員専用 クイック判断サマリー
                </h2>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold shrink-0">
                  3秒即断モード
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-200/80 mt-0.5">
                「これOK？NG？」「今すぐ何をする？」「絶対ダメなこと」だけを一目で確認できます
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* 🎙️ 現場作業員専用 音声でAIに質問ボタン */}
            <button
              onClick={handleStartVoiceSearch}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs transition-all shadow-md shrink-0 ${
                isVoiceSearching
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse ring-2 ring-red-400'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 active:scale-95'
              }`}
              title="現場で声に出して質問するだけでAIが即答します"
            >
              {isVoiceSearching ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>聞き取り中...停止</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-slate-950" />
                  <span>🎙️ 声でAIに質問</span>
                </>
              )}
            </button>

            {/* テキスト検索 */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="事象・キーワード検索..."
                className="text-xs bg-slate-950 border border-amber-500/30 rounded-xl pl-9 pr-8 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-48"
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

            {onOpenManual && (
              <button
                onClick={onOpenManual}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/60 text-amber-300 text-xs font-bold transition-all shadow-sm shrink-0"
                title="現場作業員向けクイックガイドを開く"
              >
                <span>👷 ガイド</span>
              </button>
            )}
          </div>
        </div>

        {/* 🎙️ 音声対話リスニング＆案内バナー */}
        {(isVoiceSearching || voiceFeedback || voiceError) && (
          <div className="bg-slate-950/95 border border-amber-500/60 rounded-xl p-3 space-y-2 animate-fadeIn">
            {isVoiceSearching && (
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <Radio className="w-4 h-4 text-red-500 animate-ping" />
                <span>現場の声を聞き取っています...（例：「白サビが出た」「水蒸気爆発の穴あけは？」）</span>
              </div>
            )}

            {voiceQueryText && (
              <div className="text-xs bg-slate-900 p-2 rounded-lg border border-slate-700 text-slate-200 font-mono">
                🗣️ 『{voiceQueryText}』
              </div>
            )}

            {voiceFeedback && !isVoiceSearching && (
              <div className="flex items-center justify-between gap-2 text-xs bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-400">『{voiceFeedback.query}』 ➔ </span>
                    {voiceFeedback.matchedNo > 0 ? (
                      <span className="font-bold text-amber-300">
                        No.{voiceFeedback.matchedNo} {voiceFeedback.matchedTitle}（自動読み上げ中🔊）
                      </span>
                    ) : (
                      <span className="text-rose-300">{voiceFeedback.matchedTitle}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setVoiceFeedback(null)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {voiceError && (
              <div className="text-xs text-rose-400 flex items-center justify-between">
                <span>⚠️ {voiceError}</span>
                <button onClick={() => setVoiceError(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* クイック判定フィルター（OK / NG / 危険） - スマホ横スクロール対応 */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-800 text-xs overflow-x-auto no-scrollbar">
          <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            判定:
          </span>
          <button
            onClick={() => setVerdictFilter('ALL')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all shrink-0 ${
              verdictFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            すべて ({questions.length})
          </button>
          <button
            onClick={() => setVerdictFilter('OK（合格/許容）')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 ${
              verdictFilter === 'OK（合格/許容）'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>OK（合格出荷）</span>
          </button>
          <button
            onClick={() => setVerdictFilter('NG（手直し必須）')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 ${
              verdictFilter === 'NG（手直し必須）'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>NG（手直し要）</span>
          </button>
          <button
            onClick={() => setVerdictFilter('危険（作業即停止）')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 ${
              verdictFilter === '危険（作業即停止）'
                ? 'bg-red-600 text-white shadow animate-pulse'
                : 'bg-slate-800 text-red-400 hover:bg-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>⚠️ 危険（作業即停止）</span>
          </button>
        </div>
      </div>

      {/* 200問 作業員用クイックカードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {filtered.map((q) => {
          const sum = q.worker_summary;
          const isSpeaking = speakingId === q.id;
          const isHighlighted = highlightedCardId === q.id;

          let verdictBadgeClass = 'bg-slate-800 text-slate-200 border-slate-700';
          let verdictIcon = <AlertTriangle className="w-4 h-4 text-amber-400" />;

          if (sum?.verdict_ok_ng === 'OK（合格/許容）') {
            verdictBadgeClass = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 ring-1 ring-emerald-500/40';
            verdictIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
          } else if (sum?.verdict_ok_ng === 'NG（手直し必須）') {
            verdictBadgeClass = 'bg-rose-950/90 text-rose-300 border-rose-500/60 ring-1 ring-rose-500/40';
            verdictIcon = <XCircle className="w-4 h-4 text-rose-400" />;
          } else if (sum?.verdict_ok_ng === '危険（作業即停止）') {
            verdictBadgeClass = 'bg-red-950 text-red-200 border-red-500 ring-2 ring-red-500/60 animate-pulse';
            verdictIcon = <Flame className="w-4 h-4 text-red-400" />;
          }

          return (
            <div
              key={q.id}
              id={`worker-card-${q.id}`}
              className={`glass-card rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 transition-all duration-300 border ${
                isHighlighted
                  ? 'border-amber-400 ring-4 ring-amber-500/30 bg-amber-950/20'
                  : sum?.verdict_ok_ng === '危険（作業即停止）'
                  ? 'border-red-500/70 bg-red-950/10'
                  : 'border-slate-800 hover:border-amber-500/50'
              }`}
            >
              {/* カード上部：No, タイトル, 判定バッジ */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-xs font-mono font-black px-1.5 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700 shrink-0 mt-0.5">
                    No.{q.no}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {q.title}
                  </h3>
                </div>

                <div className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-black border shadow-sm shrink-0 ${verdictBadgeClass}`}>
                  {verdictIcon}
                  <span>{sum?.verdict_ok_ng || '要確認'}</span>
                </div>
              </div>

              {/* 写真サムネイルがある場合 */}
              {q.images && q.images.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                  <img
                    src={q.images[0]}
                    alt="現場見本写真"
                    className="w-14 h-11 object-cover rounded-lg border border-slate-700 shrink-0"
                  />
                  <span className="text-[11px] text-slate-300 font-medium">
                    実物写真サンプルあり
                  </span>
                </div>
              )}

              {/* 現場要約 3段ボックス */}
              <div className="space-y-2 text-xs">
                {/* 1. 今すぐやる処置 */}
                <div className="bg-slate-950/90 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>【今すぐやる処置】</span>
                  </div>
                  <p className="text-slate-100 font-medium leading-relaxed whitespace-pre-line pl-1 text-[11px] sm:text-xs">
                    {sum?.immediate_action}
                  </p>
                </div>

                {/* 2. ⚠️ 絶対やってはいけないNG行動 */}
                <div className="bg-red-950/30 p-2.5 rounded-xl border border-red-500/30 space-y-0.5">
                  <div className="flex items-center gap-1 text-red-400 font-bold text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>⚠️ 絶対やっちゃダメなこと！</span>
                  </div>
                  <p className="text-red-200 font-semibold leading-relaxed pl-1 text-[11px]">
                    {sum?.forbidden_action}
                  </p>
                </div>
              </div>

              {/* 下部アクションバー：音声読み上げ ＆ 詳細バイブルへ移動 */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs gap-2">
                <button
                  onClick={() => handleSpeakSummary(q)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    isSpeaking
                      ? 'bg-amber-500 text-slate-950 animate-pulse ring-2 ring-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSpeaking ? '停止' : '🔊 音声で聞く'}</span>
                </button>

                <button
                  onClick={() => onSelectQuestionForDetails(q)}
                  className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                >
                  <span>詳しい解説を見る</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

