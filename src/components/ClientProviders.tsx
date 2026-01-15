import { useState, useEffect, type ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [clients] = useState(() => {
    if (typeof window === "undefined") return null;

    const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
    const convexQueryClient = new ConvexQueryClient(convex);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          queryKeyHashFn: convexQueryClient.hashFn(),
          queryFn: convexQueryClient.queryFn(),
          staleTime: 1000 * 60 * 5,
          gcTime: 1000 * 60 * 10,
        },
      },
    });
    convexQueryClient.connect(queryClient);

    return { convex, queryClient };
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !clients) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <ConvexProvider client={clients.convex}>
      <QueryClientProvider client={clients.queryClient}>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConvexProvider>
  );
}
