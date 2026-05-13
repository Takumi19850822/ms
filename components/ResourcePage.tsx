"use client";

import { useMemo, useState } from "react";
import { ResourceRecord } from "@/lib/types";

type Props = {
  title: string;
  resourceId: string;
  initialRows: ResourceRecord[];
};

export function ResourcePage({ title, resourceId, initialRows }: Props) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ResourceRecord[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  async function loadRows(keyword: string) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (keyword) {
      params.set("search", keyword);
    }
    const response = await fetch(`/api/resources/${resourceId}?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json()) as { rows: ResourceRecord[] };
    setRows(data.rows);
    setLoading(false);
  }

  async function addRow() {
    setError("");
    setSuccess("");
    const response = await fetch(`/api/resources/${resourceId}`, { method: "POST" });
    if (!response.ok) {
      setError("新規追加に失敗しました。");
      return;
    }
    const data = (await response.json()) as { record: ResourceRecord };
    setRows((prev) => [data.record, ...prev]);
    setSelectedId(data.record.id);
  }

  function patchSelected(partial: Partial<ResourceRecord>) {
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
    const response = await fetch(`/api/resources/${resourceId}/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: selected.code,
        name: selected.name,
        storeId: selected.storeId,
        note: selected.note,
        version: selected.version,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message ?? "保存に失敗しました。");
      return;
    }
    const data = (await response.json()) as { record: ResourceRecord };
    setRows((prev) => prev.map((row) => (row.id === selected.id ? data.record : row)));
    setSelectedId(data.record.id);
    setSuccess("保存しました。");
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>{title}</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="検索..."
        style={{
          width: "min(420px, 100%)",
          height: 38,
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "0 10px",
        }}
      />
      <div>
        <button
          type="button"
          onClick={() => void loadRows(search)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          検索
        </button>
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          type="button"
          onClick={addRow}
          style={{
            border: "1px solid #111827",
            borderRadius: 6,
            background: "#111827",
            color: "#fff",
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          新規追加
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 16 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: 10, width: 88 }}>詳細</th>
                <th style={{ textAlign: "left", padding: 10 }}>コード</th>
                <th style={{ textAlign: "left", padding: 10 }}>名称</th>
                <th style={{ textAlign: "left", padding: 10 }}>店舗</th>
                <th style={{ textAlign: "left", padding: 10 }}>更新日時</th>
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
                  <tr
                    key={row.id}
                    style={{
                      borderTop: "1px solid #f3f4f6",
                      background: selectedId === row.id ? "#f9fafb" : "#fff",
                    }}
                  >
                    <td style={{ padding: 10 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          background: "#fff",
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        詳細
                      </button>
                    </td>
                    <td style={{ padding: 10 }}>{row.code}</td>
                    <td style={{ padding: 10 }}>{row.name}</td>
                    <td style={{ padding: 10 }}>{row.storeId ?? "-"}</td>
                    <td style={{ padding: 10 }}>{new Date(row.updatedAt).toLocaleString("ja-JP")}</td>
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
                <span>コード</span>
                <input
                  value={selected.code}
                  onChange={(e) => patchSelected({ code: e.target.value })}
                  style={{ height: 36, border: "1px solid #d1d5db", borderRadius: 6, padding: "0 10px" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>名称</span>
                <input
                  value={selected.name}
                  onChange={(e) => patchSelected({ name: e.target.value })}
                  style={{ height: 36, border: "1px solid #d1d5db", borderRadius: 6, padding: "0 10px" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>店舗ID</span>
                <input
                  value={selected.storeId ?? ""}
                  onChange={(e) => patchSelected({ storeId: e.target.value || null })}
                  style={{ height: 36, border: "1px solid #d1d5db", borderRadius: 6, padding: "0 10px" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>備考</span>
                <textarea
                  value={selected.note}
                  onChange={(e) => patchSelected({ note: e.target.value })}
                  rows={3}
                  style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", resize: "vertical" }}
                />
              </label>
              <div style={{ fontSize: 12, color: "#4b5563" }}>version: {selected.version}</div>
              <button
                type="button"
                onClick={saveSelected}
                disabled={saving}
                style={{
                  border: "1px solid #111827",
                  borderRadius: 6,
                  background: "#111827",
                  color: "#fff",
                  height: 36,
                  cursor: "pointer",
                }}
              >
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
