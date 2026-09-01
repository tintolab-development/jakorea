import {
  GraphItemLimitError,
  MAX_GRAPH_ITEMS,
  type FinanceItem,
  type FinanceItemCreateInput,
  type FinanceItemUpdatePatch,
  type FinanceSection,
  type FinanceViewKind,
} from '@/entities/income-expense/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseIncomeExpenseRemoteApi } from './capabilities'
import {
  mapFinanceItemResponseToDomain,
  mapFinanceSummaryToDomain,
  toApiSection,
  toApiView,
  toFinanceBulkDeleteRequest,
  toFinanceBulkUpdateRequest,
  toFinanceCreateRequest,
} from './mappers'
import {
  createFinanceItem as createLocal,
  readFinanceItems,
  removeFinanceItems as removeLocal,
  reorderFinanceItems as reorderLocal,
  updateFinanceItems as updateLocal,
} from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

async function listRemote(
  section: FinanceSection,
  view: FinanceViewKind,
): Promise<FinanceItem[]> {
  const response = await jaKoreaApi().finance(toApiSection(section), toApiView(view))
  return mapFinanceSummaryToDomain(response)
}

async function putRemoteBucket(
  section: FinanceSection,
  view: FinanceViewKind,
  rows: FinanceItem[],
): Promise<FinanceItem[]> {
  const response = await jaKoreaApi().updateFinance(
    toApiSection(section),
    toApiView(view),
    toFinanceBulkUpdateRequest(rows),
  )
  return mapFinanceSummaryToDomain(response)
}

async function resolveBucket(
  section: FinanceSection,
  view: FinanceViewKind,
  cached?: FinanceItem[],
): Promise<FinanceItem[]> {
  if (cached) {
    return [...cached].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return listRemote(section, view)
}

function orderByIds(rows: FinanceItem[], orderedIds: string[]): FinanceItem[] {
  const byId = new Map(rows.map(row => [row.id, row]))
  const ordered: FinanceItem[] = []
  for (const id of orderedIds) {
    const row = byId.get(id)
    if (row) {
      ordered.push(row)
      byId.delete(id)
    }
  }
  for (const row of byId.values()) ordered.push(row)
  return ordered.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

export async function listFinanceItemsService(
  section: FinanceSection,
  view: FinanceViewKind,
): Promise<FinanceItem[]> {
  if (shouldUseIncomeExpenseRemoteApi()) {
    return listRemote(section, view)
  }
  return readFinanceItems(section, view)
}

export async function createFinanceItemService(
  section: FinanceSection,
  view: FinanceViewKind,
  input: FinanceItemCreateInput,
  cached?: FinanceItem[],
): Promise<FinanceItem> {
  if (shouldUseIncomeExpenseRemoteApi()) {
    const current = await resolveBucket(section, view, cached)
    if (view === 'graph' && current.length >= MAX_GRAPH_ITEMS) {
      throw new GraphItemLimitError()
    }
    const created = await jaKoreaApi().createFinance(
      toApiSection(section),
      toApiView(view),
      toFinanceCreateRequest(input),
    )
    return mapFinanceItemResponseToDomain(created)
  }
  return createLocal(section, view, input)
}

export async function updateFinanceItemsService(
  section: FinanceSection,
  view: FinanceViewKind,
  patches: FinanceItemUpdatePatch[],
  cached?: FinanceItem[],
): Promise<FinanceItem[]> {
  if (shouldUseIncomeExpenseRemoteApi()) {
    const current = await resolveBucket(section, view, cached)
    const patchMap = new Map(patches.map(p => [p.id, p]))
    const next = current.map(row => {
      const p = patchMap.get(row.id)
      if (!p) return row
      const category = p.category ?? row.category
      return {
        ...row,
        name: p.name.trim(),
        ratio: p.ratio,
        amount: p.amount,
        ...(category ? { category } : {}),
      }
    })
    return putRemoteBucket(section, view, next)
  }
  return updateLocal(section, view, patches)
}

export async function removeFinanceItemsService(
  section: FinanceSection,
  view: FinanceViewKind,
  ids: string[],
  cached?: FinanceItem[],
): Promise<FinanceItem[]> {
  if (shouldUseIncomeExpenseRemoteApi()) {
    if (ids.length === 0) {
      return resolveBucket(section, view, cached)
    }
    const current = await resolveBucket(section, view, cached)
    const idSet = new Set(ids)
    const targets = current.filter(row => idSet.has(row.id))
    if (targets.length === 0) return current
    const response = await jaKoreaApi().deleteFinance(
      toApiSection(section),
      toApiView(view),
      toFinanceBulkDeleteRequest(targets),
    )
    return mapFinanceSummaryToDomain(response)
  }
  return removeLocal(section, view, ids)
}

export async function reorderFinanceItemsService(
  section: FinanceSection,
  view: FinanceViewKind,
  orderedIds: string[],
  cached?: FinanceItem[],
): Promise<FinanceItem[]> {
  if (shouldUseIncomeExpenseRemoteApi()) {
    const current = await resolveBucket(section, view, cached)
    return putRemoteBucket(section, view, orderByIds(current, orderedIds))
  }
  return reorderLocal(section, view, orderedIds)
}
