import { describe, expect, it } from 'vitest'
import { buildInstructorRejectCompleteDescription } from '@/features/program/shared/ui/detail-modal/components/instructor-reject-complete-modal'

describe('instructor-reject-complete-modal', () => {
  it('반려 완료 메시지에 사유를 포함한다', () => {
    expect(buildInstructorRejectCompleteDescription('박틴토', '인원 초과')).toBe(
      '[박틴토] 강사님의 프로그램 참여가 반려 되었습니다.\n(사유 : 인원 초과)'
    )
  })
})
