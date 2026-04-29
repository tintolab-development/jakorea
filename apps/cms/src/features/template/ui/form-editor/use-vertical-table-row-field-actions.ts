import { useCallback } from 'react'
import { message } from 'antd'
import type {
  DateTimeFieldMode,
  VerticalTableParagraph,
  VerticalTableRow,
  VerticalTableStageKind,
} from '@/features/template/model/writing-form-draft.schema'
import {
  coerceVerticalTableStageKind,
  effectiveVerticalRowDateTimeModes,
  effectiveVerticalStageKinds,
  normalizeVerticalTableParagraph,
  normalizeVerticalTableRow,
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
  rows[rowIdx] = normalizeVerticalTableRow(patch(rows[rowIdx]!))
  return normalizeVerticalTableParagraph({ ...n, rows })
}

/** 세로형 한 행 수정 시 날짜/시간 메타(유형·합성 힌트·보조 시간)를 잃지 않도록 이전 값을 합성 */
function mergeVerticalRow(prev: VerticalTableRow, next: VerticalTableRow): VerticalTableRow {
  const p = prev
  const n = next
  if (n.stageCount !== p.stageCount) return n
  if (n.stageCount === 1) {
    const p1 = p.stageCount === 1 ? p : null
    const out: VerticalTableRow = {
      ...n,
      headers: n.headers,
      cells: n.cells,
    }
    if (
      p1?.stageKinds !== undefined &&
      out.stageCount === 1 &&
      out.stageKinds === undefined
    ) {
      out.stageKinds = [...p1.stageKinds] as [VerticalTableStageKind]
    }
    if (
      p1?.dateTimeSingleStageMode !== undefined &&
      out.stageCount === 1 &&
      out.dateTimeSingleStageMode === undefined
    ) {
      out.dateTimeSingleStageMode = p1.dateTimeSingleStageMode
    }
    if (
      p1?.dateTimeStageModes !== undefined &&
      out.stageCount === 1 &&
      out.dateTimeStageModes === undefined
    ) {
      out.dateTimeStageModes = [...p1.dateTimeStageModes]
    }
    if (
      p1?.dateTimeCompositeTimeHints !== undefined &&
      out.stageCount === 1 &&
      out.dateTimeCompositeTimeHints === undefined
    ) {
      out.dateTimeCompositeTimeHints = [...p1.dateTimeCompositeTimeHints]
    }
    if (
      p1?.dateTimeStage0AuxTime !== undefined &&
      out.stageCount === 1 &&
      out.dateTimeStage0AuxTime === undefined
    ) {
      out.dateTimeStage0AuxTime = p1.dateTimeStage0AuxTime
    }
    if (
      p1?.dateTimeStage1Time !== undefined &&
      out.stageCount === 1 &&
      out.dateTimeStage1Time === undefined
    ) {
      out.dateTimeStage1Time = p1.dateTimeStage1Time
    }
    if (
      p1?.choiceMultipleSelections != null &&
      out.stageCount === 1 &&
      n.choiceMultipleSelections == null
    ) {
      ;(out as VerticalTableRow).choiceMultipleSelections = [[...p1.choiceMultipleSelections[0]]]
    }
    return normalizeVerticalTableRow(out) as VerticalTableRow
  }
  const p2 = p.stageCount === 2 ? p : null
  const out2: VerticalTableRow = {
    ...n,
    headers: n.headers,
    cells: n.cells,
  }
  if (
    p2?.stageKinds !== undefined &&
    out2.stageCount === 2 &&
    out2.stageKinds === undefined
  ) {
    out2.stageKinds = [...p2.stageKinds] as [VerticalTableStageKind, VerticalTableStageKind]
  }
  if (
    p2?.dateTimeStageModes !== undefined &&
    out2.stageCount === 2 &&
    out2.dateTimeStageModes === undefined
  ) {
    out2.dateTimeStageModes = [...p2.dateTimeStageModes]
  }
  if (
    p2?.dateTimeCompositeTimeHints !== undefined &&
    out2.stageCount === 2 &&
    out2.dateTimeCompositeTimeHints === undefined
  ) {
    out2.dateTimeCompositeTimeHints = [...p2.dateTimeCompositeTimeHints]
  }
  if (
    p2?.dateTimeStage1Time !== undefined &&
    out2.stageCount === 2 &&
    out2.dateTimeStage1Time === undefined
  ) {
    out2.dateTimeStage1Time = p2.dateTimeStage1Time
  }
  if (
    p2?.dateTimeStage0AuxTime !== undefined &&
    out2.stageCount === 2 &&
    out2.dateTimeStage0AuxTime === undefined
  ) {
    out2.dateTimeStage0AuxTime = p2.dateTimeStage0AuxTime
  }
  if (
    p2?.choiceMultipleSelections != null &&
    out2.stageCount === 2 &&
    out2.choiceMultipleSelections === undefined
  ) {
    out2.choiceMultipleSelections = [
      [...p2.choiceMultipleSelections[0]],
      [...p2.choiceMultipleSelections[1]],
    ]
  }
  return normalizeVerticalTableRow(out2) as VerticalTableRow
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
        const vtp = normalizeVerticalTableParagraph(cur as VerticalTableParagraph)
        return patchVerticalRow(cur, rowIndex, r =>
          verticalTableRowWithStageCount(r, next, vtp.verticalTableFlavor)
        )
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
            return mergeVerticalRow(r, {
              stageCount: 1,
              headers: [value],
              cells: r.cells,
              placeholderHints: r.placeholderHints,
            })
          }
          const headers: [string, string] = [...r.headers] as [string, string]
          headers[stageIdx] = value
          return mergeVerticalRow(r, {
            stageCount: 2,
            headers,
            cells: r.cells,
            placeholderHints: r.placeholderHints,
          })
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
            return mergeVerticalRow(r, {
              stageCount: 1,
              headers: r.headers,
              cells: [value],
              placeholderHints: r.placeholderHints,
            })
          }
          const cells: [string, string] = [...r.cells] as [string, string]
          cells[stageIdx] = value
          return mergeVerticalRow(r, {
            stageCount: 2,
            headers: r.headers,
            cells,
            placeholderHints: r.placeholderHints,
          })
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
            return mergeVerticalRow(r, {
              stageCount: 1,
              headers: r.headers,
              cells: r.cells,
              placeholderHints: [value],
            })
          }
          const hints: [string, string] = [
            r.placeholderHints?.[0] ?? '',
            r.placeholderHints?.[1] ?? '',
          ]
          hints[stageIdx] = value
          return mergeVerticalRow(r, {
            stageCount: 2,
            headers: r.headers,
            cells: r.cells,
            placeholderHints: hints,
          })
        })
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  const setStageKind = useCallback(
    (stageIdx: number, kind: VerticalTableStageKind) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
        const vtp = normalizeVerticalTableParagraph(cur as VerticalTableParagraph)
        return patchVerticalRow(cur, rowIndex, r => {
          const base = normalizeVerticalTableRow(r) as VerticalTableRow
          const nextKind = coerceVerticalTableStageKind(kind)
          const currentKinds = effectiveVerticalStageKinds(base, vtp.verticalTableFlavor)
          if (base.stageCount === 1) {
            const nextRow = mergeVerticalRow(base, {
              stageCount: 1,
              headers: base.headers,
              cells: base.cells,
              placeholderHints: base.placeholderHints,
              stageKinds: [nextKind],
            })
            return nextRow
          }
          const nextKinds: [VerticalTableStageKind, VerticalTableStageKind] = [
            stageIdx === 0 ? nextKind : currentKinds[0]!,
            stageIdx === 1 ? nextKind : currentKinds[1]!,
          ]
          return mergeVerticalRow(base, {
            stageCount: 2,
            headers: base.headers,
            cells: base.cells,
            placeholderHints: base.placeholderHints,
            stageKinds: nextKinds,
          })
        })
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  const setCompositeTimeHint = useCallback(
    (stageIdx: 0 | 1, value: string) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
        return patchVerticalRow(cur, rowIndex, r => {
          if (r.stageCount === 1) {
            return mergeVerticalRow(r, {
              stageCount: 1,
              headers: r.headers,
              cells: r.cells,
              placeholderHints: r.placeholderHints,
              dateTimeCompositeTimeHints: [value],
            })
          }
          const prev = r.dateTimeCompositeTimeHints
          const tuple: [string, string] = [
            stageIdx === 0 ? value : (prev?.[0] ?? ''),
            stageIdx === 1 ? value : (prev?.[1] ?? ''),
          ]
          return mergeVerticalRow(r, {
            stageCount: 2,
            headers: r.headers,
            cells: r.cells,
            placeholderHints: r.placeholderHints,
            dateTimeCompositeTimeHints: tuple,
          })
        })
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  const setDateTimeStageMode = useCallback(
    (stageIdx: 0 | 1, mode: DateTimeFieldMode) => {
      updateParagraph(paragraphId, cur => {
        if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
        return patchVerticalRow(cur, rowIndex, r => {
          const base = normalizeVerticalTableRow(r) as VerticalTableRow
          if (base.stageCount === 1) {
            return mergeVerticalRow(base, {
              stageCount: 1,
              headers: base.headers,
              cells: base.cells,
              placeholderHints: base.placeholderHints,
              dateTimeStageModes: [mode],
              dateTimeSingleStageMode: mode,
            })
          }
          const curModes = effectiveVerticalRowDateTimeModes(base)
          const nextModes: [DateTimeFieldMode, DateTimeFieldMode] = [
            stageIdx === 0 ? mode : curModes[0]!,
            stageIdx === 1 ? mode : curModes[1]!,
          ]
          return mergeVerticalRow(base, {
            stageCount: 2,
            headers: base.headers,
            cells: base.cells,
            placeholderHints: base.placeholderHints,
            dateTimeStageModes: nextModes,
          })
        })
      })
    },
    [paragraphId, rowIndex, updateParagraph]
  )

  /** @deprecated — `setDateTimeStageMode(0, mode)` 사용 */
  const setDateTimeSingleStageMode = useCallback(
    (mode: DateTimeFieldMode) => {
      setDateTimeStageMode(0, mode)
    },
    [setDateTimeStageMode]
  )

  return {
    deleteRow,
    setStageCount,
    setHeader,
    setCell,
    setStageKind,
    setPlaceholderHint,
    setCompositeTimeHint,
    setDateTimeStageMode,
    setDateTimeSingleStageMode,
  }
}
