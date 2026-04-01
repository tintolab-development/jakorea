/**
 * 마이페이지 Mock 데이터
 * Phase 5.3: 마이페이지 메인 화면용 샘플 데이터
 */

import type { MyPageData, PrimaryStatus, UserHistory } from '../../types/domain'
import { mockTodos, mockSchedules, mockApplications, mockProgramsMap, mockUsers } from './index'
import dayjs from 'dayjs'

const getDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

// 사용자 이력 Mock 데이터
const getPastFriday = (weeksAgo: number) => dayjs().day(5).subtract(weeksAgo, 'week').toISOString()

// 사용자별 참여이력 생성 (userId 포함)
// 강사 사용자 찾기
const instructor1 = mockUsers.find(u => u.email === 'instructor1@example.com')
const instructor2 = mockUsers.find(u => u.email === 'instructor2@example.com')
const instructorSenior = mockUsers.find(u => u.email === 'instructor.senior@jakorea.org')

// 개인 참여자 사용자 찾기
const individual1 = mockUsers.find(u => u.email === 'individual1@example.com')
const individual2 = mockUsers.find(u => u.email === 'individual2@example.com')
const individualActive = mockUsers.find(u => u.email === 'individual.active@jakorea.org')

// 학교 사용자 찾기
const school1 = mockUsers.find(u => u.email === 'school1@example.com')

export const mockUserHistories: UserHistory[] = [
  // instructor1의 참여이력 (5건)
  ...(instructor1
    ? [
        {
          id: 'history-001',
          userId: instructor1.id,
          programId: 'prog-001',
          role: 'INSTRUCTOR' as const,
          completedAt: getDate(30),
          finalStatus: 'COMPLETED' as const,
          paymentStatus: 'PAY_04' as const,
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
          userId: instructor1.id,
          programId: 'prog-002',
          role: 'INSTRUCTOR' as const,
          completedAt: getDate(60),
          finalStatus: 'COMPLETED' as const,
          paymentStatus: 'PAY_04' as const,
          paymentAmount: 450000,
          createdAt: getDate(90),
          updatedAt: getDate(60),
        },
        {
          id: 'history-003',
          userId: instructor1.id,
          programId: 'prog-003',
          role: 'INSTRUCTOR' as const,
          completedAt: getDate(90),
          finalStatus: 'COMPLETED' as const,
          paymentStatus: 'PAY_04' as const,
          paymentAmount: 600000,
          createdAt: getDate(120),
          updatedAt: getDate(90),
        },
        {
          id: 'history-004',
          userId: instructor1.id,
          programId: 'prog-004',
          role: 'INSTRUCTOR' as const,
          completedAt: getDate(120),
          finalStatus: 'COMPLETED' as const,
          paymentStatus: 'PAY_04' as const,
          paymentAmount: 550000,
          createdAt: getDate(150),
          updatedAt: getDate(120),
        },
        {
          id: 'history-005',
          userId: instructor1.id,
          programId: 'prog-005',
          role: 'INSTRUCTOR' as const,
          completedAt: getDate(150),
          finalStatus: 'COMPLETED' as const,
          paymentStatus: 'PAY_04' as const,
          paymentAmount: 480000,
          createdAt: getDate(180),
          updatedAt: getDate(150),
        },
      ]
    : []),
  // instructor2의 참여이력 (3건)
  ...(instructor2
    ? [
        {
          id: 'history-006',
          userId: instructor2.id,
          programId: 'prog-006',
          role: 'INSTRUCTOR' as const,
          completedAt: getDate(40),
          finalStatus: 'COMPLETED' as const,
          paymentStatus: 'PAY_04' as const,
          paymentAmount: 500000,
          createdAt: getDate(70),
          updatedAt: getDate(40),
        },
        {
          id: 'history-007',
          userId: instructor2.id,
          programId: 'prog-007',
          role: 'INSTRUCTOR' as const,
          completedAt: getDate(80),
          finalStatus: 'COMPLETED' as const,
          paymentStatus: 'PAY_04' as const,
          paymentAmount: 450000,
          createdAt: getDate(110),
          updatedAt: getDate(80),
        },
        {
          id: 'history-008',
          userId: instructor2.id,
          programId: 'prog-008',
          role: 'INSTRUCTOR' as const,
          completedAt: getDate(100),
          finalStatus: 'COMPLETED' as const,
          paymentStatus: 'PAY_04' as const,
          paymentAmount: 600000,
          createdAt: getDate(120),
          updatedAt: getDate(100),
        },
      ]
    : []),
  // individual1의 참여이력 (봉사자/참여자)
  ...(individual1
    ? [
        {
          id: 'history-009',
          userId: individual1.id,
          programId: 'prog-002',
          role: 'VOLUNTEER' as const,
          completedAt: getPastFriday(2), // 2주 전 금요일
          finalStatus: 'CONFIRMED' as const,
          managerName: '이순신 매니저',
          volunteerHours: 4,
          certificates: [
            {
              id: 'cert-002',
              title: '봉사활동 확인서',
              downloadUrl: '/certificates/cert-002.pdf',
              issuedAt: getPastFriday(2),
            },
          ],
          createdAt: getDate(50),
          updatedAt: getDate(20),
        },
        {
          id: 'history-010',
          userId: individual1.id,
          programId: 'prog-003',
          role: 'PARTICIPANT' as const,
          completedAt: getDate(10),
          finalStatus: 'COMPLETED' as const,
          managerName: '이순신 매니저',
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
    : []),
  // individual2의 참여이력
  ...(individual2
    ? [
        {
          id: 'history-011',
          userId: individual2.id,
          programId: 'prog-009',
          role: 'PARTICIPANT' as const,
          completedAt: getDate(20),
          finalStatus: 'COMPLETED' as const,
          createdAt: getDate(50),
          updatedAt: getDate(20),
        },
      ]
    : []),
  // individualActive의 참여이력
  ...(individualActive
    ? [
        {
          id: 'history-012',
          userId: individualActive.id,
          programId: 'prog-010',
          role: 'VOLUNTEER' as const,
          completedAt: getDate(5),
          finalStatus: 'CONFIRMED' as const,
          managerName: '홍길동 매니저',
          volunteerHours: 8,
          createdAt: getDate(20),
          updatedAt: getDate(5),
        },
      ]
    : []),
  // school1의 참여이력 (학교는 PARTICIPANT 역할로 참여)
  ...(school1
    ? [
        {
          id: 'history-013',
          userId: school1.id,
          programId: 'prog-011',
          role: 'PARTICIPANT' as const,
          completedAt: getDate(15),
          finalStatus: 'COMPLETED' as const,
          createdAt: getDate(45),
          updatedAt: getDate(15),
        },
      ]
    : []),
  // instructorSenior의 참여이력 (25건 - 일부만 생성)
  ...(instructorSenior
    ? Array.from({ length: 10 }, (_, i) => ({
        id: `history-senior-${i + 1}`,
        userId: instructorSenior.id,
        programId: `prog-senior-${i + 1}`,
        role: 'INSTRUCTOR' as const,
        completedAt: getDate(30 + i * 30),
        finalStatus: 'COMPLETED' as const,
        paymentStatus: 'PAY_04' as const,
        paymentAmount: 500000 + i * 10000,
        createdAt: getDate(60 + i * 30),
        updatedAt: getDate(30 + i * 30),
      }))
    : []),
]

export const mockUserHistoriesMap = new Map(mockUserHistories.map(history => [history.id, history]))

// mockProgramsMap 재export
export { mockProgramsMap }

// 마이페이지 Mock 데이터 생성
export function getMyPageData(): MyPageData {
  // 승인 대기 신청 확인
  const pendingApplication = mockApplications.find(
    app => app.status === 'submitted' || app.status === 'reviewing'
  )

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
