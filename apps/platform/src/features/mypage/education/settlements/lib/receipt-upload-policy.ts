import type { MemberFileUploadPolicy } from '@/features/mypage/instructor-apply/api/member-file-upload'

/** 시안 20MB. OpenAPI `EXPENSE_RECEIPT` 용도는 명시 용량이 없고, 동류 포털 첨부(초상권·성범죄 증빙)는 20MB. */
export const RECEIPT_UPLOAD_MAX_BYTES = 20 * 1024 * 1024

export const RECEIPT_UPLOAD_ACCEPT =
  '.jpg,.jpeg,.png,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const RECEIPT_UPLOAD_HINTS = [
  '파일은 최대 20MB까지 JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.',
  '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

export const RECEIPT_UPLOAD_POLICY: MemberFileUploadPolicy = {
  maxBytes: RECEIPT_UPLOAD_MAX_BYTES,
  allowedFileTypes: [
    { extensions: ['jpg', 'jpeg'], contentType: 'image/jpeg' },
    { extensions: ['png'], contentType: 'image/png' },
    { extensions: ['pdf'], contentType: 'application/pdf' },
    { extensions: ['doc'], contentType: 'application/msword' },
    {
      extensions: ['docx'],
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    { extensions: ['xls'], contentType: 'application/vnd.ms-excel' },
    {
      extensions: ['xlsx'],
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  ],
}
