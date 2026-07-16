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
  const remoteEnabled = useApplicationsRemoteEnabledForSurface(programId)

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
    enabled: remoteEnabled && menu === 'instructors' && instructorColumnPreset === 'general-detail',
    staleTime: 30_000,
    retry: false,
  })

  const individualQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.individualList(programId ?? '', individualScreeningStage ?? null),
    queryFn: () =>
      fetchGeneralIndividualApplications(programId!, {
        doc1: individualScreeningStage === 'doc1',
      }),
    enabled: remoteEnabled && menu === 'individual-applications',
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
    applicationsLoading:
      organizationQuery.isFetching || instructorQuery.isFetching || individualQuery.isFetching,
    approveOrganization: approveGeneralOrganizationApplication,
    rejectOrganization: rejectGeneralOrganizationApplication,
    approveInstructor: approveGeneralInstructorApplication,
    rejectInstructor: rejectGeneralInstructorApplication,
    approveIndividual: approveGeneralIndividualApplication,
    rejectIndividual: rejectGeneralIndividualApplication,
    invalidateApplications,
  }
}
