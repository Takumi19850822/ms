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
