/**
 * 관리자 대시보드 서비스
 * Phase 4.5: 관리자 홈 대시보드
 * FR-C01: 전체 프로그램 진행 현황 7단계 세분화
 */

import type { Program } from '@/types/domain'
import { mockPrograms } from '@/data/mock/programs'
import { getEducationPrograms } from '@/data/mock/education-programs'
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

/** 사업별 KPI 대비 달성률 위젯: KPI 한 항목 */
export type KpiMetricKey = 'finalParticipants' | 'finalSchools' | 'finalClasses'

export interface KpiMetric {
  key: KpiMetricKey
  label: string
  description: string
  achieved: number
  target: number
}

/** 사업별 KPI 대비 달성률 위젯: 프로그램 한 건 */
export interface ProgramKpiItem {
  programId: string
  programTitle: string
  kpis: KpiMetric[]
}

/**
 * 프로그램 진행 현황 집계 (레거시 8단계 byStatus)
 * 7단계 lifecycle → RECEIVED, MATCHING_*, MATERIAL_*, IN_PROGRESS, REPORT_SUBMITTED 매핑
 */
export async function getProgramProgressSummary(): Promise<ProgramProgressSummary> {
  await new Promise(resolve => setTimeout(resolve, 300))

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

  mockPrograms.forEach(program => {
    switch (program.lifecycleStatus) {
      case 'recruiting_students':
      case 'recruiting_instructors':
        byStatus.RECEIVED++
        break
      case 'matching_completed':
        byStatus.MATCHING_COMPLETED++
        break
      case 'education_before_textbook':
        byStatus.MATERIAL_PREPARING++
        break
      case 'education_after_textbook':
        byStatus.MATERIAL_SHIPPED++
        break
      case 'education_completed':
        byStatus.IN_PROGRESS++
        break
      case 'document_processing_completed':
        byStatus.REPORT_SUBMITTED++
        break
      default:
        break
    }
  })

  const total = Object.values(byStatus).reduce((sum, c) => sum + c, 0)
  return { total, byStatus }
}

/**
 * FR-C01: 7단계 프로그램 진행 현황 집계 (ProgramLifecycleStatus와 동기화)
 * - programType 'education' 시 교육 프로그램만 집계 (목록 페이지 테이블과 동기화)
 */
export async function getProgramProgress7Stage(options?: {
  programType?: 'education' | 'volunteer' | 'all'
}): Promise<ProgramProgress7Stage> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const programs =
    options?.programType === 'education' ? getEducationPrograms() : mockPrograms

  const stages = {
    studentRecruitment: 0,
    instructorRecruitment: 0,
    matchingCompleted: 0,
    educationBeforeTextbook: 0,
    educationAfterTextbook: 0,
    educationCompleted: 0,
    documentProcessingCompleted: 0,
  }

  programs.forEach(program => {
    switch (program.lifecycleStatus) {
      case 'recruiting_students':
        stages.studentRecruitment++
        break
      case 'recruiting_instructors':
        stages.instructorRecruitment++
        break
      case 'matching_completed':
        stages.matchingCompleted++
        break
      case 'education_before_textbook':
        stages.educationBeforeTextbook++
        break
      case 'education_after_textbook':
        stages.educationAfterTextbook++
        break
      case 'education_completed':
        stages.educationCompleted++
        break
      case 'document_processing_completed':
        stages.documentProcessingCompleted++
        break
      default:
        break // planned 등 7단계 외 상태는 집계 제외
    }
  })

  const total = Object.values(stages).reduce((sum, c) => sum + c, 0)
  return { ...stages, total }
}

/**
 * 특정 프로그램의 7단계 진행 현황 (상세 페이지 위젯용)
 * 해당 프로그램의 lifecycle 1건 + 동일 프로그램 신청/매칭 등 단계별 건수
 */
export async function getProgramProgress7StageByProgramId(
  programId: string
): Promise<ProgramProgress7Stage> {
  await new Promise(resolve => setTimeout(resolve, 150))

  const program = mockPrograms.find(p => p.id === programId)
  const stages = {
    studentRecruitment: 0,
    instructorRecruitment: 0,
    matchingCompleted: 0,
    educationBeforeTextbook: 0,
    educationAfterTextbook: 0,
    educationCompleted: 0,
    documentProcessingCompleted: 0,
  }

  if (program) {
    switch (program.lifecycleStatus) {
      case 'recruiting_students':
        stages.studentRecruitment = mockApplications.filter(a => a.programId === programId).length || 1
        break
      case 'recruiting_instructors':
        stages.instructorRecruitment = mockApplications.filter(a => a.programId === programId && a.subjectType === 'instructor').length || 1
        break
      case 'matching_completed':
      case 'education_before_textbook':
        stages.matchingCompleted = mockMatchings.filter(m => m.programId === programId).length || 1
        break
      case 'education_after_textbook':
        stages.educationAfterTextbook = 1
        break
      case 'education_completed':
        stages.educationCompleted = 1
        break
      case 'document_processing_completed':
        stages.documentProcessingCompleted = 1
        break
      default:
        stages.studentRecruitment = mockApplications.filter(a => a.programId === programId).length || 0
        break
    }
  }

  // 전체 건수는 해당 프로그램이 현재 속한 단계에 1건으로 집계
  const total = Math.max(1, Object.values(stages).reduce((sum, c) => sum + c, 0))
  return { ...stages, total }
}

/**
 * 모집 신청 현황 위젯용 프로그램 목록
 * 프로그램 리스트 + lifecycleStatus, approvedStudentCount, instructors, instructorCapacity 등
 */
export async function getRecruitmentStatusList(options?: {
  programIds?: string[]
}): Promise<Program[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  const programs = getEducationPrograms()
  if (options?.programIds && options.programIds.length > 0) {
    const idSet = new Set(options.programIds)
    return programs.filter(p => idSet.has(p.id))
  }
  return programs
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
  const pendingMatchings = mockMatchings.filter(m => m.status === 'pending').length

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

const KPI_LABELS: Record<KpiMetricKey, { label: string; description: string }> = {
  finalParticipants: { label: '최종 달성 인원', description: '명' },
  finalSchools: { label: '최종 파견 학교 수', description: '개' },
  finalClasses: { label: '최종 파견 학급 수', description: '개' },
}

/**
 * 사업 별 KPI 대비 달성률 위젯용 목록
 * programIds 있으면 해당 프로그램만, 없으면 전체(교육 프로그램)
 */
export async function getKpiAchievementList(options?: {
  programIds?: string[]
}): Promise<ProgramKpiItem[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  const programs = getEducationPrograms()
  const idSet =
    options?.programIds && options.programIds.length > 0
      ? new Set(options.programIds)
      : null
  const filtered = idSet ? programs.filter(p => idSet.has(p.id)) : programs

  return filtered.map((program, index) => {
    // 스크린샷과 유사하게 일부 달성/일부 미달 혼합 (인덱스 기반으로 패턴)
    const achievedParticipants = index % 3 === 0 ? 100 : 80
    const targetParticipants = 100
    const achievedSchools = 100
    const targetSchools = 100
    const achievedClasses = index % 2 === 0 ? 100 : 80
    const targetClasses = 100

    const kpis: KpiMetric[] = [
      {
        key: 'finalParticipants',
        label: KPI_LABELS.finalParticipants.label,
        description: KPI_LABELS.finalParticipants.description,
        achieved: achievedParticipants,
        target: targetParticipants,
      },
      {
        key: 'finalSchools',
        label: KPI_LABELS.finalSchools.label,
        description: KPI_LABELS.finalSchools.description,
        achieved: achievedSchools,
        target: targetSchools,
      },
      {
        key: 'finalClasses',
        label: KPI_LABELS.finalClasses.label,
        description: KPI_LABELS.finalClasses.description,
        achieved: achievedClasses,
        target: targetClasses,
      },
    ]
    return {
      programId: program.id,
      programTitle: program.title,
      kpis,
    }
  })
}
