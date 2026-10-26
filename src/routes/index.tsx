import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { activeCardsQueryOptions, type PublicCard } from "@/lib/cards";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(activeCardsQueryOptions()),
  head: () => ({
    meta: [
      { title: "Apply to Gatekeeper" },
      {
        name: "description",
        content: "Quick links to everything you need — applications, forms and resources.",
      },
      { property: "og:title", content: "Apply to Gatekeeper" },
      {
        property: "og:description",
        content: "Quick links to everything you need — applications, forms and resources.",
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
      <div className="hero-glow min-h-screen">
        <div className="mx-auto w-full max-w-xl px-6 pb-16">
          <header className="flex items-center justify-between py-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Gatekeeper
              </span>
            </div>
            <Link
              to="/auth"
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Admin
            </Link>
          </header>

          <section className="pt-10 text-center sm:pt-16">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Apply to Gatekeeper
            </h1>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Pick a link below — each one takes you straight where it says.
            </p>
          </section>

          <section className="mt-12">
            <Suspense fallback={<CardListSkeleton />}>
              <CardList />
            </Suspense>
          </section>

          <footer className="mt-20 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Gatekeeper
          </footer>
        </div>
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
      {cards.map((card, index) => (
        <CardItem key={card.id} card={card} index={index} />
      ))}
    </ul>
  );
}

function CardItem({ card, index }: { card: PublicCard; index: number }) {
  return (
    <li>
      <Link
        to="/$slug"
        params={{ slug: card.slug }}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      >
        <span
          className="absolute inset-y-0 left-0 w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">{card.title}</span>
          {card.subtitle && (
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              {card.subtitle}
            </span>
          )}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowUpRight className="h-4 w-4" />
        </span>
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
          className="h-[76px] animate-pulse rounded-2xl border border-border bg-muted"
        />
      ))}
    </div>
  );
}
