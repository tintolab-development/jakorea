import { describe, expect, it } from 'vitest'
import { mapSmsDeliveryToSendHistoryRow } from './sms-delivery-adapters'

describe('mapSmsDeliveryToSendHistoryRow', () => {
  it('uses list renderedContentPreview as content SSOT (no templateDisplayName fallback)', () => {
    const row = mapSmsDeliveryToSendHistoryRow({
      deliveryId: 1,
      templateDisplayName: '템플릿명만',
      renderedContentPreview: '안녕하세요 회원님, 안내드립니다.',
      renderedTitle: 'LMS 제목',
      titleTemplate: '원문 제목',
      smsMessageType: 'LMS',
      sendStatus: 'SENT',
    })
    expect(row?.content).toBe('안녕하세요 회원님, 안내드립니다.')
    expect(row?.subject).toBe('LMS 제목')
    expect(row?.messageType).toBe('LMS')
    expect(row?.templateName).toBe('템플릿명만')
  })

  it('shows - for list content when preview fields absent', () => {
    const row = mapSmsDeliveryToSendHistoryRow({
      deliveryId: 2,
      templateDisplayName: '템플릿명',
      sendStatus: 'SENT',
    })
    expect(row?.content).toBe('-')
    expect(row?.templateName).toBe('템플릿명')
  })

  it('prefers detail preview body over list preview field', () => {
    const row = mapSmsDeliveryToSendHistoryRow(
      {
        deliveryId: 3,
        renderedContentPreview: '목록 요약',
        sendStatus: 'SENT',
      },
      { renderedContent: '상세 본문 전체입니다.' }
    )
    expect(row?.content).toBe('목록 요약')
    expect(row?.bodyText).toBe('상세 본문 전체입니다.')
  })
})
