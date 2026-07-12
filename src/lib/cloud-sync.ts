// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

// We store the entire app dataset as JSONB blobs in the `info` table keyed by name.
// This lets the current localStorage-shaped frontend sync across devices in realtime
// without rewriting every CRUD path against normalized tables.

export const CLOUD_KEYS = [
  "pi_info",
  "pi_categories",
  "pi_products",
  "pi_shops",
  "pi_employees",
  "pi_vehicles",
  "pi_orders",
  "pi_debt_payments",
] as const;

export async function loadAllBlobs(): Promise<Record<string, any>> {
  const { data, error } = await supabase.from("info").select("key,value").in("key", CLOUD_KEYS as unknown as string[]);
  if (error) { console.warn("[cloud] load failed", error); return {}; }
  const out: Record<string, any> = {};
  for (const row of data || []) out[row.key] = row.value;
  return out;
}

export async function saveBlob(key: string, value: any) {
  const { error } = await supabase.from("info").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) console.warn("[cloud] save failed", key, error);
}

export function subscribeInfo(onChange: (key: string, value: any) => void) {
  const chan = supabase
    .channel("info-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "info" }, (payload: any) => {
      const row = payload.new || payload.old;
      if (row?.key) onChange(row.key, payload.new?.value);
    })
    .subscribe();
  return () => { supabase.removeChannel(chan); };
}

export async function currentUserIsAdmin(): Promise<{ userId: string | null; isAdmin: boolean }> {
  const { data: sessData } = await supabase.auth.getSession();
  const uid = sessData.session?.user?.id ?? null;
  if (!uid) return { userId: null, isAdmin: false };
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return { userId: uid, isAdmin: !!data };
}
