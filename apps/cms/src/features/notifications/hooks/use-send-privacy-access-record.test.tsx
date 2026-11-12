/** @vitest-environment jsdom */
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/notifications/api/notifications-api-client', () => ({
  recordNotificationSendPrivacyAccessRemote: vi.fn(async () => ({ recordedCount: 1 })),
}))

import { recordNotificationSendPrivacyAccessRemote } from '@/features/notifications/api/notifications-api-client'
import { useSendPrivacyAccessRecord } from '@/features/notifications/hooks/use-send-privacy-access-record'

const record = vi.mocked(recordNotificationSendPrivacyAccessRemote)
const member = (id: number) => ({ id: `actor-MEMBER-${id}`, source: 'program', actorType: 'MEMBER', actorId: id })

describe('useSendPrivacyAccessRecord (CMS-21·22)', () => {
  beforeEach(() => record.mockClear())

  it('발송 화면 수신자 표에 회원 행이 들어오면 SEND_SCREEN을 한 번 기록하고 같은 집합은 다시 기록하지 않는다', async () => {
    const onRecordError = vi.fn()
    const { rerender } = renderHook(props => useSendPrivacyAccessRecord(props), {
      initialProps: { open: true, remote: true, programId: 186046, recipients: [] as ReturnType<typeof member>[], onRecordError },
    })
    expect(record).not.toHaveBeenCalled()

    rerender({ open: true, remote: true, programId: 186046, recipients: [member(1), { id: 'm', source: 'manual' } as never], onRecordError })
    await waitFor(() => expect(record).toHaveBeenCalledTimes(1))
    expect(record).toHaveBeenLastCalledWith({
      event: 'SEND_SCREEN',
      programId: 186046,
      recipients: [{ actorType: 'MEMBER', actorId: 1 }],
    })

    rerender({ open: true, remote: true, programId: 186046, recipients: [member(1)], onRecordError })
    expect(record).toHaveBeenCalledTimes(1)

    // 화면을 닫았다가 행이 있는 상태로 다시 열면 다시 기록한다.
    rerender({ open: false, remote: true, programId: 186046, recipients: [member(1)], onRecordError })
    rerender({ open: true, remote: true, programId: 186046, recipients: [member(1)], onRecordError })
    await waitFor(() => expect(record).toHaveBeenCalledTimes(2))
  })

  it('원격이 아니면 기록하지 않는다', () => {
    renderHook(() =>
      useSendPrivacyAccessRecord({ open: true, remote: false, programId: 1, recipients: [member(1)], onRecordError: vi.fn() })
    )
    expect(record).not.toHaveBeenCalled()
  })

  it('완료 팝업은 batchId로, 실패 팝업은 수신자로 기록하고 기록 실패는 onRecordError로 넘긴다', async () => {
    const onRecordError = vi.fn()
    const { result } = renderHook(() =>
      useSendPrivacyAccessRecord({ open: true, remote: true, programId: 9, recipients: [member(3)], onRecordError })
    )
    await waitFor(() => expect(record).toHaveBeenCalledTimes(1))

    result.current.recordResultPopup(5101)
    expect(record).toHaveBeenLastCalledWith({ event: 'SEND_RESULT_POPUP', batchId: 5101 })

    const auditError = Object.assign(new Error('audit'), { response: { status: 503 } })
    record.mockRejectedValueOnce(auditError)
    result.current.recordFailedPopup()
    expect(record).toHaveBeenLastCalledWith({
      event: 'SEND_RESULT_POPUP',
      programId: 9,
      recipients: [{ actorType: 'MEMBER', actorId: 3 }],
    })
    await waitFor(() => expect(onRecordError).toHaveBeenCalledWith(auditError))

    result.current.recordResultPopup(null)
    expect(record).toHaveBeenCalledTimes(3)
  })
})
