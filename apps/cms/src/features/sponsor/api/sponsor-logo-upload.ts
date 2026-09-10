import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'

export async function uploadSponsorLogoFile(sponsorId: number, file: File): Promise<number> {
  const owner = buildAdminFileOwner(
    ADMIN_FILE_OWNER.SPONSOR_LOGO,
    sponsorId,
    ADMIN_FILE_PURPOSE.SPONSOR_LOGO
  )
  const uploaded = await uploadAdminFileMaybeMock({ file, owner })
  return uploaded.fileObjectId
}
