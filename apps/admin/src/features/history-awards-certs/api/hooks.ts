import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AwardCreateInput,
  AwardListFilter,
  CertCreateInput,
  CertListFilter,
  HistoryCreateInput,
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
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: HistoryCreateInput }) =>
      service.updateHistoryService(id, input),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.history.lists() })
    },
  })
}

export function useSetHistoryPublic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setHistoryPublicService(id, isPublic),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.history.lists() })
    },
  })
}

export function useRemoveHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => service.removeHistoryService(ids),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.history.lists() })
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
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AwardCreateInput }) =>
      service.updateAwardService(id, input),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.award.lists() })
    },
  })
}

export function useSetAwardPublic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setAwardPublicService(id, isPublic),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.award.lists() })
    },
  })
}

export function useRemoveAward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => service.removeAwardService(ids),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.award.lists() })
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
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CertCreateInput }) =>
      service.updateCertService(id, input),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.cert.lists() })
    },
  })
}

export function useSetCertPublic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      service.setCertPublicService(id, isPublic),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.cert.lists() })
    },
  })
}

export function useRemoveCert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => service.removeCertService(ids),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: historyAwardsCertsQueryKeys.cert.lists() })
    },
  })
}
