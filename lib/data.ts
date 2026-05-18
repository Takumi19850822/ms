import { SessionUser, ResourceRecord } from "@/lib/types";
import { getAccessTokenFromCookie } from "@/lib/auth";
import { getSupabaseAnon } from "@/lib/supabase";

type ResourceRow = {
  id: string;
  resourceId: string;
  code: string;
  name: string;
  storeId: string | null;
  note: string;
  updatedAt: Date;
  version: number;
};

async function getRlsClient() {
  const accessToken = await getAccessTokenFromCookie();
  if (!accessToken) {
    throw new Error("No access token in cookie.");
  }
  return getSupabaseAnon(accessToken);
}

function toRecord(row: ResourceRow): ResourceRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    storeId: row.storeId,
    note: row.note,
    updatedAt: new Date(row.updatedAt).toISOString(),
    version: row.version,
  };
}

export async function listResource(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  return listResourceRecords(resourceId, user, search);
}

export async function listResourceRecords(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  const keyword = search.trim();
  const supabase = await getRlsClient();
  let request = supabase
    .from("ResourceRecord")
    .select("id,resourceId,code,name,storeId,note,updatedAt,version")
    .eq("resourceId", resourceId)
    .order("updatedAt", { ascending: false });
  if (user.role === "store") {
    request = request.eq("storeId", user.storeId);
  }
  if (keyword) {
    request = request.or(`code.ilike.%${keyword}%,name.ilike.%${keyword}%,note.ilike.%${keyword}%,storeId.ilike.%${keyword}%`);
  }
  const result = await request.returns<ResourceRow[]>();
  if (result.error) {
    throw result.error;
  }

  return result.data.map(toRecord);
}

export async function getResourceRecord(resourceId: string, id: string, user: SessionUser): Promise<ResourceRecord | null> {
  const supabase = await getRlsClient();
  let request = supabase
    .from("ResourceRecord")
    .select("id,resourceId,code,name,storeId,note,updatedAt,version")
    .eq("resourceId", resourceId)
    .eq("id", id);
  if (user.role === "store") {
    request = request.eq("storeId", user.storeId);
  }
  const result = await request.maybeSingle<ResourceRow>();
  if (result.error) {
    throw result.error;
  }

  return result.data ? toRecord(result.data) : null;
}

export async function createResource(resourceId: string, user: SessionUser): Promise<ResourceRecord> {
  const supabase = await getRlsClient();
  const countResult = await supabase
    .from("ResourceRecord")
    .select("id", { count: "exact", head: true })
    .eq("resourceId", resourceId);
  if (countResult.error) {
    throw countResult.error;
  }

  const nextNumber = (countResult.count ?? 0) + 1;
  const storeId = user.role === "store" ? user.storeId : "store-a";

  const result = await supabase
    .from("ResourceRecord")
    .insert({
      id: crypto.randomUUID(),
      resourceId,
      code: `${resourceId.toUpperCase().slice(0, 8)}-${nextNumber}`,
      name: "新規データ",
      storeId,
      note: "",
      updatedAt: new Date().toISOString(),
      version: 1,
    })
    .select("id,resourceId,code,name,storeId,note,updatedAt,version")
    .single<ResourceRow>();
  if (result.error) {
    throw result.error;
  }

  return toRecord(result.data);
}

export async function createResourceFromPayload(
  resourceId: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note">,
): Promise<ResourceRecord> {
  const storeId = user.role === "store" ? user.storeId : payload.storeId;
  const supabase = await getRlsClient();

  const result = await supabase
    .from("ResourceRecord")
    .insert({
      id: crypto.randomUUID(),
      resourceId,
      code: payload.code,
      name: payload.name,
      storeId,
      note: payload.note,
      updatedAt: new Date().toISOString(),
      version: 1,
    })
    .select("id,resourceId,code,name,storeId,note,updatedAt,version")
    .single<ResourceRow>();
  if (result.error) {
    throw result.error;
  }

  return toRecord(result.data);
}

export async function updateResource(
  resourceId: string,
  id: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note" | "version">,
): Promise<{ ok: true; record: ResourceRecord } | { ok: false; reason: "not_found" | "forbidden" | "version_conflict" }> {
  const supabase = await getRlsClient();
  const targetResult = await supabase
    .from("ResourceRecord")
    .select("id,storeId,version")
    .eq("id", id)
    .eq("resourceId", resourceId)
    .maybeSingle<{ id: string; storeId: string | null; version: number }>();
  if (targetResult.error) {
    if (targetResult.error.code === "42501") {
      return { ok: false, reason: "forbidden" };
    }
    throw targetResult.error;
  }
  const target = targetResult.data;
  if (!target) {
    return { ok: false, reason: "not_found" };
  }
  if (user.role === "store" && target.storeId !== user.storeId) {
    return { ok: false, reason: "forbidden" };
  }
  if (payload.version !== target.version) {
    return { ok: false, reason: "version_conflict" };
  }

  const result = await supabase
    .from("ResourceRecord")
    .update({
      code: payload.code,
      name: payload.name,
      storeId: user.role === "store" ? user.storeId : payload.storeId,
      note: payload.note,
      version: target.version + 1,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,resourceId,code,name,storeId,note,updatedAt,version")
    .single<ResourceRow>();
  if (result.error) {
    if (result.error.code === "42501") {
      return { ok: false, reason: "forbidden" };
    }
    throw result.error;
  }

  return { ok: true, record: toRecord(result.data) };
}
