import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addSponsorContact,
  createSponsor,
  deleteSponsor,
  deleteSponsorContacts,
  endSponsorship,
  updateSponsorBasicInfo,
  updateSponsorContact,
  updateSponsorStatus,
} from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'

export function useSponsorMutations(listSearchParamsKey: string) {
  const queryClient = useQueryClient()
  const listKey = dataManagementQueryKeys.sponsors.list(listSearchParamsKey)

  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: listKey })
  }

  const invalidateDetail = (sponsorId: string) => {
    void queryClient.invalidateQueries({
      queryKey: dataManagementQueryKeys.sponsors.detail(sponsorId),
    })
  }

  const createMutation = useMutation({
    mutationFn: createSponsor,
    onSuccess: invalidateList,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSponsor,
    onSuccess: invalidateList,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({
      sponsorId,
      sponsorshipStatus,
    }: {
      sponsorId: string
      sponsorshipStatus: Parameters<typeof updateSponsorStatus>[1]
    }) => updateSponsorStatus(sponsorId, sponsorshipStatus),
    onSuccess: (_data, variables) => {
      invalidateList()
      invalidateDetail(variables.sponsorId)
    },
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
    onSuccess: (_data, variables) => {
      invalidateList()
      invalidateDetail(variables.sponsorId)
    },
  })

  const endSponsorshipMutation = useMutation({
    mutationFn: endSponsorship,
    onSuccess: (_data, sponsorId) => {
      invalidateList()
      invalidateDetail(sponsorId)
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
    onSuccess: (_data, variables) => {
      invalidateDetail(variables.sponsorId)
    },
  })

  const updateContactMutation = useMutation({
    mutationFn: updateSponsorContact,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dataManagementQueryKeys.sponsors.all() })
    },
  })

  const deleteContactsMutation = useMutation({
    mutationFn: deleteSponsorContacts,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dataManagementQueryKeys.sponsors.all() })
    },
  })

  return {
    createMutation,
    deleteMutation,
    updateStatusMutation,
    updateBasicInfoMutation,
    endSponsorshipMutation,
    addContactMutation,
    updateContactMutation,
    deleteContactsMutation,
  }
}
