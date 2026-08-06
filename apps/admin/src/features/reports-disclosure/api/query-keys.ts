import type { ReportKind } from '@/entities/reports-disclosure/model/types'

export const reportsDisclosureQueryKeys = {
  all: ['reports-disclosure'] as const,
  reports: () => [...reportsDisclosureQueryKeys.all, 'reports'] as const,
  reportList: (kind: ReportKind, source: 'remote' | 'local', filterKey: string) =>
    [...reportsDisclosureQueryKeys.reports(), kind, source, filterKey] as const,
  nts: () => [...reportsDisclosureQueryKeys.all, 'nts'] as const,
  ntsDetail: (source: 'remote' | 'local') =>
    [...reportsDisclosureQueryKeys.nts(), source] as const,
}
