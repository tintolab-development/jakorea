/**
 * Orval DTO → 대시보드 UI 타입 어댑터
 */
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type {
  DashboardHomeResponse,
  DashboardKpiProgressListResponse,
  DashboardKpiProgressResponse,
  DashboardProgramInquiryListResponse,
  DashboardProgramScheduleListResponse,
  DashboardRecruitmentListResponse,
  DashboardProgramScheduleResponse,
} from '@/shared/api/generated/dashboard/schemas'
import type { KpiMetric, KpiMetricKey, ProgramKpiItem } from '../admin-dashboard-service'

export interface DashboardHomeSummary {
  version: string
  programCount: number
  memberCount: number
  unreadNotificationCount: number
}

export interface ProgramInquiryRow {
  key: string
  programId?: string
  programName: string
  pending: number
  answered: number
  total: number
  unreadCount: number
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

const RECRUITMENT_STATUS_TO_LIFECYCLE: Record<string, ProgramLifecycleStatus> = {
  RECRUITING: 'recruiting_students',
  RECRUITING_STUDENTS: 'recruiting_students',
  RECRUITING_INSTRUCTORS: 'recruiting_instructors',
  RECRUITING_VOLUNTEERS: 'recruiting_instructors',
  MATCHING_COMPLETED: 'matching_completed',
  IN_PROGRESS: 'education_after_textbook',
  COMPLETED: 'education_completed',
  CLOSED: 'document_processing_completed',
}

function mapRecruitmentStatus(status: string | undefined): ProgramLifecycleStatus | undefined {
  if (!status) return undefined
  const normalized = status.trim().toUpperCase()
  return RECRUITMENT_STATUS_TO_LIFECYCLE[normalized] ?? (status as ProgramLifecycleStatus)
}

/** BE가 recruitmentStatus를 안 준 경우에만 모집 기간으로 추정 */
export function recruitmentStatusFromPeriod(
  startAt?: string,
  endAt?: string
): ProgramLifecycleStatus | undefined {
  if (!startAt || !endAt) return undefined
  const start = Date.parse(startAt)
  const end = Date.parse(endAt)
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined
  const now = Date.now()
  if (now < start) return 'planned'
  if (now <= end) return 'recruiting_students'
  return 'matching_completed'
}

type RecruitmentCountFields = {
  participantAppliedCount?: number
  participantCapacity?: number
  volunteerAppliedCount?: number
  volunteerCapacity?: number
  instructorAppliedCount?: number
  instructorCapacity?: number
  studentAppliedCount?: number
  studentCapacity?: number
  approvedStudentCount?: number
}

function pickCount(...values: Array<number | undefined>): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}

function recruitmentCountsFromItem(item: RecruitmentCountFields): {
  participantApplied?: number
  participantCapacity?: number
  volunteerApplied?: number
  volunteerCapacity?: number
} {
  return {
    participantApplied: pickCount(
      item.participantAppliedCount,
      item.studentAppliedCount,
      item.approvedStudentCount
    ),
    participantCapacity: pickCount(item.participantCapacity, item.studentCapacity),
    volunteerApplied: pickCount(item.volunteerAppliedCount, item.instructorAppliedCount),
    volunteerCapacity: pickCount(item.volunteerCapacity, item.instructorCapacity),
  }
}

function capacityRounds(programId: string, capacity: number | undefined): Program['rounds'] {
  if (capacity == null) return []
  return [
    {
      id: `${programId}-cap`,
      programId,
      roundNumber: 1,
      startDate: '',
      endDate: '',
      capacity,
      status: 'active',
    },
  ]
}

export function mapDashboardHomeResponse(dto: DashboardHomeResponse): DashboardHomeSummary {
  return {
    version: dto.version ?? '',
    programCount: dto.programCount ?? 0,
    memberCount: dto.memberCount ?? 0,
    unreadNotificationCount: dto.unreadNotificationCount ?? 0,
  }
}

export function mapRecruitmentListResponse(dto: DashboardRecruitmentListResponse): Program[] {
  const items = dto.items ?? []
  const byProgram = new Map<number, Program>()

  for (const item of items) {
    const programId = item.programId
    if (programId == null) continue
    const id = String(programId)
    const counts = recruitmentCountsFromItem(item)
    const lifecycleStatus =
      mapRecruitmentStatus(item.recruitmentStatus) ??
      recruitmentStatusFromPeriod(item.recruitmentStartAt, item.recruitmentEndAt)
    const existing = byProgram.get(programId)
    if (!existing) {
      byProgram.set(programId, {
        id,
        title: item.nameKo ?? item.programCode ?? id,
        sponsorId: '',
        type: 'offline',
        format: 'workshop',
        category: 'school',
        rounds: capacityRounds(id, counts.participantCapacity),
        startDate: item.recruitmentStartAt ?? '',
        endDate: item.recruitmentEndAt ?? '',
        status: 'active',
        lifecycleStatus,
        approvedStudentCount: counts.participantApplied,
        instructors: counts.volunteerApplied,
        instructorCapacity: counts.volunteerCapacity,
        createdAt: item.createdAt ?? '',
        updatedAt: item.createdAt ?? '',
      })
      continue
    }
    if (existing.approvedStudentCount == null && counts.participantApplied != null) {
      existing.approvedStudentCount = counts.participantApplied
    }
    if (existing.rounds.length === 0 && counts.participantCapacity != null) {
      existing.rounds = capacityRounds(id, counts.participantCapacity)
    }
    if (existing.instructors == null && counts.volunteerApplied != null) {
      existing.instructors = counts.volunteerApplied
    }
    if (existing.instructorCapacity == null && counts.volunteerCapacity != null) {
      existing.instructorCapacity = counts.volunteerCapacity
    }
    if (!existing.lifecycleStatus && lifecycleStatus) {
      existing.lifecycleStatus = lifecycleStatus
    }
  }

  return [...byProgram.values()]
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
      target: row.targetParticipantCount ?? 0,
      applicable: kpiMetricApplicable(row, 'finalParticipants', title),
    },
    {
      key: 'finalSchools',
      label: '최종 파견 학교 수',
      description: '개',
      achieved: kpiAchieved(row.actualSchoolCount),
      target: row.targetSchoolCount ?? 0,
      applicable: kpiMetricApplicable(row, 'finalSchools', title),
    },
    {
      key: 'finalClasses',
      label: '최종 파견 학급 수',
      description: '개',
      achieved: kpiAchieved(row.actualClassCount),
      target: row.targetClassCount ?? 0,
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
        instructors: row.targetInstructorCount ?? 0,
        volunteers: row.targetVolunteerCount ?? 0,
      },
    }
  })
}

export function mapProgramInquiryListResponse(
  dto: DashboardProgramInquiryListResponse
): ProgramInquiryRow[] {
  const summaries = dto.summaries
  if (summaries && summaries.length > 0) {
    return summaries.map((row, index) => {
      const programId = row.programId != null ? String(row.programId) : undefined
      const programName = row.programName?.trim() || '프로그램'
      return {
        key: programId ?? programName ?? String(index),
        programId,
        programName,
        pending: row.pending ?? 0,
        answered: row.answered ?? 0,
        total: row.total ?? 0,
        unreadCount: row.unreadCount ?? row.pending ?? 0,
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

  for (const item of items) {
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
    title: item.scheduleName ?? item.programNameKo ?? '일정',
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
    .filter((row): row is DashboardScheduleEventDto => row != null)
}
