/**
 * 마이페이지 Mock 데이터
 * Phase 5.3: 마이페이지 메인 화면용 샘플 데이터
 */

import type { MyPageData, PrimaryStatus, UserHistory } from '../../types/domain'
import { mockTodos, mockSchedules, mockApplications, mockProgramsMap } from './index'
import dayjs from 'dayjs'

const getDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

// 사용자 이력 Mock 데이터
export const mockUserHistories: UserHistory[] = [
  {
    id: 'history-001',
    programId: 'prog-001',
    role: 'INSTRUCTOR',
    completedAt: getDate(30),
    finalStatus: 'COMPLETED',
    paymentStatus: 'PAY_04',
    paymentAmount: 500000,
    certificates: [
      {
        id: 'cert-001',
        title: '강의 완료 증명서',
        downloadUrl: '/certificates/cert-001.pdf',
        issuedAt: getDate(30),
      },
    ],
    createdAt: getDate(60),
    updatedAt: getDate(30),
  },
  {
    id: 'history-002',
    programId: 'prog-002',
    role: 'VOLUNTEER',
    completedAt: getDate(20),
    finalStatus: 'CONFIRMED',
    volunteerHours: 4,
    certificates: [
      {
        id: 'cert-002',
        title: '봉사활동 확인서',
        downloadUrl: '/certificates/cert-002.pdf',
        issuedAt: getDate(20),
      },
    ],
    createdAt: getDate(50),
    updatedAt: getDate(20),
  },
  {
    id: 'history-003',
    programId: 'prog-003',
    role: 'PARTICIPANT',
    completedAt: getDate(10),
    finalStatus: 'COMPLETED',
    certificates: [
      {
        id: 'cert-003',
        title: '프로그램 수료증',
        downloadUrl: '/certificates/cert-003.pdf',
        issuedAt: getDate(10),
      },
    ],
    createdAt: getDate(40),
    updatedAt: getDate(10),
  },
]

export const mockUserHistoriesMap = new Map(
  mockUserHistories.map(history => [history.id, history])
)

// mockProgramsMap 재export
export { mockProgramsMap }

// 마이페이지 Mock 데이터 생성
export function getMyPageData(): MyPageData {
  // 승인 대기 신청 확인
  const pendingApplication = mockApplications.find(app => app.status === 'submitted' || app.status === 'reviewing')
  
  // 승인 완료된 신청 확인
  const approvedApplication = mockApplications.find(app => app.status === 'approved')
  
  // 반려된 신청 확인
  const rejectedApplication = mockApplications.find(app => app.status === 'rejected')

  // primaryStatus 결정
  let primaryStatus: PrimaryStatus = 'NONE'
  let reasonPublic: string | undefined

  if (pendingApplication) {
    primaryStatus = 'APPLY_01'
  } else if (rejectedApplication) {
    primaryStatus = 'APPLY_02'
    reasonPublic = rejectedApplication.notes || '신청이 반려되었습니다.'
  } else if (approvedApplication) {
    // 승인 완료 후 일정 확인
    const upcomingSchedule = mockSchedules
      .filter(s => s.programId === approvedApplication.programId)
      .find(s => dayjs(s.date).isAfter(dayjs(), 'day'))

    if (upcomingSchedule) {
      primaryStatus = 'SCH_01'
    } else {
      primaryStatus = 'APPLY_03'
    }
  }

  // To-do 목록 (최대 2개, 우선순위 순)
  const todos = mockTodos
    .filter(todo => !todo.completed)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2)

  // 승인 완료된 일정 (다가오는 일정만)
  const upcomingSchedules = mockSchedules
    .filter(s => {
      const app = mockApplications.find(a => a.programId === s.programId && a.status === 'approved')
      return app && dayjs(s.date).isAfter(dayjs(), 'day')
    })
    .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
    .slice(0, 5)

  // 이력 요약 (최대 3개)
  const historySummary = mockUserHistories
    .sort((a, b) => dayjs(b.completedAt).diff(dayjs(a.completedAt)))
    .slice(0, 3)

  return {
    primaryStatus,
    reasonPublic,
    todos,
    upcomingSchedules: upcomingSchedules.length > 0 ? upcomingSchedules : undefined,
    historySummary: historySummary.length > 0 ? historySummary : undefined,
  }
}

