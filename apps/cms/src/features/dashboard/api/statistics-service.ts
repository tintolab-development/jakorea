/**
 * 대시보드 통계 데이터 조회 API (Mock)
 * Phase 5.1.1: 관리자 대시보드
 */

import { mockPrograms, mockApplications, mockMatchings, mockSettlements } from '@/data/mock'

/**
 * 전체 통계 데이터
 */
export interface OverallStatistics {
  programs: {
    total: number
    inProgress: number
    completed: number
  }
  applications: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  matchings: {
    total: number
    confirmed: number
    pending: number
  }
  settlements: {
    total: number
    pending: number
    approved: number
    paid: number
  }
}

/**
 * 전체 통계 조회
 */
export async function getOverallStatistics(): Promise<OverallStatistics> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 프로그램 통계 (status: 'active' = 진행중, 'completed' = 완료)
  const programs = mockPrograms
  const programStats = {
    total: programs.length,
    inProgress: programs.filter(p => p.status === 'active').length,
    completed: programs.filter(p => p.status === 'completed').length,
  }

  // 신청 통계 (status: 'submitted' | 'reviewing' = 대기, 'approved' = 승인, 'rejected' = 반려)
  const applications = mockApplications
  const applicationStats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'submitted' || a.status === 'reviewing').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  // 매칭 통계 (status: 'active' = 확정, 'pending' = 대기)
  const matchings = mockMatchings
  const matchingStats = {
    total: matchings.length,
    confirmed: matchings.filter(m => m.status === 'active').length,
    pending: matchings.filter(m => m.status === 'pending').length,
  }

  // 정산 통계 (status: 'pending' = 대기, 'approved' = 승인, 'paid' = 지급완료)
  const settlements = mockSettlements
  const settlementStats = {
    total: settlements.length,
    pending: settlements.filter(s => s.status === 'pending' || s.status === 'calculated').length,
    approved: settlements.filter(s => s.status === 'approved').length,
    paid: settlements.filter(s => s.status === 'paid').length,
  }

  return {
    programs: programStats,
    applications: applicationStats,
    matchings: matchingStats,
    settlements: settlementStats,
  }
}

/**
 * 전체 강의 진행 현황
 */
export interface OverallProgramProgress {
  applicationCompleted: number // 신청 완료
  scheduled: number // 진행 예정
  inProgress: number // 진행 중
  completed: number // 진행 완료
}

/**
 * 전체 강의 진행 현황 조회
 */
export async function getOverallProgramProgress(): Promise<OverallProgramProgress> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const programs = mockPrograms
  const now = new Date()

  let applicationCompleted = 0
  let scheduled = 0
  let inProgress = 0
  let completed = 0

  programs.forEach(program => {
    const startDate = new Date(program.startDate)
    const endDate = new Date(program.endDate)

    // 진행 완료: lifecycleStatus가 'completed'이거나 종료일이 지난 경우
    if (program.lifecycleStatus === 'completed' || now > endDate) {
      completed++
      return
    }

    // 진행 중: lifecycleStatus가 'in_progress'이거나 현재 날짜가 시작일과 종료일 사이인 경우
    if (program.lifecycleStatus === 'in_progress' || (now >= startDate && now <= endDate)) {
      inProgress++
      return
    }

    // 진행 예정: lifecycleStatus가 'matching_completed_waiting'이거나 시작일이 미래인 경우
    if (
      program.lifecycleStatus === 'matching_completed_waiting' ||
      (program.lifecycleStatus === 'recruitment_completed_waiting' && now < startDate) ||
      (now < startDate && program.lifecycleStatus !== 'planned' && program.lifecycleStatus !== 'recruiting_students' && program.lifecycleStatus !== 'recruiting_instructors')
    ) {
      scheduled++
      return
    }

    // 신청 완료: Application status가 'approved'이고 프로그램이 아직 시작하지 않은 경우
    // 또는 모집 완료 단계
    if (
      program.lifecycleStatus === 'recruitment_completed_waiting' ||
      program.lifecycleStatus === 'recruiting_instructors'
    ) {
      applicationCompleted++
      return
    }
  })

  return {
    applicationCompleted,
    scheduled,
    inProgress,
    completed,
  }
}

