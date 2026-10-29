/**
 * Orval DTO → 대시보드 UI 타입 어댑터
 */
import type { ProgramLifecycleStatus } from '@/types/domain'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import type {
  DashboardHomeResponse,
  DashboardKpiProgressListResponse,
  DashboardKpiProgressResponse,
  DashboardProgramInquiryListResponse,
  DashboardProgramScheduleListResponse,
  DashboardRecruitmentListResponse,
  DashboardProgramScheduleResponse,
} from '@/features/dashboard/api/dashboard-generated-types'
import type { DashboardRecruitmentResponse } from '@/shared/api/generated/dashboard/schemas/dashboardRecruitmentResponse'
import type { DashboardProgramInquirySummaryResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramInquirySummaryResponse'
import type { DashboardProgramInquiryResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramInquiryResponse'
import { getDashboardProgramTypeParamForWidget } from '@/features/dashboard/lib/dashboard-widget-program-type'
import type { KpiMetric, KpiMetricKey, ProgramKpiItem } from '../admin-dashboard-service'

export interface DashboardHomeSummary {
  version: string
  programCount: number | null
  memberCount: number | null
  unreadNotificationCount: number | null
}

export interface ProgramInquiryRow {
  key: string
  programId?: string
  programName: string
  pending: number | null
  answered: number | null
  total: number | null
  unreadCount: number | null
}

export interface DashboardRecruitmentRow {
  id: string
  title: string
  programType?: string
  recruitmentWindowStatus?: string | null
  participantApplied?: number | null
  participantCapacity?: number | null
  volunteerApplied?: number | null
  volunteerCapacity?: number | null
}

export interface DashboardRecruitmentListView {
  rows: DashboardRecruitmentRow[]
  /** GET /dashboard/recruitments totalCount|totalElements. 없으면 items 길이로 대체하지 않고 null */
  totalCount: number | null
}

export interface DashboardScheduleEventDto {
  id: string
  type: 'education' | 'recruitment_deadline' | 'recruitment_start'
  title: string
  time: string
  programId: string
  programTitle: string
  lifecycleStatus: ProgramLifecycleStatus
  startAt: string
  endAt?: string
}

export interface DashboardProgramOption {
  id: string
  title: string
}

const RECRUITMENT_WINDOW_STATUS_LABEL: Record<string, string> = {
  OPEN: '모집 중',
  RECRUITING: '모집 중',
  RECRUITING_STUDENTS: '모집 중',
  RECRUITING_INSTRUCTORS: '모집 중',
  RECRUITING_VOLUNTEERS: '모집 중',
  SCHEDULED: '모집 예정',
  PLANNED: '모집 예정',
  CLOSED: '모집 마감',
  MATCHING_COMPLETED: '매칭 완료',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
}

export function formatRecruitmentWindowStatus(status?: string | null): string {
  const normalized = status?.trim()
  if (!normalized) return '-'
  const upper = normalized.toUpperCase()
  if (upper === 'OPEN' || upper === 'RECRUITING' || upper.startsWith('RECRUITING_')) {
    return '모집 중'
  }
  return RECRUITMENT_WINDOW_STATUS_LABEL[upper] ?? normalized
}

export function formatRecruitmentCount(
  applied: number | null | undefined,
  capacity: number | null | undefined
): string {
  if (applied == null && capacity == null) return '-'
  return `${applied ?? '-'} / ${capacity ?? '-'}`
}

/** 헤더·위젯 건수. 누락이면 행 수/0으로 채우지 않는다. */
export function formatDashboardCountLabel(count: number | null | undefined): string {
  return typeof count === 'number' && Number.isFinite(count) ? `${count}건` : '-'
}

export function formatDashboardHeaderTotalCount(totalCount: number | null | undefined): string {
  const label = formatDashboardCountLabel(totalCount)
  return label === '-' ? '총 -' : `총 ${label}`
}

export function mapNotificationUnreadCount(unreadCount: number | undefined): number | null {
  return nullableNumber(unreadCount)
}

type RecruitmentCountFields = {
  participantAppliedCount?: number
  participantCapacity?: number
  volunteerAppliedCount?: number
  volunteerCapacity?: number
  studentAppliedCount?: number
  studentCapacity?: number
}

function nullableNumber(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function ownFiniteNumber(record: object, key: string): number | null {
  if (!Object.prototype.hasOwnProperty.call(record, key)) return null
  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** counts 맵에 키가 있을 때만 정수. 없으면 undefined (0으로 채우지 않음) */
export function readCountMapValue(
  counts: Record<string, number> | undefined,
  key: string
): number | undefined {
  if (!counts || !Object.prototype.hasOwnProperty.call(counts, key)) return undefined
  const value = counts[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

type RecruitmentListTotalsDto = DashboardRecruitmentListResponse & {
  totalCount?: number
  totalElements?: number
}

export function recruitmentListTotalCount(dto: DashboardRecruitmentListResponse): number | null {
  const extras = dto as RecruitmentListTotalsDto
  return nullableNumber(extras.totalCount) ?? nullableNumber(extras.totalElements)
}

function recruitmentCountsFromItem(item: RecruitmentCountFields): {
  participantApplied: number | null
  participantCapacity: number | null
  volunteerApplied: number | null
  volunteerCapacity: number | null
} {
  return {
    participantApplied:
      ownFiniteNumber(item, 'participantAppliedCount') ?? ownFiniteNumber(item, 'studentAppliedCount'),
    participantCapacity:
      ownFiniteNumber(item, 'participantCapacity') ?? ownFiniteNumber(item, 'studentCapacity'),
    volunteerApplied: ownFiniteNumber(item, 'volunteerAppliedCount'),
    volunteerCapacity: ownFiniteNumber(item, 'volunteerCapacity'),
  }
}

export function mapDashboardHomeResponse(dto: DashboardHomeResponse): DashboardHomeSummary {
  return {
    version: dto.version ?? '',
    programCount: nullableNumber(dto.programCount),
    memberCount: nullableNumber(dto.memberCount),
    unreadNotificationCount: nullableNumber(dto.unreadNotificationCount),
  }
}

export function mapRecruitmentListResponse(
  dto: DashboardRecruitmentListResponse
): DashboardRecruitmentListView {
  const items = dto.items ?? []
  const byProgram = new Map<number, DashboardRecruitmentRow>()

  for (const item of items) {
    const programId = item.programId
    if (programId == null) continue
    const id = String(programId)
    const counts = recruitmentCountsFromItem(item)
    const existing = byProgram.get(programId)
    if (!existing) {
      byProgram.set(programId, {
        id,
        title: item.nameKo ?? item.programCode ?? id,
        programType: item.programType,
        recruitmentWindowStatus: item.recruitmentStatus ?? null,
        participantApplied: counts.participantApplied,
        participantCapacity: counts.participantCapacity,
        volunteerApplied: counts.volunteerApplied,
        volunteerCapacity: counts.volunteerCapacity,
      })
      continue
    }
    if (existing.participantApplied == null && counts.participantApplied != null) {
      existing.participantApplied = counts.participantApplied
    }
    if (existing.participantCapacity == null && counts.participantCapacity != null) {
      existing.participantCapacity = counts.participantCapacity
    }
    if (existing.volunteerApplied == null && counts.volunteerApplied != null) {
      existing.volunteerApplied = counts.volunteerApplied
    }
    if (existing.volunteerCapacity == null && counts.volunteerCapacity != null) {
      existing.volunteerCapacity = counts.volunteerCapacity
    }
    if (!existing.recruitmentWindowStatus && item.recruitmentStatus) {
      existing.recruitmentWindowStatus = item.recruitmentStatus
    }
    if (!existing.programType && item.programType) {
      existing.programType = item.programType
    }
  }

  return {
    rows: [...byProgram.values()],
    totalCount: recruitmentListTotalCount(dto),
  }
}

/** 실적 미제공이면 null → UI에서 '-' 표시 */
function kpiAchieved(value: number | undefined): number | null {
  return value == null ? null : value
}

function kpiProgramTitle(
  programId: string,
  row: DashboardKpiProgressResponse,
  programTitles?: Map<string, string>
): string {
  return (
    programTitles?.get(programId) ??
    row.programNameKo ??
    row.nameKo ??
    row.programCode ??
    `프로그램 ${programId}`
  )
}

function normalizeKpiProgramType(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/-/g, '_')
}

function isTrainedTeachersKpiRow(row: DashboardKpiProgressResponse, title: string): boolean {
  const type = normalizeKpiProgramType(row.programType)
  if (type.includes('trained_teacher')) return true
  return title.includes('교육받은 교사')
}

function isIndividualKpiRow(row: DashboardKpiProgressResponse): boolean {
  return normalizeKpiProgramType(row.programType).includes('individual')
}

function kpiMetricApplicable(
  row: DashboardKpiProgressResponse,
  key: KpiMetricKey,
  title: string
): boolean {
  const explicitFlag =
    key === 'finalParticipants'
      ? row.participantApplicable
      : key === 'finalSchools'
        ? row.schoolApplicable
        : row.classApplicable
  if (explicitFlag != null) return explicitFlag
  if (isTrainedTeachersKpiRow(row, title)) return false
  if (key === 'finalParticipants') return true
  if (isIndividualKpiRow(row)) return false
  return true
}

function buildKpiMetricsFromTarget(row: DashboardKpiProgressResponse, title: string): KpiMetric[] {
  return [
    {
      key: 'finalParticipants',
      label: '최종 달성 인원',
      description: '명',
      achieved: kpiAchieved(row.actualParticipantCount),
      target: kpiAchieved(row.targetParticipantCount),
      applicable: kpiMetricApplicable(row, 'finalParticipants', title),
    },
    {
      key: 'finalSchools',
      label: '최종 파견 학교 수',
      description: '개',
      achieved: kpiAchieved(row.actualSchoolCount),
      target: kpiAchieved(row.targetSchoolCount),
      applicable: kpiMetricApplicable(row, 'finalSchools', title),
    },
    {
      key: 'finalClasses',
      label: '최종 파견 학급 수',
      description: '개',
      achieved: kpiAchieved(row.actualClassCount),
      target: kpiAchieved(row.targetClassCount),
      applicable: kpiMetricApplicable(row, 'finalClasses', title),
    },
  ]
}

export function mapProgramOptionsFromRecruitmentList(
  dto: DashboardRecruitmentListResponse
): DashboardProgramOption[] {
  const items = dto.items ?? []
  const byProgram = new Map<number, DashboardProgramOption>()

  for (const item of items) {
    const programId = item.programId
    if (programId == null) continue
    if (!byProgram.has(programId)) {
      byProgram.set(programId, {
        id: String(programId),
        title: item.nameKo ?? item.programCode ?? String(programId),
      })
    }
  }

  return [...byProgram.values()]
}

function normalizeRecruitmentProgramType(value?: string): string {
  return (value ?? '').trim().toLowerCase().replace(/-/g, '_')
}

export function recruitmentItemMatchesWidgetProgramType(
  itemProgramType: string | undefined,
  widgetProgramTypeParam: string
): boolean {
  const item = normalizeRecruitmentProgramType(itemProgramType)
  const param = normalizeRecruitmentProgramType(widgetProgramTypeParam)
  if (!param) return true
  if (item === param) return true
  if (param === 'general') {
    return item === 'general' || item.startsWith('general_')
  }
  if (
    param === 'company_school' &&
    (item.includes('company_school') || item.includes('one_company'))
  ) {
    return true
  }
  if (param === 'ujat' && item.includes('ujat')) return true
  if (param === 'gemini' && item.includes('gemini')) return true
  return false
}

export function filterRecruitmentListForWidget(
  widgetKey: string,
  dto: DashboardRecruitmentListResponse
): DashboardRecruitmentListResponse {
  const programType = getDashboardProgramTypeParamForWidget(widgetKey)
  if (!programType) return dto
  const items = (dto.items ?? []).filter((item: DashboardRecruitmentResponse) =>
    recruitmentItemMatchesWidgetProgramType(item.programType, programType)
  )
  return { ...dto, items }
}

export function mapProgramOptionsForWidget(
  widgetKey: string,
  dto: DashboardRecruitmentListResponse
): DashboardProgramOption[] {
  return mapProgramOptionsFromRecruitmentList(filterRecruitmentListForWidget(widgetKey, dto))
}

export function mapKpiProgressListResponse(
  dto: DashboardKpiProgressListResponse,
  programTitles?: Map<string, string>
): ProgramKpiItem[] {
  const items = dto.items ?? []
  const byProgram = new Map<number, DashboardKpiProgressResponse>()

  for (const item of items) {
    if (item.programId == null) continue
    if (!byProgram.has(item.programId)) {
      byProgram.set(item.programId, item)
    }
  }

  return [...byProgram.entries()].map(([programId, row]) => {
    const id = String(programId)
    const programTitle = kpiProgramTitle(id, row, programTitles)
    return {
      programId: id,
      programTitle,
      kpis: buildKpiMetricsFromTarget(row, programTitle),
      educationInstructorTargets: {
        instructors: kpiAchieved(row.targetInstructorCount),
        volunteers: kpiAchieved(row.targetVolunteerCount),
      },
    }
  })
}

export function mapProgramInquiryListResponse(
  dto: DashboardProgramInquiryListResponse
): ProgramInquiryRow[] {
  const summaries = dto.summaries
  if (summaries && summaries.length > 0) {
    return summaries.map((row: DashboardProgramInquirySummaryResponse, index: number) => {
      const programId = row.programId != null ? String(row.programId) : undefined
      const programName = row.programName?.trim() || '프로그램'
      return {
        key: programId ?? programName ?? String(index),
        programId,
        programName,
        pending: nullableNumber(row.pending),
        answered: nullableNumber(row.answered),
        total: nullableNumber(row.total),
        unreadCount: nullableNumber(row.unreadCount),
      }
    })
  }

  const items = dto.items ?? []
  const grouped = new Map<
    string,
    {
      programId?: string
      programName: string
      pending: number
      answered: number
      total: number
      unreadCount: number
    }
  >()

  for (const item of items as DashboardProgramInquiryResponse[]) {
    const programId = item.programId != null ? String(item.programId) : undefined
    const programName = item.programNameSnapshot ?? item.title ?? '프로그램'
    const groupKey = programId ?? programName
    const bucket = grouped.get(groupKey) ?? {
      programId,
      programName,
      pending: 0,
      answered: 0,
      total: 0,
      unreadCount: 0,
    }
    bucket.total += 1
    const status = (item.inquiryStatus ?? '').toUpperCase()
    const isPending =
      status === 'PENDING' ||
      status === 'WAITING' ||
      status === 'UNANSWERED' ||
      status === 'RECEIVED' ||
      status === 'IN_PROGRESS'
    if (isPending) {
      bucket.pending += 1
    } else if (item.answeredAt || status === 'ANSWERED' || status === 'COMPLETED' || status === 'CLOSED') {
      bucket.answered += 1
    }
    const extra = item as typeof item & { isUnread?: boolean; read?: boolean }
    const hasReadFlag = item.unread != null || extra.isUnread != null || extra.read != null
    if (hasReadFlag) {
      if (item.unread === true || extra.isUnread === true || extra.read === false) {
        bucket.unreadCount += 1
      }
    } else if (isPending) {
      bucket.unreadCount += 1
    }
    grouped.set(groupKey, bucket)
  }

  return [...grouped.entries()].map(([key, counts]) => ({
    key,
    ...counts,
  }))
}

function mapScheduleType(
  item: DashboardProgramScheduleResponse
): DashboardScheduleEventDto['type'] {
  const name = `${item.scheduleName ?? ''} ${item.scheduleStatus ?? ''}`.toLowerCase()
  if (name.includes('모집') && name.includes('마감')) return 'recruitment_deadline'
  if (name.includes('모집') && (name.includes('시작') || name.includes('start'))) {
    return 'recruitment_start'
  }
  return 'education'
}

function formatScheduleTime(startAt: string | undefined, allDay?: boolean): string {
  if (!startAt) return ''
  if (allDay) return '종일'
  const date = new Date(startAt)
  if (Number.isNaN(date.getTime())) return startAt
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function mapScheduleItem(item: DashboardProgramScheduleResponse): DashboardScheduleEventDto | null {
  if (item.scheduleId == null || item.programId == null || !item.startAt) return null
  return {
    id: String(item.scheduleId),
    type: mapScheduleType(item),
    title: toDisplayEducationScheduleName(item.scheduleName) ?? item.programNameKo ?? '일정',
    time: formatScheduleTime(item.startAt, item.allDay),
    programId: String(item.programId),
    programTitle: item.programNameKo ?? item.programCode ?? String(item.programId),
    lifecycleStatus: 'education_after_textbook',
    startAt: item.startAt,
    endAt: item.endAt,
  }
}

export function mapProgramScheduleListResponse(
  dto: DashboardProgramScheduleListResponse
): DashboardScheduleEventDto[] {
  return (dto.items ?? [])
    .map(mapScheduleItem)
    .filter((row: DashboardScheduleEventDto | null): row is DashboardScheduleEventDto => row != null)
}
