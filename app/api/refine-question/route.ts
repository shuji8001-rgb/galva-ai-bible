import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';
import { GALVA_TERMINOLOGY_PROMPT } from '@/constants/terminology';
import { CategoryId, QuestionQueueItem, KnowledgeRecord, AiStandardAnswer, WorkerSummary } from '@/types';

import { generateRefinedGalvaData } from '@/lib/galvaAiEngine';

export async function POST(req: NextRequest) {
  try {
    const { rawText, categoryId, images } = await req.json();

    if (!rawText && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: '質問内容または画像を入力してください' },
        { status: 400 }
      );
    }

    let refinedData: {
      title: string;
      refinedQuestion: string;
      detectedCategory: CategoryId;
      aiStandardAnswer: AiStandardAnswer;
      keyCheckPoints: string[];
      suggestedCriteria: string;
      workerSummary: WorkerSummary;
      causeCategory: string;
      actionCategory: string;
    } | null = null;

    // 1. Gemini 1.5 Flash による質問具体化 ＆ AI標準仮解説 ＆ 現場要約の自動生成
    const model = getGeminiModel(true);
    if (model) {
      try {
        const prompt = `
${GALVA_TERMINOLOGY_PROMPT}

【タスク】
溶融亜鉛めっき現場の品質管理担当者（三浦さん）が現場から入力した「殴り書きメモ・気になる事象」を受け取り、以下の全項目を構造化して生成してください：
1. 大ベテラン職人（村上本部長）が即座に口頭回答しやすい具体的・論理的な技術質問文へのリライト
2. 溶融亜鉛めっき規格（JIS H 8641）に基づく、AIによる標準理論・メカニズム・合否判定ライン・現場確認ポイントの【仮解説】
3. 現場作業員向けの即断要約（OK/NG判定・今すぐやる処置・絶対やってはいけないNG行動）
4. 不具合要因カテゴリと処置カテゴリの自動分類

【入力されたメモ】
"${rawText || '（添付画像を参照してめっき欠陥・異常を確認してください）'}"
【指定カテゴリ】
"${categoryId || '自動判定'}"

【出力JSONスキーマ】
マークダウン装飾なしで、以下のJSONフォーマットで厳密に返答してください。
{
  "title": "簡潔で要点が伝わる質問タイトル（35文字以内）",
  "refinedQuestion": "ベテラン職人が回答しやすい具体的な状況・問いかけ文（100〜150文字程度）",
  "detectedCategory": "CAT-1" | "CAT-2" | "CAT-3" | "CAT-4" | "CAT-5" | "CAT-6",
  "aiTheory": "【標準理論】化学反応・浴温・Fe-Zn拡散・前処理や冷却要因などの科学的メカニズム解説（120文字程度）",
  "standardCriteria": "【JIS・合否基準】JIS H 8641規格に基づく標準的な合否判定ライン・タッチアップ許容基準（80文字程度）",
  "keyCheckPoints": ["現場確認ポイント1", "現場確認ポイント2", "現場確認ポイント3"],
  "summaryPhenomenon": "作業員向け一目サマリー（25文字以内）",
  "verdictOkNg": "OK（合格/許容）" | "NG（手直し必須）" | "判定要注意（膜厚測定要）" | "危険（作業即停止）",
  "immediateAction": "今すぐやる処置（3行以内）",
  "forbiddenAction": "絶対やってはいけないNG行動（2行以内）",
  "causeCategory": "前処理薬品・洗浄" | "温度・浸漬操作" | "冷却・保管環境" | "鋼材成分・溶接異物" | "構造設計・開口孔" | "測定手法・規格判定",
  "actionCategory": "ジンクリッチ補修" | "酸洗再めっき" | "手ケレン研磨" | "許容合格" | "追加開口・加熱矯正" | "工程・温度管理"
}
`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(cleanedJson);

        const detectedCat = (parsed.detectedCategory as CategoryId) || categoryId || 'CAT-4';
        const aiAnswer: AiStandardAnswer = {
          theory: parsed.aiTheory || '前処理および溶融亜鉛浴浸漬条件の複合要因による表面反応。',
          standard_criteria: parsed.standardCriteria || 'JIS H 8641: 軽微な欠陥は規定ジンクリッチペイントでタッチアップ補修。',
          points_to_check: parsed.keyCheckPoints || ['欠陥範囲の確認', '前処理状態の確認'],
        };

        const workerSummary: WorkerSummary = {
          summary_phenomenon: parsed.summaryPhenomenon || parsed.title || '現場確認事象',
          verdict_ok_ng: parsed.verdictOkNg || '判定要注意（膜厚測定要）',
          immediate_action: parsed.immediateAction || '目視確認の上、必要に応じて品管または本部長に相談してください。',
          forbidden_action: parsed.forbiddenAction || '未確認のまま自己判断で放置・出荷すること。',
        };

        refinedData = {
          title: parsed.title,
          refinedQuestion: parsed.refinedQuestion,
          detectedCategory: detectedCat,
          aiStandardAnswer: aiAnswer,
          keyCheckPoints: parsed.keyCheckPoints || [],
          suggestedCriteria: parsed.standardCriteria || '',
          workerSummary: workerSummary,
          causeCategory: parsed.causeCategory || '鋼材成分・溶接異物',
          actionCategory: parsed.actionCategory || '手ケレン研磨',
        };
      } catch (geminiErr) {
        console.warn('Gemini API call failed in refine-question, fallback to dynamic engine:', geminiErr);
      }
    }

    // 2. 高精度ドメイン推論エンジンによる動的フォールバック
    if (!refinedData) {
      refinedData = generateRefinedGalvaData(rawText, categoryId);
    }

    const timestamp = Date.now();
    const newQuestionId = `user-q-${timestamp}`;
    const newKnowledgeId = `user-k-${timestamp}`;

    // 2. 質問キューアイテム生成
    const newQuestionItem: QuestionQueueItem = {
      id: newQuestionId,
      no: (timestamp % 1000) + 201,
      category_id: refinedData.detectedCategory,
      title: refinedData.title,
      raw_text: rawText,
      refined_question: refinedData.refinedQuestion,
      ai_standard_answer: refinedData.aiStandardAnswer,
      key_check_points: refinedData.keyCheckPoints,
      suggested_criteria: refinedData.suggestedCriteria,
      is_answered: true, // AI仮回答が即座に生成されているため表示可能
      has_voice_answer: false, // 本部長の音声は未録音
      created_at: new Date().toISOString(),
      images: images || [],
      source_type: 'user',
      knowledge_id: newKnowledgeId,
      worker_summary: refinedData.workerSummary,
      cause_category: refinedData.causeCategory,
      action_category: refinedData.actionCategory,
    };

    // 3. AI仮解説入り構造化ナレッジレコード生成
    const newKnowledgeRecord: KnowledgeRecord = {
      id: newKnowledgeId,
      question_id: newQuestionId,
      question_title: refinedData.title,
      category_id: refinedData.detectedCategory,
      created_at: new Date().toISOString(),
      original_question: rawText || refinedData.title,
      refined_problem: refinedData.refinedQuestion,
      has_voice_answer: false,
      ai_standard_answer: refinedData.aiStandardAnswer,
      phenomenon: `【現場確認事象】：${refinedData.title}`,
      cause: `【AI推定原因】：${refinedData.aiStandardAnswer.theory}`,
      action_and_criteria: `【AI推奨合否基準・手直し】：\n${refinedData.aiStandardAnswer.standard_criteria}`,
      prevention: `【AI推奨再発防止策】：\n1. 前工程チェックシートの遵守\n2. 現場確認ポイント（${refinedData.keyCheckPoints.join('、')}）の日常点検徹底`,
      key_terminology: [refinedData.title.slice(0, 8), 'JIS H 8641', 'AI仮解説', '品質管理'],
      full_transcript: `（本部長の音声回答は未収録です。右上の「🎙️ 補足・追加録音」ボタンから村上本部長の実践知見を追加できます。）`,
      images: images || [],
      worker_summary: refinedData.workerSummary,
      cause_category: refinedData.causeCategory,
      action_category: refinedData.actionCategory,
      confidence_score: 0.92,
    };

    // Supabase DB への永続化（設定時）
    if (supabaseAdmin) {
      try {
        await Promise.all([
          supabaseAdmin.from('questions_queue').insert([newQuestionItem]),
          supabaseAdmin.from('knowledge_records').insert([newKnowledgeRecord]),
        ]);
      } catch (dbErr) {
        console.warn('Supabase DB error (ignorable if not setup):', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: newQuestionItem,
      knowledge: newKnowledgeRecord,
    });
  } catch (error: any) {
    console.error('Refine question API critical error:', error);
    return NextResponse.json(
      { error: error.message || '質問のリライト中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

function determineCategory(text: string): CategoryId {
  const t = (text || '').toLowerCase();
  if (t.includes('酸') || t.includes('脱脂') || t.includes('フラックス') || t.includes('黒皮') || t.includes('錆')) return 'CAT-1';
  if (t.includes('温度') || t.includes('湯') || t.includes('灰') || t.includes('ドロス') || t.includes('浸漬') || t.includes('吊り')) return 'CAT-2';
  if (t.includes('冷') || t.includes('白サビ') || t.includes('白') || t.includes('保管') || t.includes('クロム')) return 'CAT-3';
  if (t.includes('穴') || t.includes('パイプ') || t.includes('爆発') || t.includes('曲がり') || t.includes('歪み')) return 'CAT-5';
  if (t.includes('膜厚') || t.includes('jis') || t.includes('測') || t.includes('ミクロン') || t.includes('検査')) return 'CAT-6';
  return 'CAT-4';
}
