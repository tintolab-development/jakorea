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
import type { KpiMetric, ProgramKpiItem } from '../admin-dashboard-service'

export interface DashboardHomeSummary {
  version: string
  programCount: number
  memberCount: number
  unreadNotificationCount: number
}

export interface ProgramInquiryRow {
  key: string
  programName: string
  pending: number
  answered: number
  total: number
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
    if (!byProgram.has(programId)) {
      byProgram.set(programId, {
        id,
        title: item.nameKo ?? item.programCode ?? id,
        sponsorId: '',
        type: 'offline',
        format: 'workshop',
        category: 'school',
        rounds: [],
        startDate: '',
        endDate: '',
        status: 'active',
        lifecycleStatus: mapRecruitmentStatus(item.recruitmentStatus),
        createdAt: item.createdAt ?? '',
        updatedAt: item.createdAt ?? '',
      })
    }
  }

  return [...byProgram.values()]
}

/** API는 목표값만 제공 — achieved null이면 UI에서 '-' 표시 */
function buildKpiMetricsFromTarget(row: DashboardKpiProgressResponse): KpiMetric[] {
  return [
    {
      key: 'finalParticipants',
      label: '최종 달성 인원',
      description: '명',
      achieved: null,
      target: row.targetParticipantCount ?? 0,
    },
    {
      key: 'finalSchools',
      label: '최종 파견 학교 수',
      description: '개',
      achieved: null,
      target: row.targetSchoolCount ?? 0,
    },
    {
      key: 'finalClasses',
      label: '최종 파견 학급 수',
      description: '개',
      achieved: null,
      target: row.targetClassCount ?? 0,
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
    return {
      programId: id,
      programTitle: programTitles?.get(id) ?? `프로그램 ${id}`,
      kpis: buildKpiMetricsFromTarget(row),
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
  const items = dto.items ?? []
  const grouped = new Map<string, { pending: number; answered: number; total: number }>()

  for (const item of items) {
    const name = item.programNameSnapshot ?? item.title ?? '프로그램'
    const bucket = grouped.get(name) ?? { pending: 0, answered: 0, total: 0 }
    bucket.total += 1
    const status = (item.inquiryStatus ?? '').toUpperCase()
    if (status === 'PENDING' || status === 'WAITING' || status === 'UNANSWERED') {
      bucket.pending += 1
    } else if (item.answeredAt || status === 'ANSWERED' || status === 'COMPLETED') {
      bucket.answered += 1
    }
    grouped.set(name, bucket)
  }

  return [...grouped.entries()].map(([programName, counts], index) => ({
    key: String(index + 1),
    programName,
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
