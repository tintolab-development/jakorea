import type { FinanceSection, FinanceViewKind } from '@/entities/income-expense/model/types'

export const incomeExpenseQueryKeys = {
  all: ['income-expense'] as const,
  lists: () => [...incomeExpenseQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', section: FinanceSection, view: FinanceViewKind) =>
    [...incomeExpenseQueryKeys.lists(), source, section, view] as const,
}
