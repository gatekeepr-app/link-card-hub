import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { ExternalLink, Loader2, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AdminCard, type CardResult } from "@/lib/cards";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Manage links — Gatekeeper" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type FormState = {
  title: string;
  subtitle: string;
  slug: string;
  target_url: string;
  sort_order: string;
  is_active: boolean;
};

type DestinationCheck = {
  url: string;
  state: "checking" | "reachable" | "not-found" | "responded" | "unverified" | "invalid";
  message: string;
};

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  slug: "",
  target_url: "",
  sort_order: "0",
  is_active: true,
};

function toFormState(card: AdminCard): FormState {
  return {
    title: card.title,
    subtitle: card.subtitle ?? "",
    slug: card.slug,
    target_url: card.target_url,
    sort_order: String(card.sort_order),
    is_active: card.is_active,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AdminPage() {
  return <AdminInner />;
}

function LoadingBlock() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    </main>
  );
}

function AdminInner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuthActions();
  const cards = useQuery(api.cards.listAdminCards, {});
  const createCard = useMutation(api.cards.createCard);
  const updateCard = useMutation(api.cards.updateCard);
  const deleteCard = useMutation(api.cards.deleteCard);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<AdminCard | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [deleting, setDeleting] = useState<AdminCard | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleResult(result: CardResult, successMessage: string) {
    if (result.ok) {
      toast.success(successMessage);
      return true;
    }
    toast.error(result.message);
    return false;
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    await navigate({ to: "/auth", replace: true });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug || !form.target_url.trim()) {
      toast.error("Title, link address and destination are required.");
      return;
    }
    setCreating(true);
    try {
      const result = await createCard({
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        slug: form.slug,
        target_url: form.target_url.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      });
      if (await handleResult(result, "Link created.")) {
        setForm(emptyForm);
        setSlugTouched(false);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const result = await updateCard({
        id: editing.id,
        title: editForm.title.trim(),
        subtitle: editForm.subtitle.trim() || null,
        slug: editForm.slug,
        target_url: editForm.target_url.trim(),
        sort_order: Number(editForm.sort_order) || 0,
        is_active: editForm.is_active,
      });
      if (await handleResult(result, "Link updated.")) {
        setEditing(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(card: AdminCard) {
    const result = await updateCard({
      id: card.id,
      title: card.title,
      subtitle: card.subtitle,
      slug: card.slug,
      target_url: card.target_url,
      sort_order: card.sort_order,
      is_active: !card.is_active,
    });
    await handleResult(result, card.is_active ? "Link hidden." : "Link is live again.");
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const result = await deleteCard({ id: deleting.id });
      if (await handleResult(result, "Link deleted.")) {
        setDeleting(null);
      }
    } finally {
      setBusy(false);
    }
  }

  if (cards === undefined) return <LoadingBlock />;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/Short%20Logo.png"
              alt="Gatekeeper"
              className="h-auto w-[2.6rem] dark:brightness-0 dark:invert"
              draggable={false}
            />
            <div>
              <h1 className="text-base font-medium text-foreground">Manage links</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">View site</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(19rem,0.85fr)_minmax(0,1.15fr)]">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">Create a link</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a destination and choose how it appears on your site.
                </p>
              </div>
            </div>
            <form className="mt-6 grid gap-4" onSubmit={handleCreate}>
              <CardFields
                form={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                onTitleChange={(title) =>
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: slugTouched ? f.slug : slugify(title),
                  }))
                }
                onSlugChange={(slug) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug }));
                }}
              />
              <Button type="submit" className="justify-self-start" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create link
              </Button>
            </form>
          </section>

          <section className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Existing links
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {cards.length}
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-3">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">{card.title}</span>
                      {!card.is_active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Hidden
                        </span>
                      )}
                    </div>
                    {card.subtitle && (
                      <p className="truncate text-sm text-muted-foreground">{card.subtitle}</p>
                    )}
                    <p className="mt-1 flex items-center gap-2 truncate text-xs text-muted-foreground">
                      <code className="rounded bg-muted px-1.5 py-0.5">/{card.slug}</code>
                      <a
                        href={card.target_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {card.target_url}
                      </a>
                    </p>
                  </div>
                  <Switch
                    checked={card.is_active}
                    onCheckedChange={() => handleToggleActive(card)}
                    aria-label="Show on landing page"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit link"
                    onClick={() => {
                      setEditing(card);
                      setEditForm(toFormState(card));
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete link"
                    onClick={() => setDeleting(card)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
              {cards.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  No links yet — create the first one on the left.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit link</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleSaveEdit}>
            <CardFields
              form={editForm}
              onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this link?</DialogTitle>
          </DialogHeader>
          {deleting && (
            <p className="text-sm text-muted-foreground">
              “{deleting.title}” (/{deleting.slug}) will be removed for everyone.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CardFields({
  form,
  onChange,
  onTitleChange,
  onSlugChange,
}: {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onTitleChange?: (title: string) => void;
  onSlugChange?: (slug: string) => void;
}) {
  const [destinationCheck, setDestinationCheck] = useState<DestinationCheck | null>(null);

  useEffect(() => {
    const value = form.target_url.trim();
    if (!value) {
      setDestinationCheck(null);
      return;
    }

    let destination: URL;
    try {
      destination = new URL(value);
      if (destination.protocol !== "http:" && destination.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
    } catch {
      setDestinationCheck({
        url: value,
        state: "invalid",
        message: "Enter a valid HTTP or HTTPS URL to check the destination.",
      });
      return;
    }

    const controller = new AbortController();
    let disposed = false;
    const debounce = window.setTimeout(() => {
      setDestinationCheck({ url: value, state: "checking", message: "Checking destination…" });
      const timeout = window.setTimeout(() => controller.abort(), 8000);

      void (async () => {
        try {
          let response = await fetch(destination.href, {
            method: "HEAD",
            redirect: "follow",
            credentials: "omit",
            signal: controller.signal,
          });
          if (response.status === 405 || response.status === 501) {
            response = await fetch(destination.href, {
              method: "GET",
              headers: { Range: "bytes=0-0" },
              redirect: "follow",
              credentials: "omit",
              signal: controller.signal,
            });
          }
          controller.abort();
          if (disposed) return;

          if (response.ok) {
            setDestinationCheck({
              url: value,
              state: "reachable",
              message: `Destination responded with HTTP ${response.status}.`,
            });
          } else if (response.status === 404 || response.status === 410) {
            setDestinationCheck({
              url: value,
              state: "not-found",
              message: `Destination returned HTTP ${response.status}; check that the URL is correct.`,
            });
          } else {
            setDestinationCheck({
              url: value,
              state: "responded",
              message: `Destination returned HTTP ${response.status}; verify it before publishing.`,
            });
          }
        } catch {
          if (disposed) return;
          setDestinationCheck({
            url: value,
            state: "unverified",
            message: "Could not verify automatically. The site may block browser checks.",
          });
        } finally {
          window.clearTimeout(timeout);
        }
      })();
    }, 650);

    return () => {
      disposed = true;
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [form.target_url]);

  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="card-title">Title</Label>
        <Input
          id="card-title"
          required
          value={form.title}
          onChange={(e) =>
            onTitleChange ? onTitleChange(e.target.value) : onChange({ title: e.target.value })
          }
          placeholder="Join our team"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="card-subtitle">Subtitle (optional)</Label>
        <Input
          id="card-subtitle"
          value={form.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="We are hiring — see open roles"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="card-slug">Link address</Label>
          <Input
            id="card-slug"
            required
            value={form.slug}
            onChange={(e) =>
              onSlugChange
                ? onSlugChange(slugify(e.target.value))
                : onChange({ slug: slugify(e.target.value) })
            }
            placeholder="hiring"
          />
          <p className="text-xs text-muted-foreground">
            People will visit /{form.slug || "…"} on this site.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="card-sort">Position</Label>
          <Input
            id="card-sort"
            type="number"
            value={form.sort_order}
            onChange={(e) => onChange({ sort_order: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="card-url">Destination URL</Label>
        <Input
          id="card-url"
          required
          type="url"
          value={form.target_url}
          onChange={(e) => onChange({ target_url: e.target.value })}
          placeholder="https://forms.gle/your-form"
        />
        {destinationCheck?.url === form.target_url.trim() && (
          <p
            role="status"
            aria-live="polite"
            className={`text-xs ${
              destinationCheck.state === "reachable"
                ? "text-emerald-700 dark:text-emerald-400"
                : destinationCheck.state === "not-found" || destinationCheck.state === "invalid"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {destinationCheck.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Where visitors are sent — for example a Google Form.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="card-active"
          checked={form.is_active}
          onCheckedChange={(checked) => onChange({ is_active: checked })}
        />
        <Label htmlFor="card-active" className="font-normal text-muted-foreground">
          Show this link on the landing page
        </Label>
      </div>
    </>
  );
}
