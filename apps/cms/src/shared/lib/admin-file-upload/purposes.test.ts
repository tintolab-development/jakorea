import { describe, expect, it } from 'vitest'
import {
  ADMIN_FILE_PURPOSE,
  adminFileUploadAllowsNullOwnerId,
  resolveUploadContentType,
} from '@/shared/lib/admin-file-upload/purposes'

const XLSX_STANDARD = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function uploadFile(name: string, type: string): File {
  return new File(['xlsx-bytes'], name, { type })
}

describe('adminFileUploadAllowsNullOwnerId', () => {
  it('프로그램 등록 draft purpose는 PROGRAM_CONTENT/PROGRAM + ownerId null을 허용한다', () => {
    expect(
      adminFileUploadAllowsNullOwnerId({
        ownerDomain: 'PROGRAM_CONTENT',
        ownerType: 'PROGRAM',
        filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL,
      })
    ).toBe(true)
    expect(
      adminFileUploadAllowsNullOwnerId({
        ownerDomain: 'PROGRAM_CONTENT',
        ownerType: 'PROGRAM',
        filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_DETAIL_ATTACHMENT,
      })
    ).toBe(true)
    expect(
      adminFileUploadAllowsNullOwnerId({
        ownerDomain: 'PROGRAM_CONTENT',
        ownerType: 'PROGRAM',
        filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_INLINE_IMAGE,
      })
    ).toBe(true)
  })

  it('공지·FAQ draft purpose만 CONTENT 도메인에서 null을 허용한다', () => {
    expect(
      adminFileUploadAllowsNullOwnerId({
        ownerDomain: 'CONTENT',
        ownerType: 'NOTICE',
        filePurpose: ADMIN_FILE_PURPOSE.NOTICE_ATTACHMENT,
      })
    ).toBe(true)
    expect(
      adminFileUploadAllowsNullOwnerId({
        ownerDomain: 'CONTENT',
        ownerType: 'FAQ',
        filePurpose: ADMIN_FILE_PURPOSE.FAQ_INLINE_IMAGE,
      })
    ).toBe(true)
  })

  it('그 외 purpose는 ownerId를 요구한다', () => {
    expect(
      adminFileUploadAllowsNullOwnerId({
        ownerDomain: 'PROGRAM',
        ownerType: 'APPLICATION',
        filePurpose: ADMIN_FILE_PURPOSE.STUDENT_ROSTER,
      })
    ).toBe(false)
    expect(
      adminFileUploadAllowsNullOwnerId({
        ownerDomain: 'PROGRAM_CONTENT',
        ownerType: 'PROGRAM',
        filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_POST_INLINE_IMAGE,
      })
    ).toBe(false)
  })
})

describe('resolveUploadContentType', () => {
  it('xlsx + application/haansoftxlsx 는 표준 MIME으로 보낸다', () => {
    expect(resolveUploadContentType(uploadFile('report.xlsx', 'application/haansoftxlsx'))).toBe(
      XLSX_STANDARD
    )
  })

  it('xlsx 확장자는 대소문자를 가리지 않는다', () => {
    expect(resolveUploadContentType(uploadFile('Report.XLSX', 'application/haansoftxlsx'))).toBe(
      XLSX_STANDARD
    )
  })

  it('xlsx + 표준 MIME은 유지한다', () => {
    expect(resolveUploadContentType(uploadFile('report.xlsx', XLSX_STANDARD))).toBe(XLSX_STANDARD)
  })

  it('xlsx + 빈 MIME / octet-stream은 확장자 fallback을 쓴다', () => {
    expect(resolveUploadContentType(uploadFile('report.xlsx', ''))).toBe(XLSX_STANDARD)
    expect(resolveUploadContentType(uploadFile('report.xlsx', 'application/octet-stream'))).toBe(
      XLSX_STANDARD
    )
  })

  it('xlsx + 알 수 없는 명시 MIME은 위조하지 않는다', () => {
    expect(resolveUploadContentType(uploadFile('report.xlsx', 'application/x-unknown'))).toBe(
      'application/x-unknown'
    )
  })

  it('svg / ai / eps 확장자 MIME을 추정한다', () => {
    expect(resolveUploadContentType(uploadFile('logo.svg', ''))).toBe('image/svg+xml')
    expect(resolveUploadContentType(uploadFile('logo.ai', 'application/octet-stream'))).toBe(
      'application/vnd.adobe.illustrator'
    )
    expect(resolveUploadContentType(uploadFile('logo.eps', ''))).toBe('application/postscript')
  })

  it('pdf / docx / xls MIME은 바꾸지 않는다', () => {
    expect(resolveUploadContentType(uploadFile('a.pdf', 'application/pdf'))).toBe('application/pdf')
    expect(
      resolveUploadContentType(
        uploadFile('a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      )
    ).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(resolveUploadContentType(uploadFile('a.xls', 'application/vnd.ms-excel'))).toBe(
      'application/vnd.ms-excel'
    )
    expect(resolveUploadContentType(uploadFile('a.xls', 'application/haansoftxlsx'))).toBe(
      'application/haansoftxlsx'
    )
  })
})
