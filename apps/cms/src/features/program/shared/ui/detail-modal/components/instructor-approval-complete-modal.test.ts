import { describe, expect, it } from 'vitest'
import {
  buildInstructorApprovalCompleteDescription,
  countAssignedInstitutions,
} from '@/features/program/shared/ui/detail-modal/components/instructor-approval-complete-modal'

describe('instructor-approval-complete-modal', () => {
  it('배정 기관 수는 schoolId 기준으로 중복 제거한다', () => {
    expect(
      countAssignedInstitutions([
        { schoolId: 'a' },
        { schoolId: 'a' },
        { schoolId: 'b' },
      ])
    ).toBe(2)
  })

  it('배정 기관이 있으면 두 번째 줄을 포함한다', () => {
    expect(buildInstructorApprovalCompleteDescription('박틴토', 3)).toBe(
      '[박틴토] 강사님의 프로그램 참여가 승인 되었습니다.\n(현재 배정 기관 : 3개)'
    )
  })

  it('배정 기관이 없으면 첫 줄만 표시한다', () => {
    expect(buildInstructorApprovalCompleteDescription('박틴토', 0)).toBe(
      '[박틴토] 강사님의 프로그램 참여가 승인 되었습니다.'
    )
  })
})
