/**
 * 프로그램 통계 Mock 데이터
 * 엑셀 데이터 분석 기반 추가
 */

import type { ProgramStatistics } from '../../types/domain'
import { mockPrograms } from './programs'

function generateUUID(): string {
  return `stats-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function randomPastDate(daysAgo: number = 365): Date {
  const now = Date.now()
  const randomTime = now - Math.random() * daysAgo * 24 * 60 * 60 * 1000
  return new Date(randomTime)
}

const managerNames = [
  '이송희',
  '이소율',
  '김소윤',
  '박민수',
  '정수진',
  '최영희',
  '한지우',
  '윤서준',
  '강예은',
  '임하늘',
  '오다은',
  '신지훈',
  '홍지민',
  '조민준',
  '권수빈',
]

// 프로그램별 통계 데이터 생성
export const mockProgramStatistics: ProgramStatistics[] = mockPrograms.slice(0, 30).map((program, index) => {
  const round = program.rounds[0] // 첫 번째 회차 사용
  const createdAt = randomPastDate(365)
  const updatedAt = new Date(
    createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime())
  )

  // 참가자 수 (남/여)
  const maleParticipants = Math.floor(Math.random() * 60) + 10
  const femaleParticipants = Math.floor(Math.random() * 60) + 10
  const totalParticipants = maleParticipants + femaleParticipants

  // 자원봉사자 수
  const generalVolunteers = Math.floor(Math.random() * 5)
  const staffVolunteers = Math.floor(Math.random() * 10)
  const returningVolunteers = Math.floor(Math.random() * 3)

  // 교사/강사 수
  const generalTeachers = Math.floor(Math.random() * 2) + 1 // 1-2명
  const educatedTeachers = Math.floor(Math.random() * 3)
  const instructors = index % 3 === 0 ? Math.floor(Math.random() * 2) + 1 : 0 // 1/3 확률로 강사 있음

  return {
    id: generateUUID(),
    programId: program.id,
    roundId: round?.id,
    scheduleId: undefined, // 일정 ID는 선택사항
    maleParticipants,
    femaleParticipants,
    totalParticipants,
    generalVolunteers,
    staffVolunteers,
    returningVolunteers,
    generalTeachers,
    educatedTeachers,
    instructors,
    managerName: managerNames[index % managerNames.length],
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
})

export const mockProgramStatisticsMap = new Map(
  mockProgramStatistics.map(stat => [stat.id, stat])
)

