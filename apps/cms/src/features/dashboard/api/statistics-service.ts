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

