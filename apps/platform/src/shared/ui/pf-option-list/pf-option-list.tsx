import { forwardRef, type CSSProperties } from 'react'
import styles from './pf-option-list.module.css'

export type PFOptionListRole = 'listbox' | 'menu'

export type PFOptionListOption = {
  value: string
  label: string
  disabled?: boolean
}

export type PFOptionListProps = {
  options: PFOptionListOption[]
  onSelect: (value: string) => void
  selectedValue?: string
  role?: PFOptionListRole
  id?: string
  className?: string
  style?: CSSProperties
  'aria-labelledby'?: string
  'aria-label'?: string
}

export const PFOptionList = forwardRef<HTMLUListElement, PFOptionListProps>(
  function PFOptionList(
    {
      options,
      onSelect,
      selectedValue,
      role = 'listbox',
      id,
      className,
      style,
      'aria-labelledby': ariaLabelledBy,
      'aria-label': ariaLabel,
    },
    ref,
  ) {
    const isMenu = role === 'menu'
    const listClassName = [styles.list, className].filter(Boolean).join(' ')

    return (
      <ul
        ref={ref}
        className={listClassName}
        id={id}
        role={role}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        style={style}
      >
        {options.map(option => {
          const isSelected = !isMenu && option.value === selectedValue
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
                role={isMenu ? 'menuitem' : 'option'}
                className={optionClassName}
                aria-selected={isMenu ? undefined : isSelected}
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return
                  onSelect(option.value)
                }}
              >
                {option.label}
              </button>
            </li>
          )
        })}
      </ul>
    )
  },
)
