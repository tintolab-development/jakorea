import { describe, expect, it } from 'vitest'
import { buildInstructorBulkApproveCopy } from './instructor-bulk-approve-modal'

describe('buildInstructorBulkApproveCopy', () => {
  it('대표 강사명과 나머지 인원으로 안내 문구를 만든다', () => {
    expect(
      buildInstructorBulkApproveCopy({
        subjectName: '김제이',
        selectionCount: 3,
      })
    ).toEqual({
      title: '프로그램 신청 일괄 승인 안내',
      message:
        '**[김제이] 님 외 2명**의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.',
    })
  })

  it('이름이 없으면 회원으로 대체한다', () => {
    expect(buildInstructorBulkApproveCopy({ subjectName: '  ', selectionCount: 2 }).message).toBe(
      '**[회원] 님 외 1명**의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.'
    )
  })
})
