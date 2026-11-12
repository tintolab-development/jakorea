import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  bulkChangeDetailedPrograms,
  bulkUpdateDetailedPrograms,
  createDetailedProgram,
  deleteDetailedPrograms,
} from '@/features/detailed-program/api/admin-detailed-programs-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
import {
  applyCreatedToMatchingArrayLists,
  applyDeletedIdsToArrayLists,
  applyDeletedToArrayLists,
  applyUpdatedToMatchingArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'
import { parseDetailedProgramUsageFilter } from '@/features/detailed-program/api/detailed-program-filter-params'

function rowId(row: DetailedProgramManagementRow): string {
  return row.id
}

/** list key suffix: `dp_use=active|inactive&dp_name=...` (전체면 `dp_use` 없음) */
function detailedProgramMatchesListFilter(
  queryKey: readonly unknown[],
  row: DetailedProgramManagementRow
): boolean {
  const raw = queryKey[queryKey.length - 1]
  if (typeof raw !== 'string') return true
  const params = new URLSearchParams(raw)
  const usage = parseDetailedProgramUsageFilter(params.get('dp_use'))
  if (usage === 'active' && !row.active) return false
  if (usage === 'inactive' && row.active) return false
  const nameQ = (params.get('dp_name') ?? '').trim()
  if (nameQ && !row.name.includes(nameQ)) return false
  return true
}

export function useDetailedProgramMutations() {
  const queryClient = useQueryClient()
  const listsKey = dataManagementQueryKeys.detailedPrograms.lists()

  const createMutation = useMutation({
    mutationFn: createDetailedProgram,
    retry: false,
    onSuccess: async created => {
      if (!created.id) {
        await invalidateArrayLists(queryClient, listsKey)
        return
      }
      queryClient.setQueryData(dataManagementQueryKeys.detailedPrograms.detail(created.id), created)
      applyCreatedToMatchingArrayLists(
        queryClient,
        listsKey,
        created,
        rowId,
        detailedProgramMatchesListFilter
      )
    },
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateDetailedPrograms,
    retry: false,
    onSuccess: async updatedRows => {
      if (updatedRows.length === 0) {
        await invalidateArrayLists(queryClient, listsKey)
        return
      }
      for (const updated of updatedRows) {
        if (!updated.id) continue
        queryClient.setQueryData(dataManagementQueryKeys.detailedPrograms.detail(updated.id), updated)
        applyUpdatedToMatchingArrayLists(
          queryClient,
          listsKey,
          updated,
          rowId,
          detailedProgramMatchesListFilter
        )
      }
    },
  })

  const bulkChangesMutation = useMutation({
    mutationFn: bulkChangeDetailedPrograms,
    retry: false,
    onSuccess: async result => {
      for (const updated of result.updated) {
        if (!updated.id) continue
        queryClient.setQueryData(dataManagementQueryKeys.detailedPrograms.detail(updated.id), updated)
        applyUpdatedToMatchingArrayLists(
          queryClient,
          listsKey,
          updated,
          rowId,
          detailedProgramMatchesListFilter
        )
      }
      for (const id of result.deletedIds) {
        queryClient.removeQueries({ queryKey: dataManagementQueryKeys.detailedPrograms.detail(id) })
      }
      applyDeletedIdsToArrayLists(queryClient, listsKey, result.deletedIds, rowId)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDetailedPrograms,
    retry: false,
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: dataManagementQueryKeys.detailedPrograms.detail(id) })
        applyDeletedToArrayLists(queryClient, listsKey, id, rowId)
      }
    },
  })

  return { createMutation, bulkUpdateMutation, bulkChangesMutation, deleteMutation }
}
