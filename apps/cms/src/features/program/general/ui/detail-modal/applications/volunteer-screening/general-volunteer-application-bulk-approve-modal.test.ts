import { describe, expect, it } from 'vitest'
import { buildGeneralVolunteerApplicationBulkApproveCopy } from './general-volunteer-application-bulk-approve-modal'

describe('buildGeneralVolunteerApplicationBulkApproveCopy', () => {
  it('대표 봉사자명과 나머지 인원으로 안내 문구를 만든다', () => {
    expect(
      buildGeneralVolunteerApplicationBulkApproveCopy({
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
    expect(
      buildGeneralVolunteerApplicationBulkApproveCopy({
        subjectName: '  ',
        selectionCount: 2,
      }).message
    ).toBe(
      '**[회원] 님 외 1명**의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.'
    )
  })
})
