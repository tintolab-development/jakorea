export const settlementQueryKeys = {
  all: ['cms', 'settlement'] as const,
  paymentOrders: {
    all: () => [...settlementQueryKeys.all, 'paymentOrders'] as const,
    list: (searchParamsKey: string) =>
      [...settlementQueryKeys.paymentOrders.all(), 'list', searchParamsKey] as const,
    statements: () => [...settlementQueryKeys.paymentOrders.all(), 'statements'] as const,
    detail: (type: 'program' | 'instructor', key: string, dateRangeKey = 'all') =>
      [...settlementQueryKeys.paymentOrders.all(), 'detail', type, key, dateRangeKey] as const,
    settlement: (settlementId: number) =>
      [...settlementQueryKeys.paymentOrders.all(), 'settlement', settlementId] as const,
  },
  accountPayments: {
    all: () => [...settlementQueryKeys.all, 'accountPayments'] as const,
    list: (searchParamsKey: string) =>
      [...settlementQueryKeys.accountPayments.all(), 'list', searchParamsKey] as const,
    detail: (rowId: string) =>
      [...settlementQueryKeys.accountPayments.all(), 'detail', rowId] as const,
    settlement: (settlementId: number) =>
      [...settlementQueryKeys.accountPayments.all(), 'settlement', settlementId] as const,
    exports: () => [...settlementQueryKeys.accountPayments.all(), 'exports'] as const,
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
