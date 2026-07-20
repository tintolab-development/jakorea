import type { AdminRegisterGender } from '@/types/admin-register'

interface RegisterGenderToggleProps {
  value?: AdminRegisterGender
  onChange: (value: AdminRegisterGender) => void
  disabled?: boolean
}

export function RegisterGenderToggle({ value, onChange, disabled }: RegisterGenderToggleProps) {
  return (
    <div className="register-gender-toggle" role="group" aria-label="성별">
      <button
        type="button"
        className={`register-gender-toggle__option${
          value === 'male' ? ' register-gender-toggle__option--active' : ''
        }`}
        aria-pressed={value === 'male'}
        disabled={disabled}
        onClick={() => onChange('male')}
      >
        남성
      </button>
      <button
        type="button"
        className={`register-gender-toggle__option${
          value === 'female' ? ' register-gender-toggle__option--active' : ''
        }`}
        aria-pressed={value === 'female'}
        disabled={disabled}
        onClick={() => onChange('female')}
      >
        여성
      </button>
    </div>
  )
}
