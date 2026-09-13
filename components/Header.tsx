'use client';

import React, { useState, useEffect } from 'react';
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
  Palette,
} from 'lucide-react';
import { QuestionQueueItem, KnowledgeRecord } from '@/types';
import { ManualPersona } from '@/components/ManualModal';
import { AiSettingsModal } from '@/components/AiSettingsModal';
import { COLOR_THEMES, ColorThemeId, getStoredTheme, setStoredTheme } from '@/lib/theme';

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
  const [currentTheme, setCurrentTheme] = useState<ColorThemeId>('modern-galva');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const voiceAnsweredCount = questions.filter((q) => q.has_voice_answer).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? Math.round((voiceAnsweredCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentTheme(getStoredTheme());
      const handleThemeChange = (e: any) => {
        setCurrentTheme(e.detail || getStoredTheme());
      };
      window.addEventListener('theme-changed', handleThemeChange);
      return () => window.removeEventListener('theme-changed', handleThemeChange);
    }
  }, []);

  const handleSelectTheme = (themeId: ColorThemeId) => {
    setCurrentTheme(themeId);
    setStoredTheme(themeId);
    setIsThemeMenuOpen(false);
  };

  return (
    <>
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-header)] backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 lg:px-6 py-2 shadow-lg shadow-black/30 transition-colors duration-300">
        <div className="max-w-[1750px] mx-auto flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
          
          {/* 左側：ロゴ ＆ タイトル ＆ JISバッジ */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[var(--accent-color)] via-blue-600 to-slate-900 shadow-md ring-1 ring-white/20 shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 ring-2 ring-slate-900">
                  <Sparkles className="w-2 h-2 text-slate-950" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded bg-[var(--badge-bg)] border border-[var(--badge-border)] text-[var(--accent-color)]">
                    GALVA AI BIBLE
                  </span>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    JIS H 8641
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
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="p-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--accent-color)]"
                title="カラースタイル変更"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAiSettingsOpen(true)}
                className="p-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-main)]"
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
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--badge-bg)] border border-[var(--badge-border)] text-[var(--accent-color)] text-[11px] font-bold"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>ガイド</span>
              </button>
            </div>
          </div>

          {/* 中央：🌟 3大ナビゲーションタブ */}
          <div className="flex items-center justify-between sm:justify-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs shadow-inner shrink-0">
            <button
              onClick={() => onChangeView('BIBLE')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === 'BIBLE'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">品質バイブル</span>
            </button>

            <button
              onClick={() => onChangeView('WORKER_SUMMARY')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === 'WORKER_SUMMARY'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">職人サマリー</span>
            </button>

            <button
              onClick={() => onChangeView('ANALYTICS')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === 'ANALYTICS'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">分析・推移</span>
            </button>
          </div>

          {/* 右側：本部長肉声メーター ＆ カラースタイルセレクター ＆ 操作ボタン群（PC時） */}
          <div className="flex items-center justify-between xl:justify-end gap-3 shrink-0">
            {/* 収録進捗バー */}
            <div className="flex flex-col min-w-[130px] sm:min-w-[150px] bg-slate-800/80 xl:bg-transparent p-1 xl:p-0 rounded-lg border xl:border-none border-slate-700/60">
              <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-slate-200">
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
            <div className="hidden xl:flex items-center gap-2 relative">
              
              {/* 🎨 クイック カラースタイル切替ボタン */}
              <div className="relative">
                <button
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-sky-400 text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="濃淡カラースタイルを切り替え"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>スタイル</span>
                </button>

                {/* テーマドロップダウンメニュー */}
                {isThemeMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border-2 border-slate-300 shadow-2xl p-2 z-50 animate-fadeIn text-slate-800">
                    <div className="text-[10px] font-bold text-slate-500 px-2 py-1 mb-1 border-b border-slate-200">
                      🎨 濃淡カラースタイル選択
                    </div>
                    <div className="space-y-1">
                      {COLOR_THEMES.map((t) => {
                        const isSelected = currentTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleSelectTheme(t.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3.5 h-3.5 rounded-full border border-slate-300"
                                style={{ backgroundColor: t.previewColors.primary }}
                              />
                              <span className="truncate">{t.name}</span>
                            </div>
                            {isSelected && <span className="text-[10px] text-blue-600 font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsAiSettingsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="AIモデル＆API設定"
              >
                <Settings className="w-3.5 h-3.5 text-sky-400" />
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-sky-300 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="操作マニュアルを開く"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>マニュアル</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('初期サンプルデータ（200問個別AI解説＋本部長肉声例）にリセットしますか？')) {
                    onResetDefaults();
                  }
                }}
                title="データ初期化"
                className="p-1.5 rounded-lg bg-[var(--surface-card)] hover:bg-[var(--surface-card-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* モバイル時テーマ選択メニュー */}
      {isThemeMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white border-2 border-slate-300 p-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900">🎨 カラースタイル選択</span>
              <button
                onClick={() => setIsThemeMenuOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                ✕ 閉じる
              </button>
            </div>
            <div className="space-y-1.5">
              {COLOR_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                    currentTheme === t.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm'
                      : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: t.previewColors.primary }}
                    />
                    <span className="truncate">{t.name}</span>
                  </div>
                  {currentTheme === t.id && <span className="text-blue-600 font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AIモデル・APIキー設定モーダル */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />
    </>
  );
};
