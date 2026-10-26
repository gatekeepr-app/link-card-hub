import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { activeCardsQueryOptions, type PublicCard } from "@/lib/cards";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(activeCardsQueryOptions()),
  head: () => ({
    meta: [
      { title: "Links" },
      {
        name: "description",
        content: "Quick links and resources — jump straight to what you need.",
      },
      { property: "og:title", content: "Links" },
      {
        property: "og:description",
        content: "Quick links and resources — jump straight to what you need.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-xl flex-col px-6 py-16 sm:py-24">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Links</h1>
          <p className="mt-2 text-sm text-muted-foreground">Everything you need, one tap away.</p>
        </header>
        <Suspense fallback={<CardListSkeleton />}>
          <CardList />
        </Suspense>
        <footer className="mt-16 text-center">
          <Link
            to="/auth"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Admin sign in
          </Link>
        </footer>
      </div>
    </main>
  );
}

function CardList() {
  const { data: cards } = useSuspenseQuery(activeCardsQueryOptions());
  if (cards.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No links yet — check back soon.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </ul>
  );
}

function CardItem({ card }: { card: PublicCard }) {
  return (
    <li>
      <Link
        to="/$slug"
        params={{ slug: card.slug }}
        className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">{card.title}</span>
          {card.subtitle && (
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              {card.subtitle}
            </span>
          )}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    </li>
  );
}

function CardListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-2xl border border-border bg-muted"
        />
      ))}
    </div>
  );
}
