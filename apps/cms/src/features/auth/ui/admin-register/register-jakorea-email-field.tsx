import { Input } from 'antd'

import { JAKOREA_EMAIL_DOMAIN } from '@/features/auth/lib/jakorea-email'
import { CmsButton } from '@/shared/ui'

interface RegisterJakoreaEmailFieldProps {
  value?: string
  onChange?: (value: string) => void
  onCheckDuplicate?: () => void
  checking?: boolean
  disabled?: boolean
  hasError?: boolean
}

export function RegisterJakoreaEmailField({
  value = '',
  onChange,
  onCheckDuplicate,
  checking = false,
  disabled = false,
  hasError = false,
}: RegisterJakoreaEmailFieldProps) {
  return (
    <div className="register-email-field">
      <Input
        className={`register-email-field__input${hasError ? ' register-email-field__input--error' : ''}`}
        value={value}
        onChange={event => onChange?.(event.target.value)}
        placeholder="이메일 아이디"
        disabled={disabled}
        autoComplete="username"
      />
      <span className="register-email-field__domain">{JAKOREA_EMAIL_DOMAIN}</span>
      <CmsButton
        variant="secondary"
        size="large"
        width={120}
        className="register-email-field__check-btn"
        loading={checking}
        disabled={disabled || !value.trim()}
        onClick={onCheckDuplicate}
      >
        중복확인
      </CmsButton>
    </div>
  )
}
