import { useCallback, useEffect, useMemo, useRef } from 'react'
import { recordNotificationSendPrivacyAccessRemote } from '@/features/notifications/api/notifications-api-client'
import {
  sendPrivacyAccessRecipientsKey,
  toSendPrivacyAccessRecipients,
  type SendPrivacyAccessRecipientSource,
} from '@/features/notifications/model/shared/send-privacy-access-record'

/**
 * 정책 CMS-21·22: 발송 화면 수신자 표·발송 결과 팝업 개인정보 조회 기록.
 *
 * - 발송 화면: 표에 MEMBER·ADMIN 행이 들어오거나 바뀔 때, 그리고 행이 있는 상태로 화면을 다시 열 때 기록한다.
 * - 발송 요청 완료 팝업: batchId로 기록(서버가 배치 수신자를 직접 읽는다).
 * - 발송 실패 팝업: 화면의 수신자로 기록.
 * 기록 실패(503 AUDIT_LOG_UNAVAILABLE 등)는 onRecordError로 넘긴다 — 호출자는 기존 수신자 개인정보 게이트에
 * 전달해 원문 연락처를 숨긴다. 기록 호출은 화면 동작을 막지 않는다.
 */
export function useSendPrivacyAccessRecord(input: {
  open: boolean
  remote: boolean
  programId: number | null | undefined
  recipients: readonly SendPrivacyAccessRecipientSource[]
  onRecordError: (error: unknown) => void
}) {
  const { open, remote, programId, recipients, onRecordError } = input
  const onRecordErrorRef = useRef(onRecordError)
  const lastScreenKeyRef = useRef<string | null>(null)

  const accessRecipients = useMemo(() => toSendPrivacyAccessRecipients(recipients), [recipients])
  const screenKey = `${programId ?? ''}|${sendPrivacyAccessRecipientsKey(accessRecipients)}`
  const accessRecipientsRef = useRef(accessRecipients)

  // 최신 값은 렌더가 아니라 effect에서 ref에 반영한다(아래 effect·콜백보다 먼저 실행된다).
  useEffect(() => {
    onRecordErrorRef.current = onRecordError
    accessRecipientsRef.current = accessRecipients
  }, [onRecordError, accessRecipients])

  useEffect(() => {
    if (!open) {
      lastScreenKeyRef.current = null
      return
    }
    if (!remote) return
    const current = accessRecipientsRef.current
    if (current.length === 0) return
    if (lastScreenKeyRef.current === screenKey) return
    lastScreenKeyRef.current = screenKey
    recordNotificationSendPrivacyAccessRemote({
      event: 'SEND_SCREEN',
      ...(programId != null ? { programId } : {}),
      recipients: current,
    }).catch(error => {
      lastScreenKeyRef.current = null
      onRecordErrorRef.current(error)
    })
  }, [open, remote, programId, screenKey])

  const recordResultPopup = useCallback(
    (batchId: number | null | undefined) => {
      if (!remote || batchId == null) return
      recordNotificationSendPrivacyAccessRemote({ event: 'SEND_RESULT_POPUP', batchId }).catch(error =>
        onRecordErrorRef.current(error)
      )
    },
    [remote]
  )

  const recordFailedPopup = useCallback(() => {
    if (!remote) return
    const current = accessRecipientsRef.current
    if (current.length === 0) return
    recordNotificationSendPrivacyAccessRemote({
      event: 'SEND_RESULT_POPUP',
      ...(programId != null ? { programId } : {}),
      recipients: current,
    }).catch(error => onRecordErrorRef.current(error))
  }, [programId, remote])

  return { recordResultPopup, recordFailedPopup }
}
