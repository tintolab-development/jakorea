/**
 * UJAT 프로그램 관리 > 초등 경제교육·봉사단 모집 목록용 Mock
 * 프로그램 진행 현황(7단계)별 1건 — `ujatProgressStatus` (모집 신청 현황과 별도)
 */

import type { Program, ProgramLifecycleStatus, UjatProgramProgressStatus } from '@/types/domain'
import { PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER } from '@/shared/constants/status'
import { mockSponsors } from './sponsors'

const UJAT_LIST_CAP = 30

const UJAT_LIST_TITLE = (year: number) =>
  `${year}년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집`

function resolveJaSponsorId(): string {
  const ja = mockSponsors.find(
    s => s.name.includes('JA Korea') || s.name.includes('고유목적') || s.name.includes('JA')
  )
  return ja?.id ?? mockSponsors[0].id
}

type UjatListMockRow = {
  id: string
  year: number
  ujatProgressStatus: UjatProgramProgressStatus
  lifecycleStatus: ProgramLifecycleStatus
  schools: number
  volunteers: number
}

/** `lifecycleStatus` — 대시보드·일정 등 모집 신청 현황 연동용(진행 현황 컬럼과 무관) */
function defaultRecruitmentLifecycle(
  progress: UjatProgramProgressStatus
): ProgramLifecycleStatus {
  if (progress === 'EDUCATION_IN_PROGRESS') return 'education_in_progress'
  if (progress === 'PROGRAM_ENDED') return 'document_processing_completed'
  if (progress === 'EDUCATION_SCHEDULED') return 'planned'
  return 'recruiting_students'
}

const progressIdSuffix = (status: UjatProgramProgressStatus) =>
  status.toLowerCase().replace(/_/g, '-')

/** 진행 현황 7단계 각 1건 (목록 정렬: 최신 연도 우선) */
const UJAT_LIST_MOCK_ROWS: readonly UjatListMockRow[] =
  PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER.map((ujatProgressStatus, index) => ({
    id: `ujat-progress-${progressIdSuffix(ujatProgressStatus)}`,
    year: 2030 - index,
    ujatProgressStatus,
    lifecycleStatus: defaultRecruitmentLifecycle(ujatProgressStatus),
    schools: Math.min(index * 4, UJAT_LIST_CAP),
    volunteers: Math.min(index * 3, UJAT_LIST_CAP),
  }))

function buildUjatElementaryListPrograms(): Program[] {
  const sponsorId = resolveJaSponsorId()
  const now = new Date().toISOString()

  return UJAT_LIST_MOCK_ROWS.map(row => {
    const { id, year, ujatProgressStatus, lifecycleStatus, schools, volunteers } = row
    return {
      id,
      sponsorId,
      title: UJAT_LIST_TITLE(year),
      type: 'offline' as const,
      format: 'course' as const,
      category: 'school' as const,
      description: undefined,
      rounds: [
        {
          id: `${id}-round-1`,
          programId: id,
          roundNumber: 1,
          startDate: `${year}-03-01T00:00:00.000Z`,
          endDate: `${year}-11-30T00:00:00.000Z`,
          capacity: UJAT_LIST_CAP,
          status: 'active' as const,
          deliveryType: 'offline' as const,
        },
      ],
      startDate: `${year}-01-01T00:00:00.000Z`,
      endDate: `${year}-12-31T00:00:00.000Z`,
      status: 'active' as const,
      lifecycleStatus,
      ujatProgressStatus,
      participatingSchoolCount: schools,
      instructorCapacity: UJAT_LIST_CAP,
      generalVolunteers: volunteers,
      staffVolunteers: 0,
      returningVolunteers: 0,
      approvedStudentCount: 0,
      targetLevel: 'elementary' as const,
      createdAt: now,
      updatedAt: now,
    }
  })
}

export const mockUjatElementaryListPrograms: Program[] = buildUjatElementaryListPrograms()

export const mockUjatElementaryListProgramsMap = new Map(
  mockUjatElementaryListPrograms.map(p => [p.id, p])
)
