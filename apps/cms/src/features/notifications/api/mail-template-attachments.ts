import { uploadAdminFile } from '@/shared/lib/admin-file-upload'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import {
  bindEmailAttachmentRemote,
  unbindEmailAttachmentRemote,
} from '@/features/notifications/api/notifications-api-client'

/** 메일 템플릿 첨부 files-domain owner. CMS `/api/admin/files/attachments` 바인딩은 사용하지 않는다. */
export const MAIL_TEMPLATE_FILE_OWNER_DOMAIN = 'NOTIFICATION'
export const MAIL_TEMPLATE_FILE_OWNER_TYPE = 'EMAIL_TEMPLATE'
export const MAIL_TEMPLATE_FILE_PURPOSE = 'EMAIL_TEMPLATE_ATTACHMENT'

export function mailTemplateFileOwner(templateId: number): AdminFileUploadOwner {
  return {
    ownerDomain: MAIL_TEMPLATE_FILE_OWNER_DOMAIN,
    ownerType: MAIL_TEMPLATE_FILE_OWNER_TYPE,
    ownerId: templateId,
    filePurpose: MAIL_TEMPLATE_FILE_PURPOSE,
  }
}

/** upload-requests → confirm → CLEAN 후 template attachments bind */
export async function uploadAndBindMailTemplateAttachments(
  templateId: number,
  files: File[]
): Promise<void> {
  if (files.length === 0) return
  const owner = mailTemplateFileOwner(templateId)
  for (const file of files) {
    const uploaded = await uploadAdminFile({
      file,
      owner,
      waitUntilAvailable: true,
    })
    await bindEmailAttachmentRemote(templateId, { fileObjectId: uploaded.fileObjectId })
  }
}

export async function syncMailTemplateAttachments(input: {
  templateId: number
  newFiles: File[]
  removedAttachmentIds: number[]
}): Promise<void> {
  for (const attachmentId of input.removedAttachmentIds) {
    if (!Number.isFinite(attachmentId)) continue
    await unbindEmailAttachmentRemote(input.templateId, attachmentId)
  }
  await uploadAndBindMailTemplateAttachments(input.templateId, input.newFiles)
}
