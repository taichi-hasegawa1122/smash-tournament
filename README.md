# スマブラ社内大会 チーム編成アプリ

1回だけ開催するスマブラ社内大会のためのシンプルなチーム編成アプリです。

## 機能

### 参加者向け
- 名前とレベル（1〜5）を入力して参加登録
- 専用URLで結果を確認

### 管理者向け
- 参加者一覧の確認・削除
- 4チームのリーダー設定
- 自動チーム編成（レベルバランス考慮）
- 結果の公開/非公開制御

## セットアップ

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) でアカウントを作成
2. 新しいプロジェクトを作成
3. SQL Editorで `supabase/schema.sql` の内容を実行

### 2. 環境変数の設定

`.env.local` ファイルを作成:

```bash
cp .env.example .env.local
```

以下を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_PASSWORD=your-admin-password
```

### 3. 開発サーバーの起動

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

## Vercelへのデプロイ

### 1. GitHubにプッシュ

```bash
git add .
git commit -m "Initial commit"
git push
```

### 2. Vercelでインポート

1. [Vercel](https://vercel.com) にログイン
2. 「New Project」→ GitHubリポジトリを選択
3. 環境変数を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
4. デプロイ

## 画面一覧

| パス | 説明 |
|------|------|
| `/` | 参加登録ページ |
| `/result?t=xxx` | 結果確認ページ（参加者専用URL） |
| `/admin` | 管理者ログイン |
| `/admin/players` | 参加者一覧 |
| `/admin/leaders` | リーダー設定 |
| `/admin/assign` | チーム編成・公開 |

## チーム編成アルゴリズム

1. リーダー4名を各チームに固定
2. その他の参加者をレベル高い順にソート
3. 以下の優先順位でチームに割り当て:
   - 人数が少ないチーム
   - スコア（レベル合計）が低いチーム
   - 同条件ならランダム

## 運用の流れ

1. 管理者が `/admin` にログイン
2. 参加者に登録ページ（`/`）のURLを共有
3. 参加者が登録（専用URLを保存してもらう）
4. 管理者が `/admin/leaders` でリーダー4名を設定
5. 管理者が `/admin/assign` で編成を確定
6. 管理者が「結果を公開」ボタンで公開
7. 参加者は専用URLで結果を確認

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
