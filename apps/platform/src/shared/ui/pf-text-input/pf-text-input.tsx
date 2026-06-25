import {
  type ChangeEvent,
  type InputHTMLAttributes,
  useId,
  useState,
} from 'react'
import { PFText } from '../pf-text'
import cancelIconUrl from '../icons/cancel.svg'
import searchIconUrl from '../icons/search.svg'
import styles from './pf-text-input.module.css'

type PFTextInputSize = 'medium' | 'large' | 'xlarge'

type PFTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: PFTextInputSize
  label?: string
  hasIcon?: boolean
  error?: boolean
  onValueChange?: (value: string) => void
}

const sizeTypographyClassMap: Record<PFTextInputSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
}

export function PFTextInput({
  size = 'medium',
  label,
  hasIcon = false,
  error = false,
  disabled = false,
  id,
  value,
  defaultValue,
  onChange,
  onValueChange,
  className,
  ...props
}: PFTextInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue?.toString() ?? '')
  const currentValue = isControlled ? value?.toString() ?? '' : internalValue
  const shouldShowClearButton = !disabled && (currentValue.length > 0 || error)

  const fieldClassName = [
    styles.field,
    styles[size],
    error ? styles.error : undefined,
    disabled ? styles.disabled : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const inputClassName = [styles.input, sizeTypographyClassMap[size]].join(' ')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(event.target.value)
    }

    onValueChange?.(event.target.value)
    onChange?.(event)
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('')
    }

    onValueChange?.('')
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {label ? (
        <PFText as="label" typo="label-md" color="inherit" className={styles.label} htmlFor={inputId}>
          {label}
        </PFText>
      ) : null}

      <div className={fieldClassName}>
        {hasIcon ? <img className={styles.icon} src={searchIconUrl} alt="" aria-hidden="true" /> : null}
        <input
          id={inputId}
          className={inputClassName}
          disabled={disabled}
          value={currentValue}
          onChange={handleChange}
          {...props}
        />
        {shouldShowClearButton ? (
          <button
            className={styles['clear-button']}
            type="button"
            aria-label="입력 내용 지우기"
            onClick={handleClear}
          >
            <img className={styles['clear-icon']} src={cancelIconUrl} alt="" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
