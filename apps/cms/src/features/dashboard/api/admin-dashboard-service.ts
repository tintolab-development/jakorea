/**
 * 관리자 대시보드 서비스
 * Phase 4.5: 관리자 홈 대시보드
 */

import { mockPrograms } from '@/data/mock/programs'
import { mockApplications } from '@/data/mock/applications'
import { mockMatchings } from '@/data/mock/matchings'
import { mockSettlements } from '@/data/mock/settlements'

export interface ProgramProgressSummary {
  total: number
  byStatus: {
    RECEIVED: number
    MATCHING_IN_PROGRESS: number
    MATCHING_COMPLETED: number
    MATERIAL_PREPARING: number
    MATERIAL_SHIPPED: number
    IN_PROGRESS: number
    SURVEY_SUBMITTED: number
    REPORT_SUBMITTED: number
  }
}

export interface PendingActionCounts {
  pendingApplications: number
  pendingMatchings: number
  pendingSettlements: number
}

/**
 * 프로그램 진행 현황 집계
 */
export async function getProgramProgressSummary(): Promise<ProgramProgressSummary> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // Application의 상태를 기반으로 프로그램 진행 현황 집계
  const applications = mockApplications.filter(app => app.status === 'approved')
  
  // 매칭 상태 확인
  const matchingsByProgram = new Map<string, number>()
  mockMatchings.forEach(matching => {
    const count = matchingsByProgram.get(matching.programId) || 0
    matchingsByProgram.set(matching.programId, count + 1)
  })

  // 상태별 집계 초기화
  const byStatus = {
    RECEIVED: 0,
    MATCHING_IN_PROGRESS: 0,
    MATCHING_COMPLETED: 0,
    MATERIAL_PREPARING: 0,
    MATERIAL_SHIPPED: 0,
    IN_PROGRESS: 0,
    SURVEY_SUBMITTED: 0,
    REPORT_SUBMITTED: 0,
  }

  // 프로그램별로 상태 매핑
  applications.forEach(app => {
    const program = mockPrograms.find(p => p.id === app.programId)
    if (!program) return

    // lifecycleStatus 기반으로 상태 매핑
    // 실제 ProgramLifecycleStatus 타입에 맞게 매핑
    switch (program.lifecycleStatus) {
      case 'recruiting_students':
      case 'recruiting_instructors':
      case 'recruitment_completed_waiting':
        byStatus.RECEIVED++
        break
      case 'matching_completed_waiting':
        // 매칭이 있으면 MATCHING_COMPLETED, 없으면 MATCHING_IN_PROGRESS
        if (matchingsByProgram.has(app.programId)) {
          byStatus.MATCHING_COMPLETED++
        } else {
          byStatus.MATCHING_IN_PROGRESS++
        }
        break
      case 'in_progress':
        byStatus.IN_PROGRESS++
        break
      case 'completed':
        byStatus.REPORT_SUBMITTED++
        break
      default:
        // 매칭이 있으면 MATCHING_COMPLETED, 없으면 MATCHING_IN_PROGRESS
        if (matchingsByProgram.has(app.programId)) {
          byStatus.MATCHING_COMPLETED++
        } else {
          byStatus.MATCHING_IN_PROGRESS++
        }
    }
  })

  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0)

  return {
    total,
    byStatus,
  }
}

/**
 * 대기 중인 작업 카운트
 */
export async function getPendingActionCounts(): Promise<PendingActionCounts> {
  await new Promise(resolve => setTimeout(resolve, 200))

  // 대기 중인 신청 (submitted, reviewing)
  const pendingApplications = mockApplications.filter(
    app => app.status === 'submitted' || app.status === 'reviewing'
  ).length

  // 대기 중인 매칭 (pending)
  const pendingMatchings = mockMatchings.filter(
    m => m.status === 'pending'
  ).length

  // 대기 중인 정산 (pending, calculated)
  const pendingSettlements = mockSettlements.filter(
    s => s.status === 'pending' || s.status === 'calculated'
  ).length

  return {
    pendingApplications,
    pendingMatchings,
    pendingSettlements,
  }
}
