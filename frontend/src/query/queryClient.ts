import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { resolveProblemUi } from "@/api/problemMapping";
import { publishProblemToast } from "@/components/errors/problemToastStore";

type QueryMeta = {
  skipGlobalErrorToast?: boolean;
};

function shouldToastForQuery(error: unknown): boolean {
  const ui = resolveProblemUi(error);
  return ui.presentation === "toast" || ui.presentation === "both";
}

function shouldToastForMutation(error: unknown): boolean {
  const ui = resolveProblemUi(error);
  return ui.presentation !== "inline";
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
        retry: (failureCount) => {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            return false;
          }
          return failureCount < 2;
        }
      },
      mutations: {
        retry: false
      }
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        const meta = (query.meta ?? {}) as QueryMeta;
        if (meta.skipGlobalErrorToast) {
          return;
        }
        if (shouldToastForQuery(error)) {
          publishProblemToast(resolveProblemUi(error));
        }
      }
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const meta = (mutation.meta ?? {}) as QueryMeta;
        if (meta.skipGlobalErrorToast) {
          return;
        }
        if (shouldToastForMutation(error)) {
          publishProblemToast(resolveProblemUi(error));
        }
      }
    })
  });
}
