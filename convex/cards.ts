import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const BOOTSTRAP_ADMIN_EMAIL = "product.gatekeepr@gmail.com";
type BackendCtx = QueryCtx | MutationCtx;

function toPublicCard(card: Doc<"cards">) {
  return {
    id: card._id,
    title: card.title,
    subtitle: card.subtitle ?? null,
    slug: card.slug,
  };
}

function toAdminCard(card: Doc<"cards">) {
  return {
    ...toPublicCard(card),
    target_url: card.targetUrl,
    sort_order: card.sortOrder,
    is_active: card.isActive,
    created_at: new Date(card.createdAt).toISOString(),
    updated_at: new Date(card.updatedAt).toISOString(),
  };
}

async function getAdmin(ctx: BackendCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const userId = await getAuthUserId(ctx);
  if (!identity || !userId) return null;
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_subject", (q) => q.eq("subject", userId))
    .unique();
  if (admin) return identity;

  // Older records stored the session-bound JWT subject, which changes on login.
  // Match those records by the verified, normalized email to preserve access.
  const email = identity.email?.trim().toLowerCase();
  if (!email) return null;
  const legacyAdmin = await ctx.db
    .query("admins")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
  return legacyAdmin ? identity : null;
}

async function isFirstAdminEligible(ctx: BackendCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  if (identity.email?.trim().toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL) {
    return null;
  }
  const currentAdmin = await ctx.db.query("admins").first();
  return currentAdmin ? null : identity;
}

function validateCard(input: {
  title: string;
  subtitle?: string | null;
  slug: string;
  target_url: string;
  sort_order: number;
}) {
  if (!input.title.trim() || input.title.trim().length > 200) {
    return "Enter a title up to 200 characters.";
  }
  if (input.subtitle && input.subtitle.length > 500) {
    return "Description must be 500 characters or fewer.";
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    return "Use lowercase letters, numbers and hyphens for the link address.";
  }
  try {
    const destination = new URL(input.target_url);
    if (destination.protocol !== "https:" && destination.protocol !== "http:") {
      return "Destination must use http or https.";
    }
  } catch {
    return "Enter a valid destination URL.";
  }
  if (!Number.isSafeInteger(input.sort_order)) {
    return "Position must be a whole number.";
  }
  return null;
}

async function slugExists(
  ctx: BackendCtx,
  slug: string,
  exceptId?: Id<"cards">,
) {
  const existing = await ctx.db
    .query("cards")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  return existing !== null && existing?._id !== exceptId;
}

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_active_sort_created", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();
    return cards.map(toPublicCard);
  },
});

export const getActiveBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const card = await ctx.db
      .query("cards")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!card?.isActive) return null;
    return {
      title: card.title,
      subtitle: card.subtitle ?? null,
      target_url: card.targetUrl,
    };
  },
});

export const listAdminCards = query({
  args: {},
  handler: async (ctx) => {
    if (!(await getAdmin(ctx))) throw new Error("Forbidden");
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_sort_created")
      .order("asc")
      .collect();
    return cards.map(toAdminCard);
  },
});

export const getAdminStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { isAdmin: false, canClaimAdmin: false, email: null };
    if (await getAdmin(ctx)) {
      return { isAdmin: true, canClaimAdmin: false, email: identity.email ?? null };
    }
    const eligible = await isFirstAdminEligible(ctx);
    return {
      isAdmin: false,
      canClaimAdmin: eligible !== null,
      email: identity.email ?? null,
    };
  },
});

export const createCard = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.union(v.string(), v.null())),
    slug: v.string(),
    target_url: v.string(),
    sort_order: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, input) => {
    if (!(await getAdmin(ctx))) throw new Error("Forbidden");
    const invalid = validateCard(input);
    if (invalid) return { ok: false as const, message: invalid };
    if (await slugExists(ctx, input.slug)) {
      return { ok: false as const, message: "That link address is already in use." };
    }
    const now = Date.now();
    await ctx.db.insert("cards", {
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || undefined,
      slug: input.slug,
      targetUrl: input.target_url,
      sortOrder: input.sort_order,
      isActive: input.is_active,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true as const };
  },
});

export const updateCard = mutation({
  args: {
    id: v.id("cards"),
    title: v.string(),
    subtitle: v.optional(v.union(v.string(), v.null())),
    slug: v.string(),
    target_url: v.string(),
    sort_order: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, input) => {
    if (!(await getAdmin(ctx))) throw new Error("Forbidden");
    const invalid = validateCard(input);
    if (invalid) return { ok: false as const, message: invalid };
    const card = await ctx.db.get(input.id);
    if (!card) return { ok: false as const, message: "This link no longer exists." };
    if (await slugExists(ctx, input.slug, input.id)) {
      return { ok: false as const, message: "That link address is already in use." };
    }
    await ctx.db.patch(input.id, {
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || undefined,
      slug: input.slug,
      targetUrl: input.target_url,
      sortOrder: input.sort_order,
      isActive: input.is_active,
      updatedAt: Date.now(),
    });
    return { ok: true as const };
  },
});

export const deleteCard = mutation({
  args: { id: v.id("cards") },
  handler: async (ctx, { id }) => {
    if (!(await getAdmin(ctx))) throw new Error("Forbidden");
    const card = await ctx.db.get(id);
    if (!card) return { ok: false as const, message: "This link no longer exists." };
    await ctx.db.delete(id);
    return { ok: true as const };
  },
});

export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = await getAuthUserId(ctx);
    if (!identity || !userId) return { ok: false as const, message: "Sign in first." };
    const current = await ctx.db
      .query("admins")
      .withIndex("by_subject", (q) => q.eq("subject", userId))
      .unique();
    if (current) return { ok: true as const };
    const eligible = await isFirstAdminEligible(ctx);
    if (!eligible) {
      return { ok: false as const, message: "This account cannot claim admin access." };
    }
    await ctx.db.insert("admins", {
      subject: userId,
      email: BOOTSTRAP_ADMIN_EMAIL,
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});
