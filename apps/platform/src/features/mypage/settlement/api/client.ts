import { axiosClient } from '@/shared/api/axios-instance'
import {
  fetchIndividualSettlementSchedules,
  fetchSettlementApplications,
  type PortalIndividualScheduleSettlement,
  type PortalSettlementApplication,
} from '@/features/mypage/education/applications/api/activity-client'
import { fetchMyProgramApplications } from '@/features/mypage/education/applications/api/client'
import type { PortalProgramApplicationListItem } from '@/features/mypage/education/applications/api/types'
import { EMPTY_SETTLEMENT_OVERVIEW } from '../lib/empty-overview'
import type {
  SettlementOverviewItem,
  SettlementOverviewPageData,
  SettlementOverviewStatus,
  SettlementOverviewSummary,
} from '../model/types'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapEnvelope<T>(o.data)
    }
  }
  return payload as T
}

function readOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

function normalizeStatusToken(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_')
}

/**
 * 서버 정산/지급조서 status → 정산현황 overview 상태.
 * 알 수 없으면 waiting_confirm으로 임의 보정하지 않고 null.
 */
export function mapSettlementOverviewStatus(input: {
  status?: string | null
  statementStatus?: string | null
  paymentStatus?: string | null
}): SettlementOverviewStatus | null {
  const payment = normalizeStatusToken(input.paymentStatus)
  const statement = normalizeStatusToken(input.statementStatus ?? input.status)

  if (payment === 'PAID' || statement === 'PAID') return 'paid'
  if (
    statement === 'CORRECTION_REQUESTED' ||
    payment === 'CORRECTION_REQUESTED'
  ) {
    return 'correction_requested'
  }
  if (statement === 'REJECTED') return 'rejected'
  if (
    statement === 'CONFIRMED' ||
    statement === 'APPROVED' ||
    payment === 'WAITING_PAYMENT' ||
    payment === 'CONFIRMED'
  ) {
    return 'confirmed'
  }
  if (
    statement === 'REAPPLICATION' ||
    statement === 'RESUBMITTED' ||
    statement === 'REAPPLIED'
  ) {
    return 'reapplied'
  }
  if (
    statement === 'WAITING_CONFIRM' ||
    statement === 'REQUESTED' ||
    statement === 'ISSUED' ||
    statement === 'SUBMITTED'
  ) {
    return 'waiting_confirm'
  }
  return null
}

function sumSubmittedAmounts(
  schedule: PortalIndividualScheduleSettlement,
): number | null {
  const items = schedule.submittedItems
  if (!Array.isArray(items) || items.length === 0) return null
  let total = 0
  let hasAmount = false
  for (const item of items) {
    const amount = readOptionalNumber(item?.amount)
    if (amount == null) continue
    hasAmount = true
    total += amount
  }
  return hasAmount ? total : null
}

function mapInstructorSettlementItem(
  row: PortalSettlementApplication,
  programTitleByProgramId: Map<string, string>,
): SettlementOverviewItem | null {
  const id = readOptionalNumber(row.applicationId)
  if (id == null) return null
  const status = mapSettlementOverviewStatus({
    status: row.status,
    statementStatus: row.statementStatus,
    paymentStatus: row.paymentStatus,
  })
  if (!status) return null
  const programId = readOptionalNumber(row.programId)
  const programName =
    (programId != null ? programTitleByProgramId.get(String(programId)) : null) ?? '-'
  return {
    id: String(id),
    programName,
    organizationName: '-',
    startsAt: readOptionalText(row.submittedAt) ?? readOptionalText(row.createdAt) ?? '',
    endsAt: readOptionalText(row.submittedAt) ?? readOptionalText(row.createdAt) ?? '',
    sessionLabel: '',
    status,
    appliedAmount:
      readOptionalNumber(row.netPaymentAmount) ?? readOptionalNumber(row.grossAmount),
  }
}

function mapIndividualScheduleItem(input: {
  schedule: PortalIndividualScheduleSettlement
  programTitle: string
}): SettlementOverviewItem | null {
  const { schedule, programTitle } = input
  const id = readOptionalNumber(schedule.settlementApplicationId)
  if (id == null) return null
  const status = mapSettlementOverviewStatus({ status: schedule.status })
  if (!status) return null
  const startsAt = readOptionalText(schedule.startAt) ?? ''
  const endsAt = readOptionalText(schedule.endAt) ?? startsAt
  return {
    id: String(id),
    programName: programTitle.trim() || '-',
    organizationName: '-',
    startsAt,
    endsAt,
    sessionLabel: readOptionalText(schedule.scheduleName) ?? '',
    status,
    appliedAmount: sumSubmittedAmounts(schedule),
  }
}

function buildSummary(
  items: SettlementOverviewItem[],
  monthKey: string,
): SettlementOverviewSummary {
  let totalPaidAmount: number | null = null
  let monthPaidAmount: number | null = null
  let monthExpectedAmount: number | null = null

  for (const item of items) {
    const amount = item.appliedAmount
    if (amount == null) continue
    const inMonth =
      item.startsAt.slice(0, 7) === monthKey || item.endsAt.slice(0, 7) === monthKey

    if (item.status === 'paid') {
      totalPaidAmount = (totalPaidAmount ?? 0) + amount
      if (inMonth) monthPaidAmount = (monthPaidAmount ?? 0) + amount
    }
    if (item.status === 'confirmed' && inMonth) {
      monthExpectedAmount = (monthExpectedAmount ?? 0) + amount
    }
  }

  return { totalPaidAmount, monthPaidAmount, monthExpectedAmount }
}

async function fetchAllMyProgramApplications(
  signal?: AbortSignal,
): Promise<PortalProgramApplicationListItem[]> {
  const pageSize = 50
  const types = ['INDIVIDUAL', 'INSTRUCTOR', 'VOLUNTEER', 'ORGANIZATION'] as const
  const rows: PortalProgramApplicationListItem[] = []
  for (const applicationType of types) {
    let page = 0
    let totalPages = 1
    while (page < totalPages) {
      const result = await fetchMyProgramApplications(
        { applicationType, page, size: pageSize },
        signal,
      )
      const items = result.items ?? []
      rows.push(...items)
      totalPages = Math.max(1, result.totalPages ?? 1)
      page += 1
      if (items.length === 0) break
    }
  }
  return rows
}

/**
 * 정산현황 overview 데이터.
 * - 강사: GET /api/portal/me/settlement-applications
 * - 개인: 내 INDIVIDUAL 신청별 GET .../individual-settlements/applications/{id}/schedules
 *   (settlementApplicationId가 있는 일정만)
 */
export async function fetchSettlementOverviewPageData(input?: {
  month?: string
  signal?: AbortSignal
}): Promise<SettlementOverviewPageData> {
  const signal = input?.signal
  const month = input?.month?.trim() || ''

  const [instructorRows, applications] = await Promise.all([
    fetchSettlementApplications(signal),
    fetchAllMyProgramApplications(signal),
  ])

  const programTitleByProgramId = new Map<string, string>()
  const programTitleByApplicationId = new Map<string, string>()
  for (const app of applications) {
    const programId = readOptionalNumber(app.programId)
    const title = readOptionalText(app.programTitle)
    if (programId != null && title) {
      programTitleByProgramId.set(String(programId), title)
    }
    const applicationId = readOptionalNumber(app.applicationId)
    if (applicationId != null && title) {
      programTitleByApplicationId.set(String(applicationId), title)
    }
  }

  const items: SettlementOverviewItem[] = []

  for (const row of instructorRows) {
    const mapped = mapInstructorSettlementItem(row, programTitleByProgramId)
    if (mapped) items.push(mapped)
  }

  const individualApps = applications.filter(
    app => String(app.applicationType ?? '').toUpperCase() === 'INDIVIDUAL',
  )

  await Promise.all(
    individualApps.map(async app => {
      const applicationId = readOptionalNumber(app.applicationId)
      if (applicationId == null) return
      try {
        const schedules = await fetchIndividualSettlementSchedules(
          String(applicationId),
          signal,
        )
        const programTitle =
          programTitleByApplicationId.get(String(applicationId)) ?? '-'
        for (const schedule of schedules) {
          const mapped = mapIndividualScheduleItem({ schedule, programTitle })
          if (mapped) items.push(mapped)
        }
      } catch {
        // 개별 신청 일정 조회 실패는 다른 건을 막지 않는다.
      }
    }),
  )

  if (items.length === 0) return EMPTY_SETTLEMENT_OVERVIEW

  items.sort((a, b) => {
    const byStart = b.startsAt.localeCompare(a.startsAt)
    if (byStart !== 0) return byStart
    return b.id.localeCompare(a.id)
  })

  return {
    items,
    summary: buildSummary(items, month),
  }
}

/** 상세 enrichment용 — instructor list에 프로그램명이 없을 때 선택 조회 */
export async function fetchSettlementApplicationDetailRaw(
  applicationId: number,
  signal?: AbortSignal,
): Promise<Record<string, unknown> | null> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/settlement-applications/${applicationId}`,
    { signal },
  )
  const unwrapped = unwrapEnvelope<unknown>(data)
  if (!unwrapped || typeof unwrapped !== 'object' || Array.isArray(unwrapped)) {
    return null
  }
  return unwrapped as Record<string, unknown>
}
