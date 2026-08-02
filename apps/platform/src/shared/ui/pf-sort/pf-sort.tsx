import styles from './pf-sort.module.css'

export type PFSortOption = {
  key: string
  label: string
  disabled?: boolean
}

export type PFSortProps = {
  options: PFSortOption[]
  value: string
  onChange: (key: string) => void
  className?: string
  ariaLabel?: string
}

export function PFSort({
  options,
  value,
  onChange,
  className,
  ariaLabel = '정렬',
}: PFSortProps) {
  if (options.length === 0) return null

  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  const handleSelect = (key: string, disabled?: boolean) => {
    if (disabled || key === value) return
    onChange(key)
  }

  return (
    <div className={rootClassName} role="group" aria-label={ariaLabel}>
      {options.map(option => {
        const isActive = option.key === value

        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isActive}
            disabled={option.disabled}
            className={[
              styles.option,
              'typo-bd-md-sb',
              isActive ? styles.optionActive : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleSelect(option.key, option.disabled)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
