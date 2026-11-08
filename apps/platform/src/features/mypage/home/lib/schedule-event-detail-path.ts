import type { QueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import type { EducationApplicationListItem } from '@/features/mypage/education/applications/model/types'
import {
  educationApplicationDetailPath,
  lectureApplicationDetailPath,
  volunteerApplicationDetailPath,
} from '@/features/mypage/lib/constants'
import { lectureReportPreviewPath } from '@/features/mypage/education/schedules/lib/lecture-report-path'
import type { MypageScheduleEvent, MypageScheduleEventType } from '../model/schedule-types'

export type MypageScheduleActivitySection =
  | 'schedule'
  | 'assignment'
  | 'satisfaction'
  | 'survey'
  | 'settlement'
  | 'lecture-report'

export function resolveMypageScheduleActivitySection(
  type: MypageScheduleEventType,
): MypageScheduleActivitySection | null {
  switch (type) {
    case 'satisfaction':
      return 'satisfaction'
    case 'survey':
      return 'survey'
    case 'receipt':
      return 'settlement'
    case 'lecture_report_deadline':
      return 'lecture-report'
    case 'assignment':
      return 'assignment'
    case 'education':
      return 'schedule'
  }
}

function appendQuery(path: string, extra: Record<string, string | undefined>): string {
  const hashIndex = path.indexOf('#')
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : ''
  const qIndex = withoutHash.indexOf('?')
  const base = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash
  const params = new URLSearchParams(qIndex >= 0 ? withoutHash.slice(qIndex + 1) : '')
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return `${base}${query ? `?${query}` : ''}${hash}`
}

function buildApplicationDetailPath(
  applicationId: string,
  applicationType: ProgramApplicationType | undefined,
  section: MypageScheduleActivitySection | null,
): string {
  const sectionQuery = section ? `?section=${section}` : ''
  if (applicationType === 'INSTRUCTOR') {
    return `${lectureApplicationDetailPath(applicationId, applicationType)}${sectionQuery}`
  }
  if (applicationType === 'VOLUNTEER') {
    return `${volunteerApplicationDetailPath(applicationId, applicationType)}${sectionQuery}`
  }
  return `${educationApplicationDetailPath(applicationId, applicationType)}${sectionQuery}`
}

export function findMypageApplicationForScheduleEvent(
  queryClient: QueryClient,
  event: MypageScheduleEvent,
): EducationApplicationListItem | undefined {
  const queries = queryClient.getQueriesData<{ items?: EducationApplicationListItem[] }>({
    queryKey: platformQueryKeys.mypage.programApplications.all(),
  })

  let idMatch: EducationApplicationListItem | undefined
  const programMatches: EducationApplicationListItem[] = []

  for (const [, data] of queries) {
    for (const item of data?.items ?? []) {
      if (event.applicationId && item.id === event.applicationId) {
        idMatch = item
      }
      if (event.programId && item.programId === event.programId) {
        programMatches.push(item)
      }
    }
  }

  if (idMatch) return idMatch
  if (programMatches.length === 1) return programMatches[0]

  const hintedType = event.applicationType
  if (hintedType && programMatches.length > 1) {
    const typedMatches = programMatches.filter(item => item.applicationType === hintedType)
    if (typedMatches.length === 1) return typedMatches[0]
  }

  return undefined
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function resolveMypageScheduleEventDetailPath(
  queryClient: QueryClient,
  event: MypageScheduleEvent,
): string | null {
  const section = resolveMypageScheduleActivitySection(event.type)
  const application = findMypageApplicationForScheduleEvent(queryClient, event)

  const applicationId = event.applicationId ?? application?.id
  if (!applicationId) return null

  const applicationType =
    event.type === 'lecture_report_deadline'
      ? 'INSTRUCTOR'
      : (application?.applicationType ?? event.applicationType)

  if (event.type === 'receipt' && applicationType === 'INSTRUCTOR') {
    return null
  }

  if (event.type === 'lecture_report_deadline') {
    const assignmentId = parsePositiveInt(event.assignmentId)
    if (assignmentId != null && event.reportStatus === 'SUBMITTED') {
      return lectureReportPreviewPath(applicationId, assignmentId)
    }
    return buildApplicationDetailPath(applicationId, 'INSTRUCTOR', 'lecture-report')
  }

  const path = buildApplicationDetailPath(applicationId, applicationType, section)
  if (event.type === 'education') {
    return appendQuery(path, { scheduleId: event.scheduleId })
  }
  if (event.type === 'assignment' || event.type === 'satisfaction' || event.type === 'survey') {
    return appendQuery(path, { formBindingId: event.formBindingId })
  }
  return path
}
