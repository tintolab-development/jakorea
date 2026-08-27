export const settlementQueryKeys = {
  all: ['cms', 'settlement'] as const,
  paymentOrders: {
    all: () => [...settlementQueryKeys.all, 'paymentOrders'] as const,
    lists: () => [...settlementQueryKeys.paymentOrders.all(), 'list'] as const,
    list: (groupBy: 'program' | 'instructor', searchParamsKey: string) =>
      [...settlementQueryKeys.paymentOrders.lists(), groupBy, searchParamsKey] as const,
    statements: () => [...settlementQueryKeys.paymentOrders.all(), 'statements'] as const,
    details: () => [...settlementQueryKeys.paymentOrders.all(), 'detail'] as const,
    detail: (type: 'program' | 'instructor', key: string, dateRangeKey = 'all') =>
      [...settlementQueryKeys.paymentOrders.details(), type, key, dateRangeKey] as const,
    settlement: (settlementId: number) =>
      [...settlementQueryKeys.paymentOrders.all(), 'settlement', settlementId] as const,
  },
  accountPayments: {
    all: () => [...settlementQueryKeys.all, 'accountPayments'] as const,
    lists: () => [...settlementQueryKeys.accountPayments.all(), 'list'] as const,
    list: (searchParamsKey: string) =>
      [...settlementQueryKeys.accountPayments.lists(), searchParamsKey] as const,
    details: () => [...settlementQueryKeys.accountPayments.all(), 'detail'] as const,
    detail: (rowId: string) =>
      [...settlementQueryKeys.accountPayments.details(), rowId] as const,
    budgetSummary: (year: number, fromDate?: string, toDate?: string) =>
      [
        ...settlementQueryKeys.accountPayments.all(),
        'budgetSummary',
        year,
        fromDate ?? '',
        toDate ?? '',
      ] as const,
  },
  calendar: {
    all: () => [...settlementQueryKeys.all, 'calendar'] as const,
    range: (fromDate: string, toDate: string) =>
      [...settlementQueryKeys.calendar.all(), 'range', fromDate, toDate] as const,
    summary: (year: number, month: number) =>
      [...settlementQueryKeys.calendar.all(), 'summary', year, month] as const,
    date: (date: string) => [...settlementQueryKeys.calendar.all(), 'date', date] as const,
  },
  settlementConfigs: {
    all: () => [...settlementQueryKeys.all, 'settlementConfigs'] as const,
    current: () => [...settlementQueryKeys.settlementConfigs.all(), 'current'] as const,
  },
} as const
