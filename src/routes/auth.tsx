import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin, getAdminStatus, type CardResult } from "@/lib/cards";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in" },
      { name: "description", content: "Sign in to manage the links." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [canClaim, setCanClaim] = useState(false);

  // If a confirmed session already exists (e.g. right after email
  // confirmation), send admins straight to the admin panel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      try {
        const status = await getAdminStatus();
        if (cancelled) return;
        if (status.isAdmin) {
          await navigate({ to: "/admin", replace: true });
          return;
        }
        setSignedInEmail(user.email ?? "");
        setCanClaim(status.canClaimAdmin);
      } catch {
        // Not signed in or offline — stay on the form.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      const status = await getAdminStatus();
      if (status.isAdmin) {
        await navigate({ to: "/admin" });
        return;
      }
      setSignedInEmail(email);
      setCanClaim(status.canClaimAdmin);
      toast.error("This account is not an admin yet.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setNotice("Check your email to confirm your account, then sign in here.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim() {
    setBusy(true);
    try {
      const result = (await claimAdmin()) as CardResult;
      if (result.ok) {
        await navigate({ to: "/admin" });
        return;
      }
      toast.error(result.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSignedInEmail(null);
    setCanClaim(false);
    setMode("signin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {mode === "signin" ? "Admin sign in" : "Create an admin account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage the links."
              : "Only the first account can become the admin."}
          </p>

          {signedInEmail !== null ? (
            <div className="mt-6 grid gap-4">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="text-foreground">{signedInEmail}</span>. This account
                is not an admin{canClaim ? ", but no admin exists yet — you can claim it:" : "."}
              </p>
              {canClaim && (
                <Button onClick={handleClaim} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Claim admin access
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          ) : (
            <form
              className="mt-6 grid gap-4"
              onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Sign up"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setNotice(null);
                }}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {mode === "signin" ? "Need to create an account?" : "Already have an account?"}
              </button>
            </form>
          )}

          {notice && (
            <p className="mt-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {notice}
            </p>
          )}
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to links
          </Link>
        </div>
      </div>
    </main>
  );
}
