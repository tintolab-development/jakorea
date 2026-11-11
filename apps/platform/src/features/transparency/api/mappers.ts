/**
 * 공개 투명경영 — Public*Response → 화면 모델.
 * 아이콘·커버 그라디언트·그룹 라벨은 프론트 고정. 금액·문구·색은 API.
 */

import type {
  ExpenseDetailGroup,
  FinanceSlice,
  FinanceSummary,
  TransparencyPrinciple,
  TransparencyPrincipleIcon,
  TransparencyReport,
  TransparencyReportType,
} from '../model/types'
import type {
  PublicFinanceItemResponse,
  PublicFinanceSummaryResponse,
  PublicPrincipleResponse,
  PublicReportResponse,
  PublicReportListPage,
  PublicTransparencyResponse,
} from './types'

/** 아이콘은 displayOrder가 아니라 행 id / iconCode에 고정. */
const PRINCIPLE_ICON_BY_ID: Record<number, TransparencyPrincipleIcon> = {
  1: 'audit',
  2: 'governance',
  3: 'privacy',
  4: 'asset',
  5: 'partnership',
}

const PRINCIPLE_ICON_BY_CODE: Record<string, TransparencyPrincipleIcon> = {
  TRANSPARENCY_PRINCIPLE_1: 'audit',
  TRANSPARENCY_PRINCIPLE_2: 'governance',
  TRANSPARENCY_PRINCIPLE_3: 'privacy',
  TRANSPARENCY_PRINCIPLE_4: 'asset',
  TRANSPARENCY_PRINCIPLE_5: 'partnership',
}

/** colorHex 없을 때만 — 시드 팔레트를 프론트에 복제하지 않음 */
const MISSING_SLICE_COLOR = '#9ca3af'

export type TransparencyPageContent = {
  heroLabel: string
  heroTitle: string
  principles: TransparencyPrinciple[]
  revenueSummary: FinanceSummary
  expenseSummary: FinanceSummary
  revenueOrder: readonly string[]
  expenseGroups: ExpenseDetailGroup[]
  disclosureUrl: string
}

export type TransparencyReportsListResult = {
  items: TransparencyReport[]
  totalCount: number
  totalPages: number
  currentPage: number
}

function asText(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asAmount(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function formatPercent(ratio: number | undefined | null): string {
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return '0.00'
  return ratio.toFixed(2)
}

function splitDescription(subText: string): string[] {
  const trimmed = subText.trim()
  if (!trimmed) return []
  /** Admin CmsTextArea `\n` · Figma soft break `\u2028` 모두 문단 경계 */
  const byBreak = trimmed
    .split(/\r\n|\n|\u2028/)
    .map(line => line.trim())
    .filter(Boolean)
  if (byBreak.length > 1) return byBreak
  return [trimmed]
}

function resolvePrincipleIcon(row: PublicPrincipleResponse): TransparencyPrincipleIcon {
  if (row.iconCode && PRINCIPLE_ICON_BY_CODE[row.iconCode]) {
    return PRINCIPLE_ICON_BY_CODE[row.iconCode]
  }
  if (row.id != null && PRINCIPLE_ICON_BY_ID[row.id]) {
    return PRINCIPLE_ICON_BY_ID[row.id]
  }
  if (row.itemCode === 'PRINCIPLE_1' || row.itemCode === 'TRANSPARENCY_PRINCIPLE_1') {
    return 'audit'
  }
  if (row.itemCode === 'PRINCIPLE_2' || row.itemCode === 'TRANSPARENCY_PRINCIPLE_2') {
    return 'governance'
  }
  if (row.itemCode === 'PRINCIPLE_3' || row.itemCode === 'TRANSPARENCY_PRINCIPLE_3') {
    return 'privacy'
  }
  if (row.itemCode === 'PRINCIPLE_4' || row.itemCode === 'TRANSPARENCY_PRINCIPLE_4') {
    return 'asset'
  }
  if (row.itemCode === 'PRINCIPLE_5' || row.itemCode === 'TRANSPARENCY_PRINCIPLE_5') {
    return 'partnership'
  }
  throw new Error(`Unknown public principle icon for id=${row.id ?? '?'}`)
}

function slugifyId(label: string, fallback: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, '-')
    .replace(/^-|-$/g, '')
  return slug || fallback
}

function mapFinanceSlices(
  items: PublicFinanceItemResponse[] | undefined,
): FinanceSlice[] {
  const rows = [...(items ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  return rows.map((row, index) => {
    const label = asText(row.itemName) || `항목 ${index + 1}`
    return {
      id: row.id != null ? String(row.id) : slugifyId(label, `slice-${index + 1}`),
      label,
      percent: formatPercent(row.ratio),
      amount: asAmount(row.amount),
      color: asText(row.colorHex) || MISSING_SLICE_COLOR,
    }
  })
}

function mapFinanceSummary(
  summary: PublicFinanceSummaryResponse | undefined,
  totalLabel: string,
): FinanceSummary {
  return {
    totalLabel,
    totalAmount: asAmount(summary?.totalAmount),
    slices: mapFinanceSlices(summary?.items),
  }
}

function mapExpenseGroups(
  summary: PublicFinanceSummaryResponse | undefined,
): ExpenseDetailGroup[] {
  const rows = [...(summary?.items ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  const directRows = rows.filter(row => row.expenseCategory === 'DIRECT_PROGRAM')
  const otherRows = rows.filter(row => row.expenseCategory === 'OTHER')

  const toDetailRows = (list: PublicFinanceItemResponse[]) =>
    list.map((row, index) => {
      const label = asText(row.itemName) || `항목 ${index + 1}`
      return {
        id: row.id != null ? String(row.id) : slugifyId(label, `expense-${index + 1}`),
        label,
        percent: formatPercent(row.ratio),
        amount: asAmount(row.amount),
      }
    })

  const groups: ExpenseDetailGroup[] = []
  if (directRows.length > 0) {
    groups.push({
      id: 'direct',
      label: '직접사업비',
      rows: toDetailRows(directRows),
      subtotal: {
        label: '직접사업비 합계',
        percent: formatPercent(summary?.directProgramRatio),
        amount: asAmount(summary?.directProgramAmount),
      },
    })
  }
  if (otherRows.length > 0) {
    groups.push({
      id: 'indirect',
      label: '직접사업비 이외비용',
      rows: toDetailRows(otherRows),
      subtotal: {
        label: '직접사업비 이외비용 합계',
        percent: formatPercent(summary?.otherRatio),
        amount: asAmount(summary?.otherAmount),
      },
    })
  }
  return groups
}

export function mapPublicTransparency(
  response: PublicTransparencyResponse,
): TransparencyPageContent {
  const principles = [...(response.principles ?? [])]
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const orderA = a.row.displayOrder
      const orderB = b.row.displayOrder
      if (typeof orderA === 'number' && typeof orderB === 'number' && orderA !== orderB) {
        return orderA - orderB
      }
      return a.index - b.index
    })
    .map(({ row, index }) => {
      const title = asText(row.title)
      const description = splitDescription(asText(row.subText))
      return {
        id:
          row.id != null
            ? String(row.id)
            : asText(row.itemCode) || `principle-${index + 1}`,
        icon: resolvePrincipleIcon(row),
        title,
        description,
      } satisfies TransparencyPrinciple
    })

  const revenueSummary = mapFinanceSummary(
    response.incomeChart ?? response.incomeTable,
    '수익총계(원)',
  )
  const expenseSummary = mapFinanceSummary(
    response.expenseChart,
    '지출총계(원)',
  )

  return {
    heroLabel: asText(response.introSubText),
    heroTitle: asText(response.introMainText),
    principles,
    revenueSummary,
    expenseSummary,
    revenueOrder: revenueSummary.slices.map(slice => slice.id),
    expenseGroups: mapExpenseGroups(response.expenseTable),
    disclosureUrl: asText(response.disclosureUrl),
  }
}

function formatAuditDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}년 ${pad(d.getMonth() + 1)}월 ${pad(d.getDate())}일`
}

export function mapPublicReport(
  row: PublicReportResponse,
  type: TransparencyReportType,
  index: number,
): TransparencyReport | null {
  const title = asText(row.title)
  if (!title) return null
  const fileName = asText(row.attachmentFileName) || `${title}.pdf`
  return {
    id: row.id != null ? String(row.id) : `${type}-${index + 1}`,
    title,
    date: type === 'audit' ? formatAuditDate(row.createdAt) : undefined,
    coverUrl: asText(row.thumbnailUrl) || undefined,
    fileName,
    downloadUrl: asText(row.downloadUrl) || undefined,
  }
}

export function mapPublicReportList(
  page: PublicReportListPage,
  type: TransparencyReportType,
  requestedPage: number,
  pageSize: number,
): TransparencyReportsListResult {
  const items = (page.items ?? [])
    .map((row, index) => mapPublicReport(row, type, index))
    .filter((row): row is TransparencyReport => row != null)
  const totalCount =
    typeof page.totalCount === 'number' && Number.isFinite(page.totalCount)
      ? page.totalCount
      : items.length
  const totalPages =
    typeof page.totalPages === 'number' && page.totalPages > 0
      ? page.totalPages
      : Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const currentPage = Math.min(
    Math.max(1, requestedPage),
    totalCount === 0 ? 1 : totalPages,
  )
  return { items, totalCount, totalPages, currentPage }
}

export function hasTransparencyPageContent(
  content: TransparencyPageContent | null | undefined,
): boolean {
  if (!content) return false
  return Boolean(
    content.heroTitle.trim() ||
      content.principles.length > 0 ||
      content.revenueSummary.slices.length > 0 ||
      content.expenseSummary.slices.length > 0 ||
      content.expenseGroups.length > 0,
  )
}
