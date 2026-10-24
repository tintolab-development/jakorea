import { useId, useState } from 'react'
import type { CSSProperties, FocusEventHandler } from 'react'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import {
  applyResidentBackMaskedDisplayChange,
  formatResidentBackMaskedDisplay,
  maskResidentBackForPreview,
  sanitizeResidentBackDigits,
} from '@jakorea/form-schema/consent'
import type { CmsControlSize } from './cms-control-size'
import {
  CmsFieldFrame,
  joinCmsClassNames,
  useCmsFieldStatus,
} from './cms-field'
import type { CmsFieldProps } from './cms-field'
import './cms-resident-back-input.css'

export type CmsResidentBackInputSize = CmsControlSize

export interface CmsResidentBackInputProps extends CmsFieldProps {
  value?: string
  onValueChange?: (value: string) => void
  inputSize?: CmsResidentBackInputSize
  width?: number | string
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  className?: string
  'aria-label'?: string
  onBlur?: FocusEventHandler<HTMLInputElement>
}

export function CmsResidentBackInput({
  value = '',
  onValueChange,
  inputSize = 'large',
  width,
  disabled = false,
  readOnly = false,
  placeholder,
  className,
  label,
  required = false,
  error = false,
  message,
  onBlur,
  'aria-label': ariaLabel = '주민등록번호 뒷자리',
}: CmsResidentBackInputProps) {
  const generatedId = useId()
  const inputId = generatedId
  const messageId = `${generatedId}-message`
  const [revealed, setRevealed] = useState(false)
  const locked = Boolean(disabled || readOnly)
  const digits = sanitizeResidentBackDigits(value)
  const display = locked
    ? maskResidentBackForPreview(value)
    : formatResidentBackMaskedDisplay(digits, revealed)
  const displayHasMask = display.includes('*')
  const hasExplicitWidth = width != null
  const { isError, message: resolvedMessage, hasMessage } = useCmsFieldStatus({
    error,
    message,
    disabled,
  })

  const widthStyle: CSSProperties | undefined =
    width != null ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

  const rootCn = joinCmsClassNames(
    'cms-input',
    'cms-resident-back-input',
    `cms-input--${inputSize}`,
    hasExplicitWidth && 'cms-input--explicit-width',
    hasExplicitWidth && 'cms-field--explicit-width',
    isError && 'cms-input--error',
    className
  )

  const controlCn = joinCmsClassNames(
    'cms-resident-back-input__control',
    'cms-field__box',
    digits.length > 0 && 'cms-field__box--filled',
    disabled && 'cms-field__box--disabled',
    disabled && 'cms-resident-back-input__control--disabled',
    isError && 'cms-field__box--error'
  )

  const toggleDisabled = disabled || readOnly

  return (
    <CmsFieldFrame
      size={inputSize}
      label={label}
      required={required}
      message={resolvedMessage}
      isError={isError}
      htmlFor={inputId}
      messageId={messageId}
      className={rootCn}
      style={widthStyle}
      labelClassName="cms-input__label"
      requiredClassName="cms-input__required"
      messageClassName={joinCmsClassNames(
        'cms-input__message',
        isError && 'cms-input__message--error'
      )}
    >
      <span className={controlCn}>
        <span className="cms-input__inner cms-resident-back-input__inner">
          <input
            id={inputId}
            className="cms-resident-back-input__field"
            type="text"
            inputMode={displayHasMask ? 'text' : 'numeric'}
            autoComplete="off"
            maxLength={7}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            value={display}
            aria-label={ariaLabel}
            aria-invalid={isError || undefined}
            aria-describedby={hasMessage ? messageId : undefined}
            onChange={event => {
              if (locked) return
              const next = applyResidentBackMaskedDisplayChange(
                digits,
                event.target.value,
                revealed
              )
              if (next === digits) return
              onValueChange?.(next)
            }}
            onBlur={onBlur}
          />
        </span>
        <button
          type="button"
          className="cms-resident-back-input__toggle"
          aria-label={revealed ? '뒷자리 숨기기' : '뒷자리 보기'}
          aria-pressed={revealed}
          disabled={toggleDisabled}
          tabIndex={-1}
          onMouseDown={event => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={() => {
            if (toggleDisabled) return
            setRevealed(prev => !prev)
          }}
        >
          {revealed ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        </button>
      </span>
    </CmsFieldFrame>
  )
}
