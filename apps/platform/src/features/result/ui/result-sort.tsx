import { PFSort } from '@/shared/ui'
import { RESULT_SORT_OPTIONS } from '../lib/constants'
import type { ResultSort as ResultSortKey } from '../model/types'

type ResultSortOption = {
  key: ResultSortKey
  label: string
}

type ResultSortProps = {
  value: string
  onChange: (value: string) => void
  options?: ResultSortOption[]
  className?: string
}

export function ResultSort({
  value,
  onChange,
  options = RESULT_SORT_OPTIONS,
  className,
}: ResultSortProps) {
  return (
    <PFSort
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      ariaLabel="결과 발표 정렬"
    />
  )
}
