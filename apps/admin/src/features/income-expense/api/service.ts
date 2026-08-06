import type {
  FinanceItem,
  FinanceItemCreateInput,
  FinanceItemUpdatePatch,
  FinanceSection,
  FinanceViewKind,
} from '@/entities/income-expense/model/types'
import { shouldUseIncomeExpenseRemoteApi } from './capabilities'
import {
  createFinanceItem,
  readFinanceItems,
  removeFinanceItems,
  reorderFinanceItems,
  updateFinanceItems,
} from './store'

const remoteError = 'Income–expense remote API is not implemented yet'

export async function listFinanceItemsService(
  section: FinanceSection,
  view: FinanceViewKind
): Promise<FinanceItem[]> {
  if (shouldUseIncomeExpenseRemoteApi()) throw new Error(remoteError)
  return readFinanceItems(section, view)
}

export async function createFinanceItemService(
  section: FinanceSection,
  view: FinanceViewKind,
  input: FinanceItemCreateInput
): Promise<FinanceItem> {
  if (shouldUseIncomeExpenseRemoteApi()) throw new Error(remoteError)
  return createFinanceItem(section, view, input)
}

export async function updateFinanceItemsService(
  section: FinanceSection,
  view: FinanceViewKind,
  patches: FinanceItemUpdatePatch[]
): Promise<FinanceItem[]> {
  if (shouldUseIncomeExpenseRemoteApi()) throw new Error(remoteError)
  return updateFinanceItems(section, view, patches)
}

export async function removeFinanceItemsService(
  section: FinanceSection,
  view: FinanceViewKind,
  ids: string[]
): Promise<FinanceItem[]> {
  if (shouldUseIncomeExpenseRemoteApi()) throw new Error(remoteError)
  return removeFinanceItems(section, view, ids)
}

export async function reorderFinanceItemsService(
  section: FinanceSection,
  view: FinanceViewKind,
  orderedIds: string[]
): Promise<FinanceItem[]> {
  if (shouldUseIncomeExpenseRemoteApi()) throw new Error(remoteError)
  return reorderFinanceItems(section, view, orderedIds)
}
