/**
 * 강사/봉사자 본인 활동 데이터 조회 API (Mock)
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import type { UUID, Program, Schedule } from '@/types'
import { mockPrograms, mockMatchings, mockSchedules, mockSettlements } from '@/data/mock'
import dayjs from 'dayjs'

/**
 * 내 강의 현황 상태
 */
export type MyProgramStatus = 'completed' | 'in_progress' | 'scheduled' | 'application_completed'

/**
 * 본인 활동 요약 데이터
 */
export interface InstructorActivitySummary {
  programs: {
    total: number
    applicationCompleted: number // 신청 완료
    scheduled: number // 진행 예정
    inProgress: number // 진행중
    completed: number // 진행완료
  }
  schedules: {
    total: number
    upcoming: Schedule[] // 예정된 일정
  }
  pendingTasks: {
    reportPending: number // 보고서 제출 대기
    settlementPending: number // 정산 제출 대기
    todoCount: number // To-do 수
    settlementTasks: Array<{
      id: string
      programId: string
      programTitle: string
      matchingId: string
    }>
  }
}

/**
 * 프로그램 상태 판단 (날짜 기준)
 */
function getProgramStatus(program: Program): MyProgramStatus {
  const now = dayjs()
  const startDate = dayjs(program.startDate)
  const endDate = dayjs(program.endDate)

  // 프로그램 상태가 completed이면 진행완료
  if (program.status === 'completed') {
    return 'completed'
  }

  // 현재 날짜가 종료일 이후면 진행완료
  if (now.isAfter(endDate)) {
    return 'completed'
  }

  // 현재 날짜가 시작일 이전이면 진행 예정
  if (now.isBefore(startDate)) {
    return 'scheduled'
  }

  // 시작일과 종료일 사이면 진행중
  if (now.isAfter(startDate) && now.isBefore(endDate)) {
    return 'in_progress'
  }

  // 기본값: 진행 예정
  return 'scheduled'
}

/**
 * 본인 활동 요약 조회
 */
export async function getInstructorActivitySummary(
  instructorId: UUID
): Promise<InstructorActivitySummary> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 본인 매칭 조회
  const myMatchings = mockMatchings.filter(m => m.instructorId === instructorId)

  // 매칭된 프로그램 조회
  const myProgramIds = new Set(myMatchings.map(m => m.programId))
  const myPrograms = mockPrograms.filter(p => myProgramIds.has(p.id))

  // 프로그램 상태별 분류
  const programsByStatus = {
    applicationCompleted: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
  }

  myPrograms.forEach(program => {
    const status = getProgramStatus(program)
    switch (status) {
      case 'application_completed':
        programsByStatus.applicationCompleted++
        break
      case 'scheduled':
        programsByStatus.scheduled++
        break
      case 'in_progress':
        programsByStatus.inProgress++
        break
      case 'completed':
        programsByStatus.completed++
        break
    }
  })

  // 예정된 일정 조회 (오늘 이후)
  const now = dayjs()
  const upcomingSchedules = mockSchedules
    .filter(schedule => schedule.instructorId === instructorId)
    .filter(schedule => {
      const scheduleDate = dayjs(schedule.date)
      return scheduleDate.isAfter(now) || scheduleDate.isSame(now, 'day')
    })
    .sort((a, b) => {
      const dateA = dayjs(a.date)
      const dateB = dayjs(b.date)
      return dateA.valueOf() - dateB.valueOf()
    })

  // 대기 중인 작업 계산 (Mock 데이터 기반)
  // 실제로는 보고서, 정산 데이터를 조회해야 함
  const reportPending = 0 // 보고서 제출 대기 (추후 구현)
  
  // 정산 제출 대기: 활성 매칭 중 아직 정산이 제출되지 않은 것
  const activeMatchingIds = new Set(
    mockMatchings.filter(m => m.instructorId === instructorId && m.status === 'active').map(m => m.id)
  )
  const submittedSettlementMatchingIds = new Set(
    mockSettlements
      .filter(s => s.instructorId === instructorId && s.status !== 'pending')
      .map(s => s.matchingId)
  )
  const settlementPending = Array.from(activeMatchingIds).filter(
    matchingId => !submittedSettlementMatchingIds.has(matchingId)
  ).length
  
  const todoCount = 0 // To-do 수 (추후 구현)

  // 정산 제출 대기 작업 목록
  const settlementTasks = mockMatchings
    .filter(m => m.instructorId === instructorId && m.status === 'active')
    .filter(m => !submittedSettlementMatchingIds.has(m.id))
    .map(matching => {
      const program = mockPrograms.find(p => p.id === matching.programId)
      return {
        id: matching.id,
        programId: matching.programId,
        programTitle: program?.title || '프로그램명 없음',
        matchingId: matching.id,
      }
    })

  return {
    programs: {
      total: myPrograms.length,
      applicationCompleted: programsByStatus.applicationCompleted,
      scheduled: programsByStatus.scheduled,
      inProgress: programsByStatus.inProgress,
      completed: programsByStatus.completed,
    },
    schedules: {
      total: upcomingSchedules.length,
      upcoming: upcomingSchedules.slice(0, 5), // 최대 5개만
    },
    pendingTasks: {
      reportPending,
      settlementPending,
      todoCount,
      settlementTasks,
    },
  }
}

