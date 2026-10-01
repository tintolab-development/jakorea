import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { fileObjectIdFromAdminFileUrl } from '@/shared/lib/admin-file-upload/attachments'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
} from '@/shared/lib/admin-file-upload/purposes'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import {
  contentUrlForFileObjectId,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload/upload-maybe-mock'

/** 공지·FAQ 인라인은 신규(ownerId 없음) prepare가 ownerId를 필수로 본다. 프로그램 본문은 null 허용. */
const INLINE_IMAGE_REQUIRES_OWNER_ID = new Set<string>([
  ADMIN_FILE_PURPOSE.NOTICE_INLINE_IMAGE,
  ADMIN_FILE_PURPOSE.FAQ_INLINE_IMAGE,
])

const pendingInlineImageFiles = new Map<string, File>()

export function rememberPendingInlineImage(blobSrc: string, file: File): void {
  pendingInlineImageFiles.set(blobSrc, file)
}

export function takePendingInlineImage(blobSrc: string): File | undefined {
  const file = pendingInlineImageFiles.get(blobSrc)
  pendingInlineImageFiles.delete(blobSrc)
  return file
}

export function peekPendingInlineImage(blobSrc: string): File | undefined {
  return pendingInlineImageFiles.get(blobSrc)
}

export function inlineImageRequiresOwnerId(owner: AdminFileUploadOwner): boolean {
  return INLINE_IMAGE_REQUIRES_OWNER_ID.has(owner.filePurpose)
}

export function stripBlobImageSources(content: string): string {
  return content
    .replace(/!\[[^\]]*]\(blob:[^)]+\)/g, '')
    .replace(/<img\b[^>]*\bsrc=["']blob:[^"']+["'][^>]*>/gi, '')
}

export function collectAdminFileObjectIdsFromContent(content: string): number[] {
  const ids: number[] = []
  const seen = new Set<number>()
  const re = /\/api\/admin\/files\/(\d+)\//g
  let match: RegExpExecArray | null
  while ((match = re.exec(content))) {
    const id = Number(match[1])
    if (!Number.isInteger(id) || id < 1 || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

export function noticeInlineImageOwner(noticeId: number | null): AdminFileUploadOwner {
  return buildAdminFileOwner(
    ADMIN_FILE_OWNER.NOTICE_INLINE,
    noticeId,
    ADMIN_FILE_PURPOSE.NOTICE_INLINE_IMAGE
  )
}

export function faqInlineImageOwner(faqId: number | null): AdminFileUploadOwner {
  return buildAdminFileOwner(
    { ownerDomain: 'CONTENT', ownerType: 'FAQ' },
    faqId,
    ADMIN_FILE_PURPOSE.FAQ_INLINE_IMAGE
  )
}

export function programInlineImageOwner(programId: number | null): AdminFileUploadOwner {
  return {
    ownerDomain: 'PROGRAM_CONTENT',
    ownerType: 'PROGRAM',
    ownerId: programId,
    filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_INLINE_IMAGE,
  }
}

export function programPostInlineImageOwner(programId: number | null): AdminFileUploadOwner {
  return {
    ownerDomain: 'PROGRAM_CONTENT',
    ownerType: 'PROGRAM',
    ownerId: programId,
    filePurpose: ADMIN_FILE_PURPOSE.PROGRAM_POST_INLINE_IMAGE,
  }
}

export function mailTemplateInlineImageOwner(templateId: number | null): AdminFileUploadOwner {
  return buildAdminFileOwner(
    ADMIN_FILE_OWNER.MAIL_TEMPLATE,
    templateId,
    ADMIN_FILE_PURPOSE.MAIL_TEMPLATE_ATTACHMENT
  )
}

/** 파일 API가 꺼진 로컬·데모만 data URL을 허용한다. */
export function shouldInsertRichTextImageLocally(
  owner: AdminFileUploadOwner | null | undefined
): boolean {
  return !isRealApiModuleEnabled('files') && owner == null
}

export async function persistRichTextInlineImage(
  file: File,
  owner: AdminFileUploadOwner
): Promise<string> {
  if (owner.ownerId == null && inlineImageRequiresOwnerId(owner)) {
    throw new Error('이미지를 업로드할 수 없습니다. 글을 먼저 저장한 뒤 다시 시도해 주세요.')
  }
  const uploaded = await uploadAdminFileMaybeMock({
    file,
    owner,
    waitUntilAvailable: true,
  })
  const persistSrc = contentUrlForFileObjectId(uploaded.fileObjectId).trim()
  if (!persistSrc || persistSrc.startsWith('data:') || fileObjectIdFromAdminFileUrl(persistSrc) == null) {
    throw new Error('이미지 주소를 받지 못했습니다. 다시 시도해 주세요.')
  }
  return persistSrc
}

export async function resolveRichTextInlineImageSrc(
  file: File,
  owner: AdminFileUploadOwner
): Promise<{ src: string; persistSrc?: string }> {
  const src = URL.createObjectURL(file)
  if (!src.startsWith('blob:')) {
    throw new Error('이미지 미리보기를 만들지 못했습니다. 다시 시도해 주세요.')
  }
  if (owner.ownerId == null && inlineImageRequiresOwnerId(owner)) {
    rememberPendingInlineImage(src, file)
    return { src }
  }
  const persistSrc = await persistRichTextInlineImage(file, owner)
  return { src, persistSrc }
}
