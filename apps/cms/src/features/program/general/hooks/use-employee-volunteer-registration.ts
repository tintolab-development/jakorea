import { useCallback, useMemo, useState } from 'react'
import { MOCK_EMPLOYEE_VOLUNTEER_REGISTRATIONS } from '@/data/mock/employee-volunteer-registrations'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import {
  aggregateEmployeeVolunteerEducationMetrics,
  type EmployeeVolunteerInstitutionRegistration,
  type EmployeeVolunteerSessionCounts,
  upsertEmployeeVolunteerInstitutionRegistration,
} from '../lib/employee-volunteer-registration'
import { resolveEmployeeVolunteerSessionRows } from '../lib/employee-volunteer-session-rows'
import type { Program } from '@/types/domain'
import type { EmployeeVolunteerSessionRowId } from '../lib/employee-volunteer-session-rows'

export function useEmployeeVolunteerRegistration(
  program: Program | null | undefined,
  schools: ParticipatingSchoolRow[],
  volunteerList: ParticipatingVolunteerRow[]
) {
  const [registrations, setRegistrations] = useState<EmployeeVolunteerInstitutionRegistration[]>(
    () => [...MOCK_EMPLOYEE_VOLUNTEER_REGISTRATIONS]
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

  const saveRegistration = useCallback(
    (
      institutionId: string,
      countsBySessionId: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>>
    ) => {
      setRegistrations(prev =>
        upsertEmployeeVolunteerInstitutionRegistration(prev, institutionId, countsBySessionId)
      )
    },
    []
  )

  return {
    sessionRows,
    approvedInstitutionOptions,
    registrations,
    educationMetrics,
    saveRegistration,
  }
}
