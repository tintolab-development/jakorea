import { describe, expect, it } from 'vitest'
import { splitSmsTemplateExistingAttachments } from './use-form'

const existing = [
  { attachmentId: 1, fileObjectId: 30001, fileName: 'a.jpg', byteSize: 100 },
  { attachmentId: 2, fileObjectId: 30002, fileName: 'b.jpg', byteSize: 200 },
]

describe('splitSmsTemplateExistingAttachments', () => {
  it('화면에서 지운 기존 첨부만 삭제 대상', () => {
    expect(
      splitSmsTemplateExistingAttachments({
        existing,
        attachmentFileNames: ['b.jpg', 'new.jpg'],
        messageType: 'MMS',
      })
    ).toEqual({ kept: [existing[1]], removedAttachmentIds: [1] })
  })

  it('MMS가 아니면 기존 첨부 전부 삭제 대상', () => {
    expect(
      splitSmsTemplateExistingAttachments({
        existing,
        attachmentFileNames: ['a.jpg', 'b.jpg'],
        messageType: 'LMS',
      }).removedAttachmentIds
    ).toEqual([1, 2])
  })
})
