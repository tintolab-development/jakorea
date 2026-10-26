import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(() => true),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn(() => true),
}))

vi.mock('@/features/notifications/api/notifications-api-client', () => ({
  fetchNotificationDeliveriesRemote: vi.fn(),
  fetchNotificationDeliveryRemote: vi.fn(),
  fetchSendBatchDetailRemote: vi.fn(),
}))

import {
  fetchNotificationDeliveryRemote,
  fetchSendBatchDetailRemote,
} from '@/features/notifications/api/notifications-api-client'
import { getSmsSendHistoryDetail } from './sms-send-history-service'

const deliveryMock = vi.mocked(fetchNotificationDeliveryRemote)
const batchMock = vi.mocked(fetchSendBatchDetailRemote)

function mmsDelivery(batchId: number | null) {
  return {
    delivery: {
      deliveryId: 10,
      batchId: batchId as number | undefined,
      smsMessageType: 'MMS',
      sendStatus: 'SENT',
    },
    preview: { attachmentFileNames: ['preview.jpg'] },
  }
}

describe('getSmsSendHistoryDetail', () => {
  beforeEach(() => {
    deliveryMock.mockReset()
    batchMock.mockReset()
  })

  it('batchId가 숫자면 배치 상세 bodySnapshot 첨부를 사용한다', async () => {
    deliveryMock.mockResolvedValue(mmsDelivery(77))
    batchMock.mockResolvedValue({
      bodySnapshot: { attachments: [{ fileName: 'snap.jpg', fileObjectId: 501 }] },
    })

    const row = await getSmsSendHistoryDetail('10')

    expect(batchMock).toHaveBeenCalledWith(77)
    expect(row?.batchId).toBe(77)
    expect(row?.attachments).toEqual([{ fileName: 'snap.jpg', fileObjectId: 501 }])
    expect(row?.attachmentFileNames).toEqual(['snap.jpg'])
  })

  it('batchId가 null이면 배치 API를 호출하지 않는다', async () => {
    deliveryMock.mockResolvedValue(mmsDelivery(null))

    const row = await getSmsSendHistoryDetail('10')

    expect(batchMock).not.toHaveBeenCalled()
    expect(row?.batchId).toBeNull()
    expect(row?.attachmentFileNames).toEqual(['preview.jpg'])
  })

  it('배치 조회 실패·빈 첨부면 preview 첨부를 유지한다', async () => {
    deliveryMock.mockResolvedValue(mmsDelivery(77))
    batchMock.mockRejectedValueOnce(new Error('boom'))
    expect((await getSmsSendHistoryDetail('10'))?.attachmentFileNames).toEqual(['preview.jpg'])

    batchMock.mockResolvedValueOnce({ bodySnapshot: { attachments: [] } })
    expect((await getSmsSendHistoryDetail('10'))?.attachmentFileNames).toEqual(['preview.jpg'])
  })
})
