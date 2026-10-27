import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  guardGeneralVolunteerInterview2Fail,
  guardGeneralVolunteerInterview2Pass,
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
    managerAScore: 4,
    managerBScore: 5,
    ...overrides,
  } as GeneralVolunteerApplicantRow
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
})
