# Git / Cloudflare 準備メモ

## 1) Git 初期化

このリポジトリは `git init -b main` 済みです。

初回コミット前の基本コマンド:

```bash
git add .
git commit -m "chore: bootstrap project"
```

リモート接続:

```bash
git remote add origin <YOUR_GIT_URL>
git push -u origin main
```

## 2) Cloudflare 準備

OpenNext + Wrangler の土台を追加済み:

- `wrangler.jsonc`
- `open-next.config.ts`
- `public/_headers`
- `package.json` の `preview` / `deploy` / `cf:*` scripts

## 3) ローカル環境ファイル

```bash
copy .env.example .env
copy .dev.vars.example .dev.vars
```

## 4) Cloudflare 認証とデプロイ

```bash
npx wrangler login
npm run deploy
```

## 5) DB 接続情報の登録

Worker 環境に `DATABASE_URL` を登録:

```bash
npx wrangler secret put DATABASE_URL
```

`DATABASE_URL` は Cloudflare 本番接続方式に合わせて設定してください
（Hyperdrive または外部公開PostgreSQLなど）。
