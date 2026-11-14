/**
 * 양식·문서 발급 API 성공 후 공통 「발급 완료」 안내.
 * `showSaveCompletedAlert` / `showRegisterCompletedAlert`와 대칭 — cmsAlertModal(AlertModal) 1종.
 */

import { MESSAGES } from '@/shared/constants/messages'
import { cmsAlertModal } from './cms-alert-modal-api'

export const ISSUE_COMPLETED_ALERT_TITLE = '발급 완료'

export function showIssueCompletedAlert(options?: {
  onConfirm?: () => void
  /** X·바깥 클릭·Esc로 닫을 때 */
  onDismiss?: () => void
}): void {
  cmsAlertModal.show({
    title: ISSUE_COMPLETED_ALERT_TITLE,
    content: MESSAGES.success.issued,
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
    onDismiss: options?.onDismiss,
  })
}
