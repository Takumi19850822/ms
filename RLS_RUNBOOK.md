# RLS運用手順書（Supabase Auth中心）

この手順書は、Supabase Auth のユーザーを基準に RLS を運用するための実施手順です。

## 0. 方針

- 認証は Supabase Auth（`auth.users`）を利用する。
- 業務属性（`role`, `store_id`, `is_active`）は `public.app_user_profile` で管理する。
- 通常データアクセスは `anon key + Authorization: Bearer <access_token>` で実行し、RLS を適用する。
- `service_role` は管理用途（ユーザー招待、プロフィール管理など）に限定する。

## 1. 必須環境変数

`.env` / Cloudflare の環境変数に以下を設定する。

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. SQL適用

Supabase SQL Editor で以下を実行する。

1. `rls_app_user.sql`（`app_user_profile` と関数/ポリシー作成）
2. `rls_resource_record.sql`（`ResourceRecord` のRLSポリシー更新）
3. `seed_master_store.sql`（店舗マスタ投入、任意）

## 2.1 認証まわりの環境変数

`.env` に以下を設定する（Dashboard > Project Settings > API から取得）。

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（ユーザ招待・管理 API で必須）
- `APP_URL`（招待メールのリンク先。ローカルは `http://localhost:3000`、本番は公開 URL）

Supabase Dashboard > Authentication > URL Configuration も合わせて設定する。

- **Site URL**: `APP_URL` と同じ値
- **Redirect URLs**: `APP_URL` を含む URL（例: `http://localhost:3000/**`）

## 2.2 ユーザ登録の仕組み

このアプリは Supabase Auth の `auth.users` と、業務属性テーブル `public.app_user_profile` の2段構成。

- 管理画面「新規追加」→ `auth.users` に招待作成 + `app_user_profile` に upsert + **招待メール送信**
- 受信者が招待メールのリンクを開き、**本人がパスワードを設定**して初めてログイン可能
- ログイン成功には **両方** が必要（Auth 認証 OK、`email_confirmed_at` あり、`app_user_profile.is_active = true`）
- 最初の管理者だけは Supabase Dashboard または SQL で作成（RLS_RUNBOOK 参照）

## 3. 初期管理者セットアップ

1. Supabase Auth 側で最初の管理者ユーザーを作成（招待または手動作成）。
2. そのユーザーの `id` を使って `public.app_user_profile` に `role='admin'` の行を作成。

例:

```sql
insert into public.app_user_profile (id, name, role, store_id, is_active)
values ('<auth.users.id>', '管理者', 'admin', null, true)
on conflict (id) do update
set role = excluded.role, is_active = excluded.is_active;
```

## 4. 管理者ユーザー追加フロー

- 管理画面の新規追加は `auth.admin.inviteUserByEmail` で招待メールを送る。
- 招待時に `app_user_profile` を同時作成/更新する。
- ログイン可否は `app_user_profile.is_active` で制御する。

## 5. 動作確認

### 管理者

- `/masters/user` でユーザー一覧・招待・更新ができる。
- リソース一覧で全店舗データが見える。

### 店舗ユーザー

- 自店舗の `ResourceRecord` のみ参照/更新できる。
- ユーザー管理 API は 403 になる。

## 6. トラブルシュート

- ログインできない:
  - `auth.users` に対象ユーザーがあるか
  - `app_user_profile` に同じ `id` の行があるか
  - `is_active = true` か
  - `.env` の `SUPABASE_ANON_KEY` が Dashboard の値と一致しているか
  - 画面に「app_user_profile が未登録」と出る場合は SQL 未適用または profile 行未作成
- ユーザ新規追加で 500 / Invalid API key:
  - `SUPABASE_SERVICE_ROLE_KEY` が古い・誤り。Dashboard から **service_role** を再コピーして `.env` 更新後、dev サーバー再起動
- 招待メールのリンクが localhost になる:
  - 本番では `.env` の `APP_URL` を本番 URL に設定
  - Supabase の Site URL / Redirect URLs も同じ URL に更新
- 403 が出る:
  - `role/store_id` の設定がポリシーと一致しているか
  - SQL が最新（`rls_app_user.sql`, `rls_resource_record.sql`）か

## 7. 参考ファイル

- `rls_app_user.sql`
- `rls_resource_record.sql`
- `lib/auth-session.ts`
- `lib/supabase.ts`
- `lib/data.ts`
- `lib/users.ts`
