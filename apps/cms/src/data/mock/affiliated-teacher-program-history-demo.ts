/**
 * 학교 상세 → 소속 교사 → 프로젝트 참여 이력 mock
 * — `program-lecture-history-demo` 5단계 시나리오와 동일 programId(economy-prog-001~005) 사용
 */

import type { UserHistory } from '../../types/domain'
import {
  MOCK_AFFILIATED_TEACHER_DUAL_USER_ID,
  MOCK_AFFILIATED_TEACHER_SCHOOL_ONLY_USER_ID,
} from './users'

const now = new Date()

function daysAgo(n: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

const MOCK_MANAGER_NAMES = ['이순신 매니저', '홍길동 매니저', '김담당 매니저', '박운영 매니저', '최지원 매니저']

/** 봉사 프로그램 참여 이력 5건 — 수강·강의 demo와 동일 programId·담당자 패턴 */
export function createAffiliatedTeacherVolunteerHistories(
  userId: string,
  idPrefix: string
): UserHistory[] {
  return [
    {
      id: `history-${idPrefix}-vol-05`,
      userId,
      programId: 'economy-prog-001',
      programName: undefined,
      role: 'VOLUNTEER',
      completedAt: daysAgo(1),
      finalStatus: 'CONFIRMED',
      managerName: MOCK_MANAGER_NAMES[0],
      volunteerHours: 4,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: `history-${idPrefix}-vol-04`,
      userId,
      programId: 'economy-prog-002',
      role: 'VOLUNTEER',
      completedAt: daysAgo(5),
      finalStatus: 'CANCELLED',
      managerName: MOCK_MANAGER_NAMES[1],
      volunteerHours: 0,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(4),
    },
    {
      id: `history-${idPrefix}-vol-03`,
      userId,
      programId: 'economy-prog-003',
      role: 'VOLUNTEER',
      completedAt: daysAgo(20),
      finalStatus: 'CONFIRMED',
      managerName: MOCK_MANAGER_NAMES[2],
      volunteerHours: 6,
      createdAt: daysAgo(21),
      updatedAt: daysAgo(15),
    },
    {
      id: `history-${idPrefix}-vol-02`,
      userId,
      programId: 'economy-prog-004',
      role: 'VOLUNTEER',
      completedAt: daysAgo(90),
      finalStatus: 'CONFIRMED',
      managerName: MOCK_MANAGER_NAMES[3],
      volunteerHours: 8,
      createdAt: daysAgo(91),
      updatedAt: daysAgo(30),
    },
    {
      id: `history-${idPrefix}-vol-01`,
      userId,
      programId: 'economy-prog-005',
      role: 'VOLUNTEER',
      completedAt: daysAgo(800),
      finalStatus: 'COMPLETED',
      managerName: MOCK_MANAGER_NAMES[4],
      volunteerHours: 12,
      certificates: [
        {
          id: `cert-${idPrefix}-vol-01`,
          title: '봉사활동 확인서',
          downloadUrl: `/certificates/${idPrefix}-vol-01.pdf`,
          issuedAt: daysAgo(600),
        },
      ],
      createdAt: daysAgo(801),
      updatedAt: daysAgo(600),
    },
  ]
}

export const affiliatedTeacherVolunteerHistories: UserHistory[] = [
  ...createAffiliatedTeacherVolunteerHistories(
    MOCK_AFFILIATED_TEACHER_SCHOOL_ONLY_USER_ID,
    'aff-stu-only'
  ),
  ...createAffiliatedTeacherVolunteerHistories(MOCK_AFFILIATED_TEACHER_DUAL_USER_ID, 'aff-dual'),
]
