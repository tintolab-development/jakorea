import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import {
  guardUjatVolunteerInterview2Evaluation,
  guardUjatVolunteerInterview2Fail,
  guardUjatVolunteerInterview2Pass,
  INTERVIEW_RESULT_NOT_ENDED_ALERT,
} from './guard-actions'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

const INTERVIEW_EVALUATION_REQUIRED_ALERT = {
  title: '면접 평가 진행 안내',
  content: '면접 평가 진행 후 합격 혹은 불합격 처리가 가능합니다.',
  confirmLabel: '닫기',
}

function row(overrides: Partial<UjatVolunteerApplicantRow> = {}): UjatVolunteerApplicantRow {
  return {
    interviewAssignmentStatus: 'assigned',
    secondInterviewScreeningStatus: 'completed',
    assignedInterviewDateLabel: '2020.01.01',
    assignedInterviewTime: '10:00 ~ 10:30',
    managerAScore: 4,
    managerBScore: 5,
    ...overrides,
  } as UjatVolunteerApplicantRow
}

function futureInterviewRow(
  overrides: Partial<UjatVolunteerApplicantRow> = {}
): UjatVolunteerApplicantRow {
  return row({
    assignedInterviewDateLabel: '2099.12.31',
    assignedInterviewTime: '10:00 ~ 10:30',
    ...overrides,
  })
}

describe('guardUjatVolunteerInterview2Pass/Fail/Evaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks pass before both evaluators score and shows close-only alert', () => {
    expect(guardUjatVolunteerInterview2Pass(row({ managerBScore: null }))).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(INTERVIEW_EVALUATION_REQUIRED_ALERT)
  })

  it('blocks fail before both evaluators score and shows close-only alert', () => {
    expect(
      guardUjatVolunteerInterview2Fail(row({ managerAScore: null, managerBScore: null }))
    ).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(INTERVIEW_EVALUATION_REQUIRED_ALERT)
  })

  it('allows pass/fail after evaluation is complete', () => {
    const evaluated = row({ managerAScore: 1, managerBScore: 1 })
    expect(guardUjatVolunteerInterview2Pass(evaluated)).toBe(true)
    expect(guardUjatVolunteerInterview2Fail(evaluated)).toBe(true)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })

  it('prefers already-pass copy over evaluation-required copy', () => {
    expect(
      guardUjatVolunteerInterview2Pass(
        row({ secondInterviewScreeningStatus: 'pass', managerBScore: null })
      )
    ).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: '면접 합격 안내',
      content: '이미 면접 합격 처리된 봉사자입니다.',
    })
  })

  it('blocks pass/fail/evaluation before interview ends', () => {
    const pending = futureInterviewRow()
    expect(guardUjatVolunteerInterview2Pass(pending)).toBe(false)
    expect(guardUjatVolunteerInterview2Fail(pending)).toBe(false)
    expect(guardUjatVolunteerInterview2Evaluation(pending)).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(INTERVIEW_RESULT_NOT_ENDED_ALERT)
  })

  it('prefers not-ended copy over evaluation-required copy', () => {
    expect(
      guardUjatVolunteerInterview2Pass(futureInterviewRow({ managerBScore: null }))
    ).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(INTERVIEW_RESULT_NOT_ENDED_ALERT)
  })

  it('allows evaluation after interview ends', () => {
    expect(guardUjatVolunteerInterview2Evaluation(row())).toBe(true)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })
})
