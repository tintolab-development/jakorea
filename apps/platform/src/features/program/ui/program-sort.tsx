import { PFSort } from '@/shared/ui'
import { PROGRAM_SORT_OPTIONS } from '../lib/constants'
import type { ProgramSort as ProgramSortKey } from '../model/types'

type ProgramSortOption = {
  key: ProgramSortKey
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
  return (
    <PFSort
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      ariaLabel="프로그램 정렬"
    />
  )
}
