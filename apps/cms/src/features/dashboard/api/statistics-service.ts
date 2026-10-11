/**
 * 대시보드 통계 데이터 조회 API
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

const EMPTY_OVERALL: OverallStatistics = {
  programs: { total: 0, inProgress: 0, completed: 0 },
  applications: { total: 0, pending: 0, approved: 0, rejected: 0 },
  matchings: { total: 0, confirmed: 0, pending: 0 },
  settlements: { total: 0, pending: 0, approved: 0, paid: 0 },
}

export async function getOverallStatistics(): Promise<OverallStatistics> {
  return EMPTY_OVERALL
}

export async function getProgramStatistics(_programId: string): Promise<OverallStatistics['programs']> {
  return EMPTY_OVERALL.programs
}

export interface OverallProgramProgress {
  applicationCompleted: number
  scheduled: number
  inProgress: number
  completed: number
}

const EMPTY_PROGRAM_PROGRESS: OverallProgramProgress = {
  applicationCompleted: 0,
  scheduled: 0,
  inProgress: 0,
  completed: 0,
}

export async function getOverallProgramProgress(): Promise<OverallProgramProgress> {
  return EMPTY_PROGRAM_PROGRESS
}
