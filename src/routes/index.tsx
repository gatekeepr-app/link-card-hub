import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ShieldCheck,
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
const CARD_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-fuchsia-500 to-purple-400",
  "from-blue-500 to-indigo-400",
  "from-teal-500 to-emerald-400",
];

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

      <div className="relative mx-auto w-full max-w-xl px-6 pb-20">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Gatekeeper
            </span>
          </div>
          <Link
            to="/auth"
            className="group flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur transition-all hover:border-primary/30 hover:text-foreground"
          >
            Admin
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </header>

        {/* Hero */}
        <section className="pt-12 text-center sm:pt-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Applications open
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Apply to{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Gatekeeper
            </span>
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
    <ul className="flex flex-col gap-3.5">
      {cards.map((card, index) => (
        <CardItem key={card.id} card={card} index={index} />
      ))}
    </ul>
  );
}

function CardItem({ card, index }: { card: PublicCard; index: number }) {
  const Icon = CARD_ICONS[index % CARD_ICONS.length];
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <li style={{ animationDelay: `${index * 70}ms` }} className="animate-card-in">
      <Link
        to="/$slug"
        params={{ slug: card.slug }}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card/60 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-card hover:shadow-xl hover:shadow-primary/5"
      >
        {/* Hover gradient wash */}
        <span
          className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/5 group-hover:via-primary/[0.02] group-hover:to-transparent group-hover:opacity-100"
          aria-hidden
        />
        {/* Left accent line */}
        <span
          className="absolute inset-y-0 left-0 w-[3px] scale-y-0 bg-gradient-to-b from-indigo-500 to-violet-500 transition-transform duration-300 group-hover:scale-y-100"
          aria-hidden
        />

        {/* Icon */}
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="h-5 w-5" />
        </span>

        {/* Text */}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">{card.title}</span>
          {card.subtitle && (
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              {card.subtitle}
            </span>
          )}
        </span>

        {/* Arrow */}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:rotate-45 group-hover:border-transparent group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
    </li>
  );
}

function CardListSkeleton() {
  return (
    <div className="flex flex-col gap-3.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[76px] animate-pulse rounded-2xl border border-border bg-muted/50"
        />
      ))}
    </div>
  );
}
