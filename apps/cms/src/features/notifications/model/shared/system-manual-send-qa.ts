/**
 * TEMP local QA — SYSTEM/자동발송 알림톡 수동 발송.
 * BE: `ja.notification.qa.system-manual-send-enabled` (local profile only).
 * FE는 Option A를 우회하지 않고, `systemManualSendQaEnabled===true`일 때만 배너 표시.
 */

export const SYSTEM_MANUAL_SEND_QA_BANNER_TEXT =
  '[TEMP QA] 자동발송(SYSTEM) 템플릿 수동 발송이 로컬에서 허용됩니다. 운영 반영 전 플래그를 끄세요.'

export function isSystemManualSendQaEnabled(
  value: boolean | null | undefined
): boolean {
  return value === true
}
