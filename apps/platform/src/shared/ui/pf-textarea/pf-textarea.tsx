import {
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TextareaHTMLAttributes,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react'
import { PFText } from '../pf-text'
import resizeIconUrl from './icons/resize.svg'
import styles from './pf-textarea.module.css'

export type PFTextareaSize = 'medium' | 'large' | 'xlarge'
export type PFTextareaVariant = 'default' | 'formPage'
export type PFTextareaMessageStatus = 'neutral' | 'success' | 'error'

export type PFTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'width'
> & {
  size?: PFTextareaSize
  /** Platform 양식 페이지(PFFormPage) 내부 전용 스타일 */
  variant?: PFTextareaVariant
  /** 지정 시 루트 width (숫자는 px) */
  width?: number | string
  label?: string
  error?: boolean
  message?: string
  messageStatus?: PFTextareaMessageStatus
  onValueChange?: (value: string) => void
}

const DEFAULT_ROWS = 4

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

const sizeTypographyClassMap: Record<PFTextareaSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
}

function readMinHeightPx(element: HTMLTextAreaElement): number {
  const parsed = Number.parseFloat(getComputedStyle(element).minHeight)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : element.getBoundingClientRect().height
}

export function PFTextarea({
  size = 'medium',
  variant = 'default',
  width,
  label,
  error = false,
  message,
  messageStatus = 'neutral',
  disabled = false,
  required = false,
  rows = DEFAULT_ROWS,
  id,
  value,
  defaultValue,
  onChange,
  onValueChange,
  className,
  style,
  ...props
}: PFTextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue?.toString() ?? '')
  const currentValue = isControlled ? value?.toString() ?? '' : internalValue
  const isFormPage = variant === 'formPage'
  const rootStyle = { ...toWidthStyle(width), ...style }

  const fieldClassName = [
    styles.field,
    error ? styles.error : undefined,
    disabled ? styles.disabled : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const textareaClassName = [
    styles.textarea,
    size !== 'medium' ? styles.textareaLarge : undefined,
    isFormPage ? styles.formPageTextarea : sizeTypographyClassMap[size],
  ]
    .filter(Boolean)
    .join(' ')

  const messageStatusClassMap = {
    neutral: styles.messageNeutral,
    success: styles.messageSuccess,
    error: styles.messageError,
  } as const
  const messageClassName = [styles.message, messageStatusClassMap[messageStatus]].join(' ')

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) {
      setInternalValue(event.target.value)
    }

    onValueChange?.(event.target.value)
    onChange?.(event)
  }

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (disabled) return
      const textarea = textareaRef.current
      if (textarea == null) return

      event.preventDefault()
      const handle = event.currentTarget
      handle.setPointerCapture(event.pointerId)

      const startY = event.clientY
      const startHeight = textarea.getBoundingClientRect().height
      const minHeight = readMinHeightPx(textarea)

      const onPointerMove = (moveEvent: PointerEvent) => {
        const nextHeight = Math.max(minHeight, startHeight + (moveEvent.clientY - startY))
        textarea.style.height = `${nextHeight}px`
      }

      const onPointerUp = (upEvent: PointerEvent) => {
        handle.releasePointerCapture(upEvent.pointerId)
        handle.removeEventListener('pointermove', onPointerMove)
        handle.removeEventListener('pointerup', onPointerUp)
      }

      handle.addEventListener('pointermove', onPointerMove)
      handle.addEventListener('pointerup', onPointerUp)
    },
    [disabled]
  )

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} style={rootStyle}>
      {label ? (
        <label className={styles.label} htmlFor={textareaId}>
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
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={textareaClassName}
          disabled={disabled}
          required={required}
          rows={rows}
          {...props}
          value={currentValue}
          onChange={handleChange}
        />
        <button
          className={styles.resizeHandle}
          type="button"
          disabled={disabled}
          aria-label="입력 영역 높이 조절"
          onPointerDown={handleResizePointerDown}
        >
          <img className={styles.resizeIcon} src={resizeIconUrl} alt="" aria-hidden="true" />
        </button>
      </div>
      {message ? <p className={messageClassName}>{message}</p> : null}
    </div>
  )
}
