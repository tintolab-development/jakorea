const TERMS_CHECK_UNCHECKED_FILL = '#BBC4C7'
const TERMS_CHECK_AGREE_ALL_CHECKED_FILL = '#337791'
const TERMS_CHECK_ITEM_CHECKED_FILL = '#01A1AF'

interface RegisterTermsAgreeAllCheckIconProps {
  checked: boolean
}

export function RegisterTermsAgreeAllCheckIcon({ checked }: RegisterTermsAgreeAllCheckIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="16"
      viewBox="0 0 21 16"
      fill="none"
      className="register-terms-check-icon register-terms-check-icon--agree-all"
      aria-hidden
    >
      <path
        d="M7.5095 15.4L0 8.08014L2.30879 5.82995L7.5095 10.8993L18.6912 0L21 2.25018L7.5095 15.4Z"
        fill={checked ? TERMS_CHECK_AGREE_ALL_CHECKED_FILL : TERMS_CHECK_UNCHECKED_FILL}
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
      width="15"
      height="11"
      viewBox="0 0 15 11"
      fill="none"
      className="register-terms-check-icon register-terms-check-icon--item"
      aria-hidden
    >
      <path
        d="M5.36393 11L0 5.77153L1.64913 4.16425L5.36393 7.78524L13.3509 0L15 1.60727L5.36393 11Z"
        fill={checked ? TERMS_CHECK_ITEM_CHECKED_FILL : TERMS_CHECK_UNCHECKED_FILL}
      />
    </svg>
  )
}
