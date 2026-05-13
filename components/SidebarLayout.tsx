"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { MASTER_CATEGORIES, ORDER_CATEGORIES } from "@/lib/resources";
import { SessionUser } from "@/lib/types";

function NavLink({ href, label, collapsed }: { href: string; label: string; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "8px 10px",
        borderRadius: 6,
        background: active ? "#ffffff" : "transparent",
        border: active ? "1px solid #d1d5db" : "1px solid transparent",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      title={label}
    >
      {collapsed ? label.slice(0, 2) : label}
    </Link>
  );
}

export function SidebarLayout({ children, session }: { children: React.ReactNode; session: SessionUser }) {
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 72 : 268;

  const sidebarItems = useMemo(
    () => ({
      orders: ORDER_CATEGORIES.map((item) => ({ href: `/orders/${item.key}`, label: item.title })),
      masters: MASTER_CATEGORIES.map((item) => ({ href: `/masters/${item.key}`, label: item.title })),
    }),
    [],
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <aside
        style={{
          width,
          transition: "width .2s ease",
          background: "#f3f4f6",
          borderRight: "1px solid #e5e7eb",
          padding: 12,
          display: "grid",
          alignContent: "start",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            height: 36,
            cursor: "pointer",
          }}
        >
          {collapsed ? ">>" : "<<"}
        </button>

        <section style={{ display: "grid", gap: 6 }}>
          {!collapsed ? <strong>オーダー</strong> : null}
          {sidebarItems.orders.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} collapsed={collapsed} />
          ))}
        </section>

        <section style={{ display: "grid", gap: 6 }}>
          {!collapsed ? <strong>マスタ</strong> : null}
          {sidebarItems.masters.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} collapsed={collapsed} />
          ))}
        </section>

        <section style={{ marginTop: "auto", fontSize: 12, color: "#4b5563" }}>
          {!collapsed ? (
            <>
              <div>{session.name}</div>
              <div>{session.email}</div>
              <div>role: {session.role}</div>
            </>
          ) : (
            <div>{session.name.slice(0, 1)}</div>
          )}
        </section>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
