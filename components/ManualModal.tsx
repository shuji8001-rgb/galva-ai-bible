'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HelpCircle,
  X,
  UserCheck,
  Award,
  BarChart3,
  HardHat,
  Sparkles,
  Camera,
  Mic,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Layers,
  ArrowRight,
  Bot,
  Wrench,
  Search,
  Filter,
  Check,
  Flame,
  XCircle,
  Play,
  RotateCcw,
  Tag,
} from 'lucide-react';

export type ManualPersona = 'MIURA' | 'MURAKAMI' | 'ADMIN' | 'WORKER';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPersona?: ManualPersona;
}

export const ManualModal: React.FC<ManualModalProps> = ({
  isOpen,
  onClose,
  initialPersona = 'MIURA',
}) => {
  const [activePersona, setActivePersona] = useState<ManualPersona>(initialPersona);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActivePersona(initialPersona);
  }, [initialPersona]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* モーダル最上部ヘッダー */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>溶融亜鉛めっき「技術伝承AIバイブル」ビジュアル操作マニュアル</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  画面イメージ解説版
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                実際の操作画面イメージを見ながら、4つの役割に応じた使い方が3分でわかります
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4視点タブ切り替えバー */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActivePersona('MIURA')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activePersona === 'MIURA'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30'
                : 'text-sky-300/80 hover:bg-slate-800/80'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>① 三浦さん（品管・質問側）</span>
          </button>

          <button
            onClick={() => setActivePersona('MURAKAMI')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activePersona === 'MURAKAMI'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'text-amber-300/80 hover:bg-slate-800/80'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>② 村上本部長（職人・回答側）</span>
          </button>

          <button
            onClick={() => setActivePersona('ADMIN')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activePersona === 'ADMIN'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'text-cyan-300/80 hover:bg-slate-800/80'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>③ 管理者（品質分析・統括）</span>
          </button>

          <button
            onClick={() => setActivePersona('WORKER')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activePersona === 'WORKER'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'text-emerald-300/80 hover:bg-slate-800/80'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>④ 現場作業員（3秒即断）</span>
          </button>
        </div>

        {/* マニュアル本文エリア */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 custom-scrollbar">
          {/* ============================================================ */}
          {/* 1. 三浦さん視点（画面イメージ付き） */}
          {/* ============================================================ */}
          {activePersona === 'MIURA' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 役割バナー */}
              <div className="bg-sky-950/40 border border-sky-500/40 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-sky-300">三浦さん（品管担当）の主な操作</h3>
                  <p className="text-xs text-sky-100/90 leading-relaxed mt-0.5">
                    現場で気になった不具合・疑問をスマホで殴り書き入力＆写真添付するだけ。Gemini 1.5 FlashがJIS H 8641規格に照らした具体的質問文と【AI標準理論・仮解説】を自動生成して即座に登録します。
                  </p>
                </div>
              </div>

              {/* 画面イメージ 1：質問投稿の流れ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 text-xs flex items-center justify-center font-black">1</span>
                    画面操作イメージ：現場質問メモの入力と類似質問（重複防止）サジェスト
                  </h4>
                  <span className="text-[11px] text-sky-400 font-mono">左ペイン上部</span>
                </div>

                {/* 実際のUIを模した高精細モックアップ */}
                <div className="bg-slate-950 rounded-2xl border-2 border-sky-500/40 p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                      <span className="text-xs font-bold text-sky-300">三浦さんの現場質問メモ（音声 / 殴り書き）</span>
                    </div>
                    <span className="text-[10px] text-slate-500">🎙️ 音声入力 / 📷 写真対応</span>
                  </div>

                  {/* 入力欄モック */}
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200">
                    <span className="text-slate-400 block text-[10px] mb-1">▼ 現場での殴り書き or マイク入力例</span>
                    <p className="font-mono text-sky-200 bg-slate-950/60 p-2 rounded border border-slate-800">
                      「パイプの端っこが茶色くサビてる。これって酸洗やり直し？それともそのまま浸けていいの？」
                    </p>
                  </div>

                  {/* 💡 類似質問・重複防止サジェストのモック */}
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
                      <span className="flex items-center gap-1.5">
                        💡 似た質問・既存回答が見つかりました（重複防止）
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-mono">AIリアルタイム検知</span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 font-bold mr-1">No.72</span>
                        <span className="text-[11px] font-bold text-white">酸洗後の戻り錆発生時の浸漬可否と処置</span>
                        <p className="text-[10px] text-slate-400 truncate">処置: 65℃フラックス液で還元溶解可能。そのまま浸漬OK</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-black text-[10px] shrink-0">
                        既存回答を見る →
                      </span>
                    </div>
                  </div>

                  {/* ボタン配置モック */}
                  <div className="grid grid-cols-12 gap-1.5 pt-1">
                    <div className="col-span-3 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-sky-950 border border-sky-600 text-[11px] font-bold text-sky-300">
                      <Mic className="w-3.5 h-3.5 text-sky-400" />
                      <span>🎙️ 音声</span>
                    </div>
                    <div className="col-span-3 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200">
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      <span>📷 写真</span>
                    </div>
                    <div className="col-span-6 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-[11px] shadow">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>✨ AI具体化登録</span>
                    </div>
                  </div>
                </div>

                {/* 変換後の生成イメージ */}
                <div className="flex items-center justify-center py-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 bg-slate-900/90 px-4 py-1.5 rounded-full border border-cyan-500/40">
                    <span>⚡ 新規質問ならAIがJIS規格と照合して一瞬で自動生成！</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-950 via-sky-950/30 to-slate-950 rounded-2xl border-2 border-cyan-500/50 p-4 space-y-2">
                  <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                    <Bot className="w-4 h-4" />
                    【自動生成される具体化質問 ＆ AI仮解説】
                  </span>
                  <p className="text-xs font-bold text-white">
                    【品管確認】酸洗後の戻り錆（茶褐色変色）の発生要因とフラックス許容基準
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-sky-800/50 text-slate-300">
                      <strong className="text-sky-300 block">🤖 標準理論：</strong>
                      水酸化鉄の急速酸化。65℃以上のフラックス液で還元溶解可能。
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-sky-800/50 text-slate-300">
                      <strong className="text-cyan-300 block">⚖️ JIS合否基準：</strong>
                      JIS H 8641: 薄い黄錆は許容、黒錆・粉吹きは再酸洗へ。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. 村上本部長視点（画面イメージ付き） */}
          {/* ============================================================ */}
          {activePersona === 'MURAKAMI' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 役割バナー */}
              <div className="bg-amber-950/40 border border-amber-500/50 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300">村上本部長（ベテラン職人）の主な操作</h3>
                  <p className="text-xs text-amber-100/90 leading-relaxed mt-0.5">
                    三浦さんの質問を耳で聞き、青色のAI仮解説を確認してマイクで口頭回答。「めっき専門用語AI辞書」が自動補正し、ゴールドの【本部長直伝ノウハウ】として保存。「👑済」マークが付きます。
                  </p>
                </div>
              </div>

              {/* 画面イメージ 2：本部長ワークスペース */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-black">2</span>
                    画面操作イメージ：本部長ワークスペースでの音声回答
                  </h4>
                  <span className="text-[11px] text-amber-400 font-mono">右ペイン上部</span>
                </div>

                {/* 実際のワークスペースを模したモックアップ */}
                <div className="bg-slate-950 rounded-2xl border-2 border-amber-500/60 p-4 shadow-xl space-y-3">
                  {/* 青（AI仮解説） ＋ 金（本部長録音）の2本立て表示 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 左：AI仮解説（青） */}
                    <div className="bg-gradient-to-br from-slate-900 via-sky-950/30 to-slate-900 p-3 rounded-xl border border-sky-500/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5" />
                          ① AI標準仮解説（青）
                        </span>
                        <span className="text-[10px] bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800 text-sky-300">
                          教科書基準
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        JIS規格および冶金理論に基づく合否判定ラインを事前に確認できます。
                      </p>
                    </div>

                    {/* 右：本部長録音エリア（金） */}
                    <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-orange-950/30 p-3 rounded-xl border-2 border-amber-500/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-amber-400" />
                          ② 本部長肉声知見（金）
                        </span>
                        <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded-full border border-amber-500 text-amber-200">
                          👑 直伝ノウハウ
                        </span>
                      </div>

                      {/* 録音ボタンモック */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md animate-pulse">
                          <Mic className="w-4 h-4" />
                          <span>🎙️ 口頭で回答を録音開始</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* めっき用語自動補正イメージ */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      めっき専門誤変換辞書が自動補正：
                    </span>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                      <span className="text-rose-400 line-through">「リラックス」</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-400 font-bold">「フラックス」</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-rose-400 line-through">「ドロ水」</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-400 font-bold">「ドロス」</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-rose-400 line-through">「不メッキ」</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-400 font-bold">「不めっき」</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. 管理者視点（画面イメージ付き） */}
          {/* ============================================================ */}
          {activePersona === 'ADMIN' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 役割バナー */}
              <div className="bg-cyan-950/40 border border-cyan-500/40 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-cyan-300">管理者・品質統括の主な操作</h3>
                  <p className="text-xs text-cyan-100/90 leading-relaxed mt-0.5">
                    「📊 品質分析・解析」画面で200件の品質課題を統計分析。原因別シェア（前処理・温度・Si・開口孔）や処置パターン、⚠️重大事故防止（水蒸気爆発アラート）を一元管理します。
                  </p>
                </div>
              </div>

              {/* 画面イメージ 3：分析ダッシュボード */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 text-xs flex items-center justify-center font-black">3</span>
                    画面操作イメージ：品質分析・解析ダッシュボード
                  </h4>
                  <span className="text-[11px] text-cyan-400 font-mono">📊 品質分析画面</span>
                </div>

                {/* 分析UIモックアップ */}
                <div className="bg-slate-950 rounded-2xl border-2 border-cyan-500/50 p-4 shadow-xl space-y-4">
                  {/* KPIカード 4列モック */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">全マスター件数</span>
                      <span className="text-lg font-black text-white font-mono">200問</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-amber-500/40">
                      <span className="text-[10px] text-amber-300 block">👑 本部長収録進捗</span>
                      <span className="text-lg font-black text-amber-400 font-mono">6 / 200問</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-rose-500/40">
                      <span className="text-[10px] text-rose-300 block">要手直し比率</span>
                      <span className="text-lg font-black text-rose-400 font-mono">110問 (55%)</span>
                    </div>
                    <div className="bg-red-950/40 p-2.5 rounded-xl border border-red-500/60">
                      <span className="text-[10px] text-red-300 block">🚨 最重要安全項目</span>
                      <span className="text-lg font-black text-red-400 font-mono">12問</span>
                    </div>
                  </div>

                  {/* 根本原因シェアグラフモック */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-200 block">不具合の根本原因 分布シェア</span>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between"><span>前処理薬品・洗浄 (CAT-1)</span><strong className="text-cyan-400 font-mono">35件 (18%)</strong></div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden"><div className="bg-cyan-500 h-full w-[18%]" /></div>

                      <div className="flex justify-between"><span>温度・浸漬操作 (CAT-2)</span><strong className="text-cyan-400 font-mono">36件 (18%)</strong></div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden"><div className="bg-blue-500 h-full w-[18%]" /></div>

                      <div className="flex justify-between"><span>構造設計・開口孔 (CAT-5)</span><strong className="text-cyan-400 font-mono">30件 (15%)</strong></div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden"><div className="bg-purple-500 h-full w-[15%]" /></div>
                    </div>
                  </div>

                  {/* ⚠️ 緊急アラートパネルモック */}
                  <div className="bg-red-950/40 border border-red-500/60 p-3 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-red-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                      ⚠️ 水蒸気爆発・重大安全危険項目（クリックで即座に対策確認可能）
                    </span>
                    <p className="text-[10px] text-red-200">
                      密閉パイプ未開口・ハイテン材水素脆化など、作業停止基準の対象全12問をワンタップ参照。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. 現場作業員視点（画面イメージ付き） */}
          {/* ============================================================ */}
          {activePersona === 'WORKER' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 役割バナー */}
              <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <HardHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-300">現場作業員・技能実習生の主な操作</h3>
                  <p className="text-xs text-emerald-100/90 leading-relaxed mt-0.5">
                    「👷 現場作業員要約」画面を開き、製品の前で3秒即断！「🎙️ 声でAIに質問」を押して話しかけるだけで、AIが瞬時に最適合致カードを特定し、判定と処置を音声で自動読み上げます（画面を凝視せずハンズフリー作業可能）。
                  </p>
                </div>
              </div>

              {/* 画面イメージ 4：作業員クイックカード & 音声対話 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-black">4</span>
                    画面操作イメージ：音声でAI質問 ＆ 3秒即断カードの自動音声読み上げ
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono">👷 現場要約画面</span>
                </div>

                {/* 実際の作業員用カードを模したモックアップ */}
                <div className="bg-slate-950 rounded-2xl border-2 border-emerald-500/60 p-4 shadow-xl space-y-3">
                  {/* 音声質問バーのモック */}
                  <div className="bg-gradient-to-r from-amber-950/80 to-slate-900 p-3 rounded-xl border border-amber-500/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-amber-200">
                      <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5" />
                        <span>🎙️ 声でAIに質問</span>
                      </div>
                      <span className="font-mono text-white">🗣️「白サビが出たけど出荷していい？」</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold shrink-0">
                      🔊 AI即答・音声読上中
                    </span>
                  </div>

                  {/* カード上部 */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        No.72
                      </span>
                      <h4 className="text-xs font-bold text-white">屋外保管品の白サビ発生</h4>
                    </div>

                    {/* 判定バッジ（大） */}
                    <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border-2 border-emerald-500 text-xs font-black shadow">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>OK（合格出荷）</span>
                    </div>
                  </div>

                  {/* 今すぐやる処置（3行） */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5" />
                      【今すぐやる処置】
                    </span>
                    <p className="text-xs text-slate-100 leading-relaxed">
                      真鍮ブラシで白い粉を払い落とし、風通しの良い場所に置く。膜厚を測って規格内なら合格出荷OK！
                    </p>
                  </div>

                  {/* ⚠️ 絶対やってはいけないNG行動 */}
                  <div className="bg-red-950/40 p-2.5 rounded-xl border border-red-500/40 space-y-0.5">
                    <span className="text-[11px] font-bold text-red-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      ⚠️ 絶対やっちゃダメなこと！
                    </span>
                    <p className="text-[11px] text-red-200 font-semibold">
                      酸で洗って落とそうとすること！ブルーシートで密閉して放置すること！
                    </p>
                  </div>

                  {/* ワンタップ音声読み上げボタン */}
                  <div className="pt-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow animate-pulse">
                      <Volume2 className="w-4 h-4 text-slate-950" />
                      <span>🔊 音声で案内中（自動再生）</span>
                    </div>
                    <span className="text-[11px] text-cyan-400 font-semibold">詳しい理論・JIS解説を見る →</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* モーダルフッター */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>ヘッダーおよび各画面の「マニュアル/ガイド」ボタンからいつでも再確認できます。</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black transition-all shadow-md active:scale-95"
          >
            マニュアルを閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
