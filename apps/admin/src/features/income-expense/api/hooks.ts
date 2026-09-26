import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FinanceItem,
  FinanceItemCreateInput,
  FinanceItemUpdatePatch,
  FinanceSection,
  FinanceViewKind,
} from '@/entities/income-expense/model/types'
import { incomeExpenseQueryKeys } from './query-keys'
import {
  createFinanceItemService,
  listFinanceItemsService,
  removeFinanceItemsService,
  reorderFinanceItemsService,
  updateFinanceItemsService,
} from './service'

function cachedList(
  queryClient: ReturnType<typeof useQueryClient>,
  section: FinanceSection,
  view: FinanceViewKind,
): FinanceItem[] | undefined {
  return queryClient.getQueryData<FinanceItem[]>(
    incomeExpenseQueryKeys.list(section, view),
  )
}

export function useFinanceItemsList(
  section: FinanceSection,
  view: FinanceViewKind,
  enabled = true,
) {
  return useQuery({
    queryKey: incomeExpenseQueryKeys.list(section, view),
    queryFn: () => listFinanceItemsService(section, view),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useCreateFinanceItem(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FinanceItemCreateInput) =>
      createFinanceItemService(section, view, input, cachedList(queryClient, section, view)),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: incomeExpenseQueryKeys.list(section, view),
      })
    },
  })
}

export function useUpdateFinanceItems(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: FinanceItemUpdatePatch[]) =>
      updateFinanceItemsService(section, view, patches, cachedList(queryClient, section, view)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(incomeExpenseQueryKeys.list(section, view), rows)
    },
  })
}

export function useRemoveFinanceItems(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      removeFinanceItemsService(section, view, ids, cachedList(queryClient, section, view)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(incomeExpenseQueryKeys.list(section, view), rows)
    },
  })
}

export function useReorderFinanceItems(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderFinanceItemsService(section, view, orderedIds, cachedList(queryClient, section, view)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(incomeExpenseQueryKeys.list(section, view), rows)
    },
  })
}
