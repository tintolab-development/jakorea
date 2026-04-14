/**
 * 프로그램 강의·수강 이력 화면 개발용 Mock (스크린샷 시나리오)
 * — 신청 결과 대기 / 반려 / 교육 예정 / 교육 진행 중 / 프로그램 종료 5단계
 * — programId는 **경제 교육 프로그램**(`economy-prog-*`, getEconomyPrograms)에 연결
 *   → programService.getByIdSync 폴백·상세 URL `/programs/economy-education`과 정합
 */

import type { Application } from '../../types/domain'
import type { ApplicationProgressStatus } from '../../types/application-progress'

/** 강사 목록·회원 상세에서 이 ID로 조회 시 아래 5건 강의 이력이 노출됩니다. */
export const PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID =
  'user-dev-program-lecture-history-demo' as const

const now = new Date()

function daysAgo(n: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

/** economy-programs.ts `createRounds` 와 동일 규칙: `{programId}-round-1` */
function economyRoundId(programId: string): string {
  return `${programId}-round-1`
}

/**
 * getByUserId 정렬(최신 submittedAt 우선) 기준 화면 상단→하단 = No.5→1 에 가깝게:
 * 최신: 대기 중 → 반려 → 예정 → 진행 중 → 가장 과거: 종료(다운로드·강의보고서 활성)
 */
export const programLectureHistoryDemoApplications: Application[] = [
  {
    id: 'app-lecture-demo-05',
    programId: 'economy-prog-001',
    roundId: economyRoundId('economy-prog-001'),
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
    programId: 'economy-prog-002',
    roundId: economyRoundId('economy-prog-002'),
    subjectType: 'instructor',
    subjectId: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
    status: 'rejected',
    rejectionKind: 'INTERVIEW',
    rejectionReason: '모집 정원 초과',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
    managerName: '홍길동 매니저',
  },
  {
    id: 'app-lecture-demo-03',
    programId: 'economy-prog-003',
    roundId: economyRoundId('economy-prog-003'),
    subjectType: 'instructor',
    subjectId: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
    status: 'reviewing',
    submittedAt: daysAgo(20),
    reviewedAt: daysAgo(18),
    createdAt: daysAgo(21),
    updatedAt: daysAgo(15),
    managerName: '김담당 매니저',
  },
  {
    id: 'app-lecture-demo-02',
    programId: 'economy-prog-004',
    roundId: economyRoundId('economy-prog-004'),
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
    programId: 'economy-prog-005',
    roundId: economyRoundId('economy-prog-005'),
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
