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

function stubFileObjectId(fileSize: number): number {
  return 800_000_001 + (fileSize % 10_000)
}

/**
 * files 모듈 미활성 시 stub id. 활성 시 uploadAdminFile 전체 flow.
 */
export async function uploadAdminFileMaybeMock(input: {
  file: File
  owner: AdminFileUploadOwner
  originalFileName?: string
  waitUntilAvailable?: boolean
}): Promise<UploadAdminFileResult> {
  if (shouldMockAdminFileUpload()) {
    return {
      fileObjectId: stubFileObjectId(input.file.size),
      checksumSha256: '0'.repeat(64),
    }
  }
  return uploadAdminFile({
    file: input.file,
    owner: input.owner,
    originalFileName: input.originalFileName,
    waitUntilAvailable: input.waitUntilAvailable ?? true,
  })
}

export function programFileOwner(
  programId: number,
  filePurpose: AdminFilePurpose
): AdminFileUploadOwner {
  return buildAdminFileOwner(ADMIN_FILE_OWNER.PROGRAM, programId, filePurpose)
}

export function programPostFileOwner(
  postOwnerId: number,
  filePurpose: AdminFilePurpose = ADMIN_FILE_PURPOSE.PROGRAM_POST_ATTACHMENT
): AdminFileUploadOwner {
  return buildAdminFileOwner(ADMIN_FILE_OWNER.PROGRAM_POST, postOwnerId, filePurpose)
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
