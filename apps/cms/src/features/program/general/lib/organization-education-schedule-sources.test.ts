import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import {
  buildHopeEducationSessionsFromPreferred,
  buildOrganizationApplicationScheduleScopeKey,
  filterOrganizationScheduleAssignmentSlotsForDisplay,
  mapOrganizationScheduleAssignmentSlotsToAssignedSessions,
  readPreferredEducationSchedulesForScope,
  resolveParticipatingInstitutionApplicationScheduleSessions,
  resolveParticipatingInstitutionPreferredDisplaySessions,
  resolveParticipatingProgressAssignedSessions,
  resolveParticipatingSchoolHopeSessions,
} from './organization-education-schedule-sources'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'

describe('organization-education-schedule-sources', () => {
  it('detail schedule uses OSA assignment, then confirmed participant sessions', () => {
    const hope = [
      {
        round: 1,
        date: '2026.11.02',
        dayOfWeek: '월',
        duration: '-',
        format: '-',
        classNum: '1지망',
        timeRange: '09:30 ~ 11:30',
        scheduleUnresolved: true,
      },
    ]
    const confirmed = [
      {
        round: 1,
        date: '2026.11.13',
        dayOfWeek: '목',
        duration: '-',
        format: '-',
        classNum: '1회차',
        timeRange: '10:00 ~ 12:00',
      },
    ]
    expect(
      resolveParticipatingInstitutionApplicationScheduleSessions({
        isCompanySchool: false,
        isGeneralOrganization: true,
        assignedSessions: [],
        participantSessions: [...confirmed, ...hope],
      })
    ).toEqual(confirmed)
    expect(
      resolveParticipatingInstitutionApplicationScheduleSessions({
        isCompanySchool: false,
        isGeneralOrganization: true,
        assignedSessions: confirmed,
        participantSessions: hope,
      })
    ).toBe(confirmed)
    expect(resolveParticipatingProgressAssignedSessions([...confirmed, ...hope])).toEqual(confirmed)
  })

  it('resolveParticipatingSchoolHopeSessions prefers hopeEducationSessions over sessions', () => {
    const row: ParticipatingSchoolRow = {
      id: '1',
      no: 1,
      schoolName: 'A',
      region: '',
      educationGrade: '',
      classCount: 1,
      studentCount: 10,
      lectureRound: '4',
      textbookStatus: 'not_applicable',
      approvalStatus: 'approved',
      teacherName: '-',
      instructors: '',
      programId: '186234',
      organizationApplicationId: '1691001',
      hopeEducationSessions: [
        {
          round: 1,
          date: '2026.11.02',
          dayOfWeek: '월',
          duration: '-',
          format: '-',
          classNum: '1지망',
          timeRange: '09:30 ~ 11:30',
          status: 'pending',
        },
      ],
      sessions: [
        {
          round: 99,
          date: '2026.11.13',
          dayOfWeek: '목',
          duration: '-',
          format: '-',
          classNum: '99',
          timeRange: '-',
          status: 'pending',
          resolvedScheduleId: 186907,
        },
      ],
    }
    expect(resolveParticipatingSchoolHopeSessions(row)).toHaveLength(1)
    expect(resolveParticipatingSchoolHopeSessions(row)[0]?.round).toBe(1)
  })

  it('resolveParticipatingSchoolHopeSessions returns empty when scope programId mismatches', () => {
    const row: ParticipatingSchoolRow = {
      id: '1',
      no: 1,
      schoolName: 'A',
      region: '',
      educationGrade: '',
      classCount: 1,
      studentCount: 10,
      lectureRound: '1',
      textbookStatus: 'not_applicable',
      approvalStatus: 'approved',
      teacherName: '-',
      instructors: '',
      programId: '100',
      organizationApplicationId: '200',
      hopeEducationSessions: [
        {
          round: 1,
          date: 'x',
          dayOfWeek: '월',
          duration: '-',
          format: '-',
          classNum: '1',
          timeRange: '-',
        },
      ],
    }
    expect(
      resolveParticipatingSchoolHopeSessions(row, {
        programId: '999',
        organizationApplicationId: '200',
      })
    ).toEqual([])
  })

  it('preferred enrich map is isolated per programId + organizationApplicationId', () => {
    const map = new Map<string, ReturnType<typeof buildHopeEducationSessionsFromPreferred>>()
    const preferredA = buildHopeEducationSessionsFromPreferred([
      { scheduleId: null, round: 1, label: 'A-1' },
    ])
    const preferredB = buildHopeEducationSessionsFromPreferred([
      { scheduleId: null, round: 1, label: 'B-1' },
      { scheduleId: null, round: 2, label: 'B-2' },
    ])
    map.set(buildOrganizationApplicationScheduleScopeKey('186234', '1'), preferredA as never)
    map.set(buildOrganizationApplicationScheduleScopeKey('186234', '2'), preferredB as never)
    map.set(buildOrganizationApplicationScheduleScopeKey('186235', '1'), preferredB as never)

    expect(
      readPreferredEducationSchedulesForScope(map as never, {
        programId: '186234',
        organizationApplicationId: '1',
      })
    ).toHaveLength(1)
    expect(
      readPreferredEducationSchedulesForScope(map as never, {
        programId: '186234',
        organizationApplicationId: '2',
      })
    ).toHaveLength(2)
    expect(
      readPreferredEducationSchedulesForScope(map as never, {
        programId: '186235',
        organizationApplicationId: '1',
      })
    ).toHaveLength(2)
    expect(
      readPreferredEducationSchedulesForScope(map as never, {
        programId: '186234',
        organizationApplicationId: '99',
      })
    ).toHaveLength(0)
  })

  it('1사1교 참여 기관은 빈 sessions여도 preferred 희망 일정을 표시한다', () => {
    const preferred = [
      {
        scheduleId: null,
        round: 1,
        startAt: '2026-12-22T18:00:00Z',
        endAt: '2026-12-22T21:00:00Z',
        label: null,
        unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
        educationDate: '2026-12-23',
      },
      {
        scheduleId: null,
        round: 2,
        startAt: '2026-12-29T19:00:00Z',
        endAt: '2026-12-29T22:00:00Z',
        label: null,
        unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
        educationDate: '2026-12-30',
      },
    ]
    const row: ParticipatingSchoolRow = {
      id: '1695027',
      no: 1,
      schoolName: 'QA 제휴학교',
      region: '서울특별시 중구',
      educationGrade: '2학년',
      classCount: 3,
      studentCount: 24,
      lectureRound: '',
      textbookStatus: 'not_applicable',
      approvalStatus: 'approved',
      teacherName: '최지원',
      instructors: '',
      programId: '186473',
      organizationApplicationId: '1691546',
      sessions: undefined,
      preferredEducationSchedules: preferred,
      hopeEducationSessions: buildHopeEducationSessionsFromPreferred(preferred),
    }
    const display = resolveParticipatingInstitutionPreferredDisplaySessions(row)
    expect(display).toHaveLength(2)
    expect(display[0]?.date).toBe('2026.12.23')
    expect(display[0]?.timeRange).toBe('03:00 ~ 06:00')
    expect(display[1]?.date).toBe('2026.12.30')
    expect(
      resolveParticipatingInstitutionApplicationScheduleSessions({
        isCompanySchool: true,
        isGeneralOrganization: false,
        assignedSessions: [],
        participantSessions: [],
        hopeSessions: display,
      })
    ).toEqual(display)
  })

  it('maps OSA slots to assigned sessions for one organizationApplicationId only', () => {
    const slots: SlotResponse[] = [
      {
        scheduleId: 186905,
        organizationApplicationId: 100,
        programId: 186234,
        assignmentId: 1,
        assignmentStatus: 'CONFIRMED',
        active: true,
      },
      {
        scheduleId: 186904,
        organizationApplicationId: 200,
        programId: 186234,
        assignmentId: 2,
        assignmentStatus: 'CONFIRMED',
        active: true,
      },
    ]
    const schedules = [
      {
        id: 186905,
        sessionNo: 3,
        startAt: '2026-11-02T00:30:00Z',
        endAt: '2026-11-02T02:30:00Z',
        scheduleRole: 'EDUCATION',
      },
    ]
    const assigned = mapOrganizationScheduleAssignmentSlotsToAssignedSessions(
      slots,
      schedules,
      { programId: '186234', organizationApplicationId: '100' }
    )
    expect(assigned).toHaveLength(1)
    expect(assigned[0]?.resolvedScheduleId).toBe(186905)
    expect(assigned[0]?.osaAssignmentId).toBe(1)
  })

  it('filters cancelled and inactive OSA slots', () => {
    const slots: SlotResponse[] = [
      { scheduleId: 1, assignmentStatus: 'CONFIRMED', active: true, programId: 1, organizationApplicationId: 1 },
      { scheduleId: 2, assignmentStatus: 'CANCELLED', active: true, programId: 1, organizationApplicationId: 1 },
      { scheduleId: 3, assignmentStatus: 'CONFIRMED', active: false, programId: 1, organizationApplicationId: 1 },
    ]
    expect(
      filterOrganizationScheduleAssignmentSlotsForDisplay(slots, {
        programId: '1',
        organizationApplicationId: '1',
      })
    ).toHaveLength(1)
  })
})
