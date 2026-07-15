import { PROGRAM_SORT_OPTIONS } from '../lib/constants'
import type { ProgramSort } from '../model/types'
import styles from './program-sort.module.css'

type ProgramSortOption = {
  key: ProgramSort
  label: string
}

type ProgramSortProps = {
  value: string
  onChange: (value: string) => void
  options?: ProgramSortOption[]
  className?: string
}

export function ProgramSort({
  value,
  onChange,
  options = PROGRAM_SORT_OPTIONS,
  className,
}: ProgramSortProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          className={[styles.option, value === option.key ? styles.optionActive : undefined]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
