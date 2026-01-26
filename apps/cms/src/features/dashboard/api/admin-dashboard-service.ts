/**
 * 관리자 대시보드 서비스
 * Phase 4.5: 관리자 홈 대시보드
 * FR-C01: 전체 프로그램 진행 현황 7단계 세분화
 */

import { mockPrograms } from '@/data/mock/programs'
import { mockApplications } from '@/data/mock/applications'
import { mockMatchings } from '@/data/mock/matchings'
import { mockSettlements } from '@/data/mock/settlements'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import { APPLICATION_PROGRESS_ORDER } from '@/types/application-progress'

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

/** FR-C01: 7단계 프로그램 진행 현황 */
export interface ProgramProgress7Stage {
  /** 수강자 모집 */
  studentRecruitment: number
  /** 강사 모집 */
  instructorRecruitment: number
  /** 매칭 완료 */
  matchingCompleted: number
  /** 교육 진행 중 (교재 발송 전) */
  educationBeforeTextbook: number
  /** 교육 진행 중 (교재 발송 후) */
  educationAfterTextbook: number
  /** 교육 진행 완료 */
  educationCompleted: number
  /** 서류 처리 완료 */
  documentProcessingCompleted: number
  /** 합계 */
  total: number
}

export interface PendingActionCounts {
  pendingApplications: number
  pendingMatchings: number
  pendingSettlements: number
}

/**
 * 프로그램 진행 현황 집계 (기존 8단계)
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
 * FR-C01: 7단계 프로그램 진행 현황 집계
 * - 수강자 모집 / 강사 모집 / 매칭 완료 / 교육 진행 중 (교재 발송 전) / 교육 진행 중 (교재 발송 후) / 교육 진행 완료 / 서류 처리 완료
 */
export async function getProgramProgress7Stage(): Promise<ProgramProgress7Stage> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 매칭 상태 확인 (프로그램별)
  const matchingsByProgram = new Map<string, number>()
  mockMatchings.forEach(matching => {
    const count = matchingsByProgram.get(matching.programId) || 0
    matchingsByProgram.set(matching.programId, count + 1)
  })

  // 프로그램별 최신 progressStatus 확인 (승인된 신청서 중 가장 진행된 상태)
  const programProgressStatus = new Map<string, ApplicationProgressStatus>()
  mockApplications
    .filter((app): app is typeof app & { progressStatus: ApplicationProgressStatus } =>
      app.status === 'approved' && !!app.progressStatus
    )
    .forEach(app => {
      const current = programProgressStatus.get(app.programId)
      if (!current) {
        programProgressStatus.set(app.programId, app.progressStatus)
      } else {
        // 더 진행된 상태로 업데이트 (APPLICATION_PROGRESS_ORDER 기준)
        const currentIndex = APPLICATION_PROGRESS_ORDER.indexOf(current)
        const newIndex = APPLICATION_PROGRESS_ORDER.indexOf(app.progressStatus)
        if (newIndex > currentIndex) {
          programProgressStatus.set(app.programId, app.progressStatus)
        }
      }
    })

  // 7단계 집계 초기화
  const stages = {
    studentRecruitment: 0,
    instructorRecruitment: 0,
    matchingCompleted: 0,
    educationBeforeTextbook: 0,
    educationAfterTextbook: 0,
    educationCompleted: 0,
    documentProcessingCompleted: 0,
  }

  // 프로그램별로 집계
  mockPrograms.forEach(program => {
    // 1. 수강자 모집: lifecycleStatus가 recruiting_students
    if (program.lifecycleStatus === 'recruiting_students') {
      stages.studentRecruitment++
      return
    }

    // 2. 강사 모집: lifecycleStatus가 recruiting_instructors
    if (program.lifecycleStatus === 'recruiting_instructors') {
      stages.instructorRecruitment++
      return
    }

    // 3. 매칭 완료: 매칭이 있고 (progressStatus가 MATCHING_COMPLETED 또는 lifecycleStatus가 matching_completed_waiting)
    const hasMatching = matchingsByProgram.has(program.id)
    const progressStatus = programProgressStatus.get(program.id)
    if (hasMatching && (progressStatus === 'MATCHING_COMPLETED' || program.lifecycleStatus === 'matching_completed_waiting')) {
      stages.matchingCompleted++
      return
    }

    // 4. 교육 진행 중 (교재 발송 전): progressStatus가 MATERIAL_PREPARING
    if (progressStatus === 'MATERIAL_PREPARING') {
      stages.educationBeforeTextbook++
      return
    }

    // 5. 교육 진행 중 (교재 발송 후): progressStatus가 MATERIAL_SHIPPED
    if (progressStatus === 'MATERIAL_SHIPPED') {
      stages.educationAfterTextbook++
      return
    }

    // 6. 교육 진행 완료: progressStatus가 IN_PROGRESS
    if (progressStatus === 'IN_PROGRESS') {
      stages.educationCompleted++
      return
    }

    // 7. 서류 처리 완료: progressStatus가 SURVEY_SUBMITTED 또는 REPORT_SUBMITTED
    if (progressStatus === 'SURVEY_SUBMITTED' || progressStatus === 'REPORT_SUBMITTED') {
      stages.documentProcessingCompleted++
      return
    }

    // 기본값: lifecycleStatus 기반
    if (program.lifecycleStatus === 'matching_completed_waiting' && hasMatching) {
      stages.matchingCompleted++
    } else if (program.lifecycleStatus === 'in_progress') {
      stages.educationCompleted++
    } else if (program.lifecycleStatus === 'completed') {
      stages.documentProcessingCompleted++
    }
  })

  const total = Object.values(stages).reduce((sum, count) => sum + count, 0)

  return {
    ...stages,
    total,
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
