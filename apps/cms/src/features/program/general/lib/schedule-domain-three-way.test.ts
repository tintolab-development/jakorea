import { describe, expect, it } from 'vitest'
import { mapPreferredEducationSchedulesToSessions } from '@/features/program/general/api/adapters/general-applications-adapters'
import { resolveOrganizationApproveScheduleOptionsFromPreferred } from '@/features/program/general/lib/organization-application-approve-slots'
import {
  mapOrganizationScheduleAssignmentSlotsToAssignedSessions,
  resolveParticipatingSchoolHopeSessions,
} from '@/features/program/general/lib/organization-education-schedule-sources'
import { resolvePlannedEducationSlotsFromCaches } from '@/features/program/general/lib/program-planned-education-slots'
import { buildSurveyPollScheduleSelectOptions } from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import {
  buildHopeSchedulesFixtureA,
  buildOsaSlotsFixtureA,
  buildPhysicalSchedulesWithMaterializedFixture,
  buildPlannedEducationSlotsFixture,
  THREE_WAY_PROGRAM_ID,
} from '@/features/program/general/lib/schedule-domain-three-way.fixture'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'

describe('schedule domain three-way integration', () => {
  const plannedSchedules = resolvePlannedEducationSlotsFromCaches({
    educationSlots: buildPlannedEducationSlotsFixture(),
    programSchedules: buildPhysicalSchedulesWithMaterializedFixture(),
  })

  it('planned slot count is 4 while physical schedules are 5+', () => {
    expect(buildPlannedEducationSlotsFixture()).toHaveLength(4)
    expect(buildPhysicalSchedulesWithMaterializedFixture().length).toBeGreaterThan(4)
    expect(plannedSchedules).toHaveLength(4)
  })

  it('survey options are subset of planned scheduleIds', () => {
    const options = buildSurveyPollScheduleSelectOptions(plannedSchedules)
    const plannedIds = new Set(plannedSchedules.map(s => s.id))
    for (const option of options) {
      expect(plannedIds.has(Number(option.value))).toBe(true)
    }
    expect(options.length).toBeGreaterThan(0)
  })

  it('hope A (4) unchanged when OSA assigns 1', () => {
    const preferred = buildHopeSchedulesFixtureA()
    const hopeFromPreferred = mapPreferredEducationSchedulesToSessions(preferred)
    expect(hopeFromPreferred).toHaveLength(4)

    const row = {
      id: 'school-1',
      hopeEducationSessions: hopeFromPreferred,
      preferredEducationSchedules: preferred,
    } as ParticipatingSchoolRow

    const hopeDisplay = resolveParticipatingSchoolHopeSessions(row, {
      programId: THREE_WAY_PROGRAM_ID,
      organizationApplicationId: '1001',
    })
    expect(hopeDisplay).toHaveLength(4)

    const assigned = mapOrganizationScheduleAssignmentSlotsToAssignedSessions(
      buildOsaSlotsFixtureA(),
      buildPhysicalSchedulesWithMaterializedFixture(),
      { programId: THREE_WAY_PROGRAM_ID, organizationApplicationId: '1001' }
    )
    expect(assigned).toHaveLength(1)
    expect(hopeDisplay).toHaveLength(4)
  })

  it('approve options cross-check against planned schedules only', () => {
    const validation = resolveOrganizationApproveScheduleOptionsFromPreferred(
      buildHopeSchedulesFixtureA(),
      plannedSchedules
    )
    expect(validation.options.length).toBe(4)
    expect(validation.invalidReason).toBeNull()
  })
})
