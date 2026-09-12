export type CategoryId = 'CAT-1' | 'CAT-2' | 'CAT-3' | 'CAT-4' | 'CAT-5' | 'CAT-6';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  'CAT-1': {
    id: 'CAT-1',
    name: '前処理・薬品管理',
    description: '脱脂・酸洗・水洗・フラックス・黒皮除去・ピッティング対策',
    color: 'blue',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-600 dark:text-blue-400',
  },
  'CAT-2': {
    id: 'CAT-2',
    name: 'めっき浴・浸漬作業',
    description: '浴温管理・ドロス発生・灰払い・浸漬速度・引き上げ・液切れ',
    color: 'amber',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
  'CAT-3': {
    id: 'CAT-3',
    name: '後処理・冷却・防錆',
    description: '水冷・自然放冷・白サビ防止・クロメート/ノンクロ処理・保管',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
  },
  'CAT-4': {
    id: 'CAT-4',
    name: '外観欠陥・物性判定',
    description: '不めっき・ヤケ（灰色化）・タレ・ツララ・ザラ肌・光沢ムラ・密着不良',
    color: 'rose',
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-600 dark:text-rose-400',
  },
  'CAT-5': {
    id: 'CAT-5',
    name: '構造・形状・安全',
    description: '空気抜き孔・亜鉛抜き孔・閉鎖断面・水蒸気爆発防止・熱歪み・矯正',
    color: 'purple',
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-600 dark:text-purple-400',
  },
  'CAT-6': {
    id: 'CAT-6',
    name: '検査・規格・膜厚証明',
    description: 'JIS H 8641・電磁式膜厚計・5点平均法・ハンマリング・ミルシート・報告書',
    color: 'cyan',
    badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-600 dark:text-cyan-400',
  },
};

// 一般作業員向けの現場クイック要約
export interface WorkerSummary {
  summary_phenomenon: string; // 一目でわかる事象
  verdict_ok_ng: 'OK（合格/許容）' | 'NG（手直し必須）' | '判定要注意（膜厚測定要）' | '危険（作業即停止）';
  immediate_action: string;    // 今すぐやる処置（2〜3行）
  forbidden_action: string;    // ⚠️ 絶対やってはいけないNG行動
}

// AIによる標準理論解説
export interface AiStandardAnswer {
  theory: string;              // 標準理論・メカニズム
  standard_criteria: string;   // JIS規格・公的基準
  points_to_check: string[];   // 現場確認ポイント
}

// 質問キュー（Supabase: questions_queue）
export interface QuestionQueueItem {
  id: string;
  no: number;
  category_id: CategoryId;
  title: string;
  raw_text?: string | null;
  refined_question?: string | null;
  ai_standard_answer?: AiStandardAnswer | null; // AIによる仮解説（標準理論）
  key_check_points?: string[] | null;
  suggested_criteria?: string | null;
  is_answered: boolean;       // AI仮解説済み
  has_voice_answer: boolean;   // 👑 本部長の肉声音声回答済み
  created_at: string;
  images?: string[] | null;
  source_type: 'preset' | 'user';
  knowledge_id?: string | null;
  worker_summary?: WorkerSummary | null;
  cause_category?: string | null;     // 分析用：根本原因カテゴリ
  action_category?: string | null;    // 分析用：処置カテゴリ
}

// 蓄積ナレッジレコード（Supabase: knowledge_records）- AI標準解説 ＋ 本部長職人回答の2本立て
export interface KnowledgeRecord {
  id: string;
  question_id: string;
  question_title: string;
  category_id: CategoryId;
  created_at: string;
  
  // 1. 質問と問題定義（何が質問だったのか明確化）
  original_question?: string | null; // 三浦さんの現場疑問
  refined_problem?: string | null;   // JIS規格に照らした具体的技術課題
  has_voice_answer: boolean;  // 👑 本部長音声回答済みフラグ

  // 2. AI標準理論解説（青系）
  ai_standard_answer?: AiStandardAnswer | null;

  // 3. 村上本部長の実践構造化ノウハウ（金系）
  phenomenon: string;         // 【現象】何が起きているか
  cause: string;              // 【原因】なぜ生じたか（メカニズム）
  action_and_criteria: string;// 【処置・合否判定】現場手直し・社内判断ライン
  prevention: string;         // 【再発防止策】次回製作へのフィードバック
  key_terminology: string[];  // 補正された専門用語リスト
  full_transcript: string;    // 本部長の語り全文文字起こし（誤変換補正済み）
  audio_url?: string | null;         // 音声URL
  images?: string[] | null;          // 写真URL
  audio_duration_seconds?: number | null;
  confidence_score?: number | null;

  // 4. 一般作業員向け要約 ＆ 分析用タグ
  worker_summary?: WorkerSummary | null;
  cause_category?: string | null;
  action_category?: string | null;
  updated_at?: string;
}
