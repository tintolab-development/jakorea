import { RegisterTermsItemCheckIcon } from './register-terms-check-icon'

interface RegisterTermsCheckControlProps {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
}

export function RegisterTermsCheckControl({
  checked,
  onChange,
  ariaLabel,
}: RegisterTermsCheckControlProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`register-terms-check register-terms-check--item${
        checked ? ' register-terms-check--checked' : ''
      }`}
      onClick={() => onChange(!checked)}
    >
      <RegisterTermsItemCheckIcon checked={checked} />
    </button>
  )
}
