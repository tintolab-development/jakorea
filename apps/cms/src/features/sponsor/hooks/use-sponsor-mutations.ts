import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  addSponsorContact,
  createSponsor,
  deleteSponsor,
  deleteSponsorContacts,
  deleteSponsors,
  endSponsorship,
  updateSponsorBasicInfo,
  updateSponsorContact,
  updateSponsorStatus,
} from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import {
  applyCreatedContactToDetail,
  applyDeletedContactsToDetail,
  applyUpdatedContactToDetail,
} from '@/features/sponsor/lib/contact-query-cache'
import { applySponsorStatusToCachedLists } from '@/features/sponsor/lib/apply-status-to-list'
import type {
  SponsorManagementDetailView,
  SponsorManagementRow,
} from '@/features/sponsor/model/sponsor-management.types'
import {
  applyCreatedToMatchingArrayLists,
  applyDeletedToArrayLists,
  applyUpdatedToMatchingArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'
import dayjs from 'dayjs'
import { isSponsorSponsorshipStatus } from '@/features/sponsor/model/sponsorship-status'

function rowId(row: SponsorManagementRow): string {
  return row.id
}

function detailToListRow(detail: SponsorManagementDetailView): SponsorManagementRow {
  return {
    id: detail.id,
    name: detail.name,
    nameEn: detail.nameEn,
    description: detail.description,
    contactInfo: detail.contactInfo,
    managers: detail.managers,
    securityMemo: detail.securityMemo,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    organizationKind: detail.organizationKind,
    sponsorshipStatus: detail.sponsorshipStatus,
    sponsorshipStartDate: detail.sponsorshipStartDate,
    programCount: detail.programCount,
    totalDonationAmount: detail.totalDonationAmount,
    totalBeneficiaryCount: detail.totalBeneficiaryCount,
  }
}

function sponsorMatchesListFilter(
  queryKey: readonly unknown[],
  row: SponsorManagementRow
): boolean {
  const raw = queryKey[queryKey.length - 1]
  if (typeof raw !== 'string') return true
  const params = new URLSearchParams(raw)
  const kind = params.get('sp_kind') === 'foundation' ? 'foundation' : 'corporate'
  if ((row.organizationKind ?? 'corporate') !== kind) return false

  const st = params.get('sp_st')
  if (isSponsorSponsorshipStatus(st)) {
    if ((row.sponsorshipStatus ?? 'active') !== st) return false
  }

  const nameQ = (params.get('sp_name') ?? '').trim()
  if (nameQ && !row.name.includes(nameQ)) return false

  const mgrQ = (params.get('sp_mgr') ?? '').trim()
  if (mgrQ) {
    const managers = row.managers ?? []
    if (!managers.some(m => m.name.includes(mgrQ))) return false
  }

  const from = (params.get('sp_from') ?? '').trim()
  const to = (params.get('sp_to') ?? '').trim()
  if (from || to) {
    const rawDate = row.sponsorshipStartDate
    if (rawDate == null || rawDate === '') return false
    const day = dayjs(rawDate).format('YYYY-MM-DD')
    if (from && day < from) return false
    if (to && day > to) return false
  }

  return true
}

function patchSponsorDetailStatus(
  queryClient: QueryClient,
  sponsorId: string,
  sponsorshipStatus: NonNullable<SponsorManagementRow['sponsorshipStatus']>
): void {
  const detailKey = dataManagementQueryKeys.sponsors.detail(sponsorId)
  if (!queryClient.getQueryData(detailKey)) return
  queryClient.setQueryData<SponsorManagementDetailView>(detailKey, old =>
    old ? { ...old, sponsorshipStatus } : old
  )
}

function patchSponsorOptionsList(
  queryClient: QueryClient,
  mutate: (old: SponsorManagementRow[]) => SponsorManagementRow[]
): void {
  const key = dataManagementQueryKeys.sponsors.options()
  const old = queryClient.getQueryData<SponsorManagementRow[]>(key)
  if (!Array.isArray(old)) return
  queryClient.setQueryData(key, mutate(old))
}

export function useSponsorMutations() {
  const queryClient = useQueryClient()
  const listsKey = dataManagementQueryKeys.sponsors.listAll()

  const createMutation = useMutation({
    mutationFn: createSponsor,
    onSuccess: async created => {
      if (!created.id) {
        await invalidateArrayLists(queryClient, listsKey)
        await queryClient.invalidateQueries({
          queryKey: dataManagementQueryKeys.sponsors.options(),
        })
        return
      }
      applyCreatedToMatchingArrayLists(
        queryClient,
        listsKey,
        created,
        rowId,
        sponsorMatchesListFilter
      )
      patchSponsorOptionsList(queryClient, old =>
        old.some(row => row.id === created.id) ? old : [created, ...old]
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSponsor,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: dataManagementQueryKeys.sponsors.detail(id) })
      applyDeletedToArrayLists(queryClient, listsKey, id, rowId)
      patchSponsorOptionsList(queryClient, old => old.filter(row => row.id !== id))
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteSponsors,
    onSuccess: (_data, ids) => {
      const idSet = new Set(ids)
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: dataManagementQueryKeys.sponsors.detail(id) })
        applyDeletedToArrayLists(queryClient, listsKey, id, rowId)
      }
      patchSponsorOptionsList(queryClient, old => old.filter(row => !idSet.has(row.id)))
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({
      sponsorId,
      sponsorshipStatus,
      existing,
    }: {
      sponsorId: string
      sponsorshipStatus: Parameters<typeof updateSponsorStatus>[1]
      existing: SponsorManagementRow
    }) => updateSponsorStatus(sponsorId, sponsorshipStatus, existing),
    onSuccess: (_data, variables) => {
      applySponsorStatusToCachedLists(
        queryClient,
        variables.sponsorId,
        variables.sponsorshipStatus
      )
      patchSponsorDetailStatus(queryClient, variables.sponsorId, variables.sponsorshipStatus)
      patchSponsorOptionsList(queryClient, old =>
        old.map(row =>
          row.id === variables.sponsorId
            ? { ...row, sponsorshipStatus: variables.sponsorshipStatus }
            : row
        )
      )
    },
    retry: false,
  })

  const updateBasicInfoMutation = useMutation({
    mutationFn: ({
      sponsorId,
      basicInfo,
      existing,
    }: {
      sponsorId: string
      basicInfo: Parameters<typeof updateSponsorBasicInfo>[1]
      existing: Parameters<typeof updateSponsorBasicInfo>[2]
    }) => updateSponsorBasicInfo(sponsorId, basicInfo, existing),
    onSuccess: async (updated, variables) => {
      if (!updated?.id) {
        await invalidateArrayLists(queryClient, listsKey)
        await queryClient.invalidateQueries({
          queryKey: dataManagementQueryKeys.sponsors.detail(variables.sponsorId),
        })
        return
      }
      queryClient.setQueryData(dataManagementQueryKeys.sponsors.detail(updated.id), updated)
      const listRow = detailToListRow(updated)
      applyUpdatedToMatchingArrayLists(
        queryClient,
        listsKey,
        listRow,
        rowId,
        sponsorMatchesListFilter
      )
      patchSponsorOptionsList(queryClient, old => {
        const found = old.some(row => row.id === listRow.id)
        return found
          ? old.map(row => (row.id === listRow.id ? { ...row, ...listRow } : row))
          : [listRow, ...old]
      })
    },
  })

  const endSponsorshipMutation = useMutation({
    mutationFn: endSponsorship,
    onSuccess: (_data, sponsorId) => {
      applySponsorStatusToCachedLists(queryClient, sponsorId, 'ended')
      patchSponsorDetailStatus(queryClient, sponsorId, 'ended')
      patchSponsorOptionsList(queryClient, old =>
        old.map(row => (row.id === sponsorId ? { ...row, sponsorshipStatus: 'ended' } : row))
      )
    },
  })

  const addContactMutation = useMutation({
    mutationFn: ({
      sponsorId,
      payload,
      contactType,
    }: {
      sponsorId: string
      payload: Parameters<typeof addSponsorContact>[1]
      contactType: Parameters<typeof addSponsorContact>[2]
    }) => addSponsorContact(sponsorId, payload, contactType),
    onSuccess: (created, variables) => {
      applyCreatedContactToDetail(queryClient, variables.sponsorId, created)
    },
  })

  const updateContactMutation = useMutation({
    mutationFn: ({ row }: { row: Parameters<typeof updateSponsorContact>[0]; sponsorId: string }) =>
      updateSponsorContact(row),
    onSuccess: (updated, variables) => {
      applyUpdatedContactToDetail(queryClient, variables.sponsorId, updated)
    },
  })

  const deleteContactsMutation = useMutation({
    mutationFn: ({ ids }: { ids: Parameters<typeof deleteSponsorContacts>[0]; sponsorId: string }) =>
      deleteSponsorContacts(ids),
    onSuccess: (_data, variables) => {
      applyDeletedContactsToDetail(queryClient, variables.sponsorId, variables.ids)
    },
  })

  return {
    createMutation,
    deleteMutation,
    bulkDeleteMutation,
    updateStatusMutation,
    updateBasicInfoMutation,
    endSponsorshipMutation,
    addContactMutation,
    updateContactMutation,
    deleteContactsMutation,
  }
}
