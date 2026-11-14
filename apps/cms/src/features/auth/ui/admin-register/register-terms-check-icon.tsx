/** 약관 동의 체크 — 시안 `Icon / Etc / Check` 원본 (전체 동의 28 · 항목 24, 켜짐 #00A0AF · 꺼짐 #9FAFB5) */
const TERMS_CHECK_UNCHECKED_FILL = '#9FAFB5'
const TERMS_CHECK_CHECKED_FILL = '#00A0AF'

interface RegisterTermsAgreeAllCheckIconProps {
  checked: boolean
}

export function RegisterTermsAgreeAllCheckIcon({ checked }: RegisterTermsAgreeAllCheckIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className="register-terms-check-icon register-terms-check-icon--agree-all"
      aria-hidden
    >
      <path
        d="M11.142 17.675L21.0295 7.7875C21.2628 7.55417 21.535 7.4375 21.8462 7.4375C22.1573 7.4375 22.4295 7.55417 22.6628 7.7875C22.8962 8.02083 23.0128 8.29792 23.0128 8.61875C23.0128 8.93958 22.8962 9.21667 22.6628 9.45L11.9587 20.1833C11.7253 20.4167 11.4531 20.5333 11.142 20.5333C10.8309 20.5333 10.5587 20.4167 10.3253 20.1833L5.30866 15.1667C5.07532 14.9333 4.96352 14.6562 4.97324 14.3354C4.98296 14.0146 5.10449 13.7375 5.33782 13.5042C5.57116 13.2708 5.84824 13.1542 6.16907 13.1542C6.48991 13.1542 6.76699 13.2708 7.00032 13.5042L11.142 17.675Z"
        fill={checked ? TERMS_CHECK_CHECKED_FILL : TERMS_CHECK_UNCHECKED_FILL}
      />
    </svg>
  )
}

interface RegisterTermsItemCheckIconProps {
  checked: boolean
}

export function RegisterTermsItemCheckIcon({ checked }: RegisterTermsItemCheckIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="register-terms-check-icon register-terms-check-icon--item"
      aria-hidden
    >
      <path
        d="M9.54972 15.15L18.0247 6.675C18.2247 6.475 18.4581 6.375 18.7247 6.375C18.9914 6.375 19.2247 6.475 19.4247 6.675C19.6247 6.875 19.7247 7.1125 19.7247 7.3875C19.7247 7.6625 19.6247 7.9 19.4247 8.1L10.2497 17.3C10.0497 17.5 9.81639 17.6 9.54972 17.6C9.28305 17.6 9.04972 17.5 8.84972 17.3L4.54972 13C4.34972 12.8 4.25389 12.5625 4.26222 12.2875C4.27055 12.0125 4.37472 11.775 4.57472 11.575C4.77472 11.375 5.01222 11.275 5.28722 11.275C5.56222 11.275 5.79972 11.375 5.99972 11.575L9.54972 15.15Z"
        fill={checked ? TERMS_CHECK_CHECKED_FILL : TERMS_CHECK_UNCHECKED_FILL}
      />
    </svg>
  )
}
