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

const draftProgramInlineImageFiles = new Map<number, File>()

function isProgramInlineImageDraftOwner(owner: AdminFileUploadOwner): boolean {
  return (
    owner.filePurpose === ADMIN_FILE_PURPOSE.PROGRAM_INLINE_IMAGE &&
    owner.ownerDomain === 'PROGRAM_CONTENT' &&
    owner.ownerType === 'PROGRAM' &&
    owner.ownerId == null
  )
}

export function rememberProgramInlineImageDraft(fileObjectId: number, file: File): void {
  if (fileObjectId < 1 || file.size < 1) return
  draftProgramInlineImageFiles.set(fileObjectId, file)
}

export function takeProgramInlineImageDraft(fileObjectId: number): File | undefined {
  const file = draftProgramInlineImageFiles.get(fileObjectId)
  if (file == null) return undefined
  draftProgramInlineImageFiles.delete(fileObjectId)
  return file
}

export function resetProgramInlineImageDraftsForTests(): void {
  draftProgramInlineImageFiles.clear()
}

/**
 * 인라인 이미지 upload-first.
 * 신규 공지·FAQ·프로그램 상세(PROGRAM_INLINE_IMAGE)는 ownerId null 로 prepare 한다.
 */
export async function resolveRichTextInlineImageSrc(
  file: File,
  owner: AdminFileUploadOwner
): Promise<{ src: string; persistSrc: string }> {
  const uploaded = await uploadAdminFileMaybeMock({
    file,
    owner,
    waitUntilAvailable: true,
  })
  const persistSrc = contentUrlForFileObjectId(uploaded.fileObjectId).trim()
  if (!persistSrc || persistSrc.startsWith('data:') || fileObjectIdFromAdminFileUrl(persistSrc) == null) {
    throw new Error('이미지 주소를 받지 못했습니다. 다시 시도해 주세요.')
  }
  if (isProgramInlineImageDraftOwner(owner)) {
    rememberProgramInlineImageDraft(uploaded.fileObjectId, file)
  }
  const src = URL.createObjectURL(file)
  if (!src.startsWith('blob:')) {
    throw new Error('이미지 미리보기를 만들지 못했습니다. 다시 시도해 주세요.')
  }
  return { src, persistSrc }
}
