"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setSubmitting(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      switch (data.message) {
        case "profile_not_found":
          setError("Supabase Auth には登録されていますが、app_user_profile が未登録です。管理者に連絡するか、RLS_RUNBOOK の初期管理者手順を実行してください。");
          break;
        case "email_not_confirmed":
          setError("招待メールのリンクからパスワード設定が完了していません。メールを確認してください。");
          break;
        case "supabase_not_configured":
          setError(".env に SUPABASE_URL / SUPABASE_ANON_KEY が設定されていません。");
          break;
        case "supabase_invalid_key":
          setError("SUPABASE_ANON_KEY が無効です。Supabase Dashboard から API キーを再取得してください。");
          break;
        case "supabase_unreachable":
          setError("Supabase に接続できません。ネットワークと SUPABASE_URL を確認してください。");
          break;
        default:
          setError("メールアドレスまたはパスワードが不正です。招待メールでパスワード設定済みかも確認してください。");
          break;
      }
      return;
    }
    router.push("/orders/all");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#fff",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 24,
          display: "grid",
          gap: 14,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>ログイン</h1>
        <label style={{ display: "grid", gap: 6 }}>
          <span>メールアドレス</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ height: 38, padding: "0 10px", border: "1px solid #d1d5db", borderRadius: 6 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>パスワード</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ height: 38, padding: "0 10px", border: "1px solid #d1d5db", borderRadius: 6 }}
          />
        </label>
        {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          style={{
            border: 0,
            borderRadius: 6,
            height: 40,
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </main>
  );
}
