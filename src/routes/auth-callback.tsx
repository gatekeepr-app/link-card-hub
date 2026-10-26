import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth-callback")({
  head: () => ({
    meta: [
      { title: "Confirming email — Gatekeeper" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishVerification() {
      const query = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const callbackError =
        query.get("error_description") ??
        query.get("error") ??
        fragment.get("error_description") ??
        fragment.get("error");
      if (callbackError) {
        setError(callbackError.replaceAll("+", " "));
        return;
      }

      // Require evidence that Supabase returned from a confirmation flow. A
      // previously stored session by itself does not prove this link succeeded.
      const hasConfirmationResult = query.has("code") || fragment.has("access_token");
      if (!hasConfirmationResult) {
        setError("This page must be opened from a valid email confirmation link.");
        return;
      }

      // Supabase reads the confirmation code or session tokens from this URL
      // when its client initializes (detectSessionInUrl is enabled by default).
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (!data.session) {
        setError("The confirmation link may have expired or already been used. Request a new one and try again.");
        return;
      }

      await navigate({ to: "/auth", replace: true });
    }

    void finishVerification().catch((cause: unknown) => {
      if (!cancelled) {
        setError(cause instanceof Error ? cause.message : "Email confirmation could not be completed.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          {error ? "Email confirmation failed" : "Confirming your email"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "Please wait while we finish verifying your account."}
        </p>
        {error ? (
          <div className="mt-6 grid gap-3">
            <Button asChild>
              <Link to="/auth">Return to sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to links</Link>
            </Button>
          </div>
        ) : (
          <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </main>
  );
}
