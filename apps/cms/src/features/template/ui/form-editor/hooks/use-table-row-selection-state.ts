import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  HorizontalTableRowSelection,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

export interface VerticalTableBodyRowSelection {
  paragraphId: string
  row: number
}

export function useTableRowSelectionState({
  paragraphs,
  activeParagraphId,
}: {
  paragraphs: WritingFormParagraph[]
  activeParagraphId: string | null
}) {
  const [horizontalTableRowSelectionsByParagraphId, setHorizontalTableRowSelectionsByParagraphId] =
    useState<Record<string, HorizontalTableRowSelection | null>>({})
  const [verticalTableBodyRowSelection, setVerticalTableBodyRowSelection] =
    useState<VerticalTableBodyRowSelection | null>(null)
  const previousActiveParagraphIdRef = useRef<string | null>(activeParagraphId)

  const onHorizontalTableRowSelectionChange = useCallback(
    (paragraphId: string, next: HorizontalTableRowSelection | null) => {
      setHorizontalTableRowSelectionsByParagraphId(prev => {
        if (next == null) {
          if (!(paragraphId in prev)) return prev
          const { [paragraphId]: _, ...rest } = prev
          return rest
        }
        return { [paragraphId]: next }
      })
      if (next != null) {
        setVerticalTableBodyRowSelection(null)
      }
    },
    []
  )

  const onVerticalTableBodyRowSelectionChange = useCallback(
    (paragraphId: string, row: number | null) => {
      setVerticalTableBodyRowSelection(row == null ? null : { paragraphId, row })
      if (row != null) {
        setHorizontalTableRowSelectionsByParagraphId({})
      }
    },
    []
  )

  useEffect(() => {
    const ids = new Set(paragraphs.map(p => p.id))
    setHorizontalTableRowSelectionsByParagraphId(prev => {
      let changed = false
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        if (!ids.has(k)) {
          delete next[k]
          changed = true
        }
      }
      return changed ? next : prev
    })
    setVerticalTableBodyRowSelection(v => (v != null && !ids.has(v.paragraphId) ? null : v))
  }, [paragraphs])

  useEffect(() => {
    const prev = previousActiveParagraphIdRef.current
    previousActiveParagraphIdRef.current = activeParagraphId
    if (prev === activeParagraphId) return
    if (prev != null) {
      setHorizontalTableRowSelectionsByParagraphId(p => {
        if (!(prev in p)) return p
        const { [prev]: _, ...rest } = p
        return rest
      })
    }
    setVerticalTableBodyRowSelection(null)
  }, [activeParagraphId])

  const activeHorizontalTableRowSelection =
    activeParagraphId != null
      ? (horizontalTableRowSelectionsByParagraphId[activeParagraphId] ?? null)
      : null

  const focusHorizontalTableBodyRow = useCallback(
    (nextRowIndex: number) => {
      if (activeParagraphId == null) return
      setHorizontalTableRowSelectionsByParagraphId(prev => {
        const prevSel = prev[activeParagraphId]
        const col =
          prevSel?.area === 'body' && typeof prevSel.col === 'number' ? prevSel.col : 0
        return {
          ...prev,
          [activeParagraphId]: { area: 'body', row: nextRowIndex, col },
        }
      })
    },
    [activeParagraphId]
  )

  const focusVerticalTableBodyRow = useCallback(
    (nextRowIndex: number) => {
      if (activeParagraphId == null) return
      setVerticalTableBodyRowSelection({ paragraphId: activeParagraphId, row: nextRowIndex })
    },
    [activeParagraphId]
  )

  return {
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
  }
}
