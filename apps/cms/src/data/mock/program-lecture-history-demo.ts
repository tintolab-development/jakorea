/**
 * 프로그램 강의 이력 화면 개발용 Mock (스크린샷 시나리오)
 * — 신청 결과 대기 / 반려 / 교육 예정 / 교육 진행 중 / 프로그램 종료 5단계 + 진행년도 2026·2023 혼합
 */

import type { Application, Program, ProgramRound, ProgramLifecycleStatus } from '../../types/domain'
import type { ApplicationProgressStatus } from '../../types/application-progress'
import { mockSponsors } from './sponsors'

/** 강사 목록·회원 상세에서 이 ID로 조회 시 아래 5건 강의 이력이 노출됩니다. */
export const PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID =
  'user-dev-program-lecture-history-demo' as const

const DEMO_SPONSOR_ID = mockSponsors[0]!.id

function demoRounds(programId: string, startIso: string): ProgramRound[] {
  const end = new Date(startIso)
  end.setDate(end.getDate() + 7)
  return [
    {
      id: `${programId}-round-1`,
      programId,
      roundNumber: 1,
      startDate: startIso,
      endDate: end.toISOString(),
      capacity: 30,
      status: 'active',
    },
  ]
}

const now = new Date()

function daysAgo(n: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

/** 스크린샷과 유사한 긴 프로그램명·연도·진행 단계용 데모 프로그램 5개 */
export const programLectureHistoryDemoPrograms: Program[] = [
  {
    id: 'prog-lecture-demo-01',
    sponsorId: DEMO_SPONSOR_ID,
    title:
      '[2026] 대학생 경제교육봉사단 파견 학교 모집 — 초등 대상 금요일 정규 교육 (신청 심사 중)',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '프로그램 강의 이력 화면 개발용 데모 프로그램입니다.',
    rounds: demoRounds('prog-lecture-demo-01', '2026-04-01T00:00:00.000Z'),
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-06-30T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_instructors' as ProgramLifecycleStatus,
    managerName: '이순신',
    createdAt: daysAgo(400),
    updatedAt: daysAgo(2),
  },
  {
    id: 'prog-lecture-demo-02',
    sponsorId: DEMO_SPONSOR_ID,
    title:
      '[2026] 신용케어 아카데미 강사단 추가 모집 — 지역아동센터·초등 방문 금융교육',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    rounds: demoRounds('prog-lecture-demo-02', '2026-05-10T00:00:00.000Z'),
    startDate: '2026-05-10T00:00:00.000Z',
    endDate: '2026-11-30T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'education_in_progress' as ProgramLifecycleStatus,
    managerName: '홍길동',
    createdAt: daysAgo(380),
    updatedAt: daysAgo(5),
  },
  {
    id: 'prog-lecture-demo-03',
    sponsorId: DEMO_SPONSOR_ID,
    title:
      '[2026] JA 글로벌 리더십 워크숍 — 중·고등 대상 팀 프로젝트 및 발표 (예정)',
    type: 'hybrid',
    format: 'seminar',
    category: 'individual',
    rounds: demoRounds('prog-lecture-demo-03', '2026-09-01T00:00:00.000Z'),
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-12-15T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'matching_completed' as ProgramLifecycleStatus,
    managerName: '김담당',
    createdAt: daysAgo(360),
    updatedAt: daysAgo(8),
  },
  {
    id: 'prog-lecture-demo-04',
    sponsorId: DEMO_SPONSOR_ID,
    title:
      '[2023] 지역 상생 경제교육 캠프 — 방학 집중 과정 (아카이브)',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: demoRounds('prog-lecture-demo-04', '2023-07-15T00:00:00.000Z'),
    startDate: '2023-07-15T00:00:00.000Z',
    endDate: '2023-08-20T00:00:00.000Z',
    status: 'completed',
    lifecycleStatus: 'education_in_progress' as ProgramLifecycleStatus,
    managerName: '박운영',
    createdAt: daysAgo(900),
    updatedAt: daysAgo(600),
  },
  {
    id: 'prog-lecture-demo-05',
    sponsorId: DEMO_SPONSOR_ID,
    title:
      '[2026] 청소년 창업 멘토링 DAY — 사업계획서 클리닉 및 데모데이 (종료)',
    type: 'offline',
    format: 'workshop',
    category: 'individual',
    rounds: demoRounds('prog-lecture-demo-05', '2026-02-01T00:00:00.000Z'),
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-03-31T00:00:00.000Z',
    status: 'completed',
    lifecycleStatus: 'education_completed' as ProgramLifecycleStatus,
    managerName: '최지원',
    createdAt: daysAgo(340),
    updatedAt: daysAgo(10),
  },
]

/**
 * getByUserId 정렬(최신 submittedAt 우선) 기준 화면 상단→하단 = No.5→1 에 가깝게:
 * 최신: 대기 중 → 반려 → 예정 → 진행 중 → 가장 과거: 종료(다운로드·강의보고서 활성)
 */
export const programLectureHistoryDemoApplications: Application[] = [
  {
    id: 'app-lecture-demo-05',
    programId: 'prog-lecture-demo-01',
    roundId: 'prog-lecture-demo-01-round-1',
    subjectType: 'instructor',
    subjectId: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
    status: 'submitted',
    submittedAt: daysAgo(1),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    managerName: '이순신 매니저',
  },
  {
    id: 'app-lecture-demo-04',
    programId: 'prog-lecture-demo-02',
    roundId: 'prog-lecture-demo-02-round-1',
    subjectType: 'instructor',
    subjectId: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
    status: 'rejected',
    rejectionReason: '모집 정원 초과',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
    managerName: '홍길동 매니저',
  },
  {
    id: 'app-lecture-demo-03',
    programId: 'prog-lecture-demo-03',
    roundId: 'prog-lecture-demo-03-round-1',
    subjectType: 'instructor',
    subjectId: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
    status: 'approved',
    progressStatus: 'RECEIVED' as ApplicationProgressStatus,
    submittedAt: daysAgo(20),
    reviewedAt: daysAgo(18),
    createdAt: daysAgo(21),
    updatedAt: daysAgo(15),
    managerName: '김담당 매니저',
  },
  {
    id: 'app-lecture-demo-02',
    programId: 'prog-lecture-demo-04',
    roundId: 'prog-lecture-demo-04-round-1',
    subjectType: 'instructor',
    subjectId: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
    status: 'approved',
    progressStatus: 'IN_PROGRESS' as ApplicationProgressStatus,
    submittedAt: daysAgo(90),
    reviewedAt: daysAgo(88),
    createdAt: daysAgo(91),
    updatedAt: daysAgo(30),
    managerName: '박운영 매니저',
  },
  {
    id: 'app-lecture-demo-01',
    programId: 'prog-lecture-demo-05',
    roundId: 'prog-lecture-demo-05-round-1',
    subjectType: 'instructor',
    subjectId: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
    status: 'approved',
    progressStatus: 'REPORT_SUBMITTED' as ApplicationProgressStatus,
    hasLectureReportSubmission: true,
    submittedAt: daysAgo(800),
    reviewedAt: daysAgo(798),
    createdAt: daysAgo(801),
    updatedAt: daysAgo(600),
    managerName: '최지원 매니저',
  },
]
