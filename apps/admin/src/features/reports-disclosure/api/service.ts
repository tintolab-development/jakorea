import type {
  NtsDisclosure,
  ReportCreateInput,
  ReportKind,
  ReportListFilter,
  ReportUpdateInput,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'
import { shouldUseReportsDisclosureRemoteApi } from './capabilities'
import * as store from './store'

function assertLocal(): void {
  if (shouldUseReportsDisclosureRemoteApi()) {
    throw new Error('Reports disclosure remote API is not implemented yet')
  }
}

export async function listReportsService(
  kind: ReportKind,
  filter: ReportListFilter
): Promise<TransparencyReport[]> {
  assertLocal()
  return store.listReports(kind, filter)
}

export async function createReportService(
  kind: ReportKind,
  input: ReportCreateInput
): Promise<TransparencyReport> {
  assertLocal()
  return store.createReport(kind, input)
}

export async function updateReportService(
  kind: ReportKind,
  input: ReportUpdateInput
): Promise<TransparencyReport> {
  assertLocal()
  return store.updateReport(kind, input)
}

export async function removeReportsService(
  kind: ReportKind,
  ids: string[]
): Promise<void> {
  assertLocal()
  store.removeReports(kind, ids)
}

export async function getNtsDisclosureService(): Promise<NtsDisclosure> {
  assertLocal()
  return store.readNtsDisclosure()
}

export async function saveNtsDisclosureService(linkUrl: string): Promise<NtsDisclosure> {
  assertLocal()
  return store.saveNtsDisclosure(linkUrl)
}
