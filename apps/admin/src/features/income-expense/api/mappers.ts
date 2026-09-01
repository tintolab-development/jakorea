import type {
  ExpenseCategory,
  FinanceItem,
  FinanceItemCreateInput,
  FinanceSection,
  FinanceViewKind,
} from '@/entities/income-expense/model/types'
import type { FinanceBulkDeleteRequest } from '@/shared/api/generated/ja-korea/schemas/financeBulkDeleteRequest'
import type { FinanceBulkUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/financeBulkUpdateRequest'
import type { FinanceCreateRequest } from '@/shared/api/generated/ja-korea/schemas/financeCreateRequest'
import type { FinanceItemResponse } from '@/shared/api/generated/ja-korea/schemas/financeItemResponse'
import type { FinanceSummaryResponse } from '@/shared/api/generated/ja-korea/schemas/financeSummaryResponse'
import type { FinanceUpdateItem } from '@/shared/api/generated/ja-korea/schemas/financeUpdateItem'

export function toApiSection(section: FinanceSection): 'INCOME' | 'EXPENSE' {
  return section === 'income' ? 'INCOME' : 'EXPENSE'
}

export function toApiView(view: FinanceViewKind): 'CHART' | 'TABLE' {
  return view === 'graph' ? 'CHART' : 'TABLE'
}

export function toApiExpenseCategory(
  category: ExpenseCategory | undefined,
): 'DIRECT_PROGRAM' | 'OTHER' | undefined {
  if (category === 'direct') return 'DIRECT_PROGRAM'
  if (category === 'indirect') return 'OTHER'
  return undefined
}

export function toFeExpenseCategory(
  value: string | undefined,
): ExpenseCategory | undefined {
  if (value === 'DIRECT_PROGRAM') return 'direct'
  if (value === 'OTHER') return 'indirect'
  return undefined
}

export function mapFinanceItemResponseToDomain(row: FinanceItemResponse): FinanceItem {
  const id = row.id != null ? String(row.id) : ''
  const category = toFeExpenseCategory(row.expenseCategory)
  return {
    id,
    name: row.itemName ?? '',
    ratio: Number(row.ratio ?? 0),
    amount: Number(row.amount ?? 0),
    sortOrder: row.displayOrder ?? 0,
    version: row.version ?? 0,
    ...(category ? { category } : {}),
  }
}

export function mapFinanceSummaryToDomain(response: FinanceSummaryResponse): FinanceItem[] {
  return (response.items ?? [])
    .map(mapFinanceItemResponseToDomain)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function toFinanceCreateRequest(input: FinanceItemCreateInput): FinanceCreateRequest {
  const expenseCategory = toApiExpenseCategory(input.category)
  return {
    itemName: input.name.trim(),
    ratio: input.ratio,
    amount: input.amount,
    ...(expenseCategory ? { expenseCategory } : {}),
  }
}

export function toFinanceUpdateItem(row: FinanceItem, displayOrder: number): FinanceUpdateItem {
  const expenseCategory = toApiExpenseCategory(row.category)
  return {
    id: Number(row.id),
    itemName: row.name.trim(),
    ratio: row.ratio,
    amount: row.amount,
    displayOrder,
    version: row.version,
    ...(expenseCategory ? { expenseCategory } : {}),
  }
}

export function toFinanceBulkUpdateRequest(rows: FinanceItem[]): FinanceBulkUpdateRequest {
  return {
    items: rows.map((row, index) => toFinanceUpdateItem(row, index + 1)),
  }
}

export function toFinanceBulkDeleteRequest(rows: FinanceItem[]): FinanceBulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}
