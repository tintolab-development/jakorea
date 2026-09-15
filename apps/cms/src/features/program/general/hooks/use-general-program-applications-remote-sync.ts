import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveGeneralIndividualApplication,
  approveGeneralInstructorApplication,
  approveGeneralOrganizationApplication,
  fetchGeneralIndividualApplications,
  fetchGeneralInstructorApplications,
  fetchGeneralOrganizationApplications,
  rejectGeneralIndividualApplication,
  rejectGeneralInstructorApplication,
  rejectGeneralOrganizationApplication,
  submitGeneralIndividualDocumentResult,
} from '@/features/program/general/api/admin-applications-service'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useApplicationsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { ApplicantListMenu } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-list-menu'

type UseGeneralProgramApplicationsRemoteSyncOptions = {
  programId?: string
  menu: ApplicantListMenu | ''
  usesProgramInstitutionApplications: boolean
  instructorColumnPreset: string
  individualScreeningStage?: 'doc1'
  /** 참여자 mock 프로그램 — 강사 목록도 remote 비활성 */
  preferApplicationListMock?: boolean
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
  preferApplicationListMock = false,
  setInstitutionList,
  setInstructorList,
  setIndividualList,
}: UseGeneralProgramApplicationsRemoteSyncOptions) {
  const queryClient = useQueryClient()
  const surfaceRemoteEnabled = useApplicationsRemoteEnabledForSurface(programId)
  /** 기관 신청은 기존 remote 유지 — 강사만 참여자 mock 프로그램에서 FE mock */
  const instructorRemoteEnabled = surfaceRemoteEnabled && !preferApplicationListMock
  const remoteEnabled = surfaceRemoteEnabled

  const organizationQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.organizationList(programId ?? ''),
    queryFn: () => fetchGeneralOrganizationApplications(programId!),
    enabled:
      remoteEnabled && menu === 'institutions' && usesProgramInstitutionApplications,
    staleTime: 30_000,
    retry: false,
  })

  const instructorQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.instructorList(programId ?? ''),
    queryFn: () => fetchGeneralInstructorApplications(programId!),
    enabled:
      instructorRemoteEnabled &&
      menu === 'instructors' &&
      instructorColumnPreset === 'general-detail',
    staleTime: 30_000,
    retry: false,
  })

  const individualQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.individualList(programId ?? '', individualScreeningStage ?? null),
    queryFn: () =>
      fetchGeneralIndividualApplications(programId!, {
        doc1: individualScreeningStage === 'doc1',
      }),
    /** 1차 서류 심사 대상자는 mock 고정 목록 — remote 신청 목록과 분리 */
    enabled:
      remoteEnabled &&
      !preferApplicationListMock &&
      menu === 'individual-applications' &&
      individualScreeningStage !== 'doc1',
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (organizationQuery.data) setInstitutionList(organizationQuery.data)
  }, [organizationQuery.data, setInstitutionList])

  useEffect(() => {
    if (instructorQuery.data) setInstructorList(instructorQuery.data)
  }, [instructorQuery.data, setInstructorList])

  useEffect(() => {
    if (individualQuery.data) setIndividualList(individualQuery.data)
  }, [individualQuery.data, setIndividualList])

  const invalidateApplications = async () => {
    await queryClient.invalidateQueries({ queryKey: generalApplicationsQueryKeys.all })
  }

  return {
    remoteEnabled,
    /** 강사 목록 승인/반려 — mock 프로그램에서는 false */
    instructorRemoteEnabled,
    applicationsLoading:
      (organizationQuery.isEnabled &&
        (organizationQuery.isPending || organizationQuery.isFetching)) ||
      (instructorQuery.isEnabled &&
        (instructorQuery.isPending || instructorQuery.isFetching)) ||
      (individualQuery.isEnabled &&
        (individualQuery.isPending || individualQuery.isFetching)),
    approveOrganization: approveGeneralOrganizationApplication,
    rejectOrganization: rejectGeneralOrganizationApplication,
    approveInstructor: approveGeneralInstructorApplication,
    rejectInstructor: rejectGeneralInstructorApplication,
    approveIndividual: approveGeneralIndividualApplication,
    rejectIndividual: rejectGeneralIndividualApplication,
    submitIndividualDocumentResult: submitGeneralIndividualDocumentResult,
    invalidateApplications,
  }
}
