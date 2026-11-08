import { describe, expect, it } from 'vitest'
import { mapOrganizationApplicationToApplicantSchoolRow } from './general-applications-adapters'
import { prepareGeneralEducationScheduleSessions } from '@/features/program/general/lib/participating-school-session-display'
import {
  ORGANIZATION_APPROVE_USE_REQUESTED_SCHEDULE_GUIDE,
  formatOrganizationApplicationApproveErrorMessage,
} from '@/features/program/general/lib/organization-application-approve-slots'
import { formatGeneralDetailSessionLine } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import { formatInstitutionCalendarSessionTimeDisplay } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-calendar-session'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas'

/** BE keonhee 로컬 programId=186565 (GENERAL_ORGANIZATION · PERIOD) 실제 응답 */
const CONFIRMED_1691636 = [
  { scheduleId: 187747, round: 1, startAt: '2026-11-08T14:10:00Z', endAt: '2026-11-08T14:59:00Z', label: '2026-11-08', unresolvedReason: null, scheduleIds: [187747], educationDate: '2026-11-08' },
  { scheduleId: 187748, round: 2, startAt: '2026-11-08T15:00:00Z', endAt: '2026-11-08T16:00:00Z', label: '2026-11-09', unresolvedReason: null, scheduleIds: [187748], educationDate: '2026-11-09' },
]
const UNRESOLVED_1691634 = [
  { scheduleId: null, round: 1, startAt: '2026-11-08T00:00:00Z', endAt: '2026-11-08T01:00:00Z', label: '2026-11-08', unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH', scheduleIds: [], educationDate: '2026-11-08' },
  { scheduleId: null, round: 2, startAt: '2026-11-09T00:00:00Z', endAt: '2026-11-09T01:00:00Z', label: '2026-11-09', unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH', scheduleIds: [], educationDate: '2026-11-09' },
]

const PERIOD_SHAPE = {
  educationStructure: 'schedule',
  sessionRound: 'single',
  educationScheduleMode: 'period',
} as const

function rowFor(preferred: unknown[]) {
  return mapOrganizationApplicationToApplicantSchoolRow(
    {
      id: 1,
      programType: 'GENERAL_ORGANIZATION',
      availableActions: [],
      sessions: [],
      preferredEducationSchedules: preferred,
    } as unknown as OrganizationApplicationListItemResponse,
    0,
    '186565'
  )
}

function displayLines(preferred: unknown[], detailScheduleTimeSpan = '10:00 ~ 12:00') {
  const sessions = prepareGeneralEducationScheduleSessions(rowFor(preferred).sessions ?? [], PERIOD_SHAPE, {
    detailScheduleTimeSpan,
  })
  return sessions.map(session => formatGeneralDetailSessionLine(session, null))
}

describe('일반 기관 PERIOD 진행 희망 교육 일정', () => {
  it('1691636 확정 2행: 서울 시각·educationDate, 2지망 00:00은 11/09, 프로그램 시간으로 덮지 않는다', () => {
    expect(displayLines(CONFIRMED_1691636)).toEqual([
      '2026.11.08(일) 23:10 ~ 23:59 | 확정',
      '2026.11.09(월) 00:00 ~ 01:00 | 확정',
    ])
  })

  it('1691634 미확정 2행: scheduleId null이어도 행이 사라지지 않고 미확정(희망)으로 표시한다', () => {
    const sessions = rowFor(UNRESOLVED_1691634).sessions ?? []
    expect(sessions).toHaveLength(2)
    expect(sessions.every(session => session.resolvedScheduleId == null)).toBe(true)
    expect(displayLines(UNRESOLVED_1691634)).toEqual([
      '2026.11.08(일) 09:00 ~ 10:00 | 미확정(희망)',
      '2026.11.09(월) 09:00 ~ 10:00 | 미확정(희망)',
    ])
    expect(displayLines(UNRESOLVED_1691634).join(' ')).not.toContain('NO_PROGRAM_DEFINED')
  })

  it('지망 순서(round)대로 그린다 — 2지망이 더 이른 날짜여도 순서를 바꾸지 않는다', () => {
    const reversedDates = [
      { ...UNRESOLVED_1691634[1], round: 1 },
      { ...UNRESOLVED_1691634[0], round: 2 },
    ]
    const sessions = rowFor([reversedDates[1], reversedDates[0]]).sessions ?? []
    expect(sessions.map(session => session.classNum)).toEqual(['1지망', '2지망'])
    expect(sessions.map(session => session.date)).toEqual(['2026.11.09', '2026.11.08'])
  })

  it('label(날짜뿐)을 시각보다 우선하지 않는다 — 캘린더 카드도 시각을 표시한다', () => {
    const sessions = rowFor(CONFIRMED_1691636).sessions ?? []
    expect(sessions.every(session => session.scheduleLabel == null)).toBe(true)
    expect(sessions.map(session => formatInstitutionCalendarSessionTimeDisplay(session))).not.toContain(
      '2026-11-08'
    )
  })

  it('PERIOD가 아닌 희망 행(일정 지정 line:N 라벨)은 확정 문구를 붙이지 않고 라벨을 유지한다', () => {
    const sessions =
      rowFor([
        {
          scheduleId: 501,
          round: 1,
          startAt: '2026-11-10T00:00:00Z',
          endAt: '2026-11-10T02:00:00Z',
          label: '26년 11월 10일(화) 09:00 ~ 11:00',
          educationDate: '2026-11-10',
        },
      ]).sessions ?? []
    expect(sessions[0]?.hopeScheduleConfirmed).toBeUndefined()
    expect(sessions[0]?.scheduleLabel).toBe('26년 11월 10일(화) 09:00 ~ 11:00')
    expect(formatGeneralDetailSessionLine(sessions[0]!, null)).not.toContain('확정')
  })
})

describe('PERIOD 승인 일정 검증 오류', () => {
  const apiError = (code: string, message: string) => ({
    isAxiosError: true,
    response: { status: 400, data: { error: { code, message } } },
  })

  it.each([
    'ORGANIZATION_APPROVE_PREFERRED_SCHEDULE_REQUIRED',
    'ORGANIZATION_APPROVE_SCHEDULE_NOT_REQUESTED',
  ])('%s: 서버 메시지 + 희망 일정 행 확정 안내', code => {
    const message = formatOrganizationApplicationApproveErrorMessage(apiError(code, '서버 안내 문구입니다.'))
    expect(message).toContain(ORGANIZATION_APPROVE_USE_REQUESTED_SCHEDULE_GUIDE)
  })
})
