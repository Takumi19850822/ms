"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

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

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  minWidth: 0,
};

const sectionStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  display: "grid",
  gap: 14,
  background: "#fff",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
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
  { name: "shirtDesignNo", label: "シャツデザインNo." },
  { name: "shirtBodyPrice", label: "シャツ本体価格" },
  { name: "shirtColorA", label: "シャツA色" },
  { name: "shirtColorB", label: "シャツB色" },
  { name: "shirtColorC", label: "シャツC色" },
];

const shirtNumberFields: FieldConfig[] = [
  { name: "backNumberFont", label: "背番号フォント" },
  { name: "backNumberFillColor", label: "背番号フォント中カラー" },
  { name: "backNumberInnerBorder", label: "背番号フォントフチ内" },
  { name: "backNumberOuterBorder", label: "背番号フォントフチ外" },
];

const shirtTeamFields: FieldConfig[] = [
  { name: "shirtTeamFont", label: "チーム名フォント" },
  { name: "shirtTeamFillColor", label: "チーム名フォント中カラー" },
  { name: "shirtTeamInnerBorder", label: "チーム名フォントフチ内" },
  { name: "shirtTeamOuterBorder", label: "チーム名フォントフチ外" },
  { name: "shirtTeamPrintPosition", label: "チーム名プリント位置" },
  { name: "shirtTeamStyle", label: "チーム名スタイル" },
];

const chestNumberFields: FieldConfig[] = [
  { name: "chestNumberFont", label: "胸番号フォント" },
  { name: "chestNumberFillColor", label: "胸番号フォント中カラー" },
  { name: "chestNumberInnerBorder", label: "胸番号フォントフチ内" },
  { name: "chestNumberOuterBorder", label: "胸番号フォントフチ外" },
  { name: "chestNumberPrintPosition", label: "胸番号プリント位置" },
];

const personalNameFields: FieldConfig[] = [
  { name: "personalNameFont", label: "個人名フォント" },
  { name: "personalNameFillColor", label: "個人名フォント中カラー" },
  { name: "personalNameInnerBorder", label: "個人名フォントフチ内" },
  { name: "personalNameOuterBorder", label: "個人名フォントフチ外" },
  { name: "personalNamePrintPosition", label: "個人名プリント位置" },
  { name: "personalNameStyle", label: "個人名スタイル" },
];

const pantsFields: FieldConfig[] = [
  { name: "pantsDesignNo", label: "バスケットパンツデザインNo" },
  { name: "pantsBodyPrice", label: "バスケットパンツ本体価格" },
  { name: "pantsColorA", label: "バスケットパンツA色" },
  { name: "pantsColorB", label: "バスケットパンツB色" },
  { name: "pantsColorC", label: "バスケットパンツC色" },
];

const pantsNumberFields: FieldConfig[] = [
  { name: "pantsNumberFont", label: "パンツ番号フォント" },
  { name: "pantsNumberFillColor", label: "パンツ番号中カラー" },
  { name: "pantsNumberInnerBorder", label: "パンツ番号フチ内" },
  { name: "pantsNumberOuterBorder", label: "パンツ番号フチ外" },
  { name: "pantsNumberPrintPosition", label: "パンツ番号プリント位置" },
];

const pantsTeamFields: FieldConfig[] = [
  { name: "pantsTeamFont", label: "パンツチーム名フォント" },
  { name: "pantsTeamFillColor", label: "パンツチーム名中カラー" },
  { name: "pantsTeamInnerBorder", label: "パンツチーム名フチ内" },
  { name: "pantsTeamOuterBorder", label: "パンツチーム名フチ外" },
  { name: "pantsTeamPrintPosition", label: "パンツチーム名プリント位置" },
  { name: "pantsTeamName", label: "パンツチーム名" },
  { name: "pantsTeamStyle", label: "パンツチーム名スタイル" },
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
    <label style={labelStyle}>
      <span>{field.label}</span>
      <input
        type={field.type ?? "text"}
        value={value}
        readOnly={field.readOnly}
        onChange={(event) => onChange(field.name, event.target.value)}
        style={{ ...inputStyle, background: field.readOnly ? "#f9fafb" : "#fff" }}
      />
    </label>
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
                <td style={{ padding: 8 }}>
                  <input value={row.number} onChange={(event) => onChange(row.id, "number", event.target.value)} style={inputStyle} />
                </td>
                <td style={{ padding: 8 }}>
                  <input value={row.wearSize} onChange={(event) => onChange(row.id, "wearSize", event.target.value)} style={inputStyle} />
                </td>
                <td style={{ padding: 8 }}>
                  <input value={row.pantsSize} onChange={(event) => onChange(row.id, "pantsSize", event.target.value)} style={inputStyle} />
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

      <Section title="基本情報">
        <FieldGrid>
          {baseFields.map((field) => (
            <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
          ))}
        </FieldGrid>
        <div style={gridStyle}>
          <RadioGroup label="新規・追加" value={orderType} options={["新規", "追加"]} onChange={setOrderType} />
          <RadioGroup label="作成区分" value={creationType} options={["デザイン作成", "製品作成"]} onChange={setCreationType} />
        </div>
        <label style={labelStyle}>
          <span>フリー入力</span>
          <textarea
            value={values.freeText}
            onChange={(event) => updateValue("freeText", event.target.value)}
            rows={4}
            style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", resize: "vertical" }}
          />
        </label>
      </Section>

      <Section title="シャツ">
        <CheckboxField label="シャツ（大人＆ジュニアサイズ）" checked={shirtEnabled} onChange={setShirtEnabled} />
        {shirtEnabled ? (
          <>
            <FieldGrid>
              {shirtFields.map((field) => (
                <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
              ))}
            </FieldGrid>

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
              {pantsFields.map((field) => (
                <TextField key={field.name} field={field} value={values[field.name] ?? ""} onChange={updateValue} />
              ))}
            </FieldGrid>

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
