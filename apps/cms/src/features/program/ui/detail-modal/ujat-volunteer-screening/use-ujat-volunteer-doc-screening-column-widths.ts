import { useCallback, useMemo, useRef, useState } from 'react'
import {
  UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS,
  UJAT_ESSAY_COLUMN_MIN_WIDTHS,
  type UjatEssayColumnKey,
} from '@/features/program/model/ujat-volunteer-screening-constants'
import {
  computeDocScreeningTableScrollX,
  ESSAY_COLUMN_MAX_WIDTH,
  type UjatEssayColumnWidths,
} from './ujat-volunteer-doc-screening-columns'

const ESSAY_COLUMN_KEYS = Object.keys(
  UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS
) as UjatEssayColumnKey[]

function clampEssayWidth(key: UjatEssayColumnKey, width: number): number {
  const min = UJAT_ESSAY_COLUMN_MIN_WIDTHS[key]
  return Math.min(ESSAY_COLUMN_MAX_WIDTH, Math.max(min, Math.round(width)))
}

export function useUjatVolunteerDocScreeningColumnWidths() {
  const [essayColumnWidths, setEssayColumnWidths] = useState<UjatEssayColumnWidths>(() => ({
    ...UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS,
  }))
  const isResizingRef = useRef(false)

  const handleEssayColumnResizeStart = useCallback(() => {
    isResizingRef.current = true
  }, [])

  const handleEssayColumnResizeStop = useCallback((key: UjatEssayColumnKey, width: number) => {
    isResizingRef.current = false
    setEssayColumnWidths(prev => ({
      ...prev,
      [key]: clampEssayWidth(key, width),
    }))
  }, [])

  const minTableScrollX = useMemo(
    () => computeDocScreeningTableScrollX(essayColumnWidths),
    [essayColumnWidths]
  )

  return {
    essayColumnWidths,
    handleEssayColumnResizeStart,
    handleEssayColumnResizeStop,
    minTableScrollX,
    isResizingRef,
    essayColumnKeys: ESSAY_COLUMN_KEYS,
  }
}
