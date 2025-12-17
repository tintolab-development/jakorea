/**
 * Material Design 3 TextField React Wrapper
 * Phase 1.2: 기본 입력 필드 컴포넌트
 */

interface MdTextFieldProps {
  label: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'number'
  required?: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
}

export default function MdTextField({
  label,
  value = '',
  onChange,
  type = 'text',
  required = false,
  error,
  disabled = false,
  placeholder,
}: MdTextFieldProps) {
  // Material Design 3 TextField는 웹 컴포넌트이므로 직접 제어가 필요
  // 일단 기본 input으로 구현, 향후 M3 통합 시 개선

  return (
    <div className="md-text-field-container">
      <label className="md-text-field-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`md-text-field ${error ? 'error' : ''}`}
      />
      {error && <div className="md-text-field-error">{error}</div>}
    </div>
  )
}

