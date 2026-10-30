import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  Sparkles,
  Globe,
  FileText,
  Users,
  Briefcase,
  MessageSquare,
  ExternalLink,
  Layers,
} from "lucide-react";
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

/* Rotating accent icons per card, matched by index */
const CARD_ICONS = [FileText, Users, Briefcase, Globe, MessageSquare, Layers, ExternalLink, Sparkles];

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-0 -right-40 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0_/_3%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0_/_3%)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-20">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <img
            src="/Short%20Logo.png"
            alt="Gatekeeper"
            className="h-auto w-32 sm:w-36 dark:brightness-0 dark:invert"
            draggable={false}
          />
        </header>

        {/* Hero */}
        <section className="pt-12 text-center sm:pt-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Applications open
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            <span className="block">Apply to</span>
            <img
              src="/Short%20Logo.png"
              alt="Gatekeeper"
              className="mx-auto mt-3 block h-auto w-[min(58vw,18rem)] dark:brightness-0 dark:invert"
              draggable={false}
            />
          </h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
            Pick a link below — each one takes you straight where it says.
          </p>
        </section>

        {/* Cards */}
        <section className="mt-14">
          <Suspense fallback={<CardListSkeleton />}>
            <CardList />
          </Suspense>
        </section>

        {/* Footer */}
        <footer className="mt-24 text-center">
          <div className="mx-auto mb-4 h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Gatekeeper
          </p>
        </footer>
      </div>
    </main>
  );
}

function CardList() {
  const { data: cards } = useSuspenseQuery(activeCardsQueryOptions());
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 py-16 text-center">
        <p className="text-sm text-muted-foreground">No links yet — check back soon.</p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <CardItem key={card.id} card={card} index={index} />
      ))}
    </ul>
  );
}

function CardItem({ card, index }: { card: PublicCard; index: number }) {
  const Icon = CARD_ICONS[index % CARD_ICONS.length];

  return (
    <li style={{ animationDelay: `${index * 70}ms` }} className="animate-card-in">
      <Card className="group h-full overflow-hidden rounded-2xl border-border bg-card p-0 shadow-none transition-colors hover:border-primary/40">
        <Link
          to="/$slug"
          params={{ slug: card.slug }}
          className="relative flex h-full min-h-[112px] items-center gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {/* Icon */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground">
            <Icon className="h-5 w-5" aria-hidden />
          </span>

          {/* Text */}
          <CardContent className="relative min-w-0 flex-1 p-0">
            <span className="line-clamp-2 break-words font-medium text-foreground">{card.title}</span>
            {card.subtitle && (
              <span className="mt-1 line-clamp-3 break-words text-sm text-muted-foreground">
                {card.subtitle}
              </span>
            )}
          </CardContent>

          {/* Arrow */}
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      </Card>
    </li>
  );
}

function CardListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[76px] animate-pulse rounded-2xl border border-border bg-muted/50"
        />
      ))}
    </div>
  );
}
