import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin sign in — Gatekeeper" },
      { name: "description", content: "Sign in to manage the Gatekeeper links." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signIn" | "signUp";

function makeFormData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Authentication could not be completed.";
}

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signIn, signOut } = useAuthActions();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const status = useQuery(api.cards.getAdminStatus, isAuthenticated ? {} : "skip");
  const claimAdmin = useMutation(api.cards.claimAdmin);

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status?.isAdmin) void navigate({ to: "/admin", replace: true });
  }, [navigate, status?.isAdmin]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn("password", makeFormData({ email, password, flow: mode }));
      toast.success(mode === "signUp" ? "Admin account created." : "Signed in.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim() {
    setBusy(true);
    try {
      const result = await claimAdmin({});
      if (result.ok) {
        await navigate({ to: "/admin", replace: true });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    queryClient.clear();
    setMode("signIn");
  }

  const checking = authLoading || (isAuthenticated && status === undefined);
  const signedInEmail = status?.email;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-none">
          <div className="flex items-center gap-2.5">
            <img
              src="/Short%20Logo.png"
              alt="Gatekeeper"
              className="h-auto w-32 dark:brightness-0 dark:invert"
              draggable={false}
            />
          </div>
          <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
            {mode === "signUp" ? "Set up admin account" : "Admin sign in"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signUp"
              ? "Create the admin account using product.gatekeepr@gmail.com."
              : "Sign in to manage the links."}
          </p>

          {checking ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking account…
            </div>
          ) : isAuthenticated ? (
            <div className="mt-6 grid gap-4">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="text-foreground">{signedInEmail ?? "your account"}</span>.
                {status?.canClaimAdmin ? " You can claim the initial admin role." : " This account is not an admin."}
              </p>
              {status?.canClaimAdmin && (
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
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signIn" ? "Sign in" : "Create account"}
              </Button>

              {mode === "signIn" && (
                <div className="flex justify-center gap-x-4 gap-y-2 text-xs">
                  <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMode("signUp")}>
                    First time? Set up account
                  </button>
                </div>
              )}

              {mode === "signUp" && (
                <Button type="button" variant="ghost" onClick={() => setMode("signIn")} disabled={busy}>
                  Back to sign in
                </Button>
              )}
            </form>
          )}
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Back to links
          </Link>
        </div>
      </div>
    </main>
  );
}
