import type { TextbookBusinessAreaRow } from '@/features/textbook/model/business-area.types'

export type BusinessAreaSaveOperation =
  | { kind: 'update'; row: TextbookBusinessAreaRow }
  | { kind: 'create'; row: TextbookBusinessAreaRow }
  | { kind: 'delete'; row: TextbookBusinessAreaRow }

export function planBusinessAreaSave(
  baseline: readonly TextbookBusinessAreaRow[],
  draft: readonly TextbookBusinessAreaRow[]
): BusinessAreaSaveOperation[] {
  const existing = new Map(baseline.map(row => [row.id, row]))
  const draftIds = new Set(draft.map(row => row.id))
  return [
    ...draft.filter(row => existing.has(row.id) && existing.get(row.id)?.name !== row.name)
      .map((row): BusinessAreaSaveOperation => ({ kind: 'update', row })),
    ...draft.filter(row => !existing.has(row.id))
      .map((row): BusinessAreaSaveOperation => ({ kind: 'create', row })),
    ...baseline.filter(row => !draftIds.has(row.id))
      .map((row): BusinessAreaSaveOperation => ({ kind: 'delete', row })),
  ]
}

/**
 * On a partial failure reconcile against fresh server rows and only replay outstanding intent.
 * A request can commit even when the response is lost. Do not duplicate a present name or
 * resurrect a deleted row; do not treat unrelated concurrent additions as intended deletions.
 */
export function rebasePendingBusinessAreaDraft(
  server: readonly TextbookBusinessAreaRow[],
  pending: readonly BusinessAreaSaveOperation[]
): TextbookBusinessAreaRow[] {
  let next = [...server]
  for (const { kind, row } of pending) {
    if (kind === 'update') {
      next = next.map(item => item.id === row.id ? { ...item, name: row.name } : item)
    } else if (kind === 'create') {
      if (!next.some(item => item.name === row.name)) next.push(row)
    } else {
      next = next.filter(item => item.id !== row.id)
    }
  }
  return next
}
