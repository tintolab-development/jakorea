import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type {
  UjatEducationProgressRegionRow,
  UjatEducationProgressRegionValues,
  UjatEducationProgressSummaryCellValue,
  UjatEducationProgressSummaryTone,
} from './types'

export const UJAT_EDU_PROGRESS_SUMMARY_TOTAL_COLOR = 'var(--color-mint-01, #01A1AF)'

export const UJAT_EDU_PROGRESS_SUMMARY_TONE_CLASSNAME: Record<
  UjatEducationProgressSummaryTone,
  string
> = {
  h1: 'ujat-edu-progress-summary__cell--tone-h1',
  h2: 'ujat-edu-progress-summary__cell--tone-h2',
  grand: 'ujat-edu-progress-summary__cell--tone-grand',
} as const

export const UJAT_EDU_PROGRESS_SUMMARY_TOTAL_CELL_CLASSNAME =
  'ujat-edu-progress-summary__cell--total'

const numberFormatter = new Intl.NumberFormat('ko-KR')

export function formatSummaryCellValue(
  value: UjatEducationProgressSummaryCellValue
): string {
  if (value == null) return '-'
  return numberFormatter.format(value)
}

export function sumRegionValues(
  values: UjatEducationProgressRegionValues
): UjatEducationProgressSummaryCellValue {
  const nums = listUjatEducationRegionsActive()
    .map(region => values[region.key as UjatInstitutionApplicationRegionKey])
    .filter((v): v is number => v != null)
  if (nums.length === 0) return null
  return nums.reduce((acc, n) => acc + n, 0)
}

export function buildRegionRow(
  regions: UjatEducationProgressRegionValues,
  total?: UjatEducationProgressSummaryCellValue
): UjatEducationProgressRegionRow {
  const resolvedTotal = total ?? sumRegionValues(regions)
  return { regions, total: resolvedTotal }
}

export function summaryToneClassName(
  tone: UjatEducationProgressSummaryTone | undefined
): string | undefined {
  if (!tone) return undefined
  return UJAT_EDU_PROGRESS_SUMMARY_TONE_CLASSNAME[tone]
}

export function regionValuesInOrder(
  row: UjatEducationProgressRegionRow
): UjatEducationProgressSummaryCellValue[] {
  return listUjatEducationRegionsActive().map(region =>
    row.regions[region.key as UjatInstitutionApplicationRegionKey]
  )
}
