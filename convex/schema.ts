import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  cards: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    slug: v.string(),
    targetUrl: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active_sort_created", ["isActive", "sortOrder", "createdAt"])
    .index("by_sort_created", ["sortOrder", "createdAt"]),
  admins: defineTable({
    subject: v.string(),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_email", ["email"]),
});
