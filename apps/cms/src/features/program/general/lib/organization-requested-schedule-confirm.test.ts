import { describe, expect, it } from 'vitest'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import {
  buildRequestedScheduleConfirmOptions,
  hasConfirmedRequestedSchedule,
  initialRequestedScheduleConfirmSelection,
  shouldShowRequestedScheduleConfirmAction,
} from './organization-requested-schedule-confirm'
import {
  ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE,
  resolveOrganizationInstructorAssignmentScheduleTarget,
} from './organization-instructor-assignable-schedule'

// programId 186565 계남중학교 실데이터 형태
const rows: RequestedScheduleResponse[] = [
  {
    id: 185038,
    preferenceOrder: 2,
    requestedDate: '2026-11-09',
    startPeriod: null,
    sessionCount: 3,
    sessionTimes: [{ sessionOrder: 1, period: 1, startTime: '09:00:00', endTime: '10:00:00' }],
    resolvedScheduleId: null,
    resolvedScheduleIds: [],
  },
  {
    id: 185037,
    preferenceOrder: 1,
    requestedDate: '2026-11-08',
    startPeriod: null,
    sessionCount: 3,
    sessionTimes: [{ sessionOrder: 1, period: 1, startTime: '09:00:00', endTime: '10:00:00' }],
    resolvedScheduleId: null,
    resolvedScheduleIds: [],
  },
] as RequestedScheduleResponse[]

const now = new Date('2026-11-08T03:00:00Z') // 서울 12:00

describe('희망 일정 확정 (일반 기관 · 기간 지정)', () => {
  it('지난 희망 일정(11/08 09:00)은 목록에서 빼고 확정 여부를 표시한다', () => {
    const options = buildRequestedScheduleConfirmOptions(rows, now)
    expect(options.map(option => option.requestedScheduleId)).toEqual([185038])
    expect(options[0]).toMatchObject({ confirmed: false })
    expect(options[0]?.label).toContain('09:00 ~ 10:00')
    expect(options[0]?.label).toContain('2지망')
    expect(options[0]?.label).toContain('3차시')
    expect(hasConfirmedRequestedSchedule(options)).toBe(false)
    expect(initialRequestedScheduleConfirmSelection(options)).toEqual([])
  })

  it('확정된 행은 처음 선택 상태로 둔다', () => {
    const options = buildRequestedScheduleConfirmOptions(
      [
        { ...rows[0]!, resolvedScheduleId: 190002, resolvedScheduleIds: [190002] },
        { ...rows[1]!, resolvedScheduleId: 190001, resolvedScheduleIds: [190001] },
      ],
      now
    )
    expect(hasConfirmedRequestedSchedule(options)).toBe(true)
    expect(initialRequestedScheduleConfirmSelection(options)).toEqual([185038])
  })

  it('일반 기관 기간 지정에서만 확정 액션을 보인다', () => {
    const options = buildRequestedScheduleConfirmOptions(rows, now)
    const base = { isGeneralOrganization: true, isCompanySchool: false, options }
    expect(shouldShowRequestedScheduleConfirmAction({ ...base, educationScheduleMode: 'period' })).toBe(true)
    expect(shouldShowRequestedScheduleConfirmAction({ ...base, educationScheduleMode: 'date' })).toBe(false)
    expect(
      shouldShowRequestedScheduleConfirmAction({
        ...base,
        isCompanySchool: true,
        educationScheduleMode: 'period',
      })
    ).toBe(false)
    expect(
      shouldShowRequestedScheduleConfirmAction({
        ...base,
        options: [],
        educationScheduleMode: 'period',
      })
    ).toBe(false)
  })
})

describe('강사 배정 일정 대상', () => {
  it('일반 기관은 확정 일정 id로만 배정하고 requestedScheduleId 단독은 쓰지 않는다', () => {
    expect(
      resolveOrganizationInstructorAssignmentScheduleTarget({
        allowRequestedScheduleOnly: false,
        boardScheduleId: null,
        resolvedScheduleId: 190001,
        requestedScheduleId: 185038,
      })
    ).toEqual({ scheduleId: 190001, requestedScheduleId: 185038 })
    expect(
      resolveOrganizationInstructorAssignmentScheduleTarget({
        allowRequestedScheduleOnly: false,
        boardScheduleId: null,
        resolvedScheduleId: null,
        requestedScheduleId: 185038,
      })
    ).toBeNull()
    expect(ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE).toContain('희망 일정 확정')
  })

  it('board 매칭 일정이 있으면 우선한다', () => {
    expect(
      resolveOrganizationInstructorAssignmentScheduleTarget({
        allowRequestedScheduleOnly: false,
        boardScheduleId: 187141,
        resolvedScheduleId: 190001,
      })
    ).toEqual({ scheduleId: 187141 })
  })

  it('1사1교는 일정 id가 없으면 requestedScheduleId 단독 배정을 유지한다', () => {
    expect(
      resolveOrganizationInstructorAssignmentScheduleTarget({
        allowRequestedScheduleOnly: true,
        resolvedScheduleId: null,
        requestedScheduleId: 185038,
      })
    ).toEqual({ requestedScheduleId: 185038 })
  })
})
