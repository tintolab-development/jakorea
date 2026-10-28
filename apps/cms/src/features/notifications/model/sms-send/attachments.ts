import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'

/** 문자 발송 화면에서 올린 MMS 요청 첨부 1건 */
export type SmsSendRequestAttachment = {
  key: string
  fileName: string
  fileSize: number
  /** confirm 후 CLEAN·AVAILABLE 확인된 fileObjectId. 업로드·검사 중이면 null */
  fileObjectId: number | null
  status: 'uploading' | 'ready'
}

/**
 * 발송될 첨부 출처
 * - request: 발송 화면에서 올린 파일만 발송(템플릿 첨부와 합치지 않음)
 * - template: 템플릿 MMS에 등록된 첨부 발송(attachmentFileIds 생략)
 * - none: 첨부 없음
 */
export type SmsSendAttachmentSource = 'request' | 'template' | 'none'

export function resolveSmsSendAttachmentView(input: {
  messageType: SmsMessageType
  templateSelected: boolean
  templateAttachmentFileNames: string[]
  requestAttachments: SmsSendRequestAttachment[]
}): {
  source: SmsSendAttachmentSource
  fileNames: string[]
  attachmentFileIds: number[]
  uploadPending: boolean
} {
  if (input.messageType !== 'MMS') {
    return { source: 'none', fileNames: [], attachmentFileIds: [], uploadPending: false }
  }
  if (input.requestAttachments.length > 0) {
    const attachmentFileIds: number[] = []
    for (const item of input.requestAttachments) {
      if (item.status !== 'ready' || item.fileObjectId == null) continue
      if (!attachmentFileIds.includes(item.fileObjectId)) attachmentFileIds.push(item.fileObjectId)
    }
    return {
      source: 'request',
      fileNames: input.requestAttachments.map(item => item.fileName),
      attachmentFileIds,
      uploadPending: input.requestAttachments.some(
        item => item.status !== 'ready' || item.fileObjectId == null
      ),
    }
  }
  if (input.templateSelected && input.templateAttachmentFileNames.length > 0) {
    return {
      source: 'template',
      fileNames: [...input.templateAttachmentFileNames],
      attachmentFileIds: [],
      uploadPending: false,
    }
  }
  return { source: 'none', fileNames: [], attachmentFileIds: [], uploadPending: false }
}

export const SMS_SEND_TEMPLATE_ATTACHMENT_HINT =
  '템플릿에 등록된 첨부파일이 발송됩니다. 파일을 추가하면 템플릿 첨부파일 대신 추가한 파일만 발송됩니다.'
export const SMS_SEND_REQUEST_ATTACHMENT_OVERRIDE_HINT =
  '추가한 파일만 발송되며, 템플릿에 등록된 첨부파일은 발송되지 않습니다.'
