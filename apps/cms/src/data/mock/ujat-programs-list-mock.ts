/**
 * UJAT 프로그램 관리 > 초등 경제교육·봉사단 모집 목록용 Mock
 * 프로그램 진행 현황(5종)별 1건 — `ujatProgressStatus` (모집 신청 현황과 별도)
 */

import type { Program, ProgramLifecycleStatus, UjatProgramProgressStatus } from '@/types/domain'
import { UJAT_PROGRAM_LIST_PROGRESS_ORDER } from '@/features/program/ujat/lib/ujat-program-list-progress'
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
  firstHalfVolunteers: number
  secondHalfVolunteers: number
}

/** `lifecycleStatus` — 대시보드·일정 등 모집 신청 현황 연동용(진행 현황 컬럼과 무관) */
function defaultRecruitmentLifecycle(
  progress: UjatProgramProgressStatus
): ProgramLifecycleStatus {
  if (progress === 'EDUCATION_IN_PROGRESS') return 'education_in_progress'
  if (progress === 'PROGRAM_ENDED') return 'document_processing_completed'
  if (progress === 'EDUCATION_SCHEDULED') return 'planned'
  if (progress === 'VOLUNTEER_RECRUITING') return 'recruiting_instructors'
  return 'recruiting_students'
}

const progressIdSuffix = (status: UjatProgramProgressStatus) =>
  status.toLowerCase().replace(/_/g, '-')

/** 진행 현황 5종 각 1건 (목록 정렬: 최신 연도 우선) */
const UJAT_LIST_MOCK_ROWS: readonly UjatListMockRow[] = UJAT_PROGRAM_LIST_PROGRESS_ORDER.map(
  (ujatProgressStatus, index) => ({
    id: `ujat-progress-${progressIdSuffix(ujatProgressStatus)}`,
    year: 2030 - index,
    ujatProgressStatus,
    lifecycleStatus: defaultRecruitmentLifecycle(ujatProgressStatus),
    schools: Math.min(index * 5 + 4, UJAT_LIST_CAP),
    firstHalfVolunteers: Math.min(index * 4 + 2, UJAT_LIST_CAP),
    secondHalfVolunteers: Math.min(index * 3, UJAT_LIST_CAP),
  })
)

function buildUjatElementaryListPrograms(): Program[] {
  const sponsorId = resolveJaSponsorId()
  const now = new Date().toISOString()

  return UJAT_LIST_MOCK_ROWS.map(row => {
    const {
      id,
      year,
      ujatProgressStatus,
      lifecycleStatus,
      schools,
      firstHalfVolunteers,
      secondHalfVolunteers,
    } = row
    const hasRecruitDemoData =
      ujatProgressStatus === 'PARTICIPANT_RECRUITING' ||
      ujatProgressStatus === 'VOLUNTEER_RECRUITING'
    return {
      id,
      sponsorId,
      title: UJAT_LIST_TITLE(year),
      mainTitle: hasRecruitDemoData ? `${year}년 JA Korea 초등 경제교육 대상 학교` : undefined,
      type: 'offline' as const,
      format: 'course' as const,
      category: 'school' as const,
      description: hasRecruitDemoData
        ? 'JA Korea 초등 경제교육 프로그램은 초등학생들에게 경제·금융 개념을 체험 중심으로 전달하는 프로그램입니다.'
        : undefined,
      recruitmentGuide: hasRecruitDemoData
        ? '1. 신청 자격: 해당 지역 초등학교\n2. 신청 방법: 홈페이지 온라인 신청\n3. 선발: 선착순 및 서류 심사'
        : undefined,
      learningSupportContent: hasRecruitDemoData
        ? '교재, 교구, 강사 파견, 수업 지원 자료 제공'
        : undefined,
      district: hasRecruitDemoData
        ? '경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역 초등학교'
        : undefined,
      contactPhone: hasRecruitDemoData ? '02-6085-6028' : undefined,
      contactEmail: hasRecruitDemoData ? 'ujat@jakorea.org' : undefined,
      applicationStartDate: hasRecruitDemoData ? `${year - 1}-12-08T00:00:00.000Z` : undefined,
      applicationEndDate: hasRecruitDemoData ? `${year}-01-16T00:00:00.000Z` : undefined,
      resultAnnouncementDate: hasRecruitDemoData ? `${year}-01-26T00:00:00.000Z` : undefined,
      resultAnnouncementMethod: hasRecruitDemoData
        ? '홈페이지 공지 및 담당교사 개별 안내'
        : undefined,
      volunteerTarget: hasRecruitDemoData ? '대학(원)생' : undefined,
      volunteerTargetDetail: hasRecruitDemoData ? '전공무관, 휴학생 지원 가능' : undefined,
      volunteerApplicationStartDate: hasRecruitDemoData ? `${year}-03-10T00:00:00.000Z` : undefined,
      volunteerApplicationEndDate: hasRecruitDemoData ? `${year}-04-20T00:00:00.000Z` : undefined,
      documentPassAnnouncementDate: hasRecruitDemoData ? `${year}-04-25T00:00:00.000Z` : undefined,
      documentPassAnnouncementMethod: hasRecruitDemoData ? '홈페이지 공지' : undefined,
      interviewStartDate: hasRecruitDemoData ? `${year}-05-01T00:00:00.000Z` : undefined,
      interviewEndDate: hasRecruitDemoData ? `${year}-05-10T00:00:00.000Z` : undefined,
      interviewMethod: hasRecruitDemoData ? '온라인' : undefined,
      finalPassAnnouncementDate: hasRecruitDemoData ? `${year}-05-20T00:00:00.000Z` : undefined,
      finalPassAnnouncementMethod: hasRecruitDemoData ? '홈페이지 공지' : undefined,
      otherNotes: hasRecruitDemoData ? '면접 일정은 개별 안내 예정' : undefined,
      generalCommonInfo: hasRecruitDemoData
        ? {
            volunteerRecruitmentInfo: {
              noticeExposureTiming: 'one-week-before',
              notesNotApplicable: false,
            },
            paymentItems: '교통비',
            deductionItems: '일용근로자 원천징수세액',
            volunteerInterviewScheduleInfo: {
              recurringUnavailable: '일요일, 공휴일',
              specificUnavailableDates: '26년 3월 6일(금), 26년 3월 15일(금)',
              specificUnavailableDateIsos: ['2026-03-06', '2026-03-15'],
              availableTimeSlots:
                '09:00 ~ 09:30, 09:30 ~ 10:00, 10:00 ~ 10:30, 10:30 ~ 11:00, 11:00 ~ 11:30, 16:00 ~ 16:30, 20:30 ~ 21:00',
            },
          }
        : undefined,
      rounds: [
        {
          id: `${id}-round-1`,
          programId: id,
          roundNumber: 1,
          startDate: hasRecruitDemoData ? `${year}-04-03T00:00:00.000Z` : `${year}-03-01T00:00:00.000Z`,
          endDate: hasRecruitDemoData ? `${year}-06-19T00:00:00.000Z` : `${year}-11-30T00:00:00.000Z`,
          capacity: UJAT_LIST_CAP,
          status: 'active' as const,
          deliveryType: 'offline' as const,
          curriculum: hasRecruitDemoData ? '36' : undefined,
        },
        {
          id: `${id}-round-2`,
          programId: id,
          roundNumber: 2,
          startDate: hasRecruitDemoData ? `${year}-09-11T00:00:00.000Z` : `${year}-03-01T00:00:00.000Z`,
          endDate: hasRecruitDemoData ? `${year}-11-20T00:00:00.000Z` : `${year}-11-30T00:00:00.000Z`,
          capacity: UJAT_LIST_CAP,
          status: 'active' as const,
          deliveryType: 'offline' as const,
          curriculum: hasRecruitDemoData ? '36' : undefined,
        },
      ],
      startDate: hasRecruitDemoData ? `${year}-04-03T00:00:00.000Z` : `${year}-01-01T00:00:00.000Z`,
      endDate: hasRecruitDemoData ? `${year}-11-20T00:00:00.000Z` : `${year}-12-31T00:00:00.000Z`,
      status: 'active' as const,
      lifecycleStatus,
      ujatProgressStatus,
      participatingSchoolCount: schools,
      instructorCapacity: UJAT_LIST_CAP,
      ujatFirstHalfVolunteerCount: firstHalfVolunteers,
      ujatSecondHalfVolunteerCount: secondHalfVolunteers,
      generalVolunteers: firstHalfVolunteers,
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
