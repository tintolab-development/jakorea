/**
 * 강사진 등록 모달 전용 네이티브 select.
 * Ant Design Select 대신 사용해 포커스/box-shadow 깨짐 없이 동일 디자인 유지.
 * Form.Item의 value / onChange와 호환.
 */

export interface NativeSelectOption {
  label: string
  value: string
  disabled?: boolean
}

interface NativeSelectProps {
  value?: string
  onChange?: (value: string) => void
  options: NativeSelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  disabled = false,
}: NativeSelectProps) {
  const displayOptions =
    placeholder != null && placeholder !== ''
      ? [{ label: placeholder, value: '', disabled: true }, ...options]
      : options

  return (
    <select
      className={`add-instructor-modal__native-select ${className}`.trim()}
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled}
      aria-label={placeholder}
    >
      {displayOptions.map(opt => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
