import { ResourceConfig } from "@/lib/types";

export const ORDER_CATEGORIES = [
  { key: "all", title: "全オーダー一覧", resourceId: "orders-all" },
  { key: "basketball", title: "バスケオーダー", resourceId: "orders-basketball" },
  { key: "soccer", title: "サッカーオーダー", resourceId: "orders-soccer" },
  { key: "volleyball", title: "バレーボールオーダー", resourceId: "orders-volleyball" },
  { key: "baseball", title: "ベースボールオーダー", resourceId: "orders-baseball" },
] as const;

export const MASTER_CATEGORIES = [
  { key: "color", title: "カラーマスタ", resourceId: "master-color" },
  { key: "size", title: "サイズマスタ", resourceId: "master-size" },
  { key: "design", title: "デザインマスタ", resourceId: "master-design" },
  { key: "font", title: "フォントマスタ", resourceId: "master-font" },
  {
    key: "print-position",
    title: "プリント位置マスタ",
    resourceId: "master-print-position",
  },
  { key: "store", title: "店舗マスタ", resourceId: "master-store" },
  { key: "product", title: "商品マスタ", resourceId: "master-product" },
  { key: "user", title: "ユーザマスタ", resourceId: "master-user" },
] as const;

export const RESOURCE_CONFIGS: Record<string, ResourceConfig> = [
  ...ORDER_CATEGORIES.map((item) => ({
    id: item.resourceId,
    title: item.title,
    kind: "orders" as const,
  })),
  ...MASTER_CATEGORIES.map((item) => ({
    id: item.resourceId,
    title: item.title,
    kind: "masters" as const,
  })),
].reduce<Record<string, ResourceConfig>>((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});
