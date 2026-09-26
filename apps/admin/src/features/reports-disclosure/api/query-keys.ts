import type { ReportKind } from '@/entities/reports-disclosure/model/types'

export const reportsDisclosureQueryKeys = {
  all: ['reports-disclosure'] as const,
  reports: () => [...reportsDisclosureQueryKeys.all, 'reports'] as const,
  reportList: (kind: ReportKind, filterKey: string) =>
    [...reportsDisclosureQueryKeys.reports(), kind, 'remote', filterKey] as const,
  nts: () => [...reportsDisclosureQueryKeys.all, 'nts'] as const,
  ntsDetail: () => [...reportsDisclosureQueryKeys.nts(), 'remote'] as const,
}
