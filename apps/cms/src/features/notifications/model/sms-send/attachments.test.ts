import { describe, expect, it } from 'vitest'
import { resolveSmsSendAttachmentView, type SmsSendRequestAttachment } from './attachments'

function ready(key: string, fileObjectId: number, fileName = `${key}.jpg`): SmsSendRequestAttachment {
  return { key, fileName, fileSize: 10, fileObjectId, status: 'ready' }
}

describe('resolveSmsSendAttachmentView', () => {
  it('MMS 템플릿 첨부만 있으면 template 출처, 요청 ID 없음', () => {
    expect(
      resolveSmsSendAttachmentView({
        messageType: 'MMS',
        templateSelected: true,
        templateAttachmentFileNames: ['tpl.jpg'],
        requestAttachments: [],
      })
    ).toEqual({ source: 'template', fileNames: ['tpl.jpg'], attachmentFileIds: [], uploadPending: false })
  })

  it('요청 첨부가 있으면 템플릿 첨부 대신 요청 첨부만(병합 없음, 선택 순서 유지)', () => {
    const view = resolveSmsSendAttachmentView({
      messageType: 'MMS',
      templateSelected: true,
      templateAttachmentFileNames: ['tpl.jpg'],
      requestAttachments: [ready('b', 30002), ready('a', 30001)],
    })
    expect(view.source).toBe('request')
    expect(view.fileNames).toEqual(['b.jpg', 'a.jpg'])
    expect(view.attachmentFileIds).toEqual([30002, 30001])
  })

  it('업로드·검사 중(CLEAN/AVAILABLE 전)이면 pending, ID에서 제외', () => {
    const view = resolveSmsSendAttachmentView({
      messageType: 'MMS',
      templateSelected: false,
      templateAttachmentFileNames: [],
      requestAttachments: [
        ready('a', 30001),
        { key: 'b', fileName: 'b.jpg', fileSize: 10, fileObjectId: null, status: 'uploading' },
      ],
    })
    expect(view.uploadPending).toBe(true)
    expect(view.attachmentFileIds).toEqual([30001])
  })

  it('MMS가 아니면 첨부 없음', () => {
    expect(
      resolveSmsSendAttachmentView({
        messageType: 'LMS',
        templateSelected: true,
        templateAttachmentFileNames: ['tpl.jpg'],
        requestAttachments: [ready('a', 30001)],
      })
    ).toEqual({ source: 'none', fileNames: [], attachmentFileIds: [], uploadPending: false })
  })
})
