import { describe, expect, it } from 'vitest'
import { resolveGeminiInstructorApprovalAction } from './instructor-approval-action'

describe('resolveGeminiInstructorApprovalAction', () => {
  it('배정된 강사가 없으면 대기 강사를 승인한다', () => {
    expect(
      resolveGeminiInstructorApprovalAction({
        approvalStatus: 'PENDING',
        instructorAssigned: false,
      })
    ).toBe('approve')
  })

  it('배정된 강사가 있으면 대기 강사를 변경 대상으로 승인한다', () => {
    expect(
      resolveGeminiInstructorApprovalAction({
        approvalStatus: 'PENDING',
        instructorAssigned: true,
      })
    ).toBe('change')
  })

  it('기존 배정이 있으면 자동 반려된 강사도 변경 대상으로 복구한다', () => {
    expect(
      resolveGeminiInstructorApprovalAction({
        approvalStatus: 'REJECTED',
        instructorAssigned: true,
      })
    ).toBe('change')
  })

  it('대기 상태가 아닌 강사는 승인 대상으로 만들지 않는다', () => {
    expect(
      resolveGeminiInstructorApprovalAction({
        approvalStatus: 'APPROVED',
        instructorAssigned: true,
      })
    ).toBe('invalid')
    expect(
      resolveGeminiInstructorApprovalAction({
        approvalStatus: 'REJECTED',
        instructorAssigned: false,
      })
    ).toBe('invalid')
  })
})
