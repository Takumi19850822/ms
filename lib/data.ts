import { SessionUser, ResourceRecord } from "@/lib/types";
import { RESOURCE_CONFIGS } from "@/lib/resources";
import { getSupabase } from "@/lib/supabase";

const STORE_IDS = ["store-a", "store-b"];

type ResourceRow = {
  id: string;
  resourceId: string;
  code: string;
  name: string;
  storeId: string | null;
  note: string;
  updatedAt: string;
  version: number;
};

function seedRecords(resourceId: string): ResourceRecord[] {
  return Array.from({ length: 6 }).map((_, idx) => {
    const storeId = STORE_IDS[idx % STORE_IDS.length];
    return {
      id: crypto.randomUUID(),
      code: `${resourceId.toUpperCase().slice(0, 8)}-${idx + 1}`,
      name: `${RESOURCE_CONFIGS[resourceId]?.title ?? resourceId} ${idx + 1}`,
      storeId,
      note: idx % 2 === 0 ? "初期データ" : "",
      updatedAt: new Date().toISOString(),
      version: 1,
    };
  });
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

async function ensureSeeded(resourceId: string) {
  const supabase = getSupabase();
  const { count, error: countError } = await supabase
    .from("ResourceRecord")
    .select("id", { count: "exact", head: true })
    .eq("resourceId", resourceId);

  if (countError) {
    throw countError;
  }
  if ((count ?? 0) > 0) {
    return;
  }

  const seeds = seedRecords(resourceId);
  const { error: insertError } = await supabase.from("ResourceRecord").insert(
    seeds.map((item) => ({
      id: item.id,
      resourceId,
      code: item.code,
      name: item.name,
      storeId: item.storeId,
      note: item.note,
      updatedAt: item.updatedAt,
      version: item.version,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

export async function listResource(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  await ensureSeeded(resourceId);
  const supabase = getSupabase();
  const keyword = search.trim();
  let request = supabase
    .from("ResourceRecord")
    .select("id, resourceId, code, name, storeId, note, updatedAt, version")
    .eq("resourceId", resourceId)
    .order("updatedAt", { ascending: false });

  if (user.role === "store") {
    request = request.eq("storeId", user.storeId);
  }

  if (keyword) {
    const escaped = keyword.replaceAll(",", "\\,");
    request = request.or(
      `code.ilike.%${escaped}%,name.ilike.%${escaped}%,note.ilike.%${escaped}%,storeId.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await request.returns<ResourceRow[]>();
  if (error) {
    throw error;
  }

  return (data ?? []).map(toRecord);
}

export async function createResource(resourceId: string, user: SessionUser): Promise<ResourceRecord> {
  await ensureSeeded(resourceId);
  const supabase = getSupabase();
  const { count, error: countError } = await supabase
    .from("ResourceRecord")
    .select("id", { count: "exact", head: true })
    .eq("resourceId", resourceId);

  if (countError) {
    throw countError;
  }

  const nextNumber = (count ?? 0) + 1;
  const storeId = user.role === "store" ? user.storeId : "store-a";

  const { data, error } = await supabase
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
    .select("id, resourceId, code, name, storeId, note, updatedAt, version")
    .single<ResourceRow>();

  if (error) {
    throw error;
  }

  return toRecord(data);
}

export async function createResourceFromPayload(
  resourceId: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note">,
): Promise<ResourceRecord> {
  const supabase = getSupabase();
  const storeId = user.role === "store" ? user.storeId : payload.storeId;

  const { data, error } = await supabase
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
    .select("id, resourceId, code, name, storeId, note, updatedAt, version")
    .single<ResourceRow>();

  if (error) {
    throw error;
  }

  return toRecord(data);
}

export async function updateResource(
  resourceId: string,
  id: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note" | "version">,
): Promise<{ ok: true; record: ResourceRecord } | { ok: false; reason: "not_found" | "forbidden" | "version_conflict" }> {
  await ensureSeeded(resourceId);
  const supabase = getSupabase();
  const { data: target, error: targetError } = await supabase
    .from("ResourceRecord")
    .select("id, storeId, version")
    .eq("id", id)
    .eq("resourceId", resourceId)
    .maybeSingle<Pick<ResourceRow, "id" | "storeId" | "version">>();

  if (targetError) {
    throw targetError;
  }
  if (!target) {
    return { ok: false, reason: "not_found" };
  }
  if (user.role === "store" && target.storeId !== user.storeId) {
    return { ok: false, reason: "forbidden" };
  }
  if (payload.version !== target.version) {
    return { ok: false, reason: "version_conflict" };
  }

  const { data, error } = await supabase
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
    .select("id, resourceId, code, name, storeId, note, updatedAt, version")
    .single<ResourceRow>();

  if (error) {
    throw error;
  }

  return { ok: true, record: toRecord(data) };
}
