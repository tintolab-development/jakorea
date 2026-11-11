import { axiosClient } from '@/shared/api/axios-instance'
import {
  fetchIndividualSettlementSchedules,
  fetchVolunteerSettlementSchedules,
  fetchSettlementApplications,
  type PortalIndividualScheduleSettlement,
  type PortalSettlementApplication,
} from '@/features/mypage/education/applications/api/activity-client'
import { fetchMyProgramApplications } from '@/features/mypage/education/applications/api/client'
import type { PortalProgramApplicationListItem } from '@/features/mypage/education/applications/api/types'
import { shouldUseVolunteerSettlementSchedulesApi } from '@/features/mypage/education/settlements/lib/individual-settlement-contract'
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
  statementReapplyAvailable?: boolean | null
}): SettlementOverviewStatus | null {
  const payment = normalizeStatusToken(input.paymentStatus)
  const statement = normalizeStatusToken(input.statementStatus ?? input.status)

  if (payment === 'PAID' || statement === 'PAID') return 'paid'
  // DRAFT = 정정 승인 후 강사 재신청 대기. 강의 상세 정산 탭·CMS와 같이 "지급 정정 요청"으로 본다
  if (
    statement === 'CORRECTION_REQUESTED' ||
    payment === 'CORRECTION_REQUESTED' ||
    statement === 'DRAFT' ||
    input.statementReapplyAvailable === true
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

/**
 * 재신청 이력은 한 줄씩 보여 준다(기획 B3). 이전 신청 판단은 서버 superseded만 쓴다
 * (status 문자열이나 같은 배정의 신청 순서로 추측하지 않는다). 이전 신청의 applicationId 집합을 돌려준다.
 */
export function findSupersededInstructorApplicationIds(
  rows: readonly PortalSettlementApplication[],
): Set<number> {
  const superseded = new Set<number>()
  for (const row of rows) {
    const applicationId = readOptionalNumber(row.applicationId)
    if (row.superseded === true && applicationId != null) superseded.add(applicationId)
  }
  return superseded
}

/** 정산 신청 금액 — 최신 정산 revision 금액(정정 후 금액) 우선, 정산이 없으면 제출 당시 금액 */
export function resolveInstructorSettlementAmount(row: PortalSettlementApplication): number | null {
  return (
    readOptionalNumber(row.latestNetPaymentAmount) ??
    readOptionalNumber(row.netPaymentAmount) ??
    readOptionalNumber(row.latestGrossAmount) ??
    readOptionalNumber(row.grossAmount)
  )
}

/**
 * 강사 정산 행의 교육 진행 일시. 목록 응답의 회차 일시(scheduleStartAt·scheduleEndAt)를 쓰고,
 * 둘 다 없을 때만 제출(없으면 생성) 시각으로 대체한다.
 */
export function resolveInstructorSettlementPeriod(
  row: PortalSettlementApplication,
): { startsAt: string; endsAt: string } {
  const start = readOptionalText(row.scheduleStartAt)
  const end = readOptionalText(row.scheduleEndAt)
  if (start || end) return { startsAt: start ?? end ?? '', endsAt: end ?? start ?? '' }
  const fallback = readOptionalText(row.submittedAt) ?? readOptionalText(row.createdAt) ?? ''
  return { startsAt: fallback, endsAt: fallback }
}

/** 대체된 이전 신청의 원래 결과 → '신청 반려' | '지급 정정 요청'. 모르면 null */
export function mapSupersededResultStatus(
  value: string | null | undefined,
): SettlementOverviewStatus | null {
  const token = normalizeStatusToken(value)
  if (token === 'REJECTED') return 'rejected'
  if (token === 'CORRECTION_REQUESTED') return 'correction_requested'
  return null
}

function mapInstructorSettlementItem(
  row: PortalSettlementApplication,
  programTitleByProgramId: Map<string, string>,
  superseded: boolean,
): SettlementOverviewItem | null {
  const id = readOptionalNumber(row.applicationId)
  if (id == null) return null
  const supersededStatus = superseded ? mapSupersededResultStatus(row.supersededReason) : null
  const status =
    supersededStatus ??
    mapSettlementOverviewStatus({
      status: row.status,
      statementStatus: row.statementStatus,
      paymentStatus: row.paymentStatus,
      statementReapplyAvailable: row.statementReapplyAvailable,
    })
  if (!status) return null
  const programId = readOptionalNumber(row.programId)
  const programName =
    (programId != null ? programTitleByProgramId.get(String(programId)) : null) ?? '-'
  const { startsAt, endsAt } = resolveInstructorSettlementPeriod(row)
  return {
    id: String(id),
    programName,
    organizationName: '-',
    startsAt,
    endsAt,
    sessionLabel: '',
    status,
    appliedAmount: resolveInstructorSettlementAmount(row),
    ...(superseded ? { superseded: true } : {}),
    // superseded=true인데 supersededReason이 없는 옛 데이터만 상태 '-'
    ...(superseded && !supersededStatus ? { supersededStatusUnknown: true } : {}),
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
    // 대체된 이전 신청은 합계에서 뺀다
    if (amount == null || item.superseded) continue
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
 * - 봉사자: 일반·UJAT VOLUNTEER 신청별 GET .../volunteer-settlements/applications/{id}/schedules
 *   (둘 다 settlementApplicationId가 있는 일정만)
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

  const supersededIds = findSupersededInstructorApplicationIds(instructorRows)
  for (const row of instructorRows) {
    const applicationId = readOptionalNumber(row.applicationId)
    const superseded = applicationId != null && supersededIds.has(applicationId)
    const mapped = mapInstructorSettlementItem(row, programTitleByProgramId, superseded)
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

  const volunteerApps = applications.filter(app =>
    shouldUseVolunteerSettlementSchedulesApi(app.applicationType, app.programType),
  )

  await Promise.all(
    volunteerApps.map(async app => {
      const applicationId = readOptionalNumber(app.applicationId)
      if (applicationId == null) return
      try {
        const schedules = await fetchVolunteerSettlementSchedules(String(applicationId), signal)
        // 봉사·개인 신청 id는 테이블이 달라 겹칠 수 있다 — 제목은 해당 신청 행에서 바로 읽는다.
        const programTitle = readOptionalText(app.programTitle) ?? '-'
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
