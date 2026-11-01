import { describe, expect, it } from 'vitest'
import { buildUjatVolunteerInterview2BulkPassCopy } from './bulk-pass-modal'

describe('buildUjatVolunteerInterview2BulkPassCopy', () => {
  it('대표 봉사자명과 나머지 인원으로 안내 문구를 만든다', () => {
    expect(
      buildUjatVolunteerInterview2BulkPassCopy({
        subjectName: '김제이',
        selectionCount: 3,
      })
    ).toEqual({
      title: '면접 일괄 합격 안내',
      description:
        '**[김제이] 님 외 2명**의 면접 결과를 합격 처리하시겠습니까?\n합격 시 회원에게 합격 알림이 발송됩니다.',
    })
  })

  it('이름이 없으면 회원으로 대체한다', () => {
    expect(
      buildUjatVolunteerInterview2BulkPassCopy({
        subjectName: '  ',
        selectionCount: 2,
      }).description
    ).toBe(
      '**[회원] 님 외 1명**의 면접 결과를 합격 처리하시겠습니까?\n합격 시 회원에게 합격 알림이 발송됩니다.'
    )
  })
})
