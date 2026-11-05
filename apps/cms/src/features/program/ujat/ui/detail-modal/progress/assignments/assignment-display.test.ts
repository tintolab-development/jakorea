import { describe, expect, it } from 'vitest'
import {
  assignmentSubmissionStatusLabel,
  assignmentSubmissionStatusTone,
  isAssignmentLogViewEnabled,
  isAssignmentPlanViewEnabled,
  resolveAssignmentSubmissionStatus,
} from './assignment-display'
import type { UjatAssignmentReportState, UjatAssignmentVolunteerRow } from './types'

function report(
  status: UjatAssignmentReportState['status'],
  extras: Partial<UjatAssignmentReportState> = {}
): UjatAssignmentReportState {
  return { status, ...extras }
}

function row(
  plan: UjatAssignmentReportState,
  log: UjatAssignmentReportState
): Pick<UjatAssignmentVolunteerRow, 'plan' | 'log'> {
  return { plan, log }
}

describe('resolveAssignmentSubmissionStatus — BE 슬롯 조합 (미제출 > 기한 미준수 > 제출 완료)', () => {
  it('둘 다 미제출 → 미제출, 보기 둘 다 off', () => {
    const r = row(report('not_submitted'), report('not_submitted'))
    expect(resolveAssignmentSubmissionStatus(r)).toBe('not_submitted')
    expect(assignmentSubmissionStatusLabel('not_submitted')).toBe('미제출')
    expect(assignmentSubmissionStatusTone('not_submitted')).toBe('not_submitted')
    expect(isAssignmentPlanViewEnabled(r.plan)).toBe(false)
    expect(isAssignmentLogViewEnabled(r.log)).toBe(false)
  })

  it('계획서 미제출 + 일지 제출계 → 교육계획서 미제출', () => {
    const r = row(report('not_submitted'), report('submitted', { formResponseId: 9001 }))
    expect(resolveAssignmentSubmissionStatus(r)).toBe('plan_not_submitted')
    expect(assignmentSubmissionStatusLabel('plan_not_submitted')).toBe('교육계획서 미제출')
    expect(assignmentSubmissionStatusTone('plan_not_submitted')).toBe('not_submitted')
    expect(isAssignmentPlanViewEnabled(r.plan)).toBe(false)
    expect(isAssignmentLogViewEnabled(r.log)).toBe(true)
  })

  it('계획서 미제출 + 일지 기한 미준수 → 미제출 우선, 교육계획서 미제출', () => {
    const r = row(
      report('not_submitted'),
      report('deadline_missed', { formResponseId: 9004, submittedDateLabel: '2026.04.17(금)' })
    )
    expect(resolveAssignmentSubmissionStatus(r)).toBe('plan_not_submitted')
    expect(isAssignmentPlanViewEnabled(r.plan)).toBe(false)
    expect(isAssignmentLogViewEnabled(r.log)).toBe(true)
  })

  it('계획서 제출계 + 일지 미제출 → 교육일지 미제출', () => {
    const r = row(report('submitted', { formResponseId: 1 }), report('not_submitted'))
    expect(resolveAssignmentSubmissionStatus(r)).toBe('log_not_submitted')
    expect(assignmentSubmissionStatusLabel('log_not_submitted')).toBe('교육일지 미제출')
    expect(isAssignmentPlanViewEnabled(r.plan)).toBe(true)
    expect(isAssignmentLogViewEnabled(r.log)).toBe(false)
  })

  it('둘 다 기한 미준수 → 기한 미준수, 보기 둘 다 on', () => {
    const r = row(
      report('deadline_missed', { formResponseId: 1 }),
      report('deadline_missed', { formResponseId: 2 })
    )
    expect(resolveAssignmentSubmissionStatus(r)).toBe('deadline_missed')
    expect(assignmentSubmissionStatusLabel('deadline_missed')).toBe('기한 미준수')
    expect(assignmentSubmissionStatusTone('deadline_missed')).toBe('deadline_missed')
    expect(isAssignmentPlanViewEnabled(r.plan)).toBe(true)
    expect(isAssignmentLogViewEnabled(r.log)).toBe(true)
  })

  it('계획서 기한 미준수 + 일지 기한 내 → 교육계획서 기한 미준수', () => {
    const r = row(
      report('deadline_missed', { formResponseId: 9002 }),
      report('submitted', { formResponseId: 9003 })
    )
    expect(resolveAssignmentSubmissionStatus(r)).toBe('plan_deadline_missed')
    expect(assignmentSubmissionStatusLabel('plan_deadline_missed')).toBe('교육계획서 기한 미준수')
    expect(assignmentSubmissionStatusTone('plan_deadline_missed')).toBe('deadline_missed')
  })

  it('계획서 기한 내 + 일지 기한 미준수 → 교육일지 기한 미준수', () => {
    const r = row(
      report('submitted', { formResponseId: 1 }),
      report('deadline_missed', { formResponseId: 2 })
    )
    expect(resolveAssignmentSubmissionStatus(r)).toBe('log_deadline_missed')
    expect(assignmentSubmissionStatusLabel('log_deadline_missed')).toBe('교육일지 기한 미준수')
  })

  it('둘 다 제출계(submitted/revised) → 제출 완료', () => {
    const r = row(
      report('revised', { formResponseId: 1 }),
      report('submitted', { formResponseId: 2 })
    )
    expect(resolveAssignmentSubmissionStatus(r)).toBe('completed')
    expect(assignmentSubmissionStatusLabel('completed')).toBe('제출 완료')
    expect(assignmentSubmissionStatusTone('completed')).toBe('completed')
    expect(isAssignmentPlanViewEnabled(r.plan)).toBe(true)
    expect(isAssignmentLogViewEnabled(r.log)).toBe(true)
  })
})
