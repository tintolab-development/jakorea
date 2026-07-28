import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import chevronDownBlackUrl from '@/shared/assets/icons/chevron-down-black.svg'
import chevronDownGrayUrl from '@/shared/assets/icons/chevron-down-gray.svg'
import { PFText } from '../pf-text'
import cancelIconUrl from '../pf-text-input/icons/cancel.svg'
import styles from './pf-select.module.css'

export type PFSelectSize = 'medium' | 'large' | 'xlarge'
export type PFSelectMessageStatus = 'neutral' | 'success' | 'error'

export type PFSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type PFSelectProps = {
  size?: PFSelectSize
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
  id?: string
  'aria-label'?: string
}

const sizeTypographyClassMap: Record<PFSelectSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
}

export function PFSelect({
  size = 'medium',
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
  id,
  'aria-label': ariaLabel,
}: PFSelectProps) {
  const generatedId = useId()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectId = id ?? generatedId

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const currentValue = isControlled ? value : internalValue
  const selectedOption = options.find(option => option.value === currentValue)
  const hasValue = Boolean(selectedOption)
  const displayLabel = selectedOption?.label ?? placeholder

  const rootClassName = [styles.root, className].filter(Boolean).join(' ')
  const fieldClassName = [
    styles.field,
    styles[size],
    error ? styles.error : undefined,
    disabled ? styles.disabled : undefined,
    isOpen ? styles.open : undefined,
    hasValue ? styles.completed : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const valueClassName = [
    styles.value,
    sizeTypographyClassMap[size],
    hasValue ? styles.valueFilled : styles.valuePlaceholder,
  ].join(' ')

  const messageStatusClassMap = {
    neutral: styles.messageNeutral,
    success: styles.messageSuccess,
    error: styles.messageError,
  } as const
  const messageClassName = [styles.message, messageStatusClassMap[messageStatus]].join(' ')

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const setValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
  }

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(prev => !prev)
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

  return (
    <div className={rootClassName} ref={rootRef}>
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
        <div className={fieldClassName}>
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
            onClick={handleToggle}
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
                onClick={handleClear}
              >
                <img className={styles.clearIcon} src={cancelIconUrl} alt="" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              className={styles.chevronButton}
              tabIndex={-1}
              aria-hidden="true"
              disabled={disabled}
              onClick={handleToggle}
            >
              <img
                className={styles.chevron}
                src={hasValue ? chevronDownBlackUrl : chevronDownGrayUrl}
                alt=""
              />
            </button>
          </span>
        </div>

        {isOpen ? (
          <ul className={styles.listbox} id={listboxId} role="listbox" aria-labelledby={selectId}>
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
        ) : null}
      </div>

      {message ? <p className={messageClassName}>{message}</p> : null}
    </div>
  )
}
