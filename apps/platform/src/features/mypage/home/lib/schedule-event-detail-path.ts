import type { QueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import type { EducationApplicationListItem } from '@/features/mypage/education/applications/model/types'
import {
  educationApplicationDetailPath,
  lectureApplicationDetailPath,
  volunteerApplicationDetailPath,
} from '@/features/mypage/lib/constants'
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
): MypageScheduleActivitySection {
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
    default:
      return 'schedule'
  }
}

function buildApplicationDetailPath(
  applicationId: string,
  applicationType: ProgramApplicationType | undefined,
  section: MypageScheduleActivitySection,
): string {
  const sectionQuery = `?section=${section}`
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
  return buildApplicationDetailPath(applicationId, applicationType, section)
}
