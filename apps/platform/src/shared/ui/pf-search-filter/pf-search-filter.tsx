import { useEffect, useId, useRef, useState } from 'react'
import chevronDownPrimaryUrl from '@/shared/assets/icons/chevron-down-primary.svg'
import styles from './pf-search-filter.module.css'

export type PFSearchFilterOption = {
  value: string
  label: string
  disabled?: boolean
}

export type PFSearchFilterProps = {
  label: string
  options: PFSearchFilterOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function PFSearchFilter({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel,
}: PFSearchFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const selectedOption = options.find((option) => option.value === value)
  const selectedLabel = selectedOption?.label ?? ''

  const rootClassName = [styles.root, isOpen ? styles.open : undefined, className]
    .filter(Boolean)
    .join(' ')

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
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (disabled) return

    setIsOpen((prev) => !prev)
  }

  const handleSelect = (nextValue: string, isDisabled?: boolean) => {
    if (isDisabled || nextValue === value) {
      setIsOpen(false)
      return
    }

    onChange(nextValue)
    setIsOpen(false)
  }

  return (
    <div className={rootClassName} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel ?? `${label} 필터`}
        onClick={handleToggle}
      >
        <span className={styles.label}>{label}</span>
        <span className={styles.trailing}>
          <span className={styles.value}>{selectedLabel}</span>
          <img
            className={styles.chevron}
            src={chevronDownPrimaryUrl}
            alt=""
            aria-hidden="true"
          />
        </span>
      </button>

      <div
        className={[styles['menu-wrapper'], isOpen ? styles['menu-wrapper-open'] : undefined]
          .filter(Boolean)
          .join(' ')}
      >
        <ul
          className={styles.menu}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? `${label} 옵션`}
          aria-hidden={!isOpen}
        >
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled || !isOpen}
                  tabIndex={isOpen ? 0 : -1}
                  className={[styles.option, isSelected ? styles.selected : undefined]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelect(option.value, option.disabled)}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
