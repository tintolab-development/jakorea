import { describe, expect, it } from 'vitest'
import { validateMemberPortalFile } from '../src/features/mypage/instructor-apply/api/member-file-upload'
import { RECEIPT_UPLOAD_POLICY } from '../src/features/mypage/education/settlements/lib/receipt-upload-policy'
import {
  RECEIPT_UPLOAD_SIZE_EXCEEDED_MESSAGE,
  RECEIPT_UPLOAD_TYPE_NOT_ALLOWED_MESSAGE,
  resolveReceiptUploadServerErrorMessage,
} from '../src/features/mypage/education/settlements/lib/receipt-upload-errors'
import { MemberFileUploadRequestError } from '../src/features/mypage/instructor-apply/api/member-file-upload'
import { FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE } from '../src/shared/lib/file-upload-policy'

function file(name: string, type: string): File {
  return new File(['x'], name, { type })
}

describe('영수증 업로드 MIME 보정', () => {
  it('표준 MIME과 빈 MIME은 통과한다', () => {
    expect(() => validateMemberPortalFile(file('a.xls', 'application/vnd.ms-excel'), RECEIPT_UPLOAD_POLICY)).not.toThrow()
    expect(() => validateMemberPortalFile(file('a.doc', ''), RECEIPT_UPLOAD_POLICY)).not.toThrow()
    expect(() => validateMemberPortalFile(file('a.docx', ''), RECEIPT_UPLOAD_POLICY)).not.toThrow()
  })

  it('비표준 별칭 MIME은 통과한다(전송 값은 표준 MIME)', () => {
    expect(() => validateMemberPortalFile(file('a.xls', 'application/x-msexcel'), RECEIPT_UPLOAD_POLICY)).not.toThrow()
    expect(() => validateMemberPortalFile(file('a.doc', 'application/vnd.ms-word'), RECEIPT_UPLOAD_POLICY)).not.toThrow()
    expect(() => validateMemberPortalFile(file('a.jpg', 'image/jpg'), RECEIPT_UPLOAD_POLICY)).not.toThrow()
  })

  it('확장자와 맞지 않는 MIME, 허용 외 형식은 거절한다', () => {
    expect(() => validateMemberPortalFile(file('a.docx', 'application/pdf'), RECEIPT_UPLOAD_POLICY)).toThrow()
    expect(() => validateMemberPortalFile(file('a.webp', 'image/webp'), RECEIPT_UPLOAD_POLICY)).toThrow()
    expect(() => validateMemberPortalFile(file('a.hwp', ''), RECEIPT_UPLOAD_POLICY)).toThrow()
  })
})

describe('영수증 업로드 서버 거절 문구', () => {
  const rejected = (data: unknown) =>
    new MemberFileUploadRequestError({ response: { status: 400, data } })

  it('코드별로 기존 클라이언트 검사 문구를 연결한다', () => {
    expect(resolveReceiptUploadServerErrorMessage(rejected({ error: { code: 'MEMBER_FILE_TYPE_NOT_ALLOWED' } }))).toBe(
      RECEIPT_UPLOAD_TYPE_NOT_ALLOWED_MESSAGE
    )
    expect(resolveReceiptUploadServerErrorMessage(rejected({ code: 'MEMBER_FILE_SIZE_EXCEEDED' }))).toBe(
      RECEIPT_UPLOAD_SIZE_EXCEEDED_MESSAGE
    )
    expect(resolveReceiptUploadServerErrorMessage(rejected({ code: 'BAD_REQUEST', reason: 'EVIDENCE_FILE_COUNT_EXCEEDED' }))).toBe(
      FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE
    )
  })

  it('그 외 코드와 본문 없는 오류는 null(일반 오류 문구 유지)', () => {
    expect(resolveReceiptUploadServerErrorMessage(rejected({ code: 'SOMETHING_ELSE' }))).toBeNull()
    expect(resolveReceiptUploadServerErrorMessage(new Error('network'))).toBeNull()
  })

  it('문구는 기존 안내와 같다', () => {
    expect(RECEIPT_UPLOAD_TYPE_NOT_ALLOWED_MESSAGE).toBe('JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.')
    expect(RECEIPT_UPLOAD_SIZE_EXCEEDED_MESSAGE).toBe('파일은 20MB 이하만 첨부할 수 있습니다.')
    expect(FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE).toBe('파일은 최대 10개까지 첨부할 수 있습니다.')
  })
})
