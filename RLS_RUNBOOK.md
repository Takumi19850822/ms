# RLS移行手順書（このリポジトリ向け）

この手順書は、`ResourceRecord` / `AppUser` を **RLS前提** で運用するための作業手順です。

## 0. 前提

- このリポジトリは Supabase の HTTP API（`supabase-js`）を利用する。
- 通常業務の読み書きは `anon + JWT` で実行し、RLS を有効にする。
- `service_role` は最小用途（ログイン照合・初期管理者投入）に限定する。

## 1. 必須環境変数を設定する

`.env` に以下を設定する（本番は環境変数管理で設定）。

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`
- `SESSION_SECRET`

補足:

- `SUPABASE_JWT_SECRET` は Supabase 側で検証される JWT シークレット。アプリ側と一致が必要。
- `SESSION_SECRET` はアプリのセッション Cookie 署名用（Supabase とは別用途）。

## 2. Supabase に RLS SQL を適用する

Supabase ダッシュボードの SQL Editor で、以下を順に実行する。

1. `rls_resource_record.sql`
2. `rls_app_user.sql`

実行後、対象テーブルの RLS が有効化され、ポリシーが作成される。

## 3. JWTクレーム設計を確認する

RLSポリシーは `auth.jwt()` の以下クレームを参照する。

- `sub`: ログインユーザーID（`SessionUser.id`）
- `role`: `"authenticated"`（Supabaseロール）
- `app_role`: `"admin" | "store_all" | "store"`
- `app_store_id`: 店舗ID（`store` の場合に利用）

このリポジトリでは `lib/supabase-rls-jwt.ts` で上記クレームを付与して JWT を発行する。

## 4. アプリ側の接続経路を確認する

通常処理は `getSupabaseWithRls(user)` を使う。

- `ResourceRecord` 系: `lib/data.ts`
- `AppUser` 管理系: `lib/users.ts`（一覧/作成/更新）

`getSupabaseWithRls` は以下で構成される。

- APIキー: `SUPABASE_ANON_KEY`
- Authorization: `Bearer <RLS用JWT>`

## 5. 動作確認（必須）

### 5-1. 管理者（admin）

- ユーザー管理画面で一覧・作成・更新が可能。
- リソース一覧で全店舗データが取得できる。

### 5-2. 店舗ユーザー（store）

- `ResourceRecord` で自店舗以外が見えない。
- 自店舗以外の更新は 403 になる。
- `AppUser` 管理APIにアクセスしても 403 になる。

### 5-3. 失敗時に見るポイント

- `SUPABASE_JWT_SECRET` の不一致（最頻出）
- JWT の `app_role` / `app_store_id` 欠落
- SQL未適用（RLS/Policyが未作成）

## 6. 変更後の運用ルール

- 新規API実装時は原則 `getSupabaseWithRls(user)` を使う。
- `service_role` を使う場合は、用途を「管理・初期化」に限定し、理由を明記する。
- RLSポリシーと JWT クレーム名を変更する場合は、SQL とアプリを同時に更新する。

## 7. 切り戻し手順（緊急時）

緊急対応時のみ。原因調査後は再度RLS前提に戻す。

1. 必要に応じて該当APIをメンテナンスモード化。
2. 一時的に `service_role` 経路へ戻す（コード切替）。
3. 影響範囲確認後、RLS設定・JWT設定を修正して再デプロイ。

## 8. 参考ファイル

- `rls_resource_record.sql`
- `rls_app_user.sql`
- `lib/supabase.ts`
- `lib/supabase-rls-jwt.ts`
- `lib/data.ts`
- `lib/users.ts`
