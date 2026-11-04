/** 필수 항목 미입력 Alert — `*` 만 강조색 (CMS 동일 카피) */
import type { ReactNode } from 'react'

export const REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE = '필수 항목 입력 안내'

export const REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE: ReactNode = (
  <>
    입력되지 않은 필수 항목이 있습니다.
    {'\n'}
    &apos;
    <span className="alert-modal__required-asterisk">*</span>
    &apos; 표시된 필수 항목을 모두 작성해 주세요.
  </>
)

export const REQUIRED_FIELDS_INCOMPLETE_ALERT = {
  title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
  content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
} as const
