import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// クライアントサイド・公開用 Supabase インスタンス
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// サーバーサイド・管理者用 Supabase インスタンス（APIルート用）
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabase; // Service Role Keyが未設定の場合はAnonKeyでフォールバック

// ストレージバケット名定数
export const STORAGE_BUCKET_MEDIA = 'knowledge-media';
