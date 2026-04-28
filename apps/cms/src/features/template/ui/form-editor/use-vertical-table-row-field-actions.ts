import { useCallback } from 'react'
import { message } from 'antd'
import type {
  VerticalTableParagraph,
  VerticalTableRow,
} from '@/features/template/model/writing-form-draft.schema'
import {
  normalizeVerticalTableParagraph,
  verticalTableRemoveRow,
  verticalTableRowWithStageCount,
} from '@/features/template/model/writing-form-draft.schema'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'

function patchVerticalRow(
  p: VerticalTableParagraph,
  rowIdx: number,
  patch: (r: VerticalTableRow) => VerticalTableRow
): VerticalTableParagraph {
  const n = normalizeVerticalTableParagraph(p)
  if (rowIdx < 0 || rowIdx >= n.rows.length) return n
  const rows = [...n.rows]
  rows[rowIdx] = patch(rows[rowIdx]!)
  return normalizeVerticalTableParagraph({ ...n, rows })
}

export function useVerticalTableRowFieldActions({
  paragraphId,
  rowIndex,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraphId: string
  rowIndex: number
  updateParagraph: FormUpdateParagraph
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  const deleteRow = useCallback(() => {
    let removed = false
    updateParagraph(paragraphId, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
      const next = verticalTableRemoveRow(cur, rowIndex)
      if (next == null) {
        message.warning('데이터 행은 최소 1개 이상 유지해야 합니다.')
        return cur
      }
      removed = true
      return normalizeVerticalTableParagraph(next)
    })
    if (removed) onBodyRowDeleted?.(Math.max(0, rowIndex - 1))
  }, [onBodyRowDeleted, paragraphId, rowIndex, updateParagraph])

  const setStageCount = useCallback(
    (next: 1 | 2) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
        return patchVerticalRow(cur, rowIndex, r => verticalTableRowWithStageCount(r, next))
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  const setHeader = useCallback(
    (stageIdx: number, value: string) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
        return patchVerticalRow(cur, rowIndex, r => {
          if (r.stageCount === 1) {
            return { stageCount: 1, headers: [value], cells: r.cells, placeholderHints: r.placeholderHints }
          }
          const headers: [string, string] = [...r.headers] as [string, string]
          headers[stageIdx] = value
          const next: VerticalTableRow = {
            stageCount: 2,
            headers,
            cells: r.cells,
            placeholderHints: r.placeholderHints,
          }
          if (r.dateTimeStage1Time !== undefined) {
            next.dateTimeStage1Time = r.dateTimeStage1Time
          }
          return next
        })
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  const setCell = useCallback(
    (stageIdx: number, value: string) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
        return patchVerticalRow(cur, rowIndex, r => {
          if (r.stageCount === 1) {
            return { stageCount: 1, headers: r.headers, cells: [value], placeholderHints: r.placeholderHints }
          }
          const cells: [string, string] = [...r.cells] as [string, string]
          cells[stageIdx] = value
          const next: VerticalTableRow = {
            stageCount: 2,
            headers: r.headers,
            cells,
            placeholderHints: r.placeholderHints,
          }
          if (r.dateTimeStage1Time !== undefined) {
            next.dateTimeStage1Time = r.dateTimeStage1Time
          }
          return next
        })
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  const setPlaceholderHint = useCallback(
    (stageIdx: number, value: string) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
        return patchVerticalRow(cur, rowIndex, r => {
          if (r.stageCount === 1) {
            return {
              stageCount: 1,
              headers: r.headers,
              cells: r.cells,
              placeholderHints: [value],
            }
          }
          const hints: [string, string] = [
            r.placeholderHints?.[0] ?? '',
            r.placeholderHints?.[1] ?? '',
          ]
          hints[stageIdx] = value
          const next: VerticalTableRow = {
            stageCount: 2,
            headers: r.headers,
            cells: r.cells,
            placeholderHints: hints,
          }
          if (r.dateTimeStage1Time !== undefined) {
            next.dateTimeStage1Time = r.dateTimeStage1Time
          }
          return next
        })
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  return {
    deleteRow,
    setStageCount,
    setHeader,
    setCell,
    setPlaceholderHint,
  }
}
