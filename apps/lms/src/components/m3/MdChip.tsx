/**
 * Material Design 3 Chip React Wrapper
 * M3 컴포넌트를 직접 import하여 사용
 */

// M3 Chip 컴포넌트 import
import '@material/web/chips/filter-chip.js'

import { createElement, useId } from 'react'

interface MdChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
}

export default function MdChip({
  label,
  selected = false,
  onClick,
  disabled = false,
}: MdChipProps) {
  const chipId = useId()

  // Chip은 단순히 표시만 하므로 이벤트는 부모에서 처리
  return createElement('md-filter-chip', {
    id: chipId,
    label,
    selected,
    disabled,
    onClick,
  })
}
