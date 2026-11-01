import { describe, expect, it } from 'vitest'
import {
  buildUjatVolunteerDocumentApproveMessage,
  buildUjatVolunteerDocumentBulkApproveMessage,
  buildUjatVolunteerDocumentBulkRejectMessage,
  buildUjatVolunteerDocumentRejectMessage,
} from './document-result-modal'

describe('UJAT volunteer document result modal copy', () => {
  it('uses PermissionModal volunteer 1차 서류 승인 문구', () => {
    expect(buildUjatVolunteerDocumentApproveMessage('홍길동')).toContain(
      '**[홍길동]** 봉사자의 1차 서류 합격을 승인하시겠습니까?'
    )
  })

  it('uses PermissionModal volunteer 1차 서류 반려 문구', () => {
    expect(buildUjatVolunteerDocumentRejectMessage('홍길동')).toContain(
      '**[홍길동]** 봉사자의 1차 서류 합격을 반려하시겠습니까?'
    )
  })

  it('uses bulk selection count in 일괄 승인·반려 문구', () => {
    expect(buildUjatVolunteerDocumentBulkApproveMessage(3)).toContain('선택한 **3명**')
    expect(buildUjatVolunteerDocumentBulkRejectMessage(3)).toContain('선택한 **3명**')
  })
})
