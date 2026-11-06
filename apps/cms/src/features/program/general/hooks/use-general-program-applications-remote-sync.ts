import { useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveGeneralIndividualApplication,
  approveGeneralIndividualApplicationWithEducationScope,
  bulkApproveGeneralIndividualApplicationsWithEducationScope,
  approveGeneralInstructorApplication,
  approveGeneralOrganizationApplication,
  bulkApproveGeneralInstructorApplications,
  bulkApproveGeneralOrganizationApplications,
  bulkRejectGeneralInstructorApplications,
  bulkRejectGeneralOrganizationApplications,
  cancelGeneralIndividualApplicationApproval,
  cancelGeneralIndividualApplicationRejection,
  cancelGeneralInstructorApplicationApproval,
  cancelGeneralInstructorApplicationRejection,
  cancelGeneralOrganizationApplicationApproval,
  cancelGeneralOrganizationApplicationRejection,
  fetchGeneralIndividualApplicationsPage,
  fetchGeneralInstructorApplicationsPage,
  fetchGeneralOrganizationApplicationsPage,
  rejectGeneralIndividualApplication,
  bulkRejectGeneralIndividualApplications,
  rejectGeneralInstructorApplication,
  rejectGeneralOrganizationApplication,
  resendGeneralInstructorApplicationNotification,
  resendGeneralOrganizationApplicationNotification,
  submitGeneralIndividualDocumentResult,
  submitGeneralIndividualDocumentResultBulk,
} from '@/features/program/general/api/admin-applications-service'
import {
  buildGeneralIndividualApplicationsApiQuery,
  buildGeneralInstructorApplicationsApiQuery,
  buildGeneralOrganizationApplicationsApiQuery,
  serializeApplicationsApiQuery,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useApplicationsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { type ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ApplicantListMenu } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-list-menu'

type UseGeneralProgramApplicationsRemoteSyncOptions = {
  programId?: string
  menu: ApplicantListMenu | ''
  usesProgramInstitutionApplications: boolean
  instructorColumnPreset: string
  individualScreeningStage?: 'doc1'
  /** 조회(apply) 이후 필터. statusGroup=APPLICATION_REJECTED 등 서버 query에 포함 */
  listFilters?: Record<string, unknown>
  setInstitutionList: (rows: ApplicantSchoolRow[]) => void
  setInstructorList: (rows: ApplicantInstructorRow[]) => void
  setIndividualList: (rows: GeneralIndividualApplicantRow[]) => void
}

export function useGeneralProgramApplicationsRemoteSync({
  programId,
  menu,
  usesProgramInstitutionApplications,
  instructorColumnPreset,
  individualScreeningStage,
  listFilters = {},
  setInstitutionList,
  setInstructorList,
  setIndividualList,
}: UseGeneralProgramApplicationsRemoteSyncOptions) {
  const queryClient = useQueryClient()
  const surfaceRemoteEnabled = useApplicationsRemoteEnabledForSurface(programId)
  /** FE 시드만 mock. 실제 등록 프로그램은 유형·면접 단계와 무관하게 remote. */
  const instructorRemoteEnabled = surfaceRemoteEnabled
  const individualRemoteEnabled = surfaceRemoteEnabled
  const remoteEnabled = surfaceRemoteEnabled

  const organizationApplicationsForInstructorCalendar =
    menu === 'instructors' && instructorColumnPreset === 'general-detail'

  const organizationApiQuery = useMemo(
    () => buildGeneralOrganizationApplicationsApiQuery(listFilters),
    [listFilters]
  )
  const instructorApiQuery = useMemo(
    () => buildGeneralInstructorApplicationsApiQuery(listFilters),
    [listFilters]
  )
  const individualApiQuery = useMemo(
    () => buildGeneralIndividualApplicationsApiQuery(listFilters),
    [listFilters]
  )

  const organizationQuery = useInfiniteQuery({
    queryKey: generalApplicationsQueryKeys.organizationList(
      programId ?? '',
      serializeApplicationsApiQuery(organizationApiQuery)
    ),
    queryFn: ({ pageParam }) =>
      fetchGeneralOrganizationApplicationsPage(programId!, { queryClient }, {
        page: pageParam,
        ...organizationApiQuery,
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled:
      remoteEnabled &&
      usesProgramInstitutionApplications &&
      (menu === 'institutions' || organizationApplicationsForInstructorCalendar),
    staleTime: 30_000,
    retry: false,
  })

  const instructorQuery = useInfiniteQuery({
    queryKey: generalApplicationsQueryKeys.instructorList(
      programId ?? '',
      serializeApplicationsApiQuery(instructorApiQuery)
    ),
    queryFn: ({ pageParam }) =>
      fetchGeneralInstructorApplicationsPage(programId!, {
        page: pageParam,
        ...instructorApiQuery,
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled:
      instructorRemoteEnabled &&
      menu === 'instructors' &&
      instructorColumnPreset === 'general-detail',
    staleTime: 30_000,
    retry: false,
  })

  const individualQuery = useInfiniteQuery({
    queryKey: generalApplicationsQueryKeys.individualList(
      programId ?? '',
      `${individualScreeningStage ?? 'all'}:${serializeApplicationsApiQuery(individualApiQuery)}`
    ),
    queryFn: ({ pageParam }) =>
      fetchGeneralIndividualApplicationsPage(programId!, {
        doc1: individualScreeningStage === 'doc1',
        query: { page: pageParam, ...individualApiQuery },
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: individualRemoteEnabled && menu === 'individual-applications',
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    // 교육받은 교사 화면에서는 전용 query가 기관 신청 목록의 유일한 원천이다.
    // 비활성화된 generic query의 캐시를 로컬 목록에 복사하지 않는다.
    if (!remoteEnabled || !organizationQuery.data) return
    setInstitutionList(organizationQuery.data.pages.flatMap(page => page.rows))
  }, [organizationQuery.data, remoteEnabled, setInstitutionList])

  useEffect(() => {
    if (instructorQuery.data) {
      setInstructorList(instructorQuery.data.pages.flatMap(page => page.rows))
    }
  }, [instructorQuery.data, setInstructorList])

  useEffect(() => {
    if (!individualRemoteEnabled || menu !== 'individual-applications') return
    setIndividualList(individualQuery.data?.pages.flatMap(page => page.rows) ?? [])
  }, [
    individualQuery.data,
    individualRemoteEnabled,
    individualScreeningStage,
    menu,
    programId,
    setIndividualList,
  ])

  const invalidateApplications = async () => {
    await queryClient.invalidateQueries({ queryKey: generalApplicationsQueryKeys.all })
  }

  const invalidateIndividualApplications = async () => {
    if (!programId) return
    await queryClient.invalidateQueries({
      queryKey: generalApplicationsQueryKeys.individualLists(programId),
    })
  }

  const activeQuery =
    menu === 'institutions'
      ? organizationQuery
      : menu === 'instructors'
        ? instructorQuery
        : individualQuery

  return {
    remoteEnabled,
    /** 강사 목록 승인/반려 — mock 프로그램에서는 false */
    instructorRemoteEnabled,
    /** 참여자 목록·승인·반려 — FE 시드는 false, 실제 프로그램은 true */
    individualRemoteEnabled,
    applicationsLoading:
      (organizationQuery.isEnabled &&
        (organizationQuery.isPending ||
          (organizationQuery.isFetching && organizationQuery.data === undefined))) ||
      (instructorQuery.isEnabled &&
        (instructorQuery.isPending ||
          (instructorQuery.isFetching && instructorQuery.data === undefined))) ||
      (individualQuery.isEnabled &&
        (individualQuery.isPending ||
          (individualQuery.isFetching && individualQuery.data === undefined))),
    hasNextPage: activeQuery.hasNextPage ?? false,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    fetchNextPage: activeQuery.fetchNextPage,
    approveOrganization: approveGeneralOrganizationApplication,
    rejectOrganization: rejectGeneralOrganizationApplication,
    cancelOrganizationApproval: cancelGeneralOrganizationApplicationApproval,
    cancelOrganizationRejection: cancelGeneralOrganizationApplicationRejection,
    bulkApproveOrganization: bulkApproveGeneralOrganizationApplications,
    bulkRejectOrganization: bulkRejectGeneralOrganizationApplications,
    approveInstructor: approveGeneralInstructorApplication,
    rejectInstructor: rejectGeneralInstructorApplication,
    bulkApproveInstructor: bulkApproveGeneralInstructorApplications,
    bulkRejectInstructor: bulkRejectGeneralInstructorApplications,
    cancelInstructorApproval: cancelGeneralInstructorApplicationApproval,
    cancelInstructorRejection: cancelGeneralInstructorApplicationRejection,
    resendInstructorNotification: resendGeneralInstructorApplicationNotification,
    resendOrganizationNotification: resendGeneralOrganizationApplicationNotification,
    approveIndividual: approveGeneralIndividualApplication,
    approveIndividualWithEducationScope: approveGeneralIndividualApplicationWithEducationScope,
    bulkApproveIndividualWithEducationScope:
      bulkApproveGeneralIndividualApplicationsWithEducationScope,
    rejectIndividual: rejectGeneralIndividualApplication,
    bulkRejectIndividual: bulkRejectGeneralIndividualApplications,
    cancelIndividualApproval: cancelGeneralIndividualApplicationApproval,
    cancelIndividualRejection: cancelGeneralIndividualApplicationRejection,
    submitIndividualDocumentResult: submitGeneralIndividualDocumentResult,
    submitIndividualDocumentResultBulk: submitGeneralIndividualDocumentResultBulk,
    invalidateApplications,
    invalidateIndividualApplications,
  }
}
