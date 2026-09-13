'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  BarChart3,
  HardHat,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { QuestionQueueItem, KnowledgeRecord } from '@/types';
import { ManualPersona } from '@/components/ManualModal';
import { AiSettingsModal } from '@/components/AiSettingsModal';

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
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  const voiceAnsweredCount = questions.filter((q) => q.has_voice_answer).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? Math.round((voiceAnsweredCount / totalCount) * 100) : 0;

  return (
    <>
      <header className="border-b border-slate-800 bg-[#070d18]/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 lg:px-6 py-2.5 shadow-xl shadow-black/40">
        <div className="max-w-[1750px] mx-auto flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
          
          {/* 左側：ロゴ ＆ タイトル ＆ JISバッジ */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-900 shadow-md ring-1 ring-white/20 shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 ring-2 ring-slate-900">
                  <Sparkles className="w-2 h-2 text-slate-950" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                    GALVA AI BIBLE
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    JIS H 8641準拠
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span className="galva-gradient-text">
                    溶融亜鉛めっき「技術伝承AIバイブル」
                  </span>
                </h1>
              </div>
            </div>

            {/* モバイル用クイック操作ボタン */}
            <div className="flex items-center gap-1.5 xl:hidden">
              <button
                onClick={() => setIsAiSettingsOpen(true)}
                className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300"
                title="AI設定"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
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
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5" />
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

          {/* 中央：🌟 3大ナビゲーションタブ */}
          <div className="flex items-center justify-between sm:justify-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs shadow-inner shrink-0">
            <button
              onClick={() => onChangeView('BIBLE')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeView === 'WORKER_SUMMARY'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">👷 現場作業員要約</span>
            </button>
          </div>

          {/* 右側：本部長肉声メーター ＆ 操作ボタン群（PC時） */}
          <div className="flex items-center justify-between xl:justify-end gap-3 shrink-0">
            {/* 収録進捗バー */}
            <div className="flex flex-col min-w-[130px] sm:min-w-[150px] bg-slate-900/90 xl:bg-transparent p-1 xl:p-0 rounded-lg border xl:border-none border-slate-800">
              <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <span>👑 本部長音声</span>
                </span>
                <span>
                  <strong className="text-amber-300 font-mono text-xs">{voiceAnsweredCount}</strong> / {totalCount}問
                  <span className="text-amber-400 ml-1 font-mono">({progressPercent}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/60 mt-1">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(progressPercent, 3)}%` }}
                />
              </div>
            </div>

            {/* PC用操作ボタン群 */}
            <div className="hidden xl:flex items-center gap-2">
              <button
                onClick={() => setIsAiSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="AIモデル＆API設定"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI設定</span>
              </button>

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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="操作マニュアルを開く"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>マニュアル</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('初期サンプルデータ（200問個別AI解説＋本部長肉声例）にリセットしますか？')) {
                    onResetDefaults();
                  }
                }}
                title="データ初期化"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* AI知能モデル＆API設定モーダル */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />
    </>
  );
};
