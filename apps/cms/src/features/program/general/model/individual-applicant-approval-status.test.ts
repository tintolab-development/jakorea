import { describe, expect, it } from 'vitest'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import {
  patchGeneralIndividualApplicantForApprovalStatus,
  patchGeneralIndividualApplicantForCancelApproval,
} from '@/features/program/general/model/individual-applicant'

const pendingApplicant: GeneralIndividualApplicantRow = {
  id: '1',
  no: 1,
  applicantName: '김참여자',
  affiliation: '',
  educationGrade: '',
  homeAddress: '',
  approvalStatus: 'pending',
  availableActions: ['VIEW', 'APPROVE', 'REJECT'],
}

describe('patchGeneralIndividualApplicantForApprovalStatus', () => {
  it('신청 반려 시 반려 취소 액션을 넣는다', () => {
    const row = patchGeneralIndividualApplicantForApprovalStatus(pendingApplicant, 'rejected', {
      notifyTiming: 'immediate',
      rejectionReason: '일정 중복',
    })

    expect(row.approvalStatus).toBe('rejected')
    expect(row.availableActions).toContain('CANCEL_REJECTION')
    expect(row.availableActions).not.toContain('APPROVE')
    expect(row.availableActions).not.toContain('REJECT')
  })

  it('승인 취소 패치는 신청 반려 표시만 하고 CANCEL_REJECTION을 넣지 않는다', () => {
    const row = patchGeneralIndividualApplicantForCancelApproval(pendingApplicant, {
      notifyTiming: 'immediate',
      rejectionReason: '일정 중복',
    })
    expect(row.approvalStatus).toBe('rejected')
    expect(row.applicationStatus).toBe('APPROVAL_CANCELLED')
    expect(row.availableActions).not.toContain('CANCEL_REJECTION')
    expect(row.availableActions).not.toContain('CANCEL_APPROVAL')
  })
})
