import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { trainedTeacherQueryKeys } from './query-keys'
import {
  approveTrainedTeacherOrganizationApplication,
  listTrainedTeacherOrganizationApplications,
  rejectTrainedTeacherOrganizationApplication,
} from './organization-applications-service'

type Options = {
  programId?: string
  enabled: boolean
  setInstitutionList: (rows: ApplicantSchoolRow[]) => void
}

export function useTrainedTeacherOrganizationApplicationsRemoteSync({
  programId,
  enabled,
  setInstitutionList,
}: Options) {
  const queryClient = useQueryClient()
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi() && Boolean(programId) && enabled

  const listQuery = useQuery({
    queryKey: trainedTeacherQueryKeys.organizationApplications(programId ?? ''),
    queryFn: () => listTrainedTeacherOrganizationApplications(programId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (listQuery.data) setInstitutionList(listQuery.data)
  }, [listQuery.data, setInstitutionList])

  const invalidateApplications = async () => {
    await queryClient.invalidateQueries({
      queryKey: trainedTeacherQueryKeys.organizationApplicationsRoot(),
    })
  }

  return {
    remoteEnabled,
    applicationsLoading: listQuery.isFetching,
    approveOrganization: approveTrainedTeacherOrganizationApplication,
    rejectOrganization: (
      applicationId: string,
      payload: ApplicationRejectRequest
    ) => rejectTrainedTeacherOrganizationApplication(applicationId, payload),
    invalidateApplications,
  }
}
