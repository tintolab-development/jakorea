import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'

/**
 * CMS Admin filePurpose allowlist (BE AdminFileUploadPolicy §8, 2026-09-10).
 * prepare 요청의 `filePurpose`는 이 집합만 허용된다.
 */
export const ADMIN_FILE_PURPOSE = {
  NOTICE_ATTACHMENT: 'NOTICE_ATTACHMENT',
  NOTICE_INLINE_IMAGE: 'NOTICE_INLINE_IMAGE',
  FAQ_INLINE_IMAGE: 'FAQ_INLINE_IMAGE',
  PROGRAM_POST_ATTACHMENT: 'PROGRAM_POST_ATTACHMENT',
  PROGRAM_POST_INLINE_IMAGE: 'PROGRAM_POST_INLINE_IMAGE',
  PROGRAM_THUMBNAIL: 'PROGRAM_THUMBNAIL',
  PROGRAM_DETAIL_ATTACHMENT: 'PROGRAM_DETAIL_ATTACHMENT',
  PROGRAM_INLINE_IMAGE: 'PROGRAM_INLINE_IMAGE',
  STUDENT_ROSTER: 'STUDENT_ROSTER',
  PORTRAIT_CONSENT: 'PORTRAIT_CONSENT',
  CRIMINAL_HISTORY_EVIDENCE: 'CRIMINAL_HISTORY_EVIDENCE',
  ASSIGNMENT_ATTACHMENT: 'ASSIGNMENT_ATTACHMENT',
  SURVEY_ATTACHMENT: 'SURVEY_ATTACHMENT',
  EDUCATION_JOURNAL: 'EDUCATION_JOURNAL',
  EXPENSE_RECEIPT: 'EXPENSE_RECEIPT',
  MAIL_TEMPLATE_ATTACHMENT: 'MAIL_TEMPLATE_ATTACHMENT',
  MMS_IMAGE: 'MMS_IMAGE',
  ALIMTALK_BANNER_IMAGE: 'ALIMTALK_BANNER_IMAGE',
  ALIMTALK_ITEM_IMAGE: 'ALIMTALK_ITEM_IMAGE',
  SPONSOR_LOGO: 'SPONSOR_LOGO',
  CERTIFICATE_ASSET: 'CERTIFICATE_ASSET',
  FORM_CATALOG_DOCUMENT: 'FORM_CATALOG_DOCUMENT',
  ELECTRONIC_SIGNATURE: 'ELECTRONIC_SIGNATURE',
  INSTRUCTOR_APPLICATION: 'INSTRUCTOR_APPLICATION',
  ABSENCE_EVIDENCE: 'ABSENCE_EVIDENCE',
} as const

export type AdminFilePurpose = (typeof ADMIN_FILE_PURPOSE)[keyof typeof ADMIN_FILE_PURPOSE]

/** 자주 쓰는 ownerDomain / ownerType 조합 (handoff·기존 CMS 관례) */
export const ADMIN_FILE_OWNER = {
  NOTICE: { ownerDomain: 'CONTENT', ownerType: 'NOTICE' },
  NOTICE_INLINE: { ownerDomain: 'CONTENT', ownerType: 'NOTICE' },
  MAIL_TEMPLATE: { ownerDomain: 'NOTIFICATION', ownerType: 'EMAIL_TEMPLATE' },
  MEMBER_CONSENT: { ownerDomain: 'MEMBER', ownerType: 'CONSENT' },
  SPONSOR_LOGO: { ownerDomain: 'SPONSOR', ownerType: 'LOGO' },
  PROGRAM: { ownerDomain: 'PROGRAM', ownerType: 'PROGRAM' },
  PROGRAM_APPLICATION: { ownerDomain: 'PROGRAM', ownerType: 'APPLICATION' },
  SMS_TEMPLATE: { ownerDomain: 'NOTIFICATION', ownerType: 'SMS_TEMPLATE' },
  /** 문자 발송 화면 MMS 요청 첨부 — ownerId null (배치 생성 전 업로드) */
  MMS_BATCH: { ownerDomain: 'NOTIFICATION', ownerType: 'MMS_BATCH' },
  SETTLEMENT: { ownerDomain: 'SETTLEMENT', ownerType: 'SUBMISSION' },
  CERTIFICATE_TEMPLATE: { ownerDomain: 'CONTENT', ownerType: 'CERTIFICATE_TEMPLATE' },
  INSTRUCTOR_APPLICATION: { ownerDomain: 'PROGRAM', ownerType: 'INSTRUCTOR_APPLICATION' },
  ATTENDANCE: { ownerDomain: 'PROGRAM', ownerType: 'ATTENDANCE' },
  EDUCATION_JOURNAL: { ownerDomain: 'PROGRAM', ownerType: 'EDUCATION_JOURNAL' },
} as const

export function buildAdminFileOwner(
  base: { ownerDomain: string; ownerType: string },
  ownerId: number | null,
  filePurpose: AdminFilePurpose | string
): AdminFileUploadOwner {
  return {
    ownerDomain: base.ownerDomain,
    ownerType: base.ownerType,
    ownerId,
    filePurpose,
  }
}

/**
 * OpenAPI `FileUploadPrepareRequest.ownerId` — upload-first draft null 허용 조합.
 * CONTENT/NOTICE + NOTICE_ATTACHMENT|NOTICE_INLINE_IMAGE,
 * CONTENT/FAQ + FAQ_INLINE_IMAGE,
 * PROGRAM_CONTENT/PROGRAM + PROGRAM_THUMBNAIL|PROGRAM_DETAIL_ATTACHMENT|PROGRAM_INLINE_IMAGE,
 * NOTIFICATION/MMS_BATCH + MMS_IMAGE (문자 발송 요청 첨부)
 */
export function adminFileUploadAllowsNullOwnerId(owner: Pick<
  AdminFileUploadOwner,
  'ownerDomain' | 'ownerType' | 'filePurpose'
>): boolean {
  const domain = owner.ownerDomain
  const type = owner.ownerType
  const purpose = owner.filePurpose
  if (
    domain === 'CONTENT' &&
    type === 'NOTICE' &&
    (purpose === ADMIN_FILE_PURPOSE.NOTICE_ATTACHMENT ||
      purpose === ADMIN_FILE_PURPOSE.NOTICE_INLINE_IMAGE)
  ) {
    return true
  }
  if (domain === 'CONTENT' && type === 'FAQ' && purpose === ADMIN_FILE_PURPOSE.FAQ_INLINE_IMAGE) {
    return true
  }
  if (
    domain === ADMIN_FILE_OWNER.MMS_BATCH.ownerDomain &&
    type === ADMIN_FILE_OWNER.MMS_BATCH.ownerType &&
    purpose === ADMIN_FILE_PURPOSE.MMS_IMAGE
  ) {
    return true
  }
  return (
    domain === 'PROGRAM_CONTENT' &&
    type === 'PROGRAM' &&
    (purpose === ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL ||
      purpose === ADMIN_FILE_PURPOSE.PROGRAM_DETAIL_ATTACHMENT ||
      purpose === ADMIN_FILE_PURPOSE.PROGRAM_INLINE_IMAGE)
  )
}

const XLSX_STANDARD_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** 브라우저가 `.xlsx`에 붙이는 확인된 별칭만. 그 외 명시 MIME은 덮지 않는다. */
const XLSX_MIME_ALIASES = new Set(['application/haansoftxlsx'])

function fileExtension(fileName: string): string {
  const name = fileName.trim().toLowerCase()
  return name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
}

/** 브라우저 `file.type`이 비어 있는 HWP 등 — 확장자로 허용 MIME 추정 */
export function resolveUploadContentType(file: File): string {
  const typed = file.type.trim()
  const ext = fileExtension(file.name)
  if (ext === 'xlsx' && XLSX_MIME_ALIASES.has(typed.toLowerCase())) {
    return XLSX_STANDARD_MIME
  }
  if (typed && typed !== 'application/octet-stream') return typed
  const byExt: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    hwp: 'application/x-hwp',
    hwpx: 'application/hwp+zip',
    zip: 'application/zip',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    ai: 'application/vnd.adobe.illustrator',
    eps: 'application/postscript',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  }
  return byExt[ext] ?? (typed || 'application/octet-stream')
}
