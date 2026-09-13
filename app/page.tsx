'use client';

import React, { useState, useEffect } from 'react';
import { Header, MainViewMode } from '@/components/Header';
import { QuestionForm } from '@/components/QuestionForm';
import { QuestionIndex } from '@/components/QuestionIndex';
import { InterviewWorkspace } from '@/components/InterviewWorkspace';
import { KnowledgeCards } from '@/components/KnowledgeCards';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { WorkerSummaryView } from '@/components/WorkerSummaryView';
import { ManualModal, ManualPersona } from '@/components/ManualModal';
import { EditKnowledgeModal } from '@/components/EditKnowledgeModal';
import { QuestionQueueItem, KnowledgeRecord } from '@/types';
import {
  getLocalQuestions,
  getLocalKnowledge,
  saveLocalQuestions,
  saveLocalKnowledge,
  syncFromSupabase,
  resetAllToDefaults,
} from '@/lib/storage';
import { getStoredTheme, applyThemeToDOM } from '@/lib/theme';
import { BookOpen, ListOrdered } from 'lucide-react';

export default function DashboardPage() {
  const [questions, setQuestions] = useState<QuestionQueueItem[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeRecord[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionQueueItem | null>(null);
  const [autoStartTrigger, setAutoStartTrigger] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'INDEX' | 'INTERVIEW'>('INDEX');
  const [activeView, setActiveView] = useState<MainViewMode>('BIBLE');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualPersona, setManualPersona] = useState<ManualPersona>('MIURA');

  // 編集モーダル用ステート
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingKnowledgeRecord, setEditingKnowledgeRecord] = useState<KnowledgeRecord | null>(null);
  const [editingQuestionItem, setEditingQuestionItem] = useState<QuestionQueueItem | null>(null);

  // マニュアルを開くハンドラー
  const handleOpenManual = (persona: ManualPersona = 'MIURA') => {
    setManualPersona(persona);
    setIsManualOpen(true);
  };

  // 編集モーダルを開く
  const handleOpenEditModal = (questionId: string) => {
    const kRecord = knowledgeList.find((k) => k.question_id === questionId);
    const qItem = questions.find((q) => q.id === questionId);
    if (kRecord) {
      setEditingKnowledgeRecord(kRecord);
      setEditingQuestionItem(qItem || null);
      setIsEditModalOpen(true);
    }
  };

  // 初期ロード ＆ Supabase同期 ＆ テーマ適用
  useEffect(() => {
    async function loadData() {
      // カラーテーマの適用
      const currentTheme = getStoredTheme();
      applyThemeToDOM(currentTheme);

      const initialQ = getLocalQuestions();
      const initialK = getLocalKnowledge();
      setQuestions(initialQ);
      setKnowledgeList(initialK);

      const target = initialQ.find((q) => q.has_voice_answer) || initialQ[0] || null;
      setSelectedQuestion(target);
      setIsLoaded(true);

      const synced = await syncFromSupabase();
      if (synced.questions.length > 0) {
        setQuestions(synced.questions);
      }
      if (synced.knowledge.length > 0) {
        setKnowledgeList(synced.knowledge);
      }
    }
    loadData();
  }, []);

  // 三浦さんの質問投稿完了時（AI仮回答付きレコードを同時反映）
  const handleQuestionAdded = (newQuestion: QuestionQueueItem, newKnowledge?: KnowledgeRecord) => {
    const updatedQ = [newQuestion, ...questions];
    setQuestions(updatedQ);
    saveLocalQuestions(updatedQ);

    if (newKnowledge) {
      const updatedK = [newKnowledge, ...knowledgeList];
      setKnowledgeList(updatedK);
      saveLocalKnowledge(updatedK);
    }

    setSelectedQuestion(newQuestion);
    setAutoStartTrigger(false);
    setActiveTabMobile('INTERVIEW');
    setActiveView('BIBLE');
  };

  // 質問選択
  const handleSelectQuestion = (q: QuestionQueueItem, autoStart: boolean = false) => {
    setSelectedQuestion(q);
    setAutoStartTrigger(autoStart);
    setActiveTabMobile('INTERVIEW');
    setActiveView('BIBLE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 選択解除（全件表示に戻す）
  const handleClearSelection = () => {
    setSelectedQuestion(null);
    setAutoStartTrigger(false);
  };

  // 補足・追記録音の開始（カードから呼び出し）
  const handleStartAppendVoice = (questionId: string) => {
    const target = questions.find((q) => q.id === questionId);
    if (target) {
      setSelectedQuestion(target);
      setAutoStartTrigger(true);
      setActiveTabMobile('INTERVIEW');
      setActiveView('BIBLE');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 本部長の回答・ナレッジ保存完了時（既存更新または新規追加）
  const handleKnowledgeSaved = (newRecord: KnowledgeRecord) => {
    const existingIndex = knowledgeList.findIndex((k) => k.question_id === newRecord.question_id);
    let updatedKnowledge: KnowledgeRecord[];
    if (existingIndex >= 0) {
      updatedKnowledge = [...knowledgeList];
      updatedKnowledge[existingIndex] = { ...newRecord, has_voice_answer: true };
    } else {
      updatedKnowledge = [{ ...newRecord, has_voice_answer: true }, ...knowledgeList];
    }
    setKnowledgeList(updatedKnowledge);
    saveLocalKnowledge(updatedKnowledge);

    const updatedQuestions = questions.map((q) => {
      if (q.id === newRecord.question_id) {
        return {
          ...q,
          is_answered: true,
          has_voice_answer: true,
          knowledge_id: newRecord.id,
        };
      }
      return q;
    });
    setQuestions(updatedQuestions);
    saveLocalQuestions(updatedQuestions);

    const targetQ = updatedQuestions.find((q) => q.id === newRecord.question_id);
    if (targetQ) setSelectedQuestion(targetQ);
    setAutoStartTrigger(false);
  };

  // ✏️ ナレッジ編集保存ハンドラー
  const handleSaveEditedKnowledge = (
    updatedRecord: KnowledgeRecord,
    updatedQuestion?: QuestionQueueItem
  ) => {
    const updatedKList = knowledgeList.map((k) =>
      k.id === updatedRecord.id ? updatedRecord : k
    );
    setKnowledgeList(updatedKList);
    saveLocalKnowledge(updatedKList);

    if (updatedQuestion) {
      const updatedQList = questions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      );
      setQuestions(updatedQList);
      saveLocalQuestions(updatedQList);

      if (selectedQuestion?.id === updatedQuestion.id) {
        setSelectedQuestion(updatedQuestion);
      }
    }
  };

  // 🗑️ 質問・ナレッジ完全削除ハンドラー
  const handleDeleteKnowledge = (questionId: string) => {
    const updatedQList = questions.filter((q) => q.id !== questionId);
    const updatedKList = knowledgeList.filter((k) => k.question_id !== questionId);
    setQuestions(updatedQList);
    setKnowledgeList(updatedKList);
    saveLocalQuestions(updatedQList);
    saveLocalKnowledge(updatedKList);

    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(updatedQList[0] || null);
    }
  };

  // 🔄 本部長回答のみリセット（AI仮解説状態に戻す）
  const handleResetVoiceAnswer = (questionId: string) => {
    const updatedQList = questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          has_voice_answer: false,
        };
      }
      return q;
    });

    const updatedKList = knowledgeList.map((k) => {
      if (k.question_id === questionId) {
        return {
          ...k,
          has_voice_answer: false,
          audio_url: undefined,
        };
      }
      return k;
    });

    setQuestions(updatedQList);
    setKnowledgeList(updatedKList);
    saveLocalQuestions(updatedQList);
    saveLocalKnowledge(updatedKList);

    const current = updatedQList.find((q) => q.id === questionId);
    if (current) setSelectedQuestion(current);
  };

  // 初期データリセット
  const handleResetDefaults = () => {
    resetAllToDefaults();
    const q = getLocalQuestions();
    const k = getLocalKnowledge();
    setQuestions(q);
    setKnowledgeList(k);
    setSelectedQuestion(q[0] || null);
    setAutoStartTrigger(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wide">
            溶融亜鉛めっき「技術伝承AIバイブル」ロード中...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-300">
      {/* 共通ヘッダー（3タブナビゲーション ＆ 4視点マニュアル付き） */}
      <Header
        questions={questions}
        knowledgeList={knowledgeList}
        activeView={activeView}
        onChangeView={setActiveView}
        onResetDefaults={handleResetDefaults}
        onOpenManual={(persona) => handleOpenManual(persona || 'MIURA')}
      />

      {/* 4視点操作マニュアルモーダル */}
      <ManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        initialPersona={manualPersona}
      />

      {/* ✏️ ナレッジ直接編集・削除モーダル */}
      <EditKnowledgeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        knowledgeRecord={editingKnowledgeRecord}
        questionItem={editingQuestionItem}
        onSave={handleSaveEditedKnowledge}
        onDelete={handleDeleteKnowledge}
        onResetVoiceAnswer={handleResetVoiceAnswer}
      />

      {/* モバイル用タブ切替（バイブルモード時のみ） */}
      {activeView === 'BIBLE' && (
        <div className="lg:hidden flex border-b border-slate-800 bg-slate-900 sticky top-[56px] z-30">
          <button
            onClick={() => setActiveTabMobile('INDEX')}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTabMobile === 'INDEX'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/50'
                : 'border-transparent text-slate-400'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>200問インデックス</span>
          </button>
          <button
            onClick={() => setActiveTabMobile('INTERVIEW')}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTabMobile === 'INTERVIEW'
                ? 'border-amber-400 text-amber-400 bg-slate-800/50'
                : 'border-transparent text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>AI仮解説＆本部長回答</span>
          </button>
        </div>
      )}

      {/* メインコンテンツエリア */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto p-3 lg:p-5">
        {/* VIEW 1: 品質バイブル（標準QA 2画面スプリット） */}
        {activeView === 'BIBLE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* 左ペイン：三浦さん質問投稿 ＆ 200問アコーディオン（幅4/12） */}
            <section
              className={`lg:col-span-4 flex flex-col h-auto lg:h-[calc(100vh-76px)] lg:sticky lg:top-[64px] space-y-3 min-h-0 ${
                activeTabMobile === 'INTERVIEW' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* 三浦さんの質問投稿フォーム（コンパクト配置・写真横登録ボタン・類似質問重複防止） */}
              <QuestionForm
                questions={questions}
                knowledgeList={knowledgeList}
                onSelectQuestion={handleSelectQuestion}
                onQuestionAdded={handleQuestionAdded}
                onOpenManual={() => handleOpenManual('MIURA')}
              />

              {/* 200問インデックス（独立スクロール・👑済マーク・AI仮解説フィルター） */}
              <div className="flex-1 min-h-0 glass-card rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                <QuestionIndex
                  questions={questions}
                  selectedQuestion={selectedQuestion}
                  onSelectQuestion={handleSelectQuestion}
                />
              </div>
            </section>

            {/* 右ペイン：AI仮解説＋本部長回答ワークスペース ＆ 200件品質バイブルカード（幅8/12） */}
            <section
              className={`lg:col-span-8 space-y-6 ${
                activeTabMobile === 'INDEX' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* 本部長インタビューワークスペース（AI仮解説＋テキスト/音声切替＋本部長ガイド＋編集ボタン付き） */}
              <InterviewWorkspace
                selectedQuestion={selectedQuestion}
                autoStartTrigger={autoStartTrigger}
                onKnowledgeSaved={handleKnowledgeSaved}
                onOpenManual={() => handleOpenManual('MURAKAMI')}
                onOpenEditModal={handleOpenEditModal}
              />

              {/* 蓄積ノウハウ（200件バイブルカード・質問構造化・写真・追記録音・編集・削除） */}
              <KnowledgeCards
                knowledgeList={knowledgeList}
                selectedQuestion={selectedQuestion}
                onClearSelection={handleClearSelection}
                onStartAppendVoice={handleStartAppendVoice}
                onOpenEditModal={handleOpenEditModal}
                onDeleteKnowledge={handleDeleteKnowledge}
              />
            </section>
          </div>
        )}

        {/* VIEW 2: 品質分析・解析ダッシュボード（管理者ガイドボタン付き） */}
        {activeView === 'ANALYTICS' && (
          <AnalyticsDashboard
            questions={questions}
            knowledgeList={knowledgeList}
            onSelectQuestion={(q) => handleSelectQuestion(q, false)}
            onOpenManual={() => handleOpenManual('ADMIN')}
          />
        )}

        {/* VIEW 3: 一般作業員専用 現場クイック要約ビュー（現場ガイドボタン付き） */}
        {activeView === 'WORKER_SUMMARY' && (
          <WorkerSummaryView
            questions={questions}
            knowledgeList={knowledgeList}
            onSelectQuestionForDetails={(q) => handleSelectQuestion(q, false)}
            onOpenManual={() => handleOpenManual('WORKER')}
          />
        )}
      </main>
    </div>
  );
}
