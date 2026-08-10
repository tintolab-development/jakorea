import { PFSort } from '@/shared/ui'
import { TEXTBOOK_SORT_OPTIONS } from '../lib/constants'
import type { TextbookSort as TextbookSortKey } from '../model/types'

type TextbookSortOption = {
  key: TextbookSortKey
  label: string
}

type TextbookSortProps = {
  value: string
  onChange: (value: string) => void
  options?: TextbookSortOption[]
  className?: string
}

export function TextbookSort({
  value,
  onChange,
  options = TEXTBOOK_SORT_OPTIONS,
  className,
}: TextbookSortProps) {
  return (
    <PFSort
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      ariaLabel="교재 정렬"
    />
  )
}
