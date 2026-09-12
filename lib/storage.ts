import { QuestionQueueItem, KnowledgeRecord } from '@/types';
import { INITIAL_QUESTIONS_MASTER, INITIAL_KNOWLEDGE_MASTER } from '@/constants/initialQuestions';
import { supabase } from '@/lib/supabase';

const QUESTIONS_STORAGE_KEY = 'galva_bible_questions_v6';
const KNOWLEDGE_STORAGE_KEY = 'galva_bible_knowledge_v6';

export function getLocalQuestions(): QuestionQueueItem[] {
  if (typeof window === 'undefined') {
    return INITIAL_QUESTIONS_MASTER;
  }
  try {
    const raw = localStorage.getItem(QUESTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(INITIAL_QUESTIONS_MASTER));
      return INITIAL_QUESTIONS_MASTER;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_QUESTIONS_MASTER.length || !parsed[0]?.worker_summary) {
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(INITIAL_QUESTIONS_MASTER));
      return INITIAL_QUESTIONS_MASTER;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load questions from localStorage:', e);
    return INITIAL_QUESTIONS_MASTER;
  }
}

export function saveLocalQuestions(questions: QuestionQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
  } catch (e: any) {
    console.warn('Failed to save questions to localStorage, trying without heavy images:', e);
    try {
      const lightweight = questions.map((q) => ({
        ...q,
        images: (q.images || []).map((img) => (img.length > 500 ? img.slice(0, 100) + '...' : img)),
      }));
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(lightweight));
    } catch (innerErr) {
      console.error('Critical failure saving questions to localStorage:', innerErr);
    }
  }
}

export function getLocalKnowledge(): KnowledgeRecord[] {
  if (typeof window === 'undefined') {
    return INITIAL_KNOWLEDGE_MASTER;
  }
  try {
    const raw = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(INITIAL_KNOWLEDGE_MASTER));
      return INITIAL_KNOWLEDGE_MASTER;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_KNOWLEDGE_MASTER.length || !parsed[0]?.worker_summary) {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(INITIAL_KNOWLEDGE_MASTER));
      return INITIAL_KNOWLEDGE_MASTER;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load knowledge from localStorage:', e);
    return INITIAL_KNOWLEDGE_MASTER;
  }
}

export function saveLocalKnowledge(knowledgeList: KnowledgeRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(knowledgeList));
  } catch (e: any) {
    console.warn('Failed to save knowledge to localStorage, trying without heavy images:', e);
    try {
      const lightweight = knowledgeList.map((k) => ({
        ...k,
        images: (k.images || []).map((img) => (img.length > 500 ? img.slice(0, 100) + '...' : img)),
      }));
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(lightweight));
    } catch (innerErr) {
      console.error('Critical failure saving knowledge to localStorage:', innerErr);
    }
  }
}

// Supabase からのリアルタイム同期（設定時）＆ 初回自動シード投入
export async function syncFromSupabase(): Promise<{
  questions: QuestionQueueItem[];
  knowledge: KnowledgeRecord[];
}> {
  if (!supabase) {
    return {
      questions: getLocalQuestions(),
      knowledge: getLocalKnowledge(),
    };
  }

  try {
    const [qRes, kRes] = await Promise.all([
      supabase.from('questions_queue').select('*').order('no', { ascending: true }),
      supabase.from('knowledge_records').select('*').order('created_at', { ascending: false }),
    ]);

    // 🌟 初回接続時：Supabase側が空の場合は初期マスターデータを一括投入
    if ((!qRes.data || qRes.data.length === 0) && !qRes.error) {
      console.log('🌱 ガルバSupabaseが初期状態のため、マスターデータ（200問）を自動投入します...');
      try {
        const cleanQuestions = INITIAL_QUESTIONS_MASTER.map((q) => ({
          ...q,
          images: q.images || [],
        }));
        const cleanKnowledge = INITIAL_KNOWLEDGE_MASTER.map((k) => ({
          ...k,
          images: k.images || [],
          key_terminology: k.key_terminology || [],
        }));

        await supabase.from('questions_queue').upsert(cleanQuestions);
        await supabase.from('knowledge_records').upsert(cleanKnowledge);

        return {
          questions: INITIAL_QUESTIONS_MASTER,
          knowledge: INITIAL_KNOWLEDGE_MASTER,
        };
      } catch (seedErr) {
        console.warn('Auto-seed to ガルバ Supabase failed:', seedErr);
      }
    }

    let questions = (qRes.data && qRes.data.length > 0) ? (qRes.data as QuestionQueueItem[]) : getLocalQuestions();
    let knowledge = (kRes.data && kRes.data.length > 0) ? (kRes.data as KnowledgeRecord[]) : getLocalKnowledge();

    saveLocalQuestions(questions);
    saveLocalKnowledge(knowledge);

    return { questions, knowledge };
  } catch (e) {
    console.warn('Supabase sync error, falling back to local storage:', e);
    return {
      questions: getLocalQuestions(),
      knowledge: getLocalKnowledge(),
    };
  }
}

export function resetAllToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(INITIAL_QUESTIONS_MASTER));
  localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(INITIAL_KNOWLEDGE_MASTER));
}
