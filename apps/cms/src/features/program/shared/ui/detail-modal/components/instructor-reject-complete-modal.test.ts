import { describe, expect, it } from 'vitest'
import { buildInstructorRejectCompleteDescription } from '@/features/program/shared/ui/detail-modal/components/instructor-reject-complete-modal'
import { buildInstructorRejectMessage } from '@/features/program/shared/ui/detail-modal/components/instructor-reject-modal'

describe('instructor-reject-modal', () => {
  it('반려 확인 메시지에 강사명을 포함한다', () => {
    expect(buildInstructorRejectMessage('박틴토')).toBe(
      '[박틴토] 강사님의 프로그램 참여를 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 강사님에게 전달되며, 알림이 발송됩니다.'
    )
  })
})

describe('instructor-reject-complete-modal', () => {
  it('반려 완료 메시지에 사유를 포함한다', () => {
    expect(buildInstructorRejectCompleteDescription('박틴토', '인원 초과')).toBe(
      '[박틴토] 강사님의 프로그램 참여가 반려 되었습니다.\n(사유 : 인원 초과)'
    )
  })
})
