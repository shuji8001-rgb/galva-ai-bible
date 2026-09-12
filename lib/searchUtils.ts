import { QuestionQueueItem, KnowledgeRecord } from '@/types';

// 溶融亜鉛めっき専門用語シノニム（同義語・現場話し言葉辞書）
const GALVA_SYNONYMS: Record<string, string[]> = {
  '黒ずみ': ['不めっき', 'ヤケ', '酸洗不足', '脱脂不良', '黒皮', '酸化被膜'],
  '黒い': ['不めっき', 'ヤケ', '酸洗不足', '脱脂不良', '黒皮'],
  '白サビ': ['白錆', '保管湿気', 'クロメート', '白化', '雨水'],
  '白さび': ['白錆', '白サビ', '保管湿気', 'クロメート', '白化'],
  'ヤケ': ['灰色', '合金層', 'サンドリン', 'ケイ素', 'Si含有量', '過共析'],
  '灰色': ['ヤケ', '合金層', 'サンドリン', 'ケイ素', 'Si含有量'],
  'ドロス': ['湯面灰', '浮ドロス', 'ボトムドロス', '亜鉛滓', '異物付着'],
  'タレ': ['ツララ', '溜まり', '引き上げ速度', 'バリ', '亜鉛タレ'],
  'ツララ': ['タレ', '溜まり', '引き上げ速度', 'バリ', '削り'],
  '不めっき': ['めっき抜け', '素地露出', '脱脂不良', '酸洗不足', 'フラックス切れ'],
  'めっき抜け': ['不めっき', '素地露出', '脱脂不良', '酸洗不足'],
  '酸洗': ['塩酸', '硫酸', 'スマット', '過酸洗', '前処理', '錆落とし'],
  'フラックス': ['フラックス処理', '塩化亜鉛アンモニウム', '濡れ性', 'ピンホール'],
  'ジンクリッチ': ['タッチアップ', '高濃度亜鉛末塗料', '補修', 'jis k 5553'],
  'タッチアップ': ['ジンクリッチ', '補修スプレー', '部分補修', '手直し'],
  '穴': ['開口孔', '空気抜き穴', '亜鉛流出孔', 'パイプ密閉', '爆発防止'],
  'パイプ': ['密閉構造', '開口孔', '空気抜き', '内圧爆発', '水蒸気爆発'],
  '爆発': ['密閉', '開口孔', '空気抜き', '水蒸気', '危険停止'],
  '膜厚': ['ミクロン', '膜厚測定', 'jis h 8641', '電磁微厚計', '付着量'],
  '曲がり': ['熱歪み', '残留応力', '浸漬歪み', '加熱矯正', '冷却歪み'],
  '歪み': ['曲がり', '熱歪み', '残留応力', '浸漬歪み', '矯正'],
};

// 日本語の重要キーワード抽出（助詞・不要語の簡易除去）
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .replace(/[、。！？!?,.\(\)\[\]\{\}「」『』\n\t]/g, ' ')
    .trim();

  // 単語分割
  const rawWords = normalized.split(/\s+/).filter((w) => w.length >= 2);
  const keywords = new Set<string>();

  // 助詞などのストップワード
  const stopWords = new Set(['したら', 'して', 'すれば', 'した', 'から', 'ので', 'けど', 'です', 'ます', 'いい', 'どう', 'なに', 'これ', 'それ', 'あれ', '塗って']);

  rawWords.forEach((word) => {
    if (!stopWords.has(word)) {
      keywords.add(word);
    }
  });

  // 2〜4文字の重要フレーズ抽出
  const textClean = normalized.replace(/\s+/g, '');
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= textClean.length - len; i++) {
      const phrase = textClean.substring(i, i + len);
      if (!stopWords.has(phrase)) {
        keywords.add(phrase);
      }
    }
  }

  return Array.from(keywords);
}

// 類似度スコアの高度な計算
export function calculateSimilarityScore(
  query: string,
  targetText: string,
  extraTerms: string[] = []
): number {
  if (!query || !targetText) return 0;

  const q = query.toLowerCase().trim();
  const t = targetText.toLowerCase().trim();

  // 1. 完全一致・部分一致
  if (t.includes(q) || q.includes(t)) {
    return 0.95;
  }

  const queryKeywords = extractKeywords(q);
  if (queryKeywords.length === 0) return 0;

  let matchedScore = 0;
  let strongMatchCount = 0;

  // 2. クエリキーワードの直接一致
  queryKeywords.forEach((kw) => {
    if (t.includes(kw)) {
      const weight = kw.length >= 3 ? 0.35 : 0.2;
      matchedScore += weight;
      strongMatchCount++;
    }

    // 3. シノニム（類義語）展開一致
    const synonyms = GALVA_SYNONYMS[kw] || [];
    synonyms.forEach((syn) => {
      if (t.includes(syn)) {
        matchedScore += 0.25;
        strongMatchCount++;
      }
    });
  });

  // 4. 追加キーワードリストの一致
  extraTerms.forEach((term) => {
    if (q.includes(term.toLowerCase())) {
      matchedScore += 0.2;
      strongMatchCount++;
    }
  });

  // 2つ以上の重要キーワードが合致した場合、重複確率が極めて高い
  if (strongMatchCount >= 2) {
    matchedScore = Math.max(matchedScore, 0.45);
  }

  return Math.min(matchedScore, 1.0);
}

export interface SimilarMatchResult {
  question: QuestionQueueItem;
  knowledge?: KnowledgeRecord;
  score: number;
  matchedReason: string;
}

// 類似する質問・ナレッジの上位N件を検索
export function findSimilarQuestions(
  query: string,
  questions: QuestionQueueItem[],
  knowledgeList: KnowledgeRecord[] = [],
  limit: number = 3,
  minScoreThreshold: number = 0.18
): SimilarMatchResult[] {
  if (!query || query.trim().length < 2) return [];

  const results: SimilarMatchResult[] = [];

  questions.forEach((q) => {
    const k = knowledgeList.find((item) => item.question_id === q.id);

    // 検索対象となる全テキストを結合
    const targetAction = [
      q.worker_summary?.immediate_action || '',
      q.worker_summary?.forbidden_action || '',
      q.worker_summary?.summary_phenomenon || '',
    ].join(' ');

    const targetTheory = [
      q.ai_standard_answer?.theory || '',
      q.ai_standard_answer?.standard_criteria || '',
      q.suggested_criteria || '',
      ...(q.key_check_points || []),
    ].join(' ');

    const targetKnowledge = [
      k?.phenomenon || '',
      k?.cause || '',
      k?.action_and_criteria || '',
      k?.prevention || '',
      ...(k?.key_terminology || []),
    ].join(' ');

    // タイトル類似度
    const titleScore = calculateSimilarityScore(query, q.title);
    // 現場処置・NG行動類似度
    const actionScore = calculateSimilarityScore(query, targetAction);
    // 質問文類似度
    const rawScore = calculateSimilarityScore(query, `${q.raw_text || ''} ${q.refined_question || ''}`);
    // 技術理論・JIS基準類似度
    const theoryScore = calculateSimilarityScore(query, targetTheory);
    // ナレッジ全般類似度
    const knowScore = calculateSimilarityScore(query, targetKnowledge);

    const maxScore = Math.max(
      titleScore * 1.2,
      actionScore * 1.15,
      rawScore,
      theoryScore * 0.95,
      knowScore * 0.9
    );

    if (maxScore >= minScoreThreshold) {
      let reason = '質問タイトルが類似';
      if (actionScore >= titleScore && actionScore >= minScoreThreshold) {
        reason = '現場処置・手直し内容が一致';
      } else if (titleScore < rawScore && rawScore >= minScoreThreshold) {
        reason = '過去の現場疑問メモと類似';
      } else if (theoryScore > titleScore) {
        reason = '発生メカニズム・JIS規格が合致';
      }

      results.push({
        question: q,
        knowledge: k,
        score: maxScore,
        matchedReason: reason,
      });
    }
  });

  // スコア降順ソート
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function filterKnowledgeRecords(
  records: KnowledgeRecord[],
  keyword: string,
  categoryFilter: string | null
): KnowledgeRecord[] {
  let list = records;

  if (categoryFilter && categoryFilter !== 'ALL') {
    list = list.filter((r) => r.category_id === categoryFilter);
  }

  if (!keyword.trim()) {
    return list;
  }

  const q = keyword.toLowerCase().trim();

  return list.filter((r) => {
    return (
      r.question_title.toLowerCase().includes(q) ||
      (r.phenomenon && r.phenomenon.toLowerCase().includes(q)) ||
      (r.cause && r.cause.toLowerCase().includes(q)) ||
      (r.action_and_criteria && r.action_and_criteria.toLowerCase().includes(q)) ||
      (r.prevention && r.prevention.toLowerCase().includes(q)) ||
      (r.key_terminology && r.key_terminology.some((t) => t.toLowerCase().includes(q))) ||
      (r.full_transcript && r.full_transcript.toLowerCase().includes(q))
    );
  });
}

export function filterQuestionQueue(
  questions: QuestionQueueItem[],
  keyword: string,
  categoryFilter: string | null,
  statusFilter: 'ALL' | 'UNANSWERED' | 'ANSWERED' = 'ALL'
): QuestionQueueItem[] {
  let list = questions;

  if (categoryFilter && categoryFilter !== 'ALL') {
    list = list.filter((q) => q.category_id === categoryFilter);
  }

  if (statusFilter === 'UNANSWERED') {
    list = list.filter((q) => !q.has_voice_answer);
  } else if (statusFilter === 'ANSWERED') {
    list = list.filter((q) => q.has_voice_answer);
  }

  if (!keyword.trim()) {
    return list;
  }

  const q = keyword.toLowerCase().trim();

  return list.filter((item) => {
    return (
      item.title.toLowerCase().includes(q) ||
      (item.refined_question && item.refined_question.toLowerCase().includes(q)) ||
      (item.raw_text && item.raw_text.toLowerCase().includes(q)) ||
      (item.worker_summary?.immediate_action &&
        item.worker_summary.immediate_action.toLowerCase().includes(q))
    );
  });
}
