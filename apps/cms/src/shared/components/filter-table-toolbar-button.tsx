/**
 * FilterTableLayout 툴바(actions / actionsAfterExcel) 전용 — 높이 h40 고정 (엑셀 버튼과 동일).
 */

import { forwardRef } from 'react'
import { CmsButton, type CmsButtonProps } from '@/shared/ui/cms-button'

export type FilterTableToolbarButtonProps = Omit<CmsButtonProps, 'size'>

export const FilterTableToolbarButton = forwardRef<
  HTMLButtonElement,
  FilterTableToolbarButtonProps
>((props, ref) => {
  return <CmsButton ref={ref} size="h40" {...props} />
})

FilterTableToolbarButton.displayName = 'FilterTableToolbarButton'
