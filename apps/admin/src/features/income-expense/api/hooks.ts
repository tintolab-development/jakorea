import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FinanceItem,
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

function cachedList(
  queryClient: ReturnType<typeof useQueryClient>,
  section: FinanceSection,
  view: FinanceViewKind,
): FinanceItem[] | undefined {
  return queryClient.getQueryData<FinanceItem[]>(
    incomeExpenseQueryKeys.list(source(), section, view),
  )
}

export function useFinanceItemsList(
  section: FinanceSection,
  view: FinanceViewKind,
  enabled = true,
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

export function useCreateFinanceItem(section: FinanceSection, view: FinanceViewKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FinanceItemCreateInput) =>
      createFinanceItemService(section, view, input, cachedList(queryClient, section, view)),
    retry: false,
    onSuccess: () => {
      // create는 단건 응답 — 해당 버킷만 invalidate 1회
      void queryClient.invalidateQueries({
        queryKey: incomeExpenseQueryKeys.list(source(), section, view),
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
      queryClient.setQueryData(incomeExpenseQueryKeys.list(source(), section, view), rows)
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
      queryClient.setQueryData(incomeExpenseQueryKeys.list(source(), section, view), rows)
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
      queryClient.setQueryData(incomeExpenseQueryKeys.list(source(), section, view), rows)
    },
  })
}
