import type {
  DetailedProgramBulkChangesRequest,
  DetailedProgramBulkUpdateItem,
} from './bulk-update'
import type { DetailedProgramSavePlan } from './validate-edits'

export type DetailedProgramSaveCall =
  | { kind: 'none' }
  | { kind: 'bulk-update'; items: DetailedProgramBulkUpdateItem[] }
  | { kind: 'bulk-delete'; ids: string[] }
  | { kind: 'bulk-changes'; request: DetailedProgramBulkChangesRequest }

/** 수정+삭제가 함께 있으면 bulk-changes 1회. 한쪽만 있으면 기존 계약. */
export function resolveDetailedProgramSaveCall(
  plan: DetailedProgramSavePlan
): DetailedProgramSaveCall {
  const hasUpdates = plan.updateItems.length > 0
  const hasDeletes = plan.deleteIds.length > 0
  if (hasUpdates && hasDeletes) {
    return {
      kind: 'bulk-changes',
      request: {
        updates: plan.updateItems,
        deleteItems: plan.deleteItems,
      },
    }
  }
  if (hasUpdates) {
    return { kind: 'bulk-update', items: plan.updateItems }
  }
  if (hasDeletes) {
    return { kind: 'bulk-delete', ids: plan.deleteIds }
  }
  return { kind: 'none' }
}
