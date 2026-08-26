import {
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  useId,
  useState,
} from 'react'
import { PFText } from '../pf-text'
import cancelIconUrl from './icons/cancel.svg'
import searchIconUrl from './icons/search.svg'
import styles from './pf-text-input.module.css'

type PFTextInputSize = 'medium' | 'large' | 'xlarge'
type PFTextInputVariant = 'default' | 'formPage'
type PFTextInputMessageStatus = 'neutral' | 'success' | 'error'

type PFTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'width'> & {
  size?: PFTextInputSize
  /** Platform 양식 페이지(PFFormPage) 내부 전용 스타일 */
  variant?: PFTextInputVariant
  /** 지정 시 루트 width (숫자는 px) */
  width?: number | string
  label?: string
  hasIcon?: boolean
  error?: boolean
  message?: string
  messageStatus?: PFTextInputMessageStatus
  onValueChange?: (value: string) => void
}

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

const sizeTypographyClassMap: Record<PFTextInputSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
}

export function PFTextInput({
  size = 'medium',
  variant = 'default',
  width,
  label,
  hasIcon = false,
  error = false,
  message,
  messageStatus = 'neutral',
  disabled = false,
  required = false,
  id,
  value,
  defaultValue,
  onChange,
  onValueChange,
  className,
  style,
  ...props
}: PFTextInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue?.toString() ?? '')
  const currentValue = isControlled ? value?.toString() ?? '' : internalValue
  const shouldShowClearButton = !disabled && (currentValue.length > 0 || error)
  const isFormPage = variant === 'formPage'
  const rootStyle = { ...toWidthStyle(width), ...style }

  const fieldClassName = [
    styles.field,
    styles[size],
    isFormPage ? styles.formPage : undefined,
    error ? styles.error : undefined,
    disabled ? styles.disabled : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const inputClassName = [
    styles.input,
    isFormPage ? styles.formPageInput : sizeTypographyClassMap[size],
  ].join(' ')
  const messageStatusClassMap = {
    neutral: styles.messageNeutral,
    success: styles.messageSuccess,
    error: styles.messageError,
  } as const
  const messageClassName = [styles.message, messageStatusClassMap[messageStatus]].join(' ')

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
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={rootStyle}
    >
      {label ? (
        <label className={styles.label} htmlFor={inputId}>
          <PFText as="span" typo="label-md" color="inherit" className={styles.labelText}>
            {label}
          </PFText>
          {required ? (
            <span className={styles.requiredMark} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={fieldClassName}>
        {hasIcon ? <img className={styles.icon} src={searchIconUrl} alt="" aria-hidden="true" /> : null}
        <input
          id={inputId}
          className={inputClassName}
          disabled={disabled}
          required={required}
          {...props}
          value={currentValue}
          onChange={handleChange}
        />
        {shouldShowClearButton ? (
          <button
            className={styles.clearButton}
            type="button"
            aria-label="입력 내용 지우기"
            onClick={handleClear}
          >
            <img className={styles.clearIcon} src={cancelIconUrl} alt="" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {message ? <p className={messageClassName}>{message}</p> : null}
    </div>
  )
}
