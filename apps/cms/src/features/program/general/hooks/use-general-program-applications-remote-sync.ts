import { useEffect } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveGeneralIndividualApplication,
  approveGeneralInstructorApplication,
  approveGeneralOrganizationApplication,
  bulkApproveGeneralInstructorApplications,
  bulkApproveGeneralOrganizationApplications,
  bulkRejectGeneralInstructorApplications,
  bulkRejectGeneralOrganizationApplications,
  cancelGeneralOrganizationApplicationApproval,
  cancelGeneralOrganizationApplicationRejection,
  fetchGeneralIndividualApplicationsPage,
  fetchGeneralInstructorApplicationsPage,
  fetchGeneralOrganizationApplicationsPage,
  rejectGeneralIndividualApplication,
  rejectGeneralInstructorApplication,
  rejectGeneralOrganizationApplication,
  submitGeneralIndividualDocumentResult,
} from '@/features/program/general/api/admin-applications-service'
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

  const organizationQuery = useInfiniteQuery({
    queryKey: generalApplicationsQueryKeys.organizationList(programId ?? ''),
    queryFn: ({ pageParam }) =>
      fetchGeneralOrganizationApplicationsPage(programId!, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled:
      remoteEnabled && menu === 'institutions' && usesProgramInstitutionApplications,
    staleTime: 30_000,
    retry: false,
  })

  const instructorQuery = useInfiniteQuery({
    queryKey: generalApplicationsQueryKeys.instructorList(programId ?? ''),
    queryFn: ({ pageParam }) =>
      fetchGeneralInstructorApplicationsPage(programId!, { page: pageParam }),
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
      individualScreeningStage ?? null
    ),
    queryFn: ({ pageParam }) =>
      fetchGeneralIndividualApplicationsPage(programId!, {
        doc1: individualScreeningStage === 'doc1',
        query: { page: pageParam },
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled:
      individualRemoteEnabled && menu === 'individual-applications',
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (organizationQuery.data) {
      setInstitutionList(organizationQuery.data.pages.flatMap(page => page.rows))
    }
  }, [organizationQuery.data, setInstitutionList])

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
    approveIndividual: approveGeneralIndividualApplication,
    rejectIndividual: rejectGeneralIndividualApplication,
    submitIndividualDocumentResult: submitGeneralIndividualDocumentResult,
    invalidateApplications,
    invalidateIndividualApplications,
  }
}
