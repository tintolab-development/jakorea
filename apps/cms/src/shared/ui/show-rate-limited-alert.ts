/**
 * 짧은 시간 반복 요청으로 서버가 처리를 제한(429 등)했을 때의 공통 「처리 제한 안내」.
 * 시안 16909-166437 — `showIssueCompletedAlert`와 같은 cmsAlertModal(AlertModal) 1종.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export const RATE_LIMITED_ALERT_TITLE = '처리 제한 안내'

export const RATE_LIMITED_ALERT_CONTENT =
  '짧은 시간 동안 요청을 반복하여 처리가 제한되었습니다.\n잠시 후 다시 시도해 주세요.'

export function showRateLimitedAlert(options?: { onConfirm?: () => void }): void {
  cmsAlertModal.show({
    title: RATE_LIMITED_ALERT_TITLE,
    content: RATE_LIMITED_ALERT_CONTENT,
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
