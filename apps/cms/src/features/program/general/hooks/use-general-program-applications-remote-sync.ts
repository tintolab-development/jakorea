import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveGeneralIndividualApplication,
  approveGeneralInstructorApplication,
  approveGeneralOrganizationApplication,
  bulkApproveGeneralInstructorApplications,
  bulkRejectGeneralInstructorApplications,
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
import {
  getApplicantInstructorsByProgramId,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { ApplicantListMenu } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-list-menu'
import { getGeneralInstitutionApplicationsForProgram } from '@/features/program/general/lib/institution-applications-mock'
import { isGeneralInstitutionCaseProgramId } from '@/features/program/general/lib/general-institution-case-roster'

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
  /** FE 시드만 mock. 실제 등록 프로그램은 유형·면접 단계와 무관하게 remote. */
  const instructorRemoteEnabled = surfaceRemoteEnabled && !preferApplicationListMock
  const individualRemoteEnabled = surfaceRemoteEnabled && !preferApplicationListMock
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
    queryKey: generalApplicationsQueryKeys.individualList(
      programId ?? '',
      individualScreeningStage ?? null
    ),
    queryFn: () =>
      fetchGeneralIndividualApplications(programId!, {
        doc1: individualScreeningStage === 'doc1',
      }),
    enabled:
      individualRemoteEnabled && menu === 'individual-applications',
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    if (organizationQuery.data) setInstitutionList(organizationQuery.data)
  }, [organizationQuery.data, setInstitutionList])

  useEffect(() => {
    if (remoteEnabled || menu !== 'institutions' || !usesProgramInstitutionApplications) return
    if (!isGeneralInstitutionCaseProgramId(programId)) return
    setInstitutionList(getGeneralInstitutionApplicationsForProgram(programId))
  }, [
    menu,
    programId,
    remoteEnabled,
    setInstitutionList,
    usesProgramInstitutionApplications,
  ])

  useEffect(() => {
    if (instructorQuery.data) setInstructorList(instructorQuery.data)
  }, [instructorQuery.data, setInstructorList])

  useEffect(() => {
    if (
      instructorRemoteEnabled ||
      menu !== 'instructors' ||
      instructorColumnPreset !== 'general-detail'
    ) {
      return
    }
    if (!isGeneralInstitutionCaseProgramId(programId)) return
    setInstructorList(getApplicantInstructorsByProgramId(programId))
  }, [
    instructorColumnPreset,
    instructorRemoteEnabled,
    menu,
    programId,
    setInstructorList,
  ])

  useEffect(() => {
    if (!individualRemoteEnabled || menu !== 'individual-applications') return
    setIndividualList(individualQuery.data ?? [])
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
      queryKey: generalApplicationsQueryKeys.individualScope(programId),
    })
  }

  return {
    remoteEnabled,
    /** 강사 목록 승인/반려 — mock 프로그램에서는 false */
    instructorRemoteEnabled,
    /** 참여자 목록·승인·반려 — FE 시드는 false, 실제 프로그램은 true */
    individualRemoteEnabled,
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
    bulkApproveInstructor: bulkApproveGeneralInstructorApplications,
    bulkRejectInstructor: bulkRejectGeneralInstructorApplications,
    approveIndividual: approveGeneralIndividualApplication,
    rejectIndividual: rejectGeneralIndividualApplication,
    submitIndividualDocumentResult: submitGeneralIndividualDocumentResult,
    invalidateApplications,
    invalidateIndividualApplications,
  }
}
