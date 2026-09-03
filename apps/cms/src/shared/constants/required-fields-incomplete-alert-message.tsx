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
