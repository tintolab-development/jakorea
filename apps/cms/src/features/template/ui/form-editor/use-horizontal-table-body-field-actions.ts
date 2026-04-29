import { useCallback } from 'react'
import { message } from 'antd'
import type { HorizontalTableColumnField } from '@/features/template/model/writing-form-draft.schema'
import {
  HORIZONTAL_TABLE_MIN_COLUMN_COUNT,
  horizontalTableRemoveColumn,
  horizontalTableRemoveRow,
  horizontalTableUpdateBodyCellColumnField,
} from '@/features/template/model/writing-form-draft.schema'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'

export function useHorizontalTableBodyFieldActions({
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
      if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
      const next = horizontalTableRemoveRow(cur, rowIndex)
      if (next == null) {
        message.warning('데이터 행은 최소 1개 이상 유지해야 합니다.')
        return cur
      }
      removed = true
      return next
    })
    if (removed) onBodyRowDeleted?.(Math.max(0, rowIndex - 1))
  }, [onBodyRowDeleted, paragraphId, rowIndex, updateParagraph])

  const removeColumn = useCallback(
    (columnIndex: number) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
        const next = horizontalTableRemoveColumn(cur, columnIndex)
        if (next == null) {
          message.warning(`열은 최소 ${HORIZONTAL_TABLE_MIN_COLUMN_COUNT}개 이상 유지해야 합니다.`)
          return cur
        }
        return next
      })
    },
    [paragraphId, updateParagraph]
  )

  const setColumnField = useCallback(
    (columnIndex: number, nextField: HorizontalTableColumnField) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'horizontal_table') return cur
        return horizontalTableUpdateBodyCellColumnField(cur, rowIndex, columnIndex, nextField)
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  return {
    deleteRow,
    removeColumn,
    setColumnField,
  }
}
