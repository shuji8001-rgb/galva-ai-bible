'use client';

import React from 'react';
import {
  Sparkles,
  Layers,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  BarChart3,
  HardHat,
  HelpCircle,
} from 'lucide-react';
import { QuestionQueueItem, KnowledgeRecord } from '@/types';
import { ManualPersona } from '@/components/ManualModal';

export type MainViewMode = 'BIBLE' | 'ANALYTICS' | 'WORKER_SUMMARY';

interface HeaderProps {
  questions: QuestionQueueItem[];
  knowledgeList: KnowledgeRecord[];
  activeView: MainViewMode;
  onChangeView: (view: MainViewMode) => void;
  onResetDefaults: () => void;
  onOpenManual: (persona?: ManualPersona) => void;
}

export const Header: React.FC<HeaderProps> = ({
  questions,
  knowledgeList,
  activeView,
  onChangeView,
  onResetDefaults,
  onOpenManual,
}) => {
  const voiceAnsweredCount = questions.filter((q) => q.has_voice_answer).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? Math.round((voiceAnsweredCount / totalCount) * 100) : 0;

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 shadow-lg shadow-black/20">
      <div className="max-w-[1750px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
        
        {/* 上段（スマホ時）/ 左側（PC時）：ロゴ ＆ タイトル ＆ スマホ用マニュアル/リセットボタン */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-900 shadow-md shadow-cyan-500/20 ring-1 ring-white/20 shrink-0">
              <Layers className="w-5 h-5 text-white" />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-2 ring-slate-900">
                <Sparkles className="w-2.5 h-2.5 text-slate-950" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                  GALVA AI BIBLE
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  JIS H 8641準拠
                </span>
              </div>
              <h1 className="text-sm sm:text-base lg:text-lg font-extrabold tracking-tight galva-gradient-text line-clamp-1">
                溶融亜鉛めっき「技術伝承AIバイブル」
              </h1>
            </div>
          </div>

          {/* スマホ用 操作マニュアル ＆ リセットボタン（画面上部にコンパクト配置） */}
          <div className="flex items-center gap-1.5 md:hidden shrink-0">
            <button
              onClick={() => {
                const currentPersona: ManualPersona =
                  activeView === 'ANALYTICS'
                    ? 'ADMIN'
                    : activeView === 'WORKER_SUMMARY'
                    ? 'WORKER'
                    : 'MIURA';
                onOpenManual(currentPersona);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-[11px] font-bold shadow-sm"
              title="操作マニュアル"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>ガイド</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('初期サンプルデータ（200問個別AI解説＋本部長肉声例）にリセットしますか？')) {
                  onResetDefaults();
                }
              }}
              title="データ初期化"
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 中段（スマホ時）/ 中央（PC時）：🌟 3大ナビゲーションタブ */}
        <div className="flex items-center justify-between sm:justify-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs shadow-inner overflow-x-auto">
          <button
            onClick={() => onChangeView('BIBLE')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              activeView === 'BIBLE'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">📖 品質バイブル</span>
          </button>

          <button
            onClick={() => onChangeView('ANALYTICS')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              activeView === 'ANALYTICS'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">📊 品質分析</span>
          </button>

          <button
            onClick={() => onChangeView('WORKER_SUMMARY')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              activeView === 'WORKER_SUMMARY'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-extrabold'
                : 'text-amber-400/90 hover:text-amber-300'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">👷 現場作業員要約</span>
          </button>
        </div>

        {/* 下段（スマホ時）/ 右側（PC時）：本部長肉声収録メーター ＆ PC用マニュアル/リセットボタン */}
        <div className="flex items-center justify-between md:justify-end gap-2.5">
          <div className="flex flex-col flex-1 md:flex-initial md:min-w-[160px] bg-slate-950/60 md:bg-transparent p-1.5 md:p-0 rounded-lg md:rounded-none border md:border-none border-slate-800">
            <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1 text-amber-400">
                <span>👑 本部長音声</span>
              </span>
              <span>
                <strong className="text-amber-300 font-mono text-xs">{voiceAnsweredCount}</strong> / {totalCount}問
                <span className="text-amber-400 ml-1 font-mono">({progressPercent}%)</span>
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/50 mt-1">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, 3)}%` }}
              />
            </div>
          </div>

          {/* PC用 操作マニュアル ＆ リセットボタン */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const currentPersona: ManualPersona =
                  activeView === 'ANALYTICS'
                    ? 'ADMIN'
                    : activeView === 'WORKER_SUMMARY'
                    ? 'WORKER'
                    : 'MIURA';
                onOpenManual(currentPersona);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
              title="4つの役割視点での操作マニュアルを開く"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>📖 操作マニュアル</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('初期サンプルデータ（200問個別AI解説＋本部長肉声例）にリセットしますか？')) {
                  onResetDefaults();
                }
              }}
              title="データを初期200問マスターにリセット"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
