import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  fetchMyActions,
  updateActionStatus,
  type FetchMyActionsQuery,
  type UpdateActionStatusPayload,
  type Action,
} from '@/lib/action-api';

// ─── Query Keys ───────────────────────────────────────────────────

export const actionKeys = {
  all: ['actions'] as const,
  lists: () => [...actionKeys.all, 'list'] as const,
  list: (filters: FetchMyActionsQuery) =>
    [...actionKeys.lists(), filters] as const,
  details: () => [...actionKeys.all, 'detail'] as const,
  detail: (actionId: string) => [...actionKeys.details(), actionId] as const,
  pendingCount: () => [...actionKeys.all, 'pendingCount'] as const,
};

// ─── Constants ───────────────────────────────────────────────────

const POLLING_INTERVAL = 5000; // 5 seconds

// ─── Hooks ────────────────────────────────────────────────────────

/**
 * Hook to fetch actions with auto-polling every 5 seconds
 * Use ownershipRole to filter: 'initiated' | 'received' | 'all'
 */
export function useActions(
  ownershipRole: 'initiated' | 'received' | 'all' = 'all',
  options: Omit<
    UseQueryOptions<{ actions: Action[]; meta: { total: number } }, Error>,
    'queryKey' | 'queryFn'
  > = {}
) {
  const query: FetchMyActionsQuery = {
    ownership_role: ownershipRole,
    limit: 100,
    offset: 0,
  };

  return useQuery({
    queryKey: actionKeys.list(query),
    queryFn: async ({ signal }) => {
      const response = await fetchMyActions(query, signal);
      return {
        actions: response.actions,
        meta: response.meta,
      };
    },
    refetchInterval: POLLING_INTERVAL, // Auto-poll every 5 seconds
    staleTime: 0, // Consider data stale immediately for real-time feel
    ...options,
  });
}

/**
 * Hook to get count of pending received actions for badge
 * Auto-polls every 5 seconds
 */
export function usePendingActionsCount() {
  return useQuery({
    queryKey: actionKeys.pendingCount(),
    queryFn: async ({ signal }) => {
      const response = await fetchMyActions(
        {
          ownership_role: 'received',
          action_status: 'created', // Only pending/new actions
          limit: 1,
          offset: 0,
        },
        signal
      );
      return response.meta.total;
    },
    refetchInterval: POLLING_INTERVAL,
    staleTime: 0,
  });
}

/**
 * Hook to update action status
 * Automatically invalidates action queries on success
 */
export function useUpdateActionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateActionStatusPayload) => {
      const response = await updateActionStatus(payload);
      return response;
    },
    onSuccess: () => {
      // Invalidate all action-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
}

/**
 * Hook to get actions by specific status
 * Useful for filtering received actions
 */
export function useReceivedActionsByStatus(
  status?: string,
  options: Omit<
    UseQueryOptions<{ actions: Action[]; meta: { total: number } }, Error>,
    'queryKey' | 'queryFn'
  > = {}
) {
  const query: FetchMyActionsQuery = {
    ownership_role: 'received',
    action_status: status,
    limit: 100,
    offset: 0,
  };

  return useQuery({
    queryKey: actionKeys.list(query),
    queryFn: async ({ signal }) => {
      const response = await fetchMyActions(query, signal);
      return {
        actions: response.actions,
        meta: response.meta,
      };
    },
    refetchInterval: POLLING_INTERVAL,
    staleTime: 0,
    ...options,
  });
}

/**
 * Hook to get initiated actions
 */
export function useInitiatedActions(
  options: Omit<
    UseQueryOptions<{ actions: Action[]; meta: { total: number } }, Error>,
    'queryKey' | 'queryFn'
  > = {}
) {
  return useActions('initiated', options);
}

/**
 * Hook to get received actions
 */
export function useReceivedActions(
  options: Omit<
    UseQueryOptions<{ actions: Action[]; meta: { total: number } }, Error>,
    'queryKey' | 'queryFn'
  > = {}
) {
  return useActions('received', options);
}
