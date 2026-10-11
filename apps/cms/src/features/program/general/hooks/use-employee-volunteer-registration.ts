import { useCallback, useMemo, useState } from 'react'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import {
  aggregateEmployeeVolunteerEducationMetrics,
  type EmployeeVolunteerInstitutionRegistration,
  type EmployeeVolunteerSessionCounts,
  upsertEmployeeVolunteerInstitutionRegistration,
} from '../lib/employee-volunteer-registration'
import { resolveEmployeeVolunteerSessionRows } from '../lib/employee-volunteer-session-rows'
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

export type UseEmployeeVolunteerRegistrationOptions = {
  programId?: string
  remoteEnabled?: boolean
}

export function useEmployeeVolunteerRegistration(
  program: Program | null | undefined,
  schools: ParticipatingSchoolRow[],
  volunteerList: ParticipatingVolunteerRow[],
  options?: UseEmployeeVolunteerRegistrationOptions
) {
  const [registrations, setRegistrations] = useState<EmployeeVolunteerInstitutionRegistration[]>(
    () => []
  )

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

  const institutionIdToName = useMemo(
    () => new Map(schools.map(school => [school.id, school.schoolName])),
    [schools]
  )

  const educationMetrics = useMemo(
    () =>
      aggregateEmployeeVolunteerEducationMetrics({
        sessionRows,
        registrations,
        volunteerList,
        institutionIdToName,
      }),
    [institutionIdToName, registrations, sessionRows, volunteerList]
  )

  const resolveOrganizationApplicationId = useCallback(
    (institutionId: string): number | undefined => {
      const school = schools.find(row => row.id === institutionId)
      const raw = school?.organizationApplicationId?.trim()
      if (!raw) return undefined
      const parsed = Number.parseInt(raw, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
    },
    [schools]
  )

  const loadRegistrationForInstitution = useCallback(
    async (institutionId: string) => {
      if (!options?.remoteEnabled || !options.programId) return

      const organizationApplicationId = resolveOrganizationApplicationId(institutionId)
      const [countsResponse, scheduleBundle] = await Promise.all([
        fetchGeneralEmployeeVolunteerCounts(options.programId, organizationApplicationId),
        fetchGeneralProgressAttendanceBundle(options.programId),
      ])

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

  const saveRegistration = useCallback(
    async (
      institutionId: string,
      countsBySessionId: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>>
    ) => {
      if (options?.remoteEnabled && options.programId) {
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
        return
      }

      setRegistrations(prev =>
        upsertEmployeeVolunteerInstitutionRegistration(prev, institutionId, countsBySessionId)
      )
    },
    [
      loadRegistrationForInstitution,
      options?.programId,
      options?.remoteEnabled,
      resolveOrganizationApplicationId,
      sessionRows,
    ]
  )

  return {
    sessionRows,
    approvedInstitutionOptions,
    registrations,
    educationMetrics,
    saveRegistration,
    loadRegistrationForInstitution,
  }
}
