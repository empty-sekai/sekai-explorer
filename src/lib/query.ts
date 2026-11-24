import { QueryClient } from "@tanstack/react-query";

/**
 * Answers from the core change only when the open bundles do, so they never go stale, and they
 * need no network, so they run offline too.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Number.POSITIVE_INFINITY, retry: false, networkMode: "always" },
  },
});
