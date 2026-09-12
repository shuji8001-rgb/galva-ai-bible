'use client';

import React, { useMemo } from 'react';
import { QuestionQueueItem, KnowledgeRecord, CATEGORIES, CategoryId } from '@/types';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Mic,
  Award,
  BookOpen,
  Sparkles,
  Layers,
  Wrench,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  questions: QuestionQueueItem[];
  knowledgeList: KnowledgeRecord[];
  onSelectQuestion: (question: QuestionQueueItem) => void;
  onOpenManual?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  questions,
  knowledgeList,
  onSelectQuestion,
  onOpenManual,
}) => {
  // 1. 本部長音声収録進捗
  const voiceAnsweredCount = useMemo(
    () => questions.filter((q) => q.has_voice_answer).length,
    [questions]
  );
  const voiceProgressPercent = Math.round((voiceAnsweredCount / questions.length) * 100) || 0;

  // 2. カテゴリ別集計
  const categoryStats = useMemo(() => {
    const stats: Record<CategoryId, { total: number; voiceCount: number; name: string; color: string }> = {
      'CAT-1': { total: 0, voiceCount: 0, name: CATEGORIES['CAT-1'].name, color: 'bg-blue-500' },
      'CAT-2': { total: 0, voiceCount: 0, name: CATEGORIES['CAT-2'].name, color: 'bg-amber-500' },
      'CAT-3': { total: 0, voiceCount: 0, name: CATEGORIES['CAT-3'].name, color: 'bg-emerald-500' },
      'CAT-4': { total: 0, voiceCount: 0, name: CATEGORIES['CAT-4'].name, color: 'bg-rose-500' },
      'CAT-5': { total: 0, voiceCount: 0, name: CATEGORIES['CAT-5'].name, color: 'bg-purple-500' },
      'CAT-6': { total: 0, voiceCount: 0, name: CATEGORIES['CAT-6'].name, color: 'bg-cyan-500' },
    };

    questions.forEach((q) => {
      if (stats[q.category_id]) {
        stats[q.category_id].total += 1;
        if (q.has_voice_answer) {
          stats[q.category_id].voiceCount += 1;
        }
      }
    });
    return stats;
  }, [questions]);

  // 3. 根本原因カテゴリ集計
  const causeStats = useMemo(() => {
    const map: Record<string, number> = {};
    questions.forEach((q) => {
      const c = q.cause_category || 'その他・複合要因';
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [questions]);

  // 4. 現場処置カテゴリ集計
  const actionStats = useMemo(() => {
    const map: Record<string, number> = {};
    questions.forEach((q) => {
      const a = q.action_category || '現場判断';
      map[a] = (map[a] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [questions]);

  // 5. 現場作業員判定（OK / NG / 判定要 / 危険）集計
  const verdictStats = useMemo(() => {
    const map: Record<string, number> = {
      'OK（合格/許容）': 0,
      'NG（手直し必須）': 0,
      '判定要注意（膜厚測定要）': 0,
      '危険（作業即停止）': 0,
    };
    questions.forEach((q) => {
      if (q.worker_summary?.verdict_ok_ng) {
        map[q.worker_summary.verdict_ok_ng] = (map[q.worker_summary.verdict_ok_ng] || 0) + 1;
      }
    });
    return map;
  }, [questions]);

  // 危険（作業即停止）の重要質問リスト
  const criticalQuestions = useMemo(() => {
    return questions.filter((q) => q.worker_summary?.verdict_ok_ng === '危険（作業即停止）');
  }, [questions]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 px-1 sm:px-0">
      {/* ページタイトル ＆ ヘッダー概要 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 p-4 sm:p-5 lg:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg lg:text-xl font-black text-white">
                  溶融亜鉛めっき 品質知見・不具合トレンド分析
                </h2>
                <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                  TOTAL: {questions.length}件
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                全200問の品質管理課題から、発生メカニズム・根本原因・現場処置・安全危険因子を統計解析
              </p>
            </div>
          </div>

          {onOpenManual && (
            <button
              onClick={onOpenManual}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/60 text-cyan-300 text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-auto"
              title="管理者向け品質分析マニュアルを開く"
            >
              <span>📊 管理者分析ガイド</span>
            </button>
          )}
        </div>

        {/* トップKPIカード 4列 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">収録マスター件数</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{questions.length}</span>
              <span className="text-xs text-slate-400 font-semibold">問</span>
            </div>
            <span className="text-[10px] text-cyan-400 mt-1 block">全6分野完全網羅</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30">
            <span className="text-[11px] font-bold text-amber-300 block mb-0.5">本部長 肉声収録進捗</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-400 font-mono">{voiceAnsweredCount}</span>
              <span className="text-xs text-slate-400">/ {questions.length}問</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${voiceProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-rose-500/30">
            <span className="text-[11px] font-bold text-rose-300 block mb-0.5">要手直し・NG比率</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-400 font-mono">
                {verdictStats['NG（手直し必須）'] || 0}
              </span>
              <span className="text-xs text-slate-400">問</span>
            </div>
            <span className="text-[10px] text-rose-400/90 mt-1 block">ジンクリッチ・再めっき</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-red-500/40 bg-red-950/20">
            <span className="text-[11px] font-bold text-red-300 block mb-0.5">⚠️ 最重要安全危険項目</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-red-400 font-mono">
                {criticalQuestions.length}
              </span>
              <span className="text-xs text-red-300 font-semibold">問（作業即停止）</span>
            </div>
            <span className="text-[10px] text-red-400 mt-1 block">水蒸気爆発・水素脆化等</span>
          </div>
        </div>
      </div>

      {/* グリッド 2列：原因分析 ＆ 処置分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 原因カテゴリ別分布 */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <span>不具合・品質変動の根本原因 分布</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">要因別シェア</span>
          </div>

          <div className="space-y-3">
            {causeStats.map(([catName, count]) => {
              const pct = Math.round((count / questions.length) * 100);
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{catName}</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {count}件 ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 現場処置・手直しパターン分布 */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>現場手直し・処置パターン 分布</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">アクション別</span>
          </div>

          <div className="space-y-3">
            {actionStats.map(([actName, count]) => {
              const pct = Math.round((count / questions.length) * 100);
              return (
                <div key={actName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{actName}</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {count}件 ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* カテゴリ別進捗＆詳細一覧 */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>分野別（CAT-1〜CAT-6）知見蓄積状況</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(Object.entries(categoryStats) as [CategoryId, (typeof categoryStats)[CategoryId]][]).map(
            ([catId, info]) => {
              const catObj = CATEGORIES[catId];
              return (
                <div
                  key={catId}
                  className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${catObj.badgeBg} ${catObj.badgeBorder} ${catObj.badgeText}`}
                    >
                      {catId}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      計 <strong className="text-white">{info.total}</strong> 問
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200">{info.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{catObj.description}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">本部長肉声回答:</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1 font-mono">
                      <span>👑 {info.voiceCount}</span>
                      <span className="text-slate-500">/ {info.total}問</span>
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* ⚠️ 最重要：安全危険（作業即停止）項目の特別アラートパネル */}
      {criticalQuestions.length > 0 && (
        <div className="bg-red-950/40 p-5 rounded-2xl border-2 border-red-500/60 shadow-xl shadow-red-950/40 space-y-3">
          <div className="flex items-center gap-2.5 text-red-300">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
            <h3 className="text-sm font-black tracking-wide">
              【人命・重大事故防止】現場最重要安全危険項目（{criticalQuestions.length}件）
            </h3>
          </div>
          <p className="text-xs text-red-200 leading-relaxed">
            下記の事象は、水蒸気爆発・亜鉛飛散・水素脆化遅れ破壊など、作業員の安全に関わる最優先管理事項です。作業前に必ず全員で確認してください。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            {criticalQuestions.map((q) => (
              <div
                key={q.id}
                onClick={() => onSelectQuestion(q)}
                className="bg-slate-950/90 p-3 rounded-xl border border-red-500/40 hover:border-red-400 cursor-pointer transition-colors group flex items-start gap-2.5"
              >
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-700/50 shrink-0 mt-0.5">
                  No.{q.no}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-bold text-white group-hover:text-red-300 line-clamp-1">
                    {q.title}
                  </p>
                  <p className="text-[11px] text-red-300/90 leading-tight">
                    🚨 {q.worker_summary?.forbidden_action || '即座に作業停止・確認要'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
