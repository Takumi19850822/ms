import { getStoreMasterByCode, parseStoreMasterNote } from "@/lib/data";
import { SessionUser } from "@/lib/types";

function todayInJapan(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export async function buildNewBasketballOrderDefaults(session: SessionUser): Promise<Record<string, string>> {
  const defaults: Record<string, string> = {
    orderDate: todayInJapan(),
    staffName: session.name,
  };

  if (!session.storeId) {
    return defaults;
  }

  const store = await getStoreMasterByCode(session.storeId, session);
  if (store) {
    const { tel } = parseStoreMasterNote(store.note);
    defaults.storeCode = store.code;
    defaults.storeName = store.name;
    defaults.storePhone = tel;
    return defaults;
  }

  defaults.storeCode = session.storeId;
  return defaults;
}
