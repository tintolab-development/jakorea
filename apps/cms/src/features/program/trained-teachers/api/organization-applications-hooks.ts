import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type {
  ApplicationDecisionCancelRequestWithNotification,
  OrganizationApplicationApprovePayload,
} from '@/features/program/general/api/applications-api-client'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { trainedTeacherQueryKeys } from './query-keys'
import {
  approveTrainedTeacherOrganizationApplication,
  cancelTrainedTeacherOrganizationApplicationApproval,
  listTrainedTeacherOrganizationApplications,
  rejectTrainedTeacherOrganizationApplication,
  resendTrainedTeacherOrganizationApplicationNotification,
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
  /** 교육받은 교사 전용 화면이 바뀌거나 원격이 꺼졌을 때 이전 목록 제거 */
  clearWhenDisabled?: boolean
  /** 조회(apply) 이후 필터 — query key에 포함되어 조회 시 API 재호출 */
  listFilters?: TrainedTeacherOrganizationApplicationUiFilters
  setInstitutionList: (rows: ApplicantSchoolRow[]) => void
}

export function useTrainedTeacherOrganizationApplicationsRemoteSync({
  programId,
  enabled,
  clearWhenDisabled = false,
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
    if (!remoteEnabled) {
      if (clearWhenDisabled) setInstitutionList([])
      return
    }
    // programId/filter key가 바뀐 직후에는 이전 프로그램 목록을 남기지 않는다.
    // 새 원격 응답이 성공한 뒤에만 목록을 다시 반영한다.
    if (query.isPending) {
      setInstitutionList([])
      return
    }
    if (query.isError) {
      setInstitutionList([])
      return
    }
    if (query.isSuccess) setInstitutionList(query.data ?? [])
  }, [
    clearWhenDisabled,
    query.data,
    query.isError,
    query.isPending,
    query.isSuccess,
    remoteEnabled,
    setInstitutionList,
  ])

  const invalidateApplications = async () => {
    await queryClient.invalidateQueries({
      queryKey: trainedTeacherQueryKeys.organizationApplicationsProgram(programId ?? ''),
    })
  }

  return {
    remoteEnabled,
    applicationsLoading: query.isFetching,
    applicationsError: remoteEnabled ? query.error : null,
    isRemoteDataSource: remoteEnabled && query.isSuccess && !query.isError,
    unavailableReason:
      remoteEnabled && query.isError ? '교육받은 교사 기관 신청 목록을 불러오지 못했습니다.' : null,
    approveOrganization: (applicationId: string, payload?: OrganizationApplicationApprovePayload) =>
      approveTrainedTeacherOrganizationApplication(programId!, applicationId, payload),
    rejectOrganization: (applicationId: string, payload: ApplicationRejectRequest) =>
      rejectTrainedTeacherOrganizationApplication(programId!, applicationId, payload),
    cancelOrganizationApproval: (
      applicationId: string,
      payload: ApplicationDecisionCancelRequestWithNotification
    ) =>
      cancelTrainedTeacherOrganizationApplicationApproval(programId!, applicationId, payload),
    resendOrganizationNotification: (
      applicationId: string,
      payload: {
        timing: 'IMMEDIATE' | 'SCHEDULED'
        scheduledAt: string | null
        reason: string | null
      },
      idempotencyKey: string
    ) =>
      resendTrainedTeacherOrganizationApplicationNotification(
        programId!,
        applicationId,
        payload,
        idempotencyKey
      ),
    invalidateApplications,
  }
}
