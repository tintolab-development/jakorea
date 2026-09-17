import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { trainedTeacherQueryKeys } from './query-keys'
import {
  approveTrainedTeacherOrganizationApplication,
  listTrainedTeacherOrganizationApplications,
  rejectTrainedTeacherOrganizationApplication,
} from './organization-applications-service'
import {
  buildTrainedTeacherOrganizationApplicationsListQuery,
  serializeTrainedTeacherOrganizationApplicationsListQuery,
  type TrainedTeacherOrganizationApplicationUiFilters,
} from './organization-applications-list-query'

const EMPTY_TT_ORG_LIST_FILTERS: TrainedTeacherOrganizationApplicationUiFilters =
  Object.freeze({})

type Options = {
  programId?: string
  enabled: boolean
  /** 조회(apply) 이후 필터 — query key에 포함되어 조회 시 API 재호출 */
  listFilters?: TrainedTeacherOrganizationApplicationUiFilters
  setInstitutionList: (rows: ApplicantSchoolRow[]) => void
}

export function useTrainedTeacherOrganizationApplicationsRemoteSync({
  programId,
  enabled,
  listFilters = EMPTY_TT_ORG_LIST_FILTERS,
  setInstitutionList,
}: Options) {
  const queryClient = useQueryClient()
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi() && Boolean(programId) && enabled

  const listQuery = useMemo(
    () => buildTrainedTeacherOrganizationApplicationsListQuery(listFilters),
    [listFilters]
  )
  const filtersKey = useMemo(
    () => serializeTrainedTeacherOrganizationApplicationsListQuery(listQuery),
    [listQuery]
  )

  const query = useQuery({
    queryKey: trainedTeacherQueryKeys.organizationApplications(programId ?? '', filtersKey),
    queryFn: () => listTrainedTeacherOrganizationApplications(programId!, listQuery),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (query.data) setInstitutionList(query.data)
  }, [query.data, setInstitutionList])

  const invalidateApplications = async () => {
    await queryClient.invalidateQueries({
      queryKey: trainedTeacherQueryKeys.organizationApplicationsRoot(),
    })
  }

  return {
    remoteEnabled,
    applicationsLoading: query.isFetching,
    approveOrganization: (applicationId: string) =>
      approveTrainedTeacherOrganizationApplication(programId!, applicationId),
    rejectOrganization: (applicationId: string, payload: ApplicationRejectRequest) =>
      rejectTrainedTeacherOrganizationApplication(programId!, applicationId, payload),
    invalidateApplications,
  }
}
