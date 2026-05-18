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
    const isRecruitmentDemo = lifecycleStatus === 'recruiting_students'
    return {
      id,
      sponsorId,
      title: UJAT_LIST_TITLE(year),
      mainTitle: isRecruitmentDemo ? `${year}년 JA Korea 초등 경제교육 대상 학교` : undefined,
      type: 'offline' as const,
      format: 'course' as const,
      category: 'school' as const,
      description: isRecruitmentDemo
        ? 'JA Korea 초등 경제교육 프로그램은 초등학생들에게 경제·금융 개념을 체험 중심으로 전달하는 프로그램입니다.'
        : undefined,
      recruitmentGuide: isRecruitmentDemo
        ? '1. 신청 자격: 해당 지역 초등학교\n2. 신청 방법: 홈페이지 온라인 신청\n3. 선발: 선착순 및 서류 심사'
        : undefined,
      learningSupportContent: isRecruitmentDemo
        ? '교재, 교구, 강사 파견, 수업 지원 자료 제공'
        : undefined,
      district: isRecruitmentDemo
        ? '경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역 초등학교'
        : undefined,
      contactPhone: isRecruitmentDemo ? '02-6085-6028' : undefined,
      contactEmail: isRecruitmentDemo ? 'ujat@jakorea.org' : undefined,
      applicationStartDate: isRecruitmentDemo ? `${year - 1}-12-08T00:00:00.000Z` : undefined,
      applicationEndDate: isRecruitmentDemo ? `${year}-01-16T00:00:00.000Z` : undefined,
      resultAnnouncementDate: isRecruitmentDemo ? `${year}-01-26T00:00:00.000Z` : undefined,
      resultAnnouncementMethod: isRecruitmentDemo
        ? '홈페이지 공지 및 담당교사 개별 안내'
        : undefined,
      volunteerTarget: isRecruitmentDemo ? '대학(원)생' : undefined,
      volunteerTargetDetail: isRecruitmentDemo ? '전공무관, 휴학생 지원 가능' : undefined,
      rounds: [
        {
          id: `${id}-round-1`,
          programId: id,
          roundNumber: 1,
          startDate: isRecruitmentDemo ? `${year}-04-03T00:00:00.000Z` : `${year}-03-01T00:00:00.000Z`,
          endDate: isRecruitmentDemo ? `${year}-06-19T00:00:00.000Z` : `${year}-11-30T00:00:00.000Z`,
          capacity: UJAT_LIST_CAP,
          status: 'active' as const,
          deliveryType: 'offline' as const,
        },
        {
          id: `${id}-round-2`,
          programId: id,
          roundNumber: 2,
          startDate: isRecruitmentDemo ? `${year}-09-11T00:00:00.000Z` : `${year}-03-01T00:00:00.000Z`,
          endDate: isRecruitmentDemo ? `${year}-11-20T00:00:00.000Z` : `${year}-11-30T00:00:00.000Z`,
          capacity: UJAT_LIST_CAP,
          status: 'active' as const,
          deliveryType: 'offline' as const,
        },
      ],
      startDate: isRecruitmentDemo ? `${year}-04-03T00:00:00.000Z` : `${year}-01-01T00:00:00.000Z`,
      endDate: isRecruitmentDemo ? `${year}-11-20T00:00:00.000Z` : `${year}-12-31T00:00:00.000Z`,
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
