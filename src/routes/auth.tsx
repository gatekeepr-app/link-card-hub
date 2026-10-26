import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin, getAdminStatus, type CardResult } from "@/lib/cards";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Gatekeeper" },
      { name: "description", content: "Sign in to manage the Gatekeeper links." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // If a confirmed session already exists, send admins straight to the panel.
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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "email_not_confirmed") {
          setNeedsVerification(true);
          toast.error("Verify your email before signing in. You can send a fresh confirmation link below.");
          return;
        }
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

  async function handleResendVerification() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth-callback` },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("A new verification link has been sent. Check your email.");
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
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Gatekeeper
            </span>
          </div>
          <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage the links. New account creation is disabled.
          </p>

          {signedInEmail !== null ? (
            <div className="mt-6 grid gap-4">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="text-foreground">{signedInEmail}</span>. This account
                is not an admin{canClaim ? ", but you can claim it:" : "."}
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
            <form className="mt-6 grid gap-4" onSubmit={handleSignIn}>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setNeedsVerification(false);
                  }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
              {needsVerification && (
                <Button type="button" variant="outline" onClick={handleResendVerification} disabled={busy || !email}>
                  Resend verification email
                </Button>
              )}
            </form>
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

