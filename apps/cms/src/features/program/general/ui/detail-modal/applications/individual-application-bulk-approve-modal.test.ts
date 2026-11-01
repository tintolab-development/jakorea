import { describe, expect, it } from 'vitest'
import { buildIndividualApplicationBulkApproveCopy } from './individual-application-bulk-approve-modal'

describe('buildIndividualApplicationBulkApproveCopy', () => {
  it('대표 참여자명과 나머지 인원으로 안내 문구를 만든다', () => {
    expect(
      buildIndividualApplicationBulkApproveCopy({
        subjectName: '김제이',
        selectionCount: 4,
      })
    ).toEqual({
      title: '프로그램 신청 일괄 승인 안내',
      message:
        '**[김제이] 님 외 3명**의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.',
    })
  })
})
