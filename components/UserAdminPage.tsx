"use client";

import { useMemo, useState } from "react";
import { AppUserRecord, Role } from "@/lib/types";

type Props = {
  initialRows: AppUserRecord[];
};

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: "admin", label: "管理者" },
  { value: "store", label: "店舗" },
  { value: "store_all", label: "全店舗" },
];

export function UserAdminPage({ initialRows }: Props) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AppUserRecord[]>(initialRows);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) ?? null, [rows, selectedId]);

  async function loadRows(keyword: string) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (keyword) {
      params.set("search", keyword);
    }
    const response = await fetch(`/api/users?${params.toString()}`, { cache: "no-store" });
    setLoading(false);
    if (!response.ok) {
      setError("ユーザ一覧の取得に失敗しました。");
      return;
    }
    const data = (await response.json()) as { rows: AppUserRecord[] };
    setRows(data.rows);
    setSelectedId(null);
  }

  async function addUser() {
    setError("");
    setSuccess("");
    const invitedEmail = window.prompt("招待するメールアドレスを入力してください。")?.trim() ?? "";
    if (!invitedEmail) {
      return;
    }
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: invitedEmail }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message ?? "新規追加に失敗しました。");
      return;
    }
    const data = (await response.json()) as { user: AppUserRecord };
    setRows((prev) => [data.user, ...prev]);
    setSelectedId(data.user.id);
    setSuccess("招待メールを送信しました。受信者がリンクからパスワードを設定するまでログインできません。");
  }

  function patchSelected(partial: Partial<AppUserRecord>) {
    if (!selected) {
      return;
    }
    setRows((prev) => prev.map((row) => (row.id === selected.id ? { ...row, ...partial } : row)));
  }

  async function saveSelected() {
    if (!selected) {
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    const response = await fetch(`/api/users/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selected.name,
        email: selected.email,
        role: selected.role,
        storeId: selected.storeId,
        isActive: selected.isActive,
        version: selected.version,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message ?? "保存に失敗しました。");
      return;
    }
    const data = (await response.json()) as { user: AppUserRecord };
    setRows((prev) => prev.map((row) => (row.id === selected.id ? data.user : row)));
    setSelectedId(data.user.id);
    setSuccess("保存しました。");
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>ユーザマスタ</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="検索..."
        style={{ width: "min(420px, 100%)", height: 38, border: "1px solid #d1d5db", borderRadius: 6, padding: "0 10px" }}
      />
      <div>
        <button
          type="button"
          onClick={() => void loadRows(search)}
          style={{ border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", padding: "6px 12px", cursor: "pointer" }}
        >
          検索
        </button>
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          type="button"
          onClick={addUser}
          style={{ border: "1px solid #111827", borderRadius: 6, background: "#111827", color: "#fff", padding: "8px 14px", cursor: "pointer" }}
        >
          新規追加
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 16 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: 10, width: 88 }}>詳細</th>
                <th style={{ textAlign: "left", padding: 10 }}>名前</th>
                <th style={{ textAlign: "left", padding: 10 }}>メール</th>
                <th style={{ textAlign: "left", padding: 10 }}>ロール</th>
                <th style={{ textAlign: "left", padding: 10 }}>状態</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12 }}>
                    読み込み中...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12 }}>
                    データがありません。
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} style={{ borderTop: "1px solid #f3f4f6", background: selectedId === row.id ? "#f9fafb" : "#fff" }}>
                    <td style={{ padding: 10 }}>
                      <button type="button" onClick={() => setSelectedId(row.id)} style={{ border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", padding: "5px 10px", cursor: "pointer" }}>
                        詳細
                      </button>
                    </td>
                    <td style={{ padding: 10 }}>{row.name}</td>
                    <td style={{ padding: 10 }}>{row.email}</td>
                    <td style={{ padding: 10 }}>{row.role}</td>
                    <td style={{ padding: 10 }}>{row.isActive ? "有効" : "無効"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>詳細</h2>
          {!selected ? (
            <p>左表の「詳細」を押すと編集できます。</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span>名前</span>
                <input value={selected.name} onChange={(e) => patchSelected({ name: e.target.value })} style={{ height: 36, border: "1px solid #d1d5db", borderRadius: 6, padding: "0 10px" }} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>メールアドレス</span>
                <input type="email" value={selected.email} onChange={(e) => patchSelected({ email: e.target.value })} style={{ height: 36, border: "1px solid #d1d5db", borderRadius: 6, padding: "0 10px" }} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>ロール</span>
                <select value={selected.role} onChange={(e) => patchSelected({ role: e.target.value as Role })} style={{ height: 36, border: "1px solid #d1d5db", borderRadius: 6, padding: "0 10px" }}>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>店舗ID</span>
                <input
                  value={selected.storeId ?? ""}
                  disabled={selected.role !== "store"}
                  onChange={(e) => patchSelected({ storeId: e.target.value || null })}
                  style={{ height: 36, border: "1px solid #d1d5db", borderRadius: 6, padding: "0 10px" }}
                />
              </label>
              <p style={{ margin: 0, fontSize: 12, color: "#4b5563" }}>
                パスワードは招待メールのリンクから本人が設定します。管理者からは変更できません。
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={selected.isActive} onChange={(e) => patchSelected({ isActive: e.target.checked })} />
                <span>有効</span>
              </label>
              <div style={{ fontSize: 12, color: "#4b5563" }}>version: {selected.version}</div>
              <button type="button" onClick={saveSelected} disabled={saving} style={{ border: "1px solid #111827", borderRadius: 6, background: "#111827", color: "#fff", height: 36, cursor: "pointer" }}>
                {saving ? "保存中..." : "保存"}
              </button>
              {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
              {success ? <p style={{ color: "#047857", margin: 0 }}>{success}</p> : null}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
