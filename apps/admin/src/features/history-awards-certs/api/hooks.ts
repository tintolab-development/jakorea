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
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import {
  collectInfiniteCachedRows,
  patchInfiniteListRow,
  removeInfiniteListRows,
} from '@/shared/lib/admin-infinite-list'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shouldUseHistoryAwardsCertsRemoteApi } from './capabilities'
import { historyAwardsCertsQueryKeys } from './query-keys'
import * as service from './service'

function source(): 'remote' | 'local' {
  return shouldUseHistoryAwardsCertsRemoteApi() ? 'remote' : 'local'
}

function filterKey(filter: object): string {
  return JSON.stringify(filter)
}

export function useHistoryList(filter: HistoryListFilter = {}, enabled = true) {
  return useAdminInfiniteList({
    queryKey: historyAwardsCertsQueryKeys.history.list(source(), filterKey(filter)),
    enabled,
    isRemote: shouldUseHistoryAwardsCertsRemoteApi(),
    fetchPage: page => service.listHistoryPageService(filter, page),
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
      service.updateHistoryService(id, input, collectInfiniteCachedRows<HistoryItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInfiniteListRow(qc, listsKey, data)
    },
  })
}

export function useSetHistoryPublic() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.history.lists()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setHistoryPublicService(
        id,
        isPublic,
        collectInfiniteCachedRows<HistoryItem>(qc, listsKey),
      ),
    retry: false,
    onSuccess: data => {
      patchInfiniteListRow(qc, listsKey, data)
    },
  })
}

export function useRemoveHistory() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.history.lists()
  return useMutation({
    mutationFn: (ids: string[]) =>
      service.removeHistoryService(ids, collectInfiniteCachedRows<HistoryItem>(qc, listsKey)),
    retry: false,
    onSuccess: (_data, ids) => {
      removeInfiniteListRows(qc, listsKey, ids)
    },
  })
}

export function useAwardList(filter: AwardListFilter = {}, enabled = true) {
  return useAdminInfiniteList({
    queryKey: historyAwardsCertsQueryKeys.award.list(source(), filterKey(filter)),
    enabled,
    isRemote: shouldUseHistoryAwardsCertsRemoteApi(),
    fetchPage: page => service.listAwardPageService(filter, page),
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
      service.updateAwardService(id, input, collectInfiniteCachedRows<AwardItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInfiniteListRow(qc, listsKey, data)
    },
  })
}

export function useSetAwardPublic() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.award.lists()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setAwardPublicService(
        id,
        isPublic,
        collectInfiniteCachedRows<AwardItem>(qc, listsKey),
      ),
    retry: false,
    onSuccess: data => {
      patchInfiniteListRow(qc, listsKey, data)
    },
  })
}

export function useRemoveAward() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.award.lists()
  return useMutation({
    mutationFn: (ids: string[]) =>
      service.removeAwardService(ids, collectInfiniteCachedRows<AwardItem>(qc, listsKey)),
    retry: false,
    onSuccess: (_data, ids) => {
      removeInfiniteListRows(qc, listsKey, ids)
    },
  })
}

export function useCertList(filter: CertListFilter = {}, enabled = true) {
  return useAdminInfiniteList({
    queryKey: historyAwardsCertsQueryKeys.cert.list(source(), filterKey(filter)),
    enabled,
    isRemote: shouldUseHistoryAwardsCertsRemoteApi(),
    fetchPage: page => service.listCertPageService(filter, page),
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
      service.updateCertService(id, input, collectInfiniteCachedRows<CertItem>(qc, listsKey)),
    retry: false,
    onSuccess: data => {
      patchInfiniteListRow(qc, listsKey, data)
    },
  })
}

export function useSetCertPublic() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.cert.lists()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setCertPublicService(
        id,
        isPublic,
        collectInfiniteCachedRows<CertItem>(qc, listsKey),
      ),
    retry: false,
    onSuccess: data => {
      patchInfiniteListRow(qc, listsKey, data)
    },
  })
}

export function useRemoveCert() {
  const qc = useQueryClient()
  const listsKey = historyAwardsCertsQueryKeys.cert.lists()
  return useMutation({
    mutationFn: (ids: string[]) =>
      service.removeCertService(ids, collectInfiniteCachedRows<CertItem>(qc, listsKey)),
    retry: false,
    onSuccess: (_data, ids) => {
      removeInfiniteListRows(qc, listsKey, ids)
    },
  })
}
