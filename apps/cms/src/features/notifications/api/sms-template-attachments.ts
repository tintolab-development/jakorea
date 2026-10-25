import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  createFileAttachment,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import {
  SMS_MMS_ATTACHMENT_MAX_EDGE_PX,
  SMS_MMS_ATTACHMENT_MAX_FILE_BYTES,
  SMS_MMS_ATTACHMENT_MAX_NAME_LENGTH,
  readSmsMmsImageSize,
} from '@/features/notifications/model/sms-template/attachments'

export function smsTemplateFileOwner(templateId: number): AdminFileUploadOwner {
  return buildAdminFileOwner(ADMIN_FILE_OWNER.SMS_TEMPLATE, templateId, ADMIN_FILE_PURPOSE.MMS_IMAGE)
}

async function assertMmsImageFile(file: File): Promise<void> {
  const name = file.name.trim()
  if (name.length > SMS_MMS_ATTACHMENT_MAX_NAME_LENGTH) {
    throw new Error(`첨부 파일명은 ${SMS_MMS_ATTACHMENT_MAX_NAME_LENGTH}자 이하여야 합니다.`)
  }
  const lower = name.toLowerCase()
  if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg')) {
    throw new Error('MMS 첨부는 JPG/JPEG만 가능합니다.')
  }
  if (file.size > SMS_MMS_ATTACHMENT_MAX_FILE_BYTES) {
    throw new Error('MMS 첨부는 파일당 300KB 이하여야 합니다.')
  }
  const size = await readSmsMmsImageSize(file)
  if (
    !size ||
    size.width > SMS_MMS_ATTACHMENT_MAX_EDGE_PX ||
    size.height > SMS_MMS_ATTACHMENT_MAX_EDGE_PX
  ) {
    throw new Error('해상도는 가로·세로 각 1000px 이하여야 합니다.')
  }
}

/** MMS 이미지 prepare → (가능 시) files attachments bind. 메일 템플릿 bind API는 사용하지 않음. */
export async function uploadAndBindSmsTemplateAttachments(
  templateId: number,
  files: File[]
): Promise<void> {
  if (files.length === 0) return
  const owner = smsTemplateFileOwner(templateId)
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    if (!file) continue
    await assertMmsImageFile(file)
    const uploaded = await uploadAdminFileMaybeMock({
      file,
      owner,
      waitUntilAvailable: true,
    })
    await createFileAttachment({
      fileObjectId: uploaded.fileObjectId,
      owner,
      attachmentType: ADMIN_FILE_PURPOSE.MMS_IMAGE,
      displayOrder: index + 1,
    })
  }
}

export async function syncSmsTemplateAttachments(input: {
  templateId: number
  newFiles: File[]
  removedAttachmentIds: number[]
}): Promise<void> {
  // 삭제 API가 SMS 전용으로 확정되기 전에는 신규 업로드만 수행
  void input.removedAttachmentIds
  await uploadAndBindSmsTemplateAttachments(input.templateId, input.newFiles)
}
