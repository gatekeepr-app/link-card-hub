import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const status = useQuery(api.cards.getAdminStatus, isAuthenticated ? {} : "skip");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (status && !status.isAdmin))) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, status]);

  if (isLoading || (isAuthenticated && status === undefined) || !status?.isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking admin access…
        </div>
      </main>
    );
  }

  return <Outlet />;
}
