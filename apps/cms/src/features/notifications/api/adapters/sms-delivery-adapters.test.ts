import { describe, expect, it } from 'vitest'
import {
  mapBatchBodySnapshotAttachments,
  mapSmsDeliveryDetailResponse,
  mapSmsDeliveryToSendHistoryRow,
} from './sms-delivery-adapters'

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

  it('keeps detail recipientContactMasked plaintext without remasking', () => {
    const row = mapSmsDeliveryDetailResponse({
      delivery: {
        deliveryId: 91,
        recipientContactMasked: '010-1234-5678',
        sendStatus: 'SENT',
      },
    })
    expect(row?.receiverPhone).toBe('010-1234-5678')
    expect(row?.receiverInfo).toBe('010-1234-5678')
  })
})
describe('mapBatchBodySnapshotAttachments', () => {
  it('예약 발송 배치 상세의 첨부 스냅샷(fileObjectId·fileName)을 그대로 보여 준다', () => {
    expect(
      mapBatchBodySnapshotAttachments({
        batch: { batchId: 123, status: 'SCHEDULED', scheduledAt: '2026-10-27T01:00:00Z' },
        bodySnapshot: {
          contentTemplate: '교육 안내입니다.',
          attachments: [
            { fileObjectId: 30001, fileName: 'notice.jpg' },
            { fileObjectId: 30002, fileName: 'map.jpg' },
          ],
        },
      })
    ).toEqual([
      { fileObjectId: 30001, fileName: 'notice.jpg' },
      { fileObjectId: 30002, fileName: 'map.jpg' },
    ])
  })

  it('첨부 없음(attachments: [])·누락은 빈 배열', () => {
    expect(mapBatchBodySnapshotAttachments({ bodySnapshot: { attachments: [] } })).toEqual([])
    expect(mapBatchBodySnapshotAttachments({ bodySnapshot: {} })).toEqual([])
    expect(mapBatchBodySnapshotAttachments(null)).toEqual([])
  })
})
