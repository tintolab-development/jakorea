import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FinanceItemCreateInput,
  FinanceItemUpdatePatch,
  FinanceSection,
  FinanceViewKind,
} from '@/entities/income-expense/model/types'
import { shouldUseIncomeExpenseRemoteApi } from './capabilities'
import { incomeExpenseQueryKeys } from './query-keys'
import {
  createFinanceItemService,
  listFinanceItemsService,
  removeFinanceItemsService,
  reorderFinanceItemsService,
  updateFinanceItemsService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseIncomeExpenseRemoteApi() ? 'remote' : 'local'
}

export function useFinanceItemsList(
  section: FinanceSection,
  view: FinanceViewKind,
  enabled = true
) {
  const dataSource = source()
  return useQuery({
    queryKey: incomeExpenseQueryKeys.list(dataSource, section, view),
    queryFn: () => listFinanceItemsService(section, view),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

function invalidateLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: incomeExpenseQueryKeys.lists() })
}

export function useCreateFinanceItem(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FinanceItemCreateInput) =>
      createFinanceItemService(section, view, input),
    retry: false,
    onSuccess: () => invalidateLists(queryClient),
  })
}

export function useUpdateFinanceItems(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: FinanceItemUpdatePatch[]) =>
      updateFinanceItemsService(section, view, patches),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(incomeExpenseQueryKeys.list(source(), section, view), rows)
      invalidateLists(queryClient)
    },
  })
}

export function useRemoveFinanceItems(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeFinanceItemsService(section, view, ids),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(incomeExpenseQueryKeys.list(source(), section, view), rows)
      invalidateLists(queryClient)
    },
  })
}

export function useReorderFinanceItems(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderFinanceItemsService(section, view, orderedIds),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(incomeExpenseQueryKeys.list(source(), section, view), rows)
      invalidateLists(queryClient)
    },
  })
}
