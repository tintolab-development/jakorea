import { useCallback, useMemo, useRef, useState } from 'react'
import {
  computeDocScreeningTableScrollX,
  DEFAULT_ESSAY_COLUMN_WIDTH,
  ESSAY_COLUMN_MAX_WIDTH,
  ESSAY_COLUMN_MIN_WIDTH,
  type UjatEssayColumnKey,
  type UjatEssayColumnWidths,
} from './ujat-volunteer-doc-screening-columns'

const ESSAY_COLUMN_KEYS: UjatEssayColumnKey[] = [
  'essayIntro',
  'essayEducationExperience',
  'essayNecessity',
  'essayJaExperience',
]

const DEFAULT_ESSAY_COLUMN_WIDTHS: UjatEssayColumnWidths = {
  essayIntro: DEFAULT_ESSAY_COLUMN_WIDTH,
  essayEducationExperience: DEFAULT_ESSAY_COLUMN_WIDTH,
  essayNecessity: DEFAULT_ESSAY_COLUMN_WIDTH,
  essayJaExperience: DEFAULT_ESSAY_COLUMN_WIDTH,
}

function clampEssayWidth(width: number): number {
  return Math.min(ESSAY_COLUMN_MAX_WIDTH, Math.max(ESSAY_COLUMN_MIN_WIDTH, Math.round(width)))
}

export function useUjatVolunteerDocScreeningColumnWidths() {
  const [essayColumnWidths, setEssayColumnWidths] =
    useState<UjatEssayColumnWidths>(DEFAULT_ESSAY_COLUMN_WIDTHS)
  const isResizingRef = useRef(false)

  const handleEssayColumnResizeStart = useCallback(() => {
    isResizingRef.current = true
  }, [])

  /** 드래그 종료 시에만 React state 반영 — 드래그 중 전체 테이블 리렌더 방지 */
  const handleEssayColumnResizeStop = useCallback((key: UjatEssayColumnKey, width: number) => {
    isResizingRef.current = false
    setEssayColumnWidths(prev => ({
      ...prev,
      [key]: clampEssayWidth(width),
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
