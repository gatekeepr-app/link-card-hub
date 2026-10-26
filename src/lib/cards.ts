import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PublicCard = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
};

export type AdminCard = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  target_url: string;
  sort_order: number;
  is_active: boolean;
};

export type CardResult = { ok: true } | { ok: false; message: string };

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Missing backend configuration");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        // Opaque sb_ keys are not JWTs; send only apikey.
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type AuthContext = {
  supabase: {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"] },
    ) => PromiseLike<{ data: boolean | null }>;
  };
  userId: string;
};

async function assertAdmin(context: AuthContext) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listActiveCards = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id, title, subtitle, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicCard[];
});

export const getCardBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: card, error } = await supabase
      .from("cards")
      .select("title, subtitle, target_url")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return card as { title: string; subtitle: string | null; target_url: string } | null;
  });

export const listAllCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("cards")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminCard[];
  });

export const createCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      title: string;
      subtitle?: string | null;
      slug: string;
      target_url: string;
      sort_order?: number;
      is_active?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<CardResult> => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("cards").insert({
      title: data.title,
      subtitle: data.subtitle ?? null,
      slug: data.slug,
      target_url: data.target_url,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, message: "That link address is already in use." };
      return { ok: false, message: error.message };
    }
    return { ok: true };
  });

export const updateCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AdminCard) => input)
  .handler(async ({ data, context }): Promise<CardResult> => {
    await assertAdmin(context);
    const { id, ...values } = data;
    const { error } = await context.supabase.from("cards").update(values).eq("id", id);
    if (error) {
      if (error.code === "23505") return { ok: false, message: "That link address is already in use." };
      return { ok: false, message: error.message };
    }
    return { ok: true };
  });

export const deleteCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<CardResult> => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("cards").delete().eq("id", data.id);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  });

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin" as never,
    });
    const { data: canClaim } = await context.supabase.rpc("no_admin_exists");
    return { isAdmin: Boolean(isAdmin), canClaimAdmin: Boolean(canClaim) };
  });

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CardResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin" as never,
    });
    if (isAdmin) return { ok: true };
    const { data: canClaim } = await context.supabase.rpc("no_admin_exists");
    if (!canClaim) return { ok: false, message: "An admin already exists." };
    const { error } = await context.supabase
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" as never });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  });

export const activeCardsQueryOptions = () =>
  queryOptions({
    queryKey: ["cards", "active"],
    queryFn: () => listActiveCards(),
  });

export const cardBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["cards", "slug", slug],
    queryFn: () => getCardBySlug({ data: { slug } }),
  });

export const adminCardsQueryOptions = () =>
  queryOptions({
    queryKey: ["cards", "admin"],
    queryFn: () => listAllCards(),
  });

export const adminStatusQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "status"],
    queryFn: () => getAdminStatus(),
  });
