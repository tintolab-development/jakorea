import type { ReactNode } from 'react'
import { JAKOREA_EMAIL_DOMAIN } from '@/features/auth/lib/jakorea-email'
import { CmsButton, CmsInput } from '@/shared/ui'

interface RegisterJakoreaEmailFieldProps {
  value?: string
  onChange?: (value: string) => void
  onCheckDuplicate?: () => void
  label?: ReactNode
  required?: boolean
  message?: ReactNode
  checking?: boolean
  disabled?: boolean
  hasError?: boolean
}

export function RegisterJakoreaEmailField({
  value = '',
  onChange,
  onCheckDuplicate,
  label,
  required = false,
  message,
  checking = false,
  disabled = false,
  hasError = false,
}: RegisterJakoreaEmailFieldProps) {
  return (
    <div className={`register-email-field${label ? ' register-email-field--has-label' : ''}`}>
      <CmsInput
        className="register-email-field__input"
        inputSize="large"
        width="100%"
        label={label}
        required={required}
        message={message}
        value={value}
        onChange={event => onChange?.(event.target.value)}
        placeholder="이메일 아이디"
        disabled={disabled}
        error={hasError}
        autoComplete="username"
      />
      <span className="register-email-field__domain">{JAKOREA_EMAIL_DOMAIN}</span>
      <CmsButton
        variant="secondary"
        size="large" className="register-email-field__check-btn"
        loading={checking}
        disabled={disabled || !value.trim()}
        onClick={onCheckDuplicate} >
        중복확인
      </CmsButton>
    </div>
  )
}
