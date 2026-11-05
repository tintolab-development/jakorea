import { describe, expect, it } from 'vitest'
import {
  filterVisibleAssignmentVolunteers,
  formatAssignmentRemarks,
  isAssignmentLogViewEnabled,
  isAssignmentPlanViewEnabled,
  resolveAssignmentSubmissionStatus,
} from './assignment-display'
import {
  buildUjatAssignmentSessionsFromResponse,
  formatAssignmentPeriodLabel,
  formatAssignmentShortDate,
  formatAssignmentWeekdayDate,
} from './assignment-submissions-adapter'
import { toUjatDocumentFileDateToken } from './document-viewer/ujat-document-viewer-types'
import { EMPTY_UJAT_ASSIGNMENT_FILTERS } from './types'
import { filterAssignmentSessionGroups } from './use-list'

describe('buildUjatAssignmentSessionsFromResponse', () => {
  it('handoff 예시 — FEEDBACK_REQUESTED는 피드백 전달 완료 비고', () => {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h1',
      response: {
        sessions: [
          {
            scheduleId: 701,
            educationDate: '2026-10-17',
            planSubmissionPeriod: { from: '2026-10-10', to: '2026-10-16' },
            logSubmissionPeriod: { from: '2026-10-17', to: '2026-10-24' },
            volunteers: [
              {
                participantId: 3001,
                memberId: 4001,
                volunteerName: '김봉사',
                institutionName: '○○초등학교',
                assignedClass: '3학년 2반',
                activityAbandoned: false,
                hasProgressOnDate: true,
                plan: {
                  status: 'FEEDBACK_REQUESTED',
                  submittedAt: '2026-10-15T11:00:00+09:00',
                  feedbackDeliveredAt: '2026-10-16T09:00:00+09:00',
                  formResponseId: 91001,
                },
                log: {
                  status: 'NOT_SUBMITTED',
                  submittedAt: null,
                  feedbackDeliveredAt: null,
                  formResponseId: null,
                },
              },
            ],
          },
        ],
      },
    })

    expect(session.id).toBe('701')
    expect(session.isoDate).toBe('2026-10-17')
    expect(session.planSubmissionPeriodLabel).toBe('2026.10.10(토) ~ 2026.10.16(금)')
    expect(session.logSubmissionPeriodLabel).toBe('2026.10.17(토) ~ 2026.10.24(토)')

    const [row] = session.volunteers
    expect(row.name).toBe('김봉사')
    expect(row.plan).toEqual({
      status: 'submitted',
      submittedDateLabel: '2026.10.15(목)',
      feedbackDeliveredDateLabel: '2026.10.16(금)',
      formResponseId: 91001,
    })
    expect(row.log).toEqual({ status: 'not_submitted' })
    expect(formatAssignmentRemarks(row)).toBe('피드백 전달 완료 (2026.10.16(금))')
  })

  it('활동 포기자는 그 날 진행 이력이 있을 때만 노출', () => {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h2',
      response: {
        sessions: [
          {
            scheduleId: 1,
            educationDate: '2026-11-06',
            volunteers: [
              { participantId: 1, activityAbandoned: true, hasProgressOnDate: true },
              { participantId: 2, activityAbandoned: true, hasProgressOnDate: false },
            ],
          },
        ],
      },
    })
    expect(filterVisibleAssignmentVolunteers(session.volunteers).map(v => v.id)).toEqual(['1-1'])
  })

  it('REVISED는 피드백 비고 대신 수정 제출 비고, DEADLINE_MISSED는 기한 미준수', () => {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h1',
      response: {
        sessions: [
          {
            scheduleId: 2,
            educationDate: '2026-04-03',
            volunteers: [
              {
                participantId: 9,
                plan: {
                  status: 'REVISED',
                  submittedAt: '2026-04-01T09:00:00+09:00',
                  feedbackDeliveredAt: '2026-03-30T09:00:00+09:00',
                  formResponseId: 1,
                },
                log: {
                  status: 'DEADLINE_MISSED',
                  submittedAt: '2026-04-12T10:00:00+09:00',
                  formResponseId: 2,
                },
              },
            ],
          },
        ],
      },
    })
    expect(formatAssignmentRemarks(session.volunteers[0])).toBe(
      '교육 계획서 수정 제출 (2026.04.01(수))\n교육일지 기한 미준수 (2026.04.12(일))'
    )
  })

  it('APPROVED는 제출 완료(submitted)로 매핑한다', () => {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h1',
      response: {
        sessions: [
          {
            scheduleId: 3,
            educationDate: '2026-05-01',
            volunteers: [
              {
                participantId: 7,
                plan: {
                  status: 'APPROVED',
                  submittedAt: '2026-04-20T09:00:00+09:00',
                  formResponseId: 77,
                },
                log: { status: 'NOT_SUBMITTED' },
              },
            ],
          },
        ],
      },
    })
    expect(session.volunteers[0]?.plan).toMatchObject({
      status: 'submitted',
      formResponseId: 77,
    })
  })

  it('sessions 없으면 빈 배열', () => {
    expect(
      buildUjatAssignmentSessionsFromResponse({ regionKey: 'seoul', half: 'h1', response: {} })
    ).toEqual([])
  })
})

describe('formatAssignmentShortDate', () => {
  it('UTC 시각은 Asia/Seoul 날짜로', () => {
    expect(formatAssignmentShortDate('2026-10-15T16:00:00Z')).toBe('2026.10.16')
  })
})

describe('formatAssignmentWeekdayDate', () => {
  it('UTC 시각은 Asia/Seoul 달력일 + 요일로', () => {
    expect(formatAssignmentWeekdayDate('2026-10-15T16:00:00Z')).toBe('2026.10.16(금)')
  })
})

describe('formatAssignmentPeriodLabel', () => {
  it('from≠to면 범위 라벨', () => {
    expect(formatAssignmentPeriodLabel({ from: '2026-01-05', to: '2026-01-09' })).toBe(
      '2026.01.05(월) ~ 2026.01.09(금)'
    )
  })

  it('from=to면 날짜 하나만', () => {
    expect(formatAssignmentPeriodLabel({ from: '2026-10-15', to: '2026-10-15' })).toBe(
      '2026.10.15(목)'
    )
  })

  it('값이 없으면 -', () => {
    expect(formatAssignmentPeriodLabel(null)).toBe('-')
  })
})

describe('wire 슬롯 → 목록 7종 (JABACK assignment-submissions 계약)', () => {
  function volunteerFrom(plan: object, log: object) {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h2',
      response: {
        sessions: [
          {
            scheduleId: 186381,
            educationDate: '2026-04-03',
            volunteers: [{ participantId: 1, plan, log }],
          },
        ],
      },
    })
    return session.volunteers[0]
  }

  it('계획서 미제출 + 일지 기한 내 제출 → 교육계획서 미제출', () => {
    const row = volunteerFrom(
      { status: 'NOT_SUBMITTED', submittedAt: null, feedbackDeliveredAt: null, formResponseId: null },
      {
        status: 'SUBMITTED',
        submittedAt: '2026-04-16T10:00:00+09:00',
        feedbackDeliveredAt: null,
        formResponseId: 9001,
      }
    )
    expect(resolveAssignmentSubmissionStatus(row)).toBe('plan_not_submitted')
    expect(isAssignmentPlanViewEnabled(row.plan)).toBe(false)
    expect(isAssignmentLogViewEnabled(row.log)).toBe(true)
    expect(row.plan.formResponseId).toBeUndefined()
    expect(row.log.formResponseId).toBe(9001)
  })

  it('계획서 마감 후 제출 + 일지 기한 내 승인 → 교육계획서 기한 미준수', () => {
    const row = volunteerFrom(
      {
        status: 'DEADLINE_MISSED',
        submittedAt: '2026-04-03T00:00:00+09:00',
        formResponseId: 9002,
      },
      {
        status: 'APPROVED',
        submittedAt: '2026-04-16T09:00:00+09:00',
        formResponseId: 9003,
      }
    )
    expect(resolveAssignmentSubmissionStatus(row)).toBe('plan_deadline_missed')
    expect(isAssignmentPlanViewEnabled(row.plan)).toBe(true)
    expect(row.plan.submittedDateLabel).toBeTruthy()
  })

  it('둘 다 없음(마감 경과 포함) → 미제출, DEADLINE_MISSED로 올리지 않음', () => {
    const row = volunteerFrom(
      { status: 'NOT_SUBMITTED', submittedAt: null, formResponseId: null },
      { status: 'NOT_SUBMITTED', submittedAt: null, formResponseId: null }
    )
    expect(resolveAssignmentSubmissionStatus(row)).toBe('not_submitted')
    expect(row.plan.status).toBe('not_submitted')
    expect(row.log.status).toBe('not_submitted')
  })

  it('알 수 없는 status는 미제출과 동등', () => {
    const row = volunteerFrom({ status: 'rejected' }, { status: ' ' })
    expect(row.plan.status).toBe('not_submitted')
    expect(row.log.status).toBe('not_submitted')
    expect(resolveAssignmentSubmissionStatus(row)).toBe('not_submitted')
  })
})

describe('FEEDBACK_REQUESTED / REVISED', () => {
  function buildPlan(plan: {
    status: 'FEEDBACK_REQUESTED' | 'REVISED'
    submittedAt: string
    feedbackDeliveredAt?: string
  }) {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h1',
      response: {
        sessions: [
          {
            scheduleId: 5,
            educationDate: '2026-04-03',
            volunteers: [
              {
                participantId: 1,
                plan: { formResponseId: 10, ...plan },
                log: { status: 'NOT_SUBMITTED' },
              },
            ],
          },
        ],
      },
    })
    return session.volunteers[0]
  }

  it('FEEDBACK_REQUESTED — 피드백 전달 완료 비고', () => {
    const row = buildPlan({
      status: 'FEEDBACK_REQUESTED',
      submittedAt: '2026-03-30T09:00:00+09:00',
      feedbackDeliveredAt: '2026-04-01T09:00:00+09:00',
    })
    expect(row.plan.status).toBe('submitted')
    expect(row.plan.feedbackDeliveredDateLabel).toBe('2026.04.01(수)')
    expect(formatAssignmentRemarks(row)).toBe('피드백 전달 완료 (2026.04.01(수))')
  })

  it('REVISED — 수정 제출 비고 (timestamp 추론 없음)', () => {
    const row = buildPlan({
      status: 'REVISED',
      submittedAt: '2026-04-02T09:00:00+09:00',
      feedbackDeliveredAt: '2026-04-01T09:00:00+09:00',
    })
    expect(row.plan.status).toBe('revised')
    expect(row.plan.feedbackDeliveredDateLabel).toBeUndefined()
    expect(formatAssignmentRemarks(row)).toBe('교육 계획서 수정 제출 (2026.04.02(목))')
  })
})

describe('filterAssignmentSessionGroups', () => {
  const sessions = buildUjatAssignmentSessionsFromResponse({
    regionKey: 'seoul',
    half: 'h1',
    response: {
      sessions: [
        {
          scheduleId: 1,
          educationDate: '2026-04-03',
          volunteers: [
            {
              participantId: 1,
              volunteerName: '김봉사',
              institutionName: '구일초등학교',
              plan: { status: 'SUBMITTED', submittedAt: '2026-04-01T09:00:00+09:00' },
              log: { status: 'NOT_SUBMITTED' },
            },
            {
              participantId: 2,
              volunteerName: '이봉사',
              institutionName: '징춘초등학교',
              activityAbandoned: true,
              hasProgressOnDate: false,
              plan: { status: 'NOT_SUBMITTED' },
              log: { status: 'NOT_SUBMITTED' },
            },
          ],
        },
        {
          scheduleId: 2,
          educationDate: '2026-04-17',
          volunteers: [
            {
              participantId: 3,
              volunteerName: '박봉사',
              institutionName: '징춘초등학교',
              plan: { status: 'NOT_SUBMITTED' },
              log: { status: 'NOT_SUBMITTED' },
            },
          ],
        },
      ],
    },
  })

  it('필터 없으면 노출 대상 봉사자만 담는다', () => {
    const groups = filterAssignmentSessionGroups(sessions, { ...EMPTY_UJAT_ASSIGNMENT_FILTERS })
    expect(groups.map(g => g.volunteers.map(v => v.name))).toEqual([['김봉사'], ['박봉사']])
  })

  it('제출 현황 필터에 맞는 행이 없는 교육일은 제외한다', () => {
    const groups = filterAssignmentSessionGroups(sessions, {
      ...EMPTY_UJAT_ASSIGNMENT_FILTERS,
      submissionStatus: 'log_not_submitted',
    })
    expect(groups.map(g => g.isoDate)).toEqual(['2026-04-03'])
  })

  it('교육 진행일 필터', () => {
    const groups = filterAssignmentSessionGroups(sessions, {
      ...EMPTY_UJAT_ASSIGNMENT_FILTERS,
      educationDate: '2026-04-17',
    })
    expect(groups.map(g => g.id)).toEqual(['2'])
  })
})

describe('toUjatDocumentFileDateToken', () => {
  it('요일 포함 라벨에서 YYMMDD 추출', () => {
    expect(toUjatDocumentFileDateToken('2026.04.03(금)')).toBe('260403')
  })

  it('제출일이 없으면 null (임의 날짜를 만들지 않는다)', () => {
    expect(toUjatDocumentFileDateToken('')).toBeNull()
    expect(toUjatDocumentFileDateToken('-')).toBeNull()
  })
})
