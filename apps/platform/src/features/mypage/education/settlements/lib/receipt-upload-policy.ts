import type { MemberFileUploadPolicy } from '@/features/mypage/instructor-apply/api/member-file-upload'
import { FILE_UPLOAD_MAX_BYTES, formatMultiFileUploadHint } from '@/shared/lib/file-upload-policy'

export const RECEIPT_UPLOAD_MAX_BYTES = FILE_UPLOAD_MAX_BYTES

export const RECEIPT_UPLOAD_ACCEPT =
  '.jpg,.jpeg,.png,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const RECEIPT_UPLOAD_HINTS = [
  formatMultiFileUploadHint('JPG, PNG, Excel, PDF, Word'),
  '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

export const RECEIPT_UPLOAD_POLICY: MemberFileUploadPolicy = {
  maxBytes: RECEIPT_UPLOAD_MAX_BYTES,
  allowedFileTypes: [
    {
      extensions: ['jpg', 'jpeg'],
      contentType: 'image/jpeg',
      contentTypeAliases: ['image/jpg', 'image/pjpeg'],
    },
    { extensions: ['png'], contentType: 'image/png', contentTypeAliases: ['image/x-png'] },
    { extensions: ['pdf'], contentType: 'application/pdf', contentTypeAliases: ['application/x-pdf'] },
    {
      extensions: ['doc'],
      contentType: 'application/msword',
      contentTypeAliases: ['application/vnd.ms-word', 'application/x-msword'],
    },
    {
      extensions: ['docx'],
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    {
      extensions: ['xls'],
      contentType: 'application/vnd.ms-excel',
      contentTypeAliases: [
        'application/x-msexcel',
        'application/x-excel',
        'application/excel',
        'application/x-ms-excel',
      ],
    },
    {
      extensions: ['xlsx'],
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  ],
}
