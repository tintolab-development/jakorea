import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import chevronDownBlackUrl from '@/shared/assets/icons/chevron-down-black.svg'
import chevronDownGrayUrl from '@/shared/assets/icons/chevron-down-gray.svg'
import { PFText } from '../pf-text'
import cancelIconUrl from '../pf-text-input/icons/cancel.svg'
import styles from './pf-select.module.css'

export type PFSelectSize = 'medium' | 'large' | 'xlarge'
export type PFSelectVariant = 'default' | 'formPage'
export type PFSelectMessageStatus = 'neutral' | 'success' | 'error'

export type PFSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type PFSelectProps = {
  size?: PFSelectSize
  /** Platform 양식 페이지(PFFormPage) 내부 전용 스타일 */
  variant?: PFSelectVariant
  /** 지정 시 루트 width (숫자는 px) */
  width?: number | string
  label?: string
  placeholder?: string
  options: PFSelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
  error?: boolean
  message?: string
  messageStatus?: PFSelectMessageStatus
  className?: string
  style?: CSSProperties
  id?: string
  'aria-label'?: string
}

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

const sizeTypographyClassMap: Record<PFSelectSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
}

const LISTBOX_GAP_PX = 8
const LISTBOX_MAX_HEIGHT_PX = 290
const LISTBOX_MIN_HEIGHT_PX = 160

function computeListboxStyle(field: HTMLElement): CSSProperties {
  const rect = field.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = Math.max(0, viewportHeight - rect.bottom - LISTBOX_GAP_PX)
  const spaceAbove = Math.max(0, rect.top - LISTBOX_GAP_PX)
  const openUpward = spaceAbove > spaceBelow
  const availableHeight = openUpward ? spaceAbove : spaceBelow
  const maxHeight = Math.min(
    LISTBOX_MAX_HEIGHT_PX,
    Math.max(LISTBOX_MIN_HEIGHT_PX, availableHeight || LISTBOX_MIN_HEIGHT_PX),
  )

  return {
    position: 'fixed',
    top: openUpward ? undefined : rect.bottom + LISTBOX_GAP_PX,
    bottom: openUpward ? viewportHeight - rect.top + LISTBOX_GAP_PX : undefined,
    left: rect.left,
    width: Math.max(rect.width, 80),
    maxHeight,
    zIndex: 1100,
  }
}

export function PFSelect({
  size = 'medium',
  variant = 'default',
  width,
  label,
  placeholder = '선택해 주세요',
  options,
  value,
  defaultValue = '',
  onValueChange,
  required = false,
  disabled = false,
  error = false,
  message,
  messageStatus = 'neutral',
  className,
  style,
  id,
  'aria-label': ariaLabel,
}: PFSelectProps) {
  const generatedId = useId()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  /** 트리거 pointerdown으로 연 직후, 같은 이벤트의 capture outside 닫기 무시 */
  const suppressOutsideCloseRef = useRef(false)
  const selectId = id ?? generatedId

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const [listboxStyle, setListboxStyle] = useState<CSSProperties | null>(null)
  const currentValue = isControlled ? value : internalValue
  const selectedOption = options.find(option => option.value === currentValue)
  const hasValue = Boolean(selectedOption)
  const displayLabel = selectedOption?.label ?? placeholder
  const isFormPage = variant === 'formPage'
  const rootStyle = { ...toWidthStyle(width), ...style }

  const rootClassName = [styles.root, className].filter(Boolean).join(' ')
  const fieldClassName = [
    styles.field,
    styles[size],
    isFormPage ? styles.formPage : undefined,
    error ? styles.error : undefined,
    disabled ? styles.disabled : undefined,
    isOpen ? styles.open : undefined,
    hasValue ? styles.completed : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const valueClassName = [
    styles.value,
    isFormPage ? styles.formPageValue : sizeTypographyClassMap[size],
    isFormPage
      ? disabled
        ? styles.formPageValueDisabled
        : hasValue
          ? styles.formPageValueFilled
          : styles.formPageValuePlaceholder
      : hasValue
        ? styles.valueFilled
        : styles.valuePlaceholder,
  ].join(' ')

  const messageStatusClassMap = {
    neutral: styles.messageNeutral,
    success: styles.messageSuccess,
    error: styles.messageError,
  } as const
  const messageClassName = [styles.message, messageStatusClassMap[messageStatus]].join(' ')

  useLayoutEffect(() => {
    if (!isOpen) {
      setListboxStyle(null)
      return
    }

    const updatePosition = () => {
      const field = fieldRef.current
      if (!field) return
      setListboxStyle(computeListboxStyle(field))
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, options.length])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (suppressOutsideCloseRef.current) return
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target) || listboxRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const setValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
  }

  const handleTriggerPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.button !== 0) return
    // click 중복 토글·포커스 스크롤로 인한 즉시 닫힘 방지
    event.preventDefault()
    suppressOutsideCloseRef.current = true
    setIsOpen(prev => !prev)
    window.requestAnimationFrame(() => {
      suppressOutsideCloseRef.current = false
    })
  }

  const handleSelect = (nextValue: string, isDisabled?: boolean) => {
    if (isDisabled) return
    setValue(nextValue)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handleClear = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (disabled) return
    setValue('')
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  const listbox =
    isOpen && listboxStyle ? (
      <ul
        ref={listboxRef}
        className={styles.listbox}
        id={listboxId}
        role="listbox"
        aria-labelledby={selectId}
        style={listboxStyle}
      >
        {options.map(option => {
          const isSelected = option.value === currentValue
          const optionClassName = [
            styles.option,
            'typo-bd-sm-md',
            isSelected ? styles.optionSelected : undefined,
            option.disabled ? styles.optionDisabled : undefined,
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                className={optionClassName}
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => handleSelect(option.value, option.disabled)}
              >
                {option.label}
              </button>
            </li>
          )
        })}
      </ul>
    ) : null

  return (
    <div className={rootClassName} ref={rootRef} style={rootStyle}>
      {label ? (
        <label className={styles.label} htmlFor={selectId}>
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

      <div className={styles.control}>
        <div className={fieldClassName} ref={fieldRef}>
          <button
            ref={triggerRef}
            id={selectId}
            type="button"
            className={styles.trigger}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-label={ariaLabel ?? label}
            aria-required={required || undefined}
            aria-invalid={error || undefined}
            onPointerDown={handleTriggerPointerDown}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className={valueClassName}>{displayLabel}</span>
          </button>

          <span className={styles.trailing}>
            {hasValue ? (
              <button
                type="button"
                className={styles.clearButton}
                aria-label="선택 지우기"
                disabled={disabled}
                onPointerDown={event => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={handleClear}
              >
                <img className={styles.clearIcon} src={cancelIconUrl} alt="" aria-hidden="true" />
              </button>
            ) : null}
            <span className={styles.chevronButton} aria-hidden="true">
              <img
                className={styles.chevron}
                src={hasValue ? chevronDownBlackUrl : chevronDownGrayUrl}
                alt=""
              />
            </span>
          </span>
        </div>
      </div>

      {message ? <p className={messageClassName}>{message}</p> : null}
      {listbox ? createPortal(listbox, document.body) : null}
    </div>
  )
}
