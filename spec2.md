# システムアーキテクチャ定義書：めっき品管技術伝承AIバイブル

## 1. インフラ・ホスティング構成概要
本プロジェクトは、インフラ管理コストをゼロにしつつ、APIキーの安全な隠蔽と音声マルチモーダル処理を実現するため、**「Next.js on Vercel」＋「Supabase」＋「Gemini 1.5 Flash」**の構成を採用する。

- **Vercel（フロントエンド ＆ サーバーレスバックエンド一体型ホスティング）：**
  - Next.js (App Router) をホスティング。
  - フロントエンド（UI表示・マイク録音・音声読み上げ）と、バックエンド（API Routes）を単一プロジェクト内で完結させる。
  - `GEMINI_API_KEY` などの機密環境変数はVercel側で安全に保持し、ブラウザ側へ一切露出させない。
- **Supabase（BaaS：Backend as a Service）：**
  - PostgreSQL Database: 200問の質問キュー（`questions_queue`）および蓄積ナレッジ（`knowledge_records`）の永続化。
  - Storage Bucket (`knowledge-media`): 録音された音声Blobファイルおよび現場写真画像の保管。
- **Gemini 1.5 Flash API（推論エンジン）：**
  - 三浦さんの質問具体化（テキストリライト）。
  - 本部長の音声マルチモーダル解析（音声直接入力 ＋ めっき誤変換辞書適用 ＋ 構造化JSON出力）。

---

## 2. データフロー・シーケンス