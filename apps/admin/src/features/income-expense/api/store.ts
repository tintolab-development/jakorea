/**
 * 수입&지출 관리 — localStorage mock
 */

import {
  GraphItemLimitError,
  MAX_GRAPH_ITEMS,
  type ExpenseCategory,
  type FinanceItem,
  type FinanceItemCreateInput,
  type FinanceItemUpdatePatch,
  type FinanceSection,
  type FinanceViewKind,
  type IncomeExpenseFileData,
} from '@/entities/income-expense/model/types'

const STORAGE_KEY = 'admin.jakorea.incomeExpense.v2'

export const INCOME_EXPENSE_CHANGED_EVENT = 'jakorea:income-expense-changed' as const

type StoreFile = {
  version: 2
  data: IncomeExpenseFileData
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function item(
  id: string,
  name: string,
  ratio: number,
  amount: number,
  sortOrder: number,
  category?: ExpenseCategory
): FinanceItem {
  return { id, name, ratio, amount, sortOrder, ...(category ? { category } : {}) }
}

function buildSeedData(): IncomeExpenseFileData {
  return {
    income: {
      graph: [
        item('ig-1', '기업기부금', 98.86, 6_609_656_834, 1),
        item('ig-2', '사업외수익', 0.95, 63_834_713, 2),
        item('ig-3', '개인기부금', 0.18, 12_258_719, 3),
      ],
      table: [
        item('it-1', '기업기부금', 98.86, 6_609_656_834, 1),
        item('it-2', '사업외수익', 0.95, 63_834_713, 2),
        item('it-3', '개인기부금', 0.18, 12_258_719, 3),
      ],
    },
    expense: {
      graph: [
        item('eg-1', '프로그램 운영비', 94.46, 5_679_666_252, 1),
        item('eg-2', '사무비', 4.27, 256_937_982, 2),
        item('eg-3', '사업외비용', 0.79, 47_338_878, 3),
        item('eg-4', '기획/홍보비', 0.2, 12_239_870, 4),
        item('eg-5', '기부모집및관리비', 0.2, 12_049_384, 5),
        item('eg-6', '이사회 운영비', 0.07, 4_492_280, 6),
      ],
      /* 시안 합계: 직접 94.94% / 5,708,447,786 · 이외 5.06% / 304,276,860 · 총 100% / 6,012,724,646 */
      table: [
        item('et-1', '프로그램 운영비 : 디지털리터러시', 67.37, 4_050_715_525, 1, 'direct'),
        item('et-2', '프로그램 운영비 : 경제금융', 6.02, 361_771_007, 2, 'direct'),
        item('et-3', '프로그램 운영비 : 진로취업', 8.5, 511_081_595, 3, 'direct'),
        item('et-4', '프로그램 운영비 : 기업가정신', 12.78, 768_387_379, 4, 'direct'),
        item('et-5', '이사회 운영비', 0.07, 4_492_280, 5, 'direct'),
        item('et-6', '기획/홍보비', 0.2, 12_000_000, 6, 'direct'),
        item('et-7', '사무비', 4.07, 244_726_980, 7, 'indirect'),
        item('et-8', '기부모집및관리비', 0.99, 59_549_880, 8, 'indirect'),
      ],
    },
  }
}

function asString(v: unknown, fb: string): string {
  return typeof v === 'string' ? v : fb
}

function asNumber(v: unknown, fb: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(/,/g, ''))
    if (Number.isFinite(n)) return n
  }
  return fb
}

function normalizeCategory(raw: unknown): ExpenseCategory | undefined {
  if (raw === 'direct' || raw === 'indirect') return raw
  return undefined
}

function normalizeItem(
  raw: Partial<FinanceItem> | null | undefined,
  index: number,
  requireCategory: boolean
): FinanceItem | null {
  if (!raw || typeof raw !== 'object') return null
  const name = asString(raw.name, '').trim()
  if (!name) return null
  const category = normalizeCategory(raw.category)
  if (requireCategory && !category) return null
  return {
    id: asString(raw.id, newId('item')),
    name,
    ratio: asNumber(raw.ratio, 0),
    amount: asNumber(raw.amount, 0),
    sortOrder: asNumber(raw.sortOrder, index + 1),
    ...(category ? { category } : {}),
  }
}

function normalizeList(
  raw: unknown,
  requireCategory: boolean
): FinanceItem[] {
  if (!Array.isArray(raw)) return []
  const items = raw
    .map((row, i) => normalizeItem(row as Partial<FinanceItem>, i, requireCategory))
    .filter((x): x is FinanceItem => x != null)
  return assignSortOrders(items)
}

function normalizeData(raw: Partial<IncomeExpenseFileData> | null | undefined): IncomeExpenseFileData {
  const seed = buildSeedData()
  if (!raw || typeof raw !== 'object') return seed
  return {
    income: {
      graph: raw.income?.graph
        ? normalizeList(raw.income.graph, false)
        : seed.income.graph,
      table: raw.income?.table
        ? normalizeList(raw.income.table, false)
        : seed.income.table,
    },
    expense: {
      graph: raw.expense?.graph
        ? normalizeList(raw.expense.graph, false)
        : seed.expense.graph,
      table: raw.expense?.table
        ? normalizeList(raw.expense.table, true)
        : seed.expense.table,
    },
  }
}

function readFile(): StoreFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 2, data: buildSeedData() }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 2 || !parsed.data) {
      return { version: 2, data: buildSeedData() }
    }
    return { version: 2, data: normalizeData(parsed.data) }
  } catch {
    return { version: 2, data: buildSeedData() }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(INCOME_EXPENSE_CHANGED_EVENT))
}

function ensurePersisted(): StoreFile {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file
}

function getBucket(
  data: IncomeExpenseFileData,
  section: FinanceSection,
  view: FinanceViewKind
): FinanceItem[] {
  return data[section][view]
}

function setBucket(
  data: IncomeExpenseFileData,
  section: FinanceSection,
  view: FinanceViewKind,
  items: FinanceItem[]
): IncomeExpenseFileData {
  return {
    ...data,
    [section]: {
      ...data[section],
      [view]: items,
    },
  }
}

export function assignSortOrders(items: FinanceItem[]): FinanceItem[] {
  return items.map((row, i) => ({ ...row, sortOrder: i + 1 }))
}

export function readFinanceItems(
  section: FinanceSection,
  view: FinanceViewKind
): FinanceItem[] {
  const file = ensurePersisted()
  return getBucket(file.data, section, view).map(row => ({ ...row }))
}

export function createFinanceItem(
  section: FinanceSection,
  view: FinanceViewKind,
  input: FinanceItemCreateInput
): FinanceItem {
  if (view === 'graph') {
    const current = readFinanceItems(section, view)
    if (current.length >= MAX_GRAPH_ITEMS) {
      throw new GraphItemLimitError()
    }
  }

  const file = ensurePersisted()
  const list = getBucket(file.data, section, view)
  const requireCategory = section === 'expense' && view === 'table'
  if (requireCategory && !input.category) {
    throw new Error('구분을 선택해 주세요.')
  }

  const next: FinanceItem = {
    id: newId(section === 'income' ? 'in' : 'ex'),
    name: input.name.trim(),
    ratio: input.ratio,
    amount: input.amount,
    sortOrder: list.length + 1,
    ...(input.category ? { category: input.category } : {}),
  }

  if (!next.name) throw new Error('항목명을 입력해 주세요.')

  const items = assignSortOrders([...list, next])
  writeFile({ version: 2, data: setBucket(file.data, section, view, items) })
  return next
}

export function updateFinanceItems(
  section: FinanceSection,
  view: FinanceViewKind,
  patches: FinanceItemUpdatePatch[]
): FinanceItem[] {
  const file = ensurePersisted()
  const list = getBucket(file.data, section, view)
  const patchMap = new Map(patches.map(p => [p.id, p]))
  const requireCategory = section === 'expense' && view === 'table'

  const items = assignSortOrders(
    list.map(row => {
      const p = patchMap.get(row.id)
      if (!p) return row
      const category = p.category ?? row.category
      if (requireCategory && !category) {
        throw new Error('구분을 선택해 주세요.')
      }
      return {
        ...row,
        name: p.name.trim(),
        ratio: p.ratio,
        amount: p.amount,
        ...(category ? { category } : { category: undefined }),
      }
    })
  )

  writeFile({ version: 2, data: setBucket(file.data, section, view, items) })
  return items.map(r => ({ ...r }))
}

export function removeFinanceItems(
  section: FinanceSection,
  view: FinanceViewKind,
  ids: string[]
): FinanceItem[] {
  const idSet = new Set(ids)
  const file = ensurePersisted()
  const list = getBucket(file.data, section, view)
  const items = assignSortOrders(list.filter(row => !idSet.has(row.id)))
  writeFile({ version: 2, data: setBucket(file.data, section, view, items) })
  return items.map(r => ({ ...r }))
}

export function reorderFinanceItems(
  section: FinanceSection,
  view: FinanceViewKind,
  orderedIds: string[]
): FinanceItem[] {
  const file = ensurePersisted()
  const list = getBucket(file.data, section, view)
  const byId = new Map(list.map(row => [row.id, row]))
  const ordered: FinanceItem[] = []
  for (const id of orderedIds) {
    const row = byId.get(id)
    if (row) {
      ordered.push(row)
      byId.delete(id)
    }
  }
  for (const rest of byId.values()) ordered.push(rest)
  const items = assignSortOrders(ordered)
  writeFile({ version: 2, data: setBucket(file.data, section, view, items) })
  return items.map(r => ({ ...r }))
}
