import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  getFileContentPath,
  uploadAdminFile,
} from '@/shared/lib/admin-file-upload'
import type { AdminFilePurpose } from '@/shared/lib/admin-file-upload/purposes'
import type { AdminFileUploadOwner, UploadAdminFileResult } from '@/shared/lib/admin-file-upload/types'

export function shouldMockAdminFileUpload(): boolean {
  return !isRealApiModuleEnabled('files')
}

/**
 * files 모듈 미활성 시 DEV-only stub. PROD 번들에서는 tree-shake.
 * 활성 시 uploadAdminFile 전체 flow.
 */
export async function uploadAdminFileMaybeMock(input: {
  file: File
  owner: AdminFileUploadOwner
  originalFileName?: string
  waitUntilAvailable?: boolean
}): Promise<UploadAdminFileResult> {
  if (import.meta.env.DEV && shouldMockAdminFileUpload()) {
    const stubId = 800_000_001 + (input.file.size % 10_000)
    return {
      fileObjectId: stubId,
      checksumSha256: '0'.repeat(64),
    }
  }
  if (shouldMockAdminFileUpload()) {
    throw new Error('파일 업로드는 files API가 활성화된 환경에서만 사용할 수 있습니다.')
  }
  return uploadAdminFile({
    file: input.file,
    owner: input.owner,
    originalFileName: input.originalFileName,
    waitUntilAvailable: input.waitUntilAvailable ?? true,
  })
}

export function programFileOwner(
  programId: number | null,
  filePurpose: AdminFilePurpose
): AdminFileUploadOwner {
  // BE ProgramAttachmentService / ProgramThumbnailService 는 PROGRAM_CONTENT/PROGRAM 만 허용.
  // ADMIN_FILE_OWNER.PROGRAM(domain=PROGRAM) 로 올리면 PUT attachments 가 OWNER_MISMATCH 로 거절된다.
  if (
    filePurpose === ADMIN_FILE_PURPOSE.PROGRAM_DETAIL_ATTACHMENT ||
    filePurpose === ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL ||
    filePurpose === ADMIN_FILE_PURPOSE.PROGRAM_INLINE_IMAGE ||
    filePurpose === ADMIN_FILE_PURPOSE.PROGRAM_POST_ATTACHMENT ||
    filePurpose === ADMIN_FILE_PURPOSE.PROGRAM_POST_INLINE_IMAGE
  ) {
    return {
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM',
      ownerId: programId,
      filePurpose,
    }
  }
  return buildAdminFileOwner(ADMIN_FILE_OWNER.PROGRAM, programId, filePurpose)
}

/**
 * 프로그램 게시글 첨부 업로드 owner. BE 는 아래 두 조합만 허용한다(그 외 400 PROGRAM_POST_ATTACHMENT_OWNER_INVALID).
 * - 새 글 작성 중(postId 없음): PROGRAM_CONTENT / PROGRAM / {programId} — PUT attachments 시 서버가 게시글로 옮긴다.
 * - 기존 글 수정: PROGRAM_CONTENT / PROGRAM_POST / {postId}
 */
export function programPostFileOwner(input: {
  programId: number
  postId?: number | null
}): AdminFileUploadOwner {
  const filePurpose = ADMIN_FILE_PURPOSE.PROGRAM_POST_ATTACHMENT
  if (input.postId != null) {
    return {
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM_POST',
      ownerId: input.postId,
      filePurpose,
    }
  }
  return {
    ownerDomain: 'PROGRAM_CONTENT',
    ownerType: 'PROGRAM',
    ownerId: input.programId,
    filePurpose,
  }
}

export function programApplicationFileOwner(
  applicationId: number,
  filePurpose: AdminFilePurpose
): AdminFileUploadOwner {
  return buildAdminFileOwner(ADMIN_FILE_OWNER.PROGRAM_APPLICATION, applicationId, filePurpose)
}

export function contentUrlForFileObjectId(fileObjectId: number): string {
  return getFileContentPath(fileObjectId)
}

export {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
}
