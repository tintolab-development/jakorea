import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AwardCreateInput,
  AwardItem,
  AwardListFilter,
  CertCreateInput,
  CertItem,
  CertListFilter,
  HistoryCreateInput,
  HistoryItem,
  HistoryListFilter,
} from '@/entities/history-awards-certs/model/types'
import { shouldUseHistoryAwardsCertsRemoteApi } from './capabilities'
import { historyAwardsCertsQueryKeys } from './query-keys'
import * as service from './service'

function source(): 'remote' | 'local' {
  return shouldUseHistoryAwardsCertsRemoteApi() ? 'remote' : 'local'
}

function filterKey(filter: object): string {
  return JSON.stringify(filter)
}

const localStale = () => ({
  staleTime: source() === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
  retry: source() === 'remote' ? 1 : false,
})

function collectCached<T extends { id: string }>(
  qc: ReturnType<typeof useQueryClient>,
  listsKey: readonly unknown[],
): T[] | undefined {
  const merged = new Map<string, T>()
  for (const [, rows] of qc.getQueriesData<T[]>({ queryKey: listsKey })) {
    for (const row of rows ?? []) merged.set(row.id, row)
  }
  return merged.size > 0 ? [...merged.values()] : undefined
}

function patchInLists<T extends { id: string }>(
  qc: ReturnType<typeof useQueryClient>,
  listsKey: readonly unknown[],
  row: T,
) {
  qc.setQueriesData<T[]>({ queryKey: listsKey }, old => {
    if (!old) return old
    const idx = old.findIndex(item => item.id === row.id)
    if (idx < 0) return old
    const next = [...old]
    next[idx] = row
    return next
  })
}

function removeFromLists(
  qc: ReturnType<typeof useQueryClient>,
  listsKey: readonly unknown[],
  ids: string[],
) {
  const idSet = new Set(ids)
  qc.setQueriesData<{ id: string }[]>({ queryKey: listsKey }, old =>
    (old ?? []).filter(row => !idSet.has(row.id)),
  )
}

export function useHistoryList(filter: HistoryListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: historyAwardsCertsQueryKeys.history.list(source(), filterKey(filter)),
    queryFn: () => service.listHistoryService(filter),
    enabled,
    ...localStale(),
  })
}

export function useCreateHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: HistoryCreateInput) => service.createHistoryService(input),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.history.lists() })
    },
  })
}

export function useUpdateHistory() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.history.lists()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: HistoryCreateInput }) =>
      service.updateHistoryService(id, input, collectCached<HistoryItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInLists(qc, listsKey, data)
    },
  })
}

export function useSetHistoryPublic() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.history.lists()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setHistoryPublicService(id, isPublic, collectCached<HistoryItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInLists(qc, listsKey, data)
    },
  })
}

export function useRemoveHistory() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.history.lists()
  return useMutation({
    mutationFn: (ids: string[]) =>
      service.removeHistoryService(ids, collectCached<HistoryItem>(qc, listsKey)),
    retry: false,
    onSuccess: (_data, ids) => {
      removeFromLists(qc, listsKey, ids)
    },
  })
}

export function useAwardList(filter: AwardListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: historyAwardsCertsQueryKeys.award.list(source(), filterKey(filter)),
    queryFn: () => service.listAwardService(filter),
    enabled,
    ...localStale(),
  })
}

export function useCreateAward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AwardCreateInput) => service.createAwardService(input),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.award.lists() })
    },
  })
}

export function useUpdateAward() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.award.lists()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AwardCreateInput }) =>
      service.updateAwardService(id, input, collectCached<AwardItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInLists(qc, listsKey, data)
    },
  })
}

export function useSetAwardPublic() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.award.lists()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setAwardPublicService(id, isPublic, collectCached<AwardItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInLists(qc, listsKey, data)
    },
  })
}

export function useRemoveAward() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.award.lists()
  return useMutation({
    mutationFn: (ids: string[]) =>
      service.removeAwardService(ids, collectCached<AwardItem>(qc, listsKey)),
    retry: false,
    onSuccess: (_data, ids) => {
      removeFromLists(qc, listsKey, ids)
    },
  })
}

export function useCertList(filter: CertListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: historyAwardsCertsQueryKeys.cert.list(source(), filterKey(filter)),
    queryFn: () => service.listCertService(filter),
    enabled,
    ...localStale(),
  })
}

export function useCreateCert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CertCreateInput) => service.createCertService(input),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.cert.lists() })
    },
  })
}

export function useUpdateCert() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.cert.lists()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CertCreateInput }) =>
      service.updateCertService(id, input, collectCached<CertItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInLists(qc, listsKey, data)
    },
  })
}

export function useSetCertPublic() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.cert.lists()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setCertPublicService(id, isPublic, collectCached<CertItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInLists(qc, listsKey, data)
    },
  })
}

export function useRemoveCert() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.cert.lists()
  return useMutation({
    mutationFn: (ids: string[]) =>
      service.removeCertService(ids, collectCached<CertItem>(qc, listsKey)),
    retry: false,
    onSuccess: (_data, ids) => {
      removeFromLists(qc, listsKey, ids)
    },
  })
}
