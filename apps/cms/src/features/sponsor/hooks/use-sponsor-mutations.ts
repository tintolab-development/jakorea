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
  applyDeletedToArrayLists,
  applyUpdatedToArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'

function rowId(row: SponsorManagementRow): string {
  return row.id
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

export function useSponsorMutations() {
  const queryClient = useQueryClient()
  const listsKey = dataManagementQueryKeys.sponsors.listAll()

  const createMutation = useMutation({
    mutationFn: createSponsor,
    onSuccess: async () => {
      await invalidateArrayLists(queryClient, listsKey)
      await queryClient.invalidateQueries({
        queryKey: dataManagementQueryKeys.sponsors.options(),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSponsor,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: dataManagementQueryKeys.sponsors.detail(id) })
      applyDeletedToArrayLists(queryClient, listsKey, id, rowId)
      void queryClient.invalidateQueries({
        queryKey: dataManagementQueryKeys.sponsors.options(),
      })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteSponsors,
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: dataManagementQueryKeys.sponsors.detail(id) })
        applyDeletedToArrayLists(queryClient, listsKey, id, rowId)
      }
      void queryClient.invalidateQueries({
        queryKey: dataManagementQueryKeys.sponsors.options(),
      })
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
      applyUpdatedToArrayLists(queryClient, listsKey, updated, rowId)
    },
  })

  const endSponsorshipMutation = useMutation({
    mutationFn: endSponsorship,
    onSuccess: (_data, sponsorId) => {
      applySponsorStatusToCachedLists(queryClient, sponsorId, 'ended')
      patchSponsorDetailStatus(queryClient, sponsorId, 'ended')
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
