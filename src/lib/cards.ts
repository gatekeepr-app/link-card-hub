import { ConvexHttpClient } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";

export type PublicCard = FunctionReturnType<typeof api.cards.listActive>[number];
export type AdminCard = FunctionReturnType<typeof api.cards.listAdminCards>[number];
export type CardResult = FunctionReturnType<typeof api.cards.createCard>;

function convexServerClient() {
  const url = process.env["VITE_CONVEX_URL"];
  if (!url) throw new Error("Missing backend configuration: VITE_CONVEX_URL");
  return new ConvexHttpClient(url);
}

export const listActiveCards = createServerFn({ method: "GET" }).handler(async () => {
  return convexServerClient().query(api.cards.listActive, {});
});

export const getCardBySlug = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    return convexServerClient().query(api.cards.getActiveBySlug, { slug: data.slug });
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
