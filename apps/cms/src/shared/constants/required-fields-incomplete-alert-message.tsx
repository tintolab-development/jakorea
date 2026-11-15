/** 필수 항목 미완 AlertModal 본문 — `*` 만 강조색 */
import type { ReactNode } from 'react'

export const REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE: ReactNode = (
  <>
    입력되지 않은 필수 항목이 있습니다.
    {'\n'}
    &apos;
    <span className="alert-modal__required-asterisk">*</span>
    &apos; 표시된 필수 항목을 모두 작성해 주세요.
  </>
)

/**
 * 필수 항목 미입력 팝업 본문 — 미입력 항목 이름은 나열하지 않고 공통 안내 문구만 보인다(사용자 결정 2026-11-16).
 * 호출부는 그대로 두기 위해 인자를 받되 쓰지 않는다.
 */
export function buildRequiredFieldsIncompleteAlertContent(
  _fieldLabels: readonly string[]
): ReactNode {
  return REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE
}
