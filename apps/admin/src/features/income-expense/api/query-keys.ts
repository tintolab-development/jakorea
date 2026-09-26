import type { FinanceSection, FinanceViewKind } from '@/entities/income-expense/model/types'

export const incomeExpenseQueryKeys = {
  all: ['income-expense'] as const,
  lists: () => [...incomeExpenseQueryKeys.all, 'list'] as const,
  list: (section: FinanceSection, view: FinanceViewKind) =>
    [...incomeExpenseQueryKeys.lists(), 'remote', section, view] as const,
}
