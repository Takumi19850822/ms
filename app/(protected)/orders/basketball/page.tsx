import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { listResourceRecords } from "@/lib/data";

const BASKETBALL_RESOURCE_ID = "orders-basketball";

type Props = {
  searchParams: Promise<{ search?: string }>;
};

export default async function BasketballOrdersPage({ searchParams }: Props) {
  const session = await getSessionFromCookie();
  if (!session) {
    notFound();
  }

  const { search = "" } = await searchParams;
  const rows = await listResourceRecords(BASKETBALL_RESOURCE_ID, session, search);

  return (
    <main style={{ padding: 24, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>バスケオーダー一覧</h1>
          <p style={{ margin: "6px 0 0", color: "#4b5563" }}>一覧から詳細を開いて編集できます。</p>
        </div>
        <Link
          href="/orders/basketball/new"
          style={{
            border: "1px solid #111827",
            borderRadius: 6,
            background: "#111827",
            color: "#fff",
            padding: "9px 14px",
          }}
        >
          新規登録
        </Link>
      </div>

      <form action="/orders/basketball" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          name="search"
          defaultValue={search}
          placeholder="検索..."
          style={{
            width: "min(420px, 100%)",
            height: 38,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: "0 10px",
          }}
        />
        <button
          type="submit"
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
      </form>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: 10, width: 88 }}>詳細</th>
              <th style={{ textAlign: "left", padding: 10 }}>発注番号</th>
              <th style={{ textAlign: "left", padding: 10 }}>チーム / 顧客</th>
              <th style={{ textAlign: "left", padding: 10 }}>店番</th>
              <th style={{ textAlign: "left", padding: 10 }}>更新日時</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 12 }}>
                  データがありません。
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 10 }}>
                    <Link
                      href={`/orders/basketball/${row.id}`}
                      style={{
                        display: "inline-block",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        background: "#fff",
                        padding: "5px 10px",
                      }}
                    >
                      詳細
                    </Link>
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
    </main>
  );
}
