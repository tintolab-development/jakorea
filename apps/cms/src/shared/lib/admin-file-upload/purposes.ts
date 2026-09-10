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
  PROGRAM_POST: { ownerDomain: 'PROGRAM', ownerType: 'POST' },
  PROGRAM_APPLICATION: { ownerDomain: 'PROGRAM', ownerType: 'APPLICATION' },
  SMS_TEMPLATE: { ownerDomain: 'NOTIFICATION', ownerType: 'SMS_TEMPLATE' },
  SETTLEMENT: { ownerDomain: 'SETTLEMENT', ownerType: 'SUBMISSION' },
  CERTIFICATE_TEMPLATE: { ownerDomain: 'CONTENT', ownerType: 'CERTIFICATE_TEMPLATE' },
  INSTRUCTOR_APPLICATION: { ownerDomain: 'PROGRAM', ownerType: 'INSTRUCTOR_APPLICATION' },
  ATTENDANCE: { ownerDomain: 'PROGRAM', ownerType: 'ATTENDANCE' },
  EDUCATION_JOURNAL: { ownerDomain: 'PROGRAM', ownerType: 'EDUCATION_JOURNAL' },
} as const

export function buildAdminFileOwner(
  base: { ownerDomain: string; ownerType: string },
  ownerId: number,
  filePurpose: AdminFilePurpose | string
): AdminFileUploadOwner {
  return {
    ownerDomain: base.ownerDomain,
    ownerType: base.ownerType,
    ownerId,
    filePurpose,
  }
}

/** 브라우저 `file.type`이 비어 있는 HWP 등 — 확장자로 허용 MIME 추정 */
export function resolveUploadContentType(file: File): string {
  const typed = file.type.trim()
  if (typed && typed !== 'application/octet-stream') return typed
  const name = file.name.trim().toLowerCase()
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
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
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  }
  return byExt[ext] ?? (typed || 'application/octet-stream')
}
