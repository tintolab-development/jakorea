import { useCallback, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import {
  EMPLOYEE_VOLUNTEER_INDIVIDUAL_PROGRAM_REGISTRATION_ID,
  isEmployeeVolunteerIndividualProgramScope,
  type EmployeeVolunteerInstitutionRegistration,
  type EmployeeVolunteerSessionCounts,
  upsertEmployeeVolunteerInstitutionRegistration,
} from '../lib/employee-volunteer-registration'
import {
  resolveEmployeeVolunteerSessionRows,
  resolveEmployeeVolunteerSessionRowsForInstitution,
} from '../lib/employee-volunteer-session-rows'
import type { Program } from '@/types/domain'
import type { EmployeeVolunteerSessionRowId } from '../lib/employee-volunteer-session-rows'
import {
  buildEmployeeVolunteerCountsPutRequest,
  mapEmployeeVolunteerCountsGetToSessionCounts,
} from '../lib/employee-volunteer-counts-remote'
import {
  fetchGeneralEmployeeVolunteerCounts,
  fetchGeneralProgressAttendanceBundle,
  saveGeneralEmployeeVolunteerCounts,
} from '../api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '../api/general-applications-query-keys'
import { generalProgramQueryKeys } from '../api/general-program-query-keys'
import { isGeneralIndividualProgram } from '../lib/survey-audience'
import { performanceQueryKeys } from '@/features/education-record/api/performance-query-keys'

export type UseEmployeeVolunteerRegistrationOptions = {
  programId?: string
  remoteEnabled?: boolean
}

export function useEmployeeVolunteerRegistration(
  program: Program | null | undefined,
  schools: ParticipatingSchoolRow[],
  _volunteerList: ParticipatingVolunteerRow[],
  options?: UseEmployeeVolunteerRegistrationOptions
) {
  const queryClient = useQueryClient()
  const [registrations, setRegistrations] = useState<EmployeeVolunteerInstitutionRegistration[]>(
    () => []
  )
  const loadRequestSeqRef = useRef(0)

  const isIndividualProgram = Boolean(program && isGeneralIndividualProgram(program))

  const sessionRows = useMemo(
    () => (program ? resolveEmployeeVolunteerSessionRows(program) : []),
    [program]
  )

  const approvedInstitutionOptions = useMemo(
    () =>
      schools
        .filter(school => school.approvalStatus === 'approved')
        .map(school => ({
          value: school.id,
          label: school.schoolName,
        })),
    [schools]
  )

  const resolveOrganizationApplicationId = useCallback(
    (institutionId: string): number | undefined => {
      if (isEmployeeVolunteerIndividualProgramScope(institutionId)) return undefined
      const school = schools.find(row => row.id === institutionId)
      const raw = school?.organizationApplicationId?.trim()
      if (!raw) return undefined
      const parsed = Number.parseInt(raw, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
    },
    [schools]
  )

  const invalidateCachesAfterSave = useCallback(
    async (programId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.schedules(programId),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.detail(programId),
        }),
        queryClient.invalidateQueries({
          queryKey: performanceQueryKeys.all,
        }),
      ])
    },
    [queryClient]
  )

  const loadRegistrationForInstitution = useCallback(
    async (institutionId: string) => {
      if (!options?.remoteEnabled || !options.programId) return

      const requestSeq = loadRequestSeqRef.current + 1
      loadRequestSeqRef.current = requestSeq

      const organizationApplicationId = resolveOrganizationApplicationId(institutionId)
      const [countsResponse, scheduleBundle] = await Promise.all([
        fetchGeneralEmployeeVolunteerCounts(options.programId, organizationApplicationId),
        fetchGeneralProgressAttendanceBundle(options.programId),
      ])

      if (loadRequestSeqRef.current !== requestSeq) return

      const countsBySessionId = mapEmployeeVolunteerCountsGetToSessionCounts(
        sessionRows,
        scheduleBundle.schedules,
        countsResponse.entries
      )

      setRegistrations(prev =>
        upsertEmployeeVolunteerInstitutionRegistration(prev, institutionId, countsBySessionId)
      )
    },
    [options?.programId, options?.remoteEnabled, resolveOrganizationApplicationId, sessionRows]
  )

  const loadIndividualProgramRegistration = useCallback(async () => {
    await loadRegistrationForInstitution(EMPLOYEE_VOLUNTEER_INDIVIDUAL_PROGRAM_REGISTRATION_ID)
  }, [loadRegistrationForInstitution])

  const saveRegistration = useCallback(
    async (
      institutionId: string,
      countsBySessionId: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>>
    ) => {
      if (!options?.remoteEnabled || !options.programId) {
        throw new Error(
          '프로그램 진행현황 API가 활성화되지 않아 임직원 자원봉사자 수를 저장할 수 없습니다.'
        )
      }

      const organizationApplicationId = resolveOrganizationApplicationId(institutionId)
      const scheduleBundle = await fetchGeneralProgressAttendanceBundle(options.programId)
      const previous = await fetchGeneralEmployeeVolunteerCounts(
        options.programId,
        organizationApplicationId
      )
      const payload = buildEmployeeVolunteerCountsPutRequest({
        organizationApplicationId,
        sessionRows,
        schedules: scheduleBundle.schedules,
        countsBySessionId,
        previousEntries: previous.entries,
      })
      await saveGeneralEmployeeVolunteerCounts(options.programId, payload)
      await loadRegistrationForInstitution(institutionId)
      await invalidateCachesAfterSave(options.programId)
    },
    [
      invalidateCachesAfterSave,
      loadRegistrationForInstitution,
      options?.programId,
      options?.remoteEnabled,
      resolveOrganizationApplicationId,
      sessionRows,
    ]
  )

  const resolveSessionRowsForInstitution = useCallback(
    (institutionId?: string) => {
      if (!program || isIndividualProgram || !institutionId) {
        return sessionRows
      }
      const school = schools.find(row => row.id === institutionId)
      return resolveEmployeeVolunteerSessionRowsForInstitution(program, school)
    },
    [isIndividualProgram, program, schools, sessionRows]
  )

  return {
    sessionRows,
    resolveSessionRowsForInstitution,
    approvedInstitutionOptions,
    registrations,
    isIndividualProgram,
    individualProgramRegistrationScopeId: EMPLOYEE_VOLUNTEER_INDIVIDUAL_PROGRAM_REGISTRATION_ID,
    saveRegistration,
    loadRegistrationForInstitution,
    loadIndividualProgramRegistration,
  }
}
