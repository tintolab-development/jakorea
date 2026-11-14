import {
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type InputHTMLAttributes,
  useId,
  useState,
} from 'react'
import { PFText } from '../pf-text'
import cancelIconUrl from './icons/cancel.svg'
import searchIconUrl from './icons/search.svg'
import { isCharCountMessage } from '../pf-textarea/is-char-count-message'
import styles from './pf-text-input.module.css'

type PFTextInputSize = 'medium' | 'large' | 'xlarge' | 'mobile'
type PFTextInputVariant = 'default' | 'formPage'
type PFTextInputMessageStatus = 'neutral' | 'success' | 'error'

type PFTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'width'> & {
  size?: PFTextInputSize
  /** Platform 양식 페이지(PFFormPage) 내부 전용 스타일 */
  variant?: PFTextInputVariant
  /** 제목 아래 한 줄 텍스트형(행정정보 1·2번 단락 시안) — field 테두리 없음 */
  appearance?: 'boxed' | 'plain'
  /** 지정 시 루트 width (숫자는 px) */
  width?: number | string
  label?: string
  hasIcon?: boolean
  error?: boolean
  message?: string
  messageStatus?: PFTextInputMessageStatus
  onValueChange?: (value: string) => void
  /** `<input>`에 추가 클래스 (plain·boxed 공통) */
  inputClassName?: string
}

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

const sizeTypographyClassMap: Record<PFTextInputSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
  mobile: 'typo-bd-md-md',
}

export function PFTextInput({
  size = 'medium',
  variant = 'default',
  appearance = 'boxed',
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
  inputClassName,
  style,
  type,
  onFocus,
  onBlur,
  ...props
}: PFTextInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue?.toString() ?? '')
  const [isFocused, setIsFocused] = useState(false)
  const currentValue = isControlled ? value?.toString() ?? '' : internalValue
  const isPassword = type === 'password'
  // 비밀번호 필드는 값이 있고 선택(focus)된 상태에서만 삭제 아이콘을 보여 준다
  const shouldShowClearButton =
    !disabled &&
    (isPassword ? isFocused && currentValue.length > 0 : currentValue.length > 0 || error)
  const isFormPage = variant === 'formPage'
  const rootStyle = { ...toWidthStyle(width), ...style }

  const fieldClassName = [
    'pf-text-input__field',
    styles.field,
    styles[size],
    isFormPage ? styles.formPage : undefined,
    error ? styles.error : undefined,
    disabled ? styles.disabled : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const resolvedInputClassName = [
    'pf-text-input__input',
    styles.input,
    isFormPage ? styles.formPageInput : sizeTypographyClassMap[size],
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ')
  const messageStatusClassMap = {
    neutral: styles.messageNeutral,
    success: styles.messageSuccess,
    error: styles.messageError,
  } as const
  const messageClassName = [
    styles.message,
    messageStatusClassMap[messageStatus],
    isCharCountMessage(message) ? styles.messageEnd : undefined,
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

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    onFocus?.(event)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    onBlur?.(event)
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('')
    }

    onValueChange?.('')
  }

  return (
    <div
      className={['pf-text-input', styles.root, className].filter(Boolean).join(' ')}
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

      {appearance === 'plain' ? (
        <input
          id={inputId}
          className={[resolvedInputClassName, styles.plainInput].filter(Boolean).join(' ')}
          disabled={disabled}
          required={required}
          type={type}
          {...props}
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : (
        <div className={fieldClassName}>
          {hasIcon ? <img className={styles.icon} src={searchIconUrl} alt="" aria-hidden="true" /> : null}
          <input
            id={inputId}
            className={resolvedInputClassName}
            disabled={disabled}
            required={required}
            type={type}
            {...props}
            value={currentValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {shouldShowClearButton ? (
            <button
              className={styles.clearButton}
              type="button"
              aria-label="입력 내용 지우기"
              // 비밀번호 필드는 focus일 때만 아이콘이 보이므로, 누르는 순간 blur로 사라지지 않게 focus를 유지한다
              onMouseDown={isPassword ? event => event.preventDefault() : undefined}
              onClick={handleClear}
            >
              <img className={styles.clearIcon} src={cancelIconUrl} alt="" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      )}
      {message ? <p className={messageClassName}>{message}</p> : null}
    </div>
  )
}
