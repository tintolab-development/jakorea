import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFile,
} from '@/shared/lib/admin-file-upload'
import type {
  AdminFileUploadOwner,
  AdminFileUploadPhase,
} from '@/shared/lib/admin-file-upload/types'
import {
  bindEmailAttachmentRemote,
  unbindEmailAttachmentRemote,
} from '@/features/notifications/api/notifications-api-client'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import {
  rejectSmsMmsAttachments,
  smsMmsAttachmentRejectMessage,
} from '@/features/notifications/model/sms-template/attachments'

export const SMS_MMS_REUPLOAD_HINT = '파일을 다시 등록해 주세요.'

/** MMS 템플릿 첨부: NOTIFICATION / SMS_TEMPLATE / {templateId} / MMS_IMAGE */
export function smsTemplateFileOwner(templateId: number): AdminFileUploadOwner {
  return buildAdminFileOwner(ADMIN_FILE_OWNER.SMS_TEMPLATE, templateId, ADMIN_FILE_PURPOSE.MMS_IMAGE)
}

/** 문자 발송 요청 첨부: NOTIFICATION / MMS_BATCH / null / MMS_IMAGE */
export function smsMmsBatchFileOwner(): AdminFileUploadOwner {
  return buildAdminFileOwner(ADMIN_FILE_OWNER.MMS_BATCH, null, ADMIN_FILE_PURPOSE.MMS_IMAGE)
}

/**
 * MMS 이미지 1건 업로드.
 * upload-requests(MMS_IMAGE) → uploadUrl PUT(method·requiredHeaders 그대로) → confirm
 * → GET /api/admin/files/{id} 로 scanStatus CLEAN + uploadStatus AVAILABLE 확인까지 기다린다.
 */
export async function uploadSmsMmsImage(input: {
  file: File
  owner: AdminFileUploadOwner
  onPhaseChange?: (phase: AdminFileUploadPhase) => void
}): Promise<{ fileObjectId: number; fileName: string }> {
  const uploaded = await uploadAdminFile({
    file: input.file,
    owner: input.owner,
    waitUntilAvailable: true,
    onPhaseChange: input.onPhaseChange,
  })
  return { fileObjectId: uploaded.fileObjectId, fileName: input.file.name.trim() }
}

/** 업로드 실패 안내 — BE error.message 우선, 아니면 재업로드 안내를 붙인다. */
export function smsMmsUploadErrorMessage(error: unknown): string {
  const message = getNotificationsApiErrorMessage(error, 'MMS 첨부 파일을 등록하지 못했습니다.')
  return message.includes('다시') ? message : `${message}\n${SMS_MMS_REUPLOAD_HINT}`
}

/** 템플릿 저장 전 사전 검증(형식·용량·개수·파일명·해상도). 최종 검증은 BE. */
async function assertSmsMmsTemplateFiles(files: File[], currentCount: number, currentTotalBytes: number) {
  const result = await rejectSmsMmsAttachments({ incoming: files, currentCount, currentTotalBytes })
  if (result.reason) throw new Error(smsMmsAttachmentRejectMessage(result.reason))
}

/**
 * MMS 템플릿 첨부 업로드 후 연결.
 * POST /api/admin/notification-templates/{templateId}/attachments { fileObjectId }
 */
export async function uploadAndBindSmsTemplateAttachments(
  templateId: number,
  files: File[],
  current: { count: number; totalBytes: number } = { count: 0, totalBytes: 0 }
): Promise<void> {
  if (files.length === 0) return
  await assertSmsMmsTemplateFiles(files, current.count, current.totalBytes)
  const owner = smsTemplateFileOwner(templateId)
  for (const file of files) {
    const uploaded = await uploadSmsMmsImage({ file, owner })
    await bindEmailAttachmentRemote(templateId, { fileObjectId: uploaded.fileObjectId })
  }
}

/**
 * 템플릿 첨부 변경 반영: 삭제 → 신규 업로드·연결.
 * DELETE /api/admin/notification-templates/{templateId}/attachments/{attachmentId}
 */
export async function syncSmsTemplateAttachments(input: {
  templateId: number
  newFiles: File[]
  removedAttachmentIds: number[]
  remaining?: { count: number; totalBytes: number }
}): Promise<void> {
  for (const attachmentId of input.removedAttachmentIds) {
    if (!Number.isFinite(attachmentId)) continue
    await unbindEmailAttachmentRemote(input.templateId, attachmentId)
  }
  await uploadAndBindSmsTemplateAttachments(input.templateId, input.newFiles, input.remaining)
}
