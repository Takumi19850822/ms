"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";

type DetailRow = {
  id: number;
  number: string;
  wearSize: string;
  pantsSize: string;
};

type SavedOrderRecord = {
  id: string;
  code: string;
  name: string;
  updatedAt: string;
  version: number;
};

type BasketballOrderFormData = {
  values?: Record<string, string>;
  orderType?: string;
  creationType?: string;
  numberSize?: string;
  options?: Partial<{
    shirtEnabled: boolean;
    shirtBackNumber: boolean;
    shirtTeamName: boolean;
    shirtChestNumber: boolean;
    shirtPersonalName: boolean;
    pantsEnabled: boolean;
    pantsNumber: boolean;
    pantsTeamName: boolean;
  }>;
  detailRows?: DetailRow[];
};

type Props = {
  initialRecord?: SavedOrderRecord;
  initialOrder?: BasketballOrderFormData;
};

type FieldConfig = {
  name: string;
  label: string;
  type?: "date" | "email" | "tel";
  readOnly?: boolean;
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 36,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "0 10px",
  background: "#fff",
};

const sectionStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  display: "grid",
  gap: 8,
  background: "#fff",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  borderTop: "1px solid #d1d5db",
  borderLeft: "1px solid #d1d5db",
};

const slipFieldStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "136px minmax(0, 1fr)",
  minWidth: 0,
  borderRight: "1px solid #d1d5db",
  borderBottom: "1px solid #d1d5db",
  background: "#fff",
};

const slipLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  minHeight: 30,
  padding: "1px 10px",
  background: "#f3f4f6",
  borderRight: "1px solid #d1d5db",
  fontWeight: 700,
  lineHeight: 1.35,
  whiteSpace: "pre-line",
};

const slipControlStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  padding: 0,
};

const slipInputStyle: CSSProperties = {
  ...inputStyle,
  height: "100%",
  minHeight: 30,
  border: 0,
  borderRadius: 0,
  background: "transparent",
};

const baseFields: FieldConfig[] = [
  { name: "orderDate", label: "注文日", type: "date" },
  { name: "storeCode", label: "店番" },
  { name: "storeName", label: "店名" },
  { name: "storePhone", label: "電話番号", type: "tel" },
  { name: "staffName", label: "担当" },
  { name: "previousPoNo", label: "前回のP.O No." },
  { name: "megaSportsPoNo", label: "メガスポーツ用P.O No." },
  { name: "watasakuOrderNo", label: "渡作発注書No" },
  { name: "deliveryEstimate", label: "お渡し目安" },
  { name: "generation", label: "世代" },
  { name: "category", label: "カテゴリ", readOnly: true },
  { name: "gender", label: "性別" },
  { name: "customerKana", label: "顧客氏名フリガナ" },
  { name: "customerName", label: "顧客氏名" },
  { name: "teamKana", label: "チーム名フリガナ" },
  { name: "teamName", label: "チーム名" },
  { name: "customerPhone", label: "電話番号", type: "tel" },
  { name: "fax", label: "FAX", type: "tel" },
  { name: "email", label: "メールアドレス", type: "email" },
];

const shirtFields: FieldConfig[] = [
  { name: "shirtDesignNo", label: "デザインNo." },
  { name: "shirtBodyPrice", label: "本体価格" },
  { name: "shirtColorA", label: "A色" },
  { name: "shirtColorB", label: "B色" },
  { name: "shirtColorC", label: "C色" },
];

const shirtNumberFields: FieldConfig[] = [
  { name: "backNumberFont", label: "フォント" },
  { name: "backNumberFillColor", label: "中カラー" },
  { name: "backNumberInnerBorder", label: "フチ内" },
  { name: "backNumberOuterBorder", label: "フチ外" },
];

const shirtTeamFields: FieldConfig[] = [
  { name: "shirtTeamFont", label: "フォント" },
  { name: "shirtTeamFillColor", label: "中カラー" },
  { name: "shirtTeamInnerBorder", label: "フチ内" },
  { name: "shirtTeamOuterBorder", label: "フチ外" },
  { name: "shirtTeamPrintPosition", label: "プリント位置" },
  { name: "shirtTeamStyle", label: "スタイル" },
];

const chestNumberFields: FieldConfig[] = [
  { name: "chestNumberFont", label: "フォント" },
  { name: "chestNumberFillColor", label: "中カラー" },
  { name: "chestNumberInnerBorder", label: "フチ内" },
  { name: "chestNumberOuterBorder", label: "フチ外" },
  { name: "chestNumberPrintPosition", label: "プリント位置" },
];

const personalNameFields: FieldConfig[] = [
  { name: "personalNameFont", label: "フォント" },
  { name: "personalNameFillColor", label: "中カラー" },
  { name: "personalNameInnerBorder", label: "フチ内" },
  { name: "personalNameOuterBorder", label: "フチ外" },
  { name: "personalNamePrintPosition", label: "プリント位置" },
  { name: "personalNameStyle", label: "スタイル" },
];

const pantsFields: FieldConfig[] = [
  { name: "pantsDesignNo", label: "デザインNo" },
  { name: "pantsBodyPrice", label: "本体価格" },
  { name: "pantsColorA", label: "A色" },
  { name: "pantsColorB", label: "B色" },
  { name: "pantsColorC", label: "C色" },
];

const pantsNumberFields: FieldConfig[] = [
  { name: "pantsNumberFont", label: "フォント" },
  { name: "pantsNumberFillColor", label: "中カラー" },
  { name: "pantsNumberInnerBorder", label: "フチ内" },
  { name: "pantsNumberOuterBorder", label: "フチ外" },
  { name: "pantsNumberPrintPosition", label: "プリント位置" },
];

const pantsTeamFields: FieldConfig[] = [
  { name: "pantsTeamFont", label: "フォント" },
  { name: "pantsTeamFillColor", label: "中カラー" },
  { name: "pantsTeamInnerBorder", label: "フチ内" },
  { name: "pantsTeamOuterBorder", label: "フチ外" },
  { name: "pantsTeamPrintPosition", label: "プリント位置" },
  { name: "pantsTeamName", label: "チーム名" },
  { name: "pantsTeamStyle", label: "スタイル" },
];

const allFields = [
  ...baseFields,
  ...shirtFields,
  ...shirtNumberFields,
  ...shirtTeamFields,
  ...chestNumberFields,
  ...personalNameFields,
  ...pantsFields,
  ...pantsNumberFields,
  ...pantsTeamFields,
];

function createInitialValues() {
  return allFields.reduce<Record<string, string>>(
    (acc, field) => {
      acc[field.name] = field.name === "category" ? "バスケ" : "";
      return acc;
    },
    {
      freeText: "",
      shirtOptionsAmount: "",
      pantsOptionsAmount: "",
      setDiscountAmount: "",
      otherCostsAmount: "",
    },
  );
}

function mergeInitialValues(initialValues?: Record<string, string>) {
  return {
    ...createInitialValues(),
    ...(initialValues ?? {}),
  };
}

function normalizeDetailRows(rows?: DetailRow[]) {
  const normalized = rows
    ?.filter((row) => row && typeof row === "object")
    .map((row, index) => ({
      id: Number.isFinite(row.id) ? row.id : index + 1,
      number: row.number ?? "",
      wearSize: row.wearSize ?? "",
      pantsSize: row.pantsSize ?? "",
    }));

  return normalized?.length ? normalized : [{ id: 1, number: "", wearSize: "", pantsSize: "" }];
}

function parseAmount(value: string) {
  const numeric = Number(value.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

function focusNextInput(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing) {
    return;
  }

  event.preventDefault();
  const controls = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input:not([type='hidden']):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])",
    ),
  );
  const currentIndex = controls.indexOf(event.currentTarget);
  controls[currentIndex + 1]?.focus();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      {children}
    </section>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div style={gridStyle}>{children}</div>;
}

function SlipField({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <label style={{ ...slipFieldStyle, ...style }}>
      <span style={slipLabelStyle}>{label}</span>
      <span style={slipControlStyle}>{children}</span>
    </label>
  );
}

function TextField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <SlipField label={field.label}>
      <input
        type={field.type ?? "text"}
        value={value}
        readOnly={field.readOnly}
        onKeyDown={focusNextInput}
        onChange={(event) => onChange(field.name, event.target.value)}
        style={{ ...slipInputStyle, background: field.readOnly ? "#f9fafb" : "#fff" }}
      />
    </SlipField>
  );
}

function InlineTextField({
  name,
  label,
  value,
  onChange,
  width,
  type,
  readOnly,
  placeholder,
  style,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  width: string;
  type?: "date" | "email" | "tel";
  readOnly?: boolean;
  placeholder?: string;
  style?: CSSProperties;
}) {
  return (
    <SlipField label={label} style={{ minWidth: width, ...style }}>
      <input
        type={type ?? "text"}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onKeyDown={focusNextInput}
        onChange={(event) => onChange(name, event.target.value)}
        style={{ ...slipInputStyle, background: readOnly ? "#f9fafb" : "#fff" }}
      />
    </SlipField>
  );
}

function FormLine({ children, withTopBorder = true }: { children: React.ReactNode; withTopBorder?: boolean }) {
  return <div style={{ ...gridStyle, borderTop: withTopBorder ? gridStyle.borderTop : 0 }}>{children}</div>;
}

function TextAreaField({
  name,
  label,
  value,
  onChange,
  rows = 3,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  rows?: number;
}) {
  return (
    <SlipField label={label} style={{ gridColumn: "1 / -1" }}>
      <textarea
        value={value}
        onKeyDown={focusNextInput}
        onChange={(event) => onChange(name, event.target.value)}
        rows={rows}
        style={{
          ...slipInputStyle,
          height: "auto",
          minHeight: 72,
          padding: "8px 10px",
          resize: "vertical",
        }}
      />
    </SlipField>
  );
}

function RadioField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <SlipField label={label}>
      <span style={{ display: "flex", gap: 14, flexWrap: "wrap", padding: "0 10px" }}>
        {options.map((option) => (
          <label key={option} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="radio" checked={value === option} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </span>
    </SlipField>
  );
}

function RadioGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 8 }}>
      <legend style={{ fontWeight: 600, marginBottom: 2 }}>{label}</legend>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {options.map((option) => (
          <label key={option} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="radio" checked={value === option} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function DetailRowsTable({
  rows,
  onChange,
  onAdd,
  onRemove,
}: {
  rows: DetailRow[];
  onChange: (id: number, key: keyof Omit<DetailRow, "id">, value: string) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: 10 }}>番号</th>
              <th style={{ textAlign: "left", padding: 10 }}>ウェアサイズ</th>
              <th style={{ textAlign: "left", padding: 10 }}>パンツサイズ</th>
              <th style={{ textAlign: "left", padding: 10, width: 88 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: 0, borderRight: "1px solid #f3f4f6" }}>
                  <input
                    value={row.number}
                    onKeyDown={focusNextInput}
                    onChange={(event) => onChange(row.id, "number", event.target.value)}
                    style={slipInputStyle}
                  />
                </td>
                <td style={{ padding: 0, borderRight: "1px solid #f3f4f6" }}>
                  <input
                    value={row.wearSize}
                    onKeyDown={focusNextInput}
                    onChange={(event) => onChange(row.id, "wearSize", event.target.value)}
                    style={slipInputStyle}
                  />
                </td>
                <td style={{ padding: 0, borderRight: "1px solid #f3f4f6" }}>
                  <input
                    value={row.pantsSize}
                    onKeyDown={focusNextInput}
                    onChange={(event) => onChange(row.id, "pantsSize", event.target.value)}
                    style={slipInputStyle}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    disabled={rows.length === 1}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      background: "#fff",
                      padding: "6px 10px",
                      cursor: rows.length === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <button
          type="button"
          onClick={onAdd}
          style={{
            border: "1px solid #111827",
            borderRadius: 6,
            background: "#111827",
            color: "#fff",
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          明細行を追加
        </button>
      </div>
    </div>
  );
}

function SummaryTable({
  shirtUnit,
  pantsUnit,
  shirtQuantity,
  pantsQuantity,
  shirtOptions,
  pantsOptions,
  setDiscount,
  otherCosts,
}: {
  shirtUnit: number;
  pantsUnit: number;
  shirtQuantity: number;
  pantsQuantity: number;
  shirtOptions: number;
  pantsOptions: number;
  setDiscount: number;
  otherCosts: number;
}) {
  const shirtAmount = shirtUnit * shirtQuantity;
  const pantsAmount = pantsUnit * pantsQuantity;
  const total = shirtAmount + pantsAmount + shirtOptions + pantsOptions - setDiscount + otherCosts;
  const tax = Math.floor(total - total / 1.1);
  const rows = [
    { label: "ウェア本体価格", unit: shirtUnit, quantity: shirtQuantity, amount: shirtAmount },
    { label: "パンツ本体価格", unit: pantsUnit, quantity: pantsQuantity, amount: pantsAmount },
    { label: "オプション（ウェア）", unit: null, quantity: null, amount: shirtOptions },
    { label: "オプション（パンツ）", unit: null, quantity: null, amount: pantsOptions },
    { label: "セット割引", unit: null, quantity: null, amount: -setDiscount },
    { label: "その他費用", unit: null, quantity: null, amount: otherCosts },
  ];

  return (
    <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: 10 }}>商品内訳</th>
            <th style={{ textAlign: "right", padding: 10 }}>単価</th>
            <th style={{ textAlign: "right", padding: 10 }}>数量</th>
            <th style={{ textAlign: "right", padding: 10 }}>金額</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderTop: "1px solid #f3f4f6" }}>
              <td style={{ padding: 10 }}>{row.label}</td>
              <td style={{ padding: 10, textAlign: "right" }}>{row.unit === null ? "-" : formatAmount(row.unit)}</td>
              <td style={{ padding: 10, textAlign: "right" }}>{row.quantity === null ? "-" : row.quantity}</td>
              <td style={{ padding: 10, textAlign: "right" }}>{formatAmount(row.amount)}</td>
            </tr>
          ))}
          <tr style={{ borderTop: "2px solid #d1d5db", fontWeight: 700 }}>
            <td colSpan={3} style={{ padding: 10 }}>
              合計金額
            </td>
            <td style={{ padding: 10, textAlign: "right" }}>{formatAmount(total)}</td>
          </tr>
          <tr style={{ borderTop: "1px solid #f3f4f6" }}>
            <td colSpan={3} style={{ padding: 10 }}>
              （内消費税）
            </td>
            <td style={{ padding: 10, textAlign: "right" }}>{formatAmount(tax)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function BasketballOrderForm({ initialRecord, initialOrder }: Props) {
  const router = useRouter();
  const initialOptions = initialOrder?.options ?? {};
  const [values, setValues] = useState(() => mergeInitialValues(initialOrder?.values));
  const [savedRecord, setSavedRecord] = useState<SavedOrderRecord | null>(initialRecord ?? null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [orderType, setOrderType] = useState(initialOrder?.orderType ?? "新規");
  const [creationType, setCreationType] = useState(initialOrder?.creationType ?? "デザイン作成");
  const [numberSize, setNumberSize] = useState(initialOrder?.numberSize ?? "大人サイズ");
  const [shirtEnabled, setShirtEnabled] = useState(initialOptions.shirtEnabled ?? true);
  const [shirtBackNumber, setShirtBackNumber] = useState(initialOptions.shirtBackNumber ?? false);
  const [shirtTeamName, setShirtTeamName] = useState(initialOptions.shirtTeamName ?? false);
  const [shirtChestNumber, setShirtChestNumber] = useState(initialOptions.shirtChestNumber ?? false);
  const [shirtPersonalName, setShirtPersonalName] = useState(initialOptions.shirtPersonalName ?? false);
  const [pantsEnabled, setPantsEnabled] = useState(initialOptions.pantsEnabled ?? false);
  const [pantsNumber, setPantsNumber] = useState(initialOptions.pantsNumber ?? false);
  const [pantsTeamName, setPantsTeamName] = useState(initialOptions.pantsTeamName ?? false);
  const [detailRows, setDetailRows] = useState<DetailRow[]>(() => normalizeDetailRows(initialOrder?.detailRows));

  const price = useMemo(() => {
    const shirtQuantity = shirtEnabled ? detailRows.filter((row) => row.wearSize.trim() || row.number.trim()).length : 0;
    const pantsQuantity = pantsEnabled ? detailRows.filter((row) => row.pantsSize.trim() || row.number.trim()).length : 0;
    return {
      shirtUnit: parseAmount(values.shirtBodyPrice),
      pantsUnit: parseAmount(values.pantsBodyPrice),
      shirtQuantity,
      pantsQuantity,
      shirtOptions: parseAmount(values.shirtOptionsAmount),
      pantsOptions: parseAmount(values.pantsOptionsAmount),
      setDiscount: parseAmount(values.setDiscountAmount),
      otherCosts: parseAmount(values.otherCostsAmount),
    };
  }, [
    detailRows,
    pantsEnabled,
    shirtEnabled,
    values.otherCostsAmount,
    values.pantsBodyPrice,
    values.pantsOptionsAmount,
    values.setDiscountAmount,
    values.shirtBodyPrice,
    values.shirtOptionsAmount,
  ]);

  function updateValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function updateDetailRow(id: number, key: keyof Omit<DetailRow, "id">, value: string) {
    setDetailRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function addDetailRow() {
    setDetailRows((prev) => [...prev, { id: Date.now(), number: "", wearSize: "", pantsSize: "" }]);
  }

  function removeDetailRow(id: number) {
    setDetailRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  }

  async function saveOrder() {
    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    const body = {
      values,
      orderType,
      creationType,
      numberSize,
      options: {
        shirtEnabled,
        shirtBackNumber,
        shirtTeamName,
        shirtChestNumber,
        shirtPersonalName,
        pantsEnabled,
        pantsNumber,
        pantsTeamName,
      },
      detailRows,
      price,
      savedAt: new Date().toISOString(),
      version: savedRecord?.version,
    };

    const response = await fetch(savedRecord ? `/api/basketball-orders/${savedRecord.id}` : "/api/basketball-orders", {
      method: savedRecord ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setSaveError(data.message ?? "保存に失敗しました。");
      return;
    }

    const data = (await response.json()) as { record: SavedOrderRecord };
    const wasNewRecord = !savedRecord;
    setSavedRecord(data.record);
    setSaveMessage(savedRecord ? "上書き保存しました。" : "保存しました。");
    if (wasNewRecord) {
      router.replace(`/orders/basketball/${data.record.id}`);
    }
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>バスケオーダー登録</h1>
          <p style={{ margin: 0, color: "#4b5563" }}>入力内容と明細行から、画面内で価格参考表を自動計算します。</p>
          {savedRecord ? (
            <p style={{ margin: 0, color: "#4b5563", fontSize: 12 }}>
              保存済み: {savedRecord.code} / version {savedRecord.version} /{" "}
              {new Date(savedRecord.updatedAt).toLocaleString("ja-JP")}
            </p>
          ) : null}
        </div>
        <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
          <Link
            href="/orders/basketball"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              background: "#fff",
              padding: "7px 12px",
            }}
          >
            一覧へ戻る
          </Link>
          <button
            type="button"
            onClick={() => void saveOrder()}
            disabled={saving}
            style={{
              border: "1px solid #111827",
              borderRadius: 6,
              background: "#111827",
              color: "#fff",
              padding: "9px 18px",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "保存中..." : savedRecord ? "上書き保存" : "保存"}
          </button>
          {saveMessage ? <p style={{ color: "#047857", margin: 0 }}>{saveMessage}</p> : null}
          {saveError ? <p style={{ color: "#b91c1c", margin: 0 }}>{saveError}</p> : null}
        </div>
      </div>

      <Section title="オーダー登録">
        <div style={{ display: "grid", gap: 0 }}>
          <FormLine>
            <InlineTextField
              name="orderDate"
              label="注文日"
              value={values.orderDate}
              onChange={updateValue}
              width="12ch"
              type="date"
            />
            <InlineTextField name="staffName" label="担当者" value={values.staffName} onChange={updateValue} width="8ch" />
          </FormLine>

          <FormLine withTopBorder={false}>
            <InlineTextField name="storeCode" label="店番" value={values.storeCode} onChange={updateValue} width="6ch" />
            <InlineTextField name="storeName" label="店名" value={values.storeName} onChange={updateValue} width="18ch" />
            <InlineTextField
              name="storePhone"
              label="電話番号"
              value={values.storePhone}
              onChange={updateValue}
              width="18ch"
              type="tel"
            />
          </FormLine>

          <FormLine withTopBorder={false}>
            <RadioField label="新規・追加区分" value={orderType} options={["新規", "追加"]} onChange={setOrderType} />
            <InlineTextField name="previousPoNo" label="前回のP.O.No" value={values.previousPoNo} onChange={updateValue} width="18ch" />
            <InlineTextField
              name="megaSportsPoNo"
              label="メガスポーツ用P.O.No"
              value={values.megaSportsPoNo}
              onChange={updateValue}
              width="20ch"
            />
          </FormLine>

          <FormLine withTopBorder={false}>
            <InlineTextField
              name="deliveryEstimate"
              label="お渡し目安"
              value={values.deliveryEstimate}
              onChange={updateValue}
              width="14ch"
              type="date"
            />
            <InlineTextField
              name="watasakuOrderNo"
              label="渡作発注書No"
              value={values.watasakuOrderNo}
              onChange={updateValue}
              width="18ch"
            />
            <RadioField label="作成区分" value={creationType} options={["デザイン作成", "製品作成"]} onChange={setCreationType} />
          </FormLine>

          <FormLine withTopBorder={false}>
            <InlineTextField name="generation" label="世代" value={values.generation} onChange={updateValue} width="10ch" />
            <InlineTextField name="category" label="カテゴリ" value={values.category} onChange={updateValue} width="10ch" readOnly />
            <InlineTextField name="gender" label="性別" value={values.gender} onChange={updateValue} width="10ch" />
          </FormLine>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>顧客情報</h3>
          <div style={{ ...gridStyle, gridTemplateColumns: "repeat(2, minmax(320px, 1fr))" }}>
            {[
              { label: "フリガナ", name: "customerKana" },
              { label: "フリガナ", name: "teamKana" },
              { label: "お客様名", name: "customerName" },
              { label: "チーム名", name: "teamName" },
              { label: "電話番号", name: "customerPhone", type: "tel" as const },
              { label: "FAX", name: "fax", type: "tel" as const },
              { label: "メールアドレス", name: "email", type: "email" as const, style: { gridColumn: "1 / -1" } },
            ].map((field) => (
              <InlineTextField
                key={field.name}
                name={field.name}
                label={field.label}
                value={values[field.name] ?? ""}
                onChange={updateValue}
                width="18ch"
                type={field.type}
                style={field.style}
              />
            ))}
            <TextAreaField name="freeText" label="フリー入力" value={values.freeText} onChange={updateValue} />
          </div>
        </div>
      </Section>

      <Section title="シャツ">
        <CheckboxField label="シャツ（大人＆ジュニアサイズ）" checked={shirtEnabled} onChange={setShirtEnabled} />
        {shirtEnabled ? (
          <>
            <FieldGrid>
              {shirtFields.slice(0, 2).map((field) => (
                <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
              ))}
            </FieldGrid>
            <div style={{ ...gridStyle, gridTemplateColumns: "repeat(3, minmax(220px, 1fr))" }}>
              {shirtFields.slice(2).map((field) => (
                <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
              ))}
            </div>

            <CheckboxField label="背番号" checked={shirtBackNumber} onChange={setShirtBackNumber} />
            {shirtBackNumber ? (
              <FieldGrid>
                {shirtNumberFields.map((field) => (
                  <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
                ))}
              </FieldGrid>
            ) : null}

            <CheckboxField label="チーム名" checked={shirtTeamName} onChange={setShirtTeamName} />
            {shirtTeamName ? (
              <FieldGrid>
                {shirtTeamFields.map((field) => (
                  <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
                ))}
              </FieldGrid>
            ) : null}

            <CheckboxField label="胸番号" checked={shirtChestNumber} onChange={setShirtChestNumber} />
            {shirtChestNumber ? (
              <FieldGrid>
                {chestNumberFields.map((field) => (
                  <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
                ))}
              </FieldGrid>
            ) : null}

            <CheckboxField label="個人名" checked={shirtPersonalName} onChange={setShirtPersonalName} />
            {shirtPersonalName ? (
              <FieldGrid>
                {personalNameFields.map((field) => (
                  <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
                ))}
              </FieldGrid>
            ) : null}

            <RadioGroup
              label="番号サイズ"
              value={numberSize}
              options={["大人サイズ", "ジュニアサイズ", "指定サイズ"]}
              onChange={setNumberSize}
            />
          </>
        ) : null}
      </Section>

      <Section title="バスケットパンツ">
        <CheckboxField label="バスケットパンツ" checked={pantsEnabled} onChange={setPantsEnabled} />
        {pantsEnabled ? (
          <>
            <FieldGrid>
              {pantsFields.slice(0, 2).map((field) => (
                <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
              ))}
            </FieldGrid>
            <div style={{ ...gridStyle, gridTemplateColumns: "repeat(3, minmax(220px, 1fr))" }}>
              {pantsFields.slice(2).map((field) => (
                <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
              ))}
            </div>

            <CheckboxField label="パンツ番号" checked={pantsNumber} onChange={setPantsNumber} />
            {pantsNumber ? (
              <FieldGrid>
                {pantsNumberFields.map((field) => (
                  <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
                ))}
              </FieldGrid>
            ) : null}

            <CheckboxField label="パンツチーム名" checked={pantsTeamName} onChange={setPantsTeamName} />
            {pantsTeamName ? (
              <FieldGrid>
                {pantsTeamFields.map((field) => (
                  <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
                ))}
              </FieldGrid>
            ) : null}
          </>
        ) : null}
      </Section>

      <Section title="発注明細">
        <DetailRowsTable rows={detailRows} onChange={updateDetailRow} onAdd={addDetailRow} onRemove={removeDetailRow} />
      </Section>

      <Section title="価格参考表">
        <p style={{ margin: 0, color: "#4b5563" }}>本体価格以外は手入力してください。数量は明細行から自動集計します。</p>
        <FieldGrid>
          <TextField field={{ name: "shirtOptionsAmount", label: "オプション（ウェア）" }} value={values.shirtOptionsAmount} onChange={updateValue} />
          <TextField field={{ name: "pantsOptionsAmount", label: "オプション（パンツ）" }} value={values.pantsOptionsAmount} onChange={updateValue} />
          <TextField field={{ name: "setDiscountAmount", label: "セット割引" }} value={values.setDiscountAmount} onChange={updateValue} />
          <TextField field={{ name: "otherCostsAmount", label: "その他費用" }} value={values.otherCostsAmount} onChange={updateValue} />
        </FieldGrid>
        <SummaryTable {...price} />
      </Section>
    </main>
  );
}
