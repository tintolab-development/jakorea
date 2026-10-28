import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  guardGeneralVolunteerInterview2Evaluation,
  guardGeneralVolunteerInterview2Fail,
  guardGeneralVolunteerInterview2Pass,
  INTERVIEW_RESULT_NOT_ENDED_ALERT,
} from './general-volunteer-applicant-guard-actions'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

const INTERVIEW_EVALUATION_REQUIRED_ALERT = {
  title: '면접 평가 진행 안내',
  content: '면접 평가 진행 후 합격 혹은 불합격 처리가 가능합니다.',
  confirmLabel: '닫기',
}

function row(
  overrides: Partial<GeneralVolunteerApplicantRow> = {}
): GeneralVolunteerApplicantRow {
  return {
    interviewAssignmentStatus: 'assigned',
    secondInterviewScreeningStatus: 'completed',
    assignedInterviewEndAt: '2020-01-01T00:00:00+09:00',
    managerAScore: 4,
    managerBScore: 5,
    ...overrides,
  } as GeneralVolunteerApplicantRow
}

function futureInterviewRow(
  overrides: Partial<GeneralVolunteerApplicantRow> = {}
): GeneralVolunteerApplicantRow {
  return row({ assignedInterviewEndAt: '2099-12-31T23:59:59+09:00', ...overrides })
}

describe('guardGeneralVolunteerInterview2Pass/Fail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks pass before both evaluators score and shows close-only alert', () => {
    expect(guardGeneralVolunteerInterview2Pass(row({ managerBScore: null }))).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(INTERVIEW_EVALUATION_REQUIRED_ALERT)
  })

  it('blocks fail before both evaluators score and shows close-only alert', () => {
    expect(
      guardGeneralVolunteerInterview2Fail(row({ managerAScore: null, managerBScore: null }))
    ).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(INTERVIEW_EVALUATION_REQUIRED_ALERT)
  })

  it('allows pass/fail after evaluation is complete', () => {
    const evaluated = row({ managerAScore: 0, managerBScore: 0 })
    expect(guardGeneralVolunteerInterview2Pass(evaluated)).toBe(true)
    expect(guardGeneralVolunteerInterview2Fail(evaluated)).toBe(true)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })

  it('prefers already-pass copy over evaluation-required copy', () => {
    expect(
      guardGeneralVolunteerInterview2Pass(
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
    expect(guardGeneralVolunteerInterview2Pass(pending)).toBe(false)
    expect(guardGeneralVolunteerInterview2Fail(pending)).toBe(false)
    expect(guardGeneralVolunteerInterview2Evaluation(pending)).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(INTERVIEW_RESULT_NOT_ENDED_ALERT)
  })

  it('prefers not-ended copy over evaluation-required copy', () => {
    expect(
      guardGeneralVolunteerInterview2Pass(futureInterviewRow({ managerBScore: null }))
    ).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(INTERVIEW_RESULT_NOT_ENDED_ALERT)
  })

  it('allows evaluation after interview ends', () => {
    expect(guardGeneralVolunteerInterview2Evaluation(row())).toBe(true)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })
})
