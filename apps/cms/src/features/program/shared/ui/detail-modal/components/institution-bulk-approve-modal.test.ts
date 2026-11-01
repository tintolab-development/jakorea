import { describe, expect, it } from 'vitest'
import { buildInstitutionApplicationBulkApproveCopy } from './institution-bulk-approve-modal'

describe('buildInstitutionApplicationBulkApproveCopy', () => {
  it('대표 기관명과 나머지 건수로 안내 문구를 만든다', () => {
    expect(
      buildInstitutionApplicationBulkApproveCopy({
        subjectName: 'JA초등학교',
        selectionCount: 4,
      })
    ).toEqual({
      title: '프로그램 신청 일괄 승인 안내',
      message:
        '**[JA초등학교] 외 3개**의 프로그램 신청을 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.',
    })
  })
})
