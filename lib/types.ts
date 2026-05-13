export type Role = "admin" | "store" | "store_all";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId: string | null;
};

export type ResourceRecord = {
  id: string;
  code: string;
  name: string;
  storeId: string | null;
  note: string;
  updatedAt: string;
  version: number;
};

export type ResourceConfig = {
  id: string;
  title: string;
  kind: "orders" | "masters";
};

export type AppUserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId: string | null;
  isActive: boolean;
  updatedAt: string;
  version: number;
};
