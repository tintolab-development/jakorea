import { type ChangeEvent, type InputHTMLAttributes, useId, useState } from 'react'
import searchMintIconUrl from '@/shared/assets/icons/search-mint.svg'
import searchWarm24IconUrl from './icons/search-warm-24.svg'
import styles from './pf-search-input.module.css'

export type PFSearchInputVariant = 'underline' | 'outlined'

export type PFSearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & {
  variant?: PFSearchInputVariant
  onValueChange?: (value: string) => void
}

export function PFSearchInput({
  variant = 'underline',
  disabled = false,
  id,
  value,
  defaultValue,
  onChange,
  onValueChange,
  className,
  placeholder = '프로그램 검색 (예: 기업가 정신, 금융 문해력)',
  ...props
}: PFSearchInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue?.toString() ?? '')
  const currentValue = isControlled ? (value?.toString() ?? '') : internalValue
  const isCompleted = currentValue.length > 0
  const isOutlined = variant === 'outlined'

  const fieldClassName = [
    styles.field,
    styles[variant],
    isCompleted ? styles.completed : undefined,
    disabled ? styles.disabled : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(event.target.value)
    }

    onValueChange?.(event.target.value)
    onChange?.(event)
  }

  const icon = (
    <img
      className={styles.icon}
      src={isOutlined ? searchWarm24IconUrl : searchMintIconUrl}
      alt=""
      aria-hidden="true"
    />
  )

  return (
    <div className={fieldClassName}>
      {icon}
      <input
        id={inputId}
        type="search"
        className={styles.input}
        disabled={disabled}
        value={currentValue}
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
    </div>
  )
}
