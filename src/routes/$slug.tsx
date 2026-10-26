import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cardBySlugQueryOptions } from "@/lib/cards";

export const Route = createFileRoute("/$slug")({
  loader: ({ params, context }) =>
    context.queryClient
      .ensureQueryData(cardBySlugQueryOptions(params.slug))
      .then((card) => {
        if (!card) throw notFound();
        return card;
      }),
  head: () => ({
    meta: [{ title: "Redirecting…" }, { name: "robots", content: "noindex" }],
  }),
  component: SlugRedirect,
});

function SlugRedirect() {
  return (
    <Suspense fallback={<RedirectFallback />}>
      <SlugRedirectInner />
    </Suspense>
  );
}

function SlugRedirectInner() {
  const { slug } = Route.useParams();
  const { data: card } = useSuspenseQuery(cardBySlugQueryOptions(slug));

  useEffect(() => {
    if (card) window.location.replace(card.target_url);
  }, [card]);

  if (!card) return <RedirectFallback />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Taking you to
        </p>
        <h1 className="mt-2 text-lg font-semibold text-foreground">{card.title}</h1>
        {card.subtitle && <p className="mt-1 text-sm text-muted-foreground">{card.subtitle}</p>}
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirecting…
        </p>
        <div className="mt-4">
          <a
            href={card.target_url}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open the link now
          </a>
        </div>
      </div>
    </main>
  );
}

function RedirectFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        One moment…
      </div>
    </main>
  );
}
