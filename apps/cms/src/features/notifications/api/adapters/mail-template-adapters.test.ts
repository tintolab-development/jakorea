import { describe, expect, it } from 'vitest'
import {
  mapMailNotificationTemplatePreviewToItem,
  parseMailSenderDisplay,
} from './mail-template-adapters'

describe('mail-template-adapters', () => {
  it('parses senderDisplay name <email>', () => {
    expect(parseMailSenderDisplay('홍길동 <gildong@jakorea.org>')).toEqual({
      senderName: '홍길동',
      senderEmail: 'gildong@jakorea.org',
    })
  })

  it('maps preview senderDisplay and attachments', () => {
    const item = mapMailNotificationTemplatePreviewToItem({
      templateId: 11,
      displayName: '안내 메일',
      titleTemplate: '제목',
      contentTemplate: '<p>본문</p>',
      senderDisplay: '관리자 <admin@jakorea.org>',
      attachments: [
        { attachmentId: 1, fileName: 'a.pdf', byteSize: 100 },
        { attachmentId: 2, fileName: 'b.docx', byteSize: 200 },
      ],
    })

    expect(item?.id).toBe('11')
    expect(item?.subject).toBe('제목')
    expect(item?.senderEmail).toBe('admin@jakorea.org')
    expect(item?.attachmentFileNames).toEqual(['a.pdf', 'b.docx'])
    expect(item?.attachments).toHaveLength(2)
  })
})
