/**
 * 관리자 대시보드 서비스
 * Phase 4.5: 관리자 홈 대시보드
 * FR-C01: 전체 프로그램 진행 현황 7단계 세분화
 *
 * 데이터 소스: 현재는 `@/data/mock/*` 기반(로컬 목). API 연동 시 이 모듈에서 분기·어댑터만 교체.
 */

import type { Program } from '@/types/domain'
import { mockPrograms, mockProgramsMap } from '@/data/mock/programs'
import { getEducationPrograms } from '@/data/mock/education-programs'
import { getCompanySchoolPrograms, getCompanySchoolProgramById } from '@/data/mock/economy-programs'
import { getGeneralPrograms } from '@/data/mock/general-programs'
import { getVolunteerPrograms } from '@/data/mock/volunteer-programs'
import { mockApplications } from '@/data/mock/applications'
import { mockMatchings } from '@/data/mock/matchings'
import { mockSettlements } from '@/data/mock/settlements'
import { MOCK_APPLICANT_INSTITUTIONS } from '@/data/mock/applicant-institutions'
import { MOCK_APPLICANT_INSTRUCTORS } from '@/data/mock/applicant-instructors'
import { mockInquiries } from '@/data/mock/inquiries'
import { mockPermissionRequests } from '@/data/mock/permission-requests'
import {
  mockPaymentOrderAdminProgramList,
  mockPaymentOrderAdminInstructorList,
} from '@/data/mock/payment-order-admin-list'
import { mockAccountPaymentRows } from '@/data/mock/account-payments-list'
import { SHORTCUT_ITEMS } from '@/features/dashboard/model/dashboard-settings-store'

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

/** 7단계 프로그램 진행 현황 (교육/봉사, 경제교육 교재 전·후 포함) */
export interface ProgramProgressStages {
  /** 참여자 모집 중 */
  studentRecruitment: number
  /** 강사 모집 중 */
  instructorRecruitment: number
  /** 참여자 모집 완료 (매칭 완료 + 교재 전) */
  matchingCompleted: number
  /** 교재 전 */
  educationBeforeTextbook: number
  /** 교재 후 진행 중 */
  educationAfterTextbook: number
  /** 강사 모집 완료 */
  educationCompleted: number
  /** 봉사자 모집 완료 */
  documentProcessingCompleted: number
  /** 합계 */
  total: number
}

/** 1사1교·일반 프로그램 3단계 진행 현황 (예정/진행/완료) */
export interface ProgramOverviewStages {
  scheduled: number
  inProgress: number
  completed: number
  total: number
}

/** @deprecated `ProgramOverviewStages` 사용 */
export type ProgramEconomyStages = ProgramOverviewStages

export type ProgramProgressStagesResult = ProgramProgressStages | ProgramOverviewStages

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
  /** 프로그램 상세 > 사업 KPI: 교육진행자 목표 (강사·봉사자) */
  educationInstructorTargets?: { instructors: number; volunteers: number }
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
      case 'planned':
      case 'instructor_recruitment_planned':
      case 'volunteer_recruitment_planned':
      case 'participant_instructor_recruitment_planned':
        break
      case 'recruiting_students':
      case 'recruiting_instructors':
      case 'recruiting_volunteers':
      case 'participant_instructor_recruiting':
        byStatus.RECEIVED++
        break
      case 'matching_completed':
      case 'participant_instructor_recruitment_completed':
        byStatus.MATCHING_COMPLETED++
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
 * 프로그램 진행 현황 집계 (상태별 세분화)
 * - programType 'education' | 'volunteer' 시 7단계 집계
 * - programType 'company_school' | 'general' 시 4카드(예정/진행/완료) 집계
 */
export async function getProgramProgressStages(options?: {
  programType?: 'education' | 'company_school' | 'general' | 'volunteer' | 'all'
}): Promise<ProgramProgressStagesResult> {
  await new Promise(resolve => setTimeout(resolve, 300))

  if (options?.programType === 'company_school' || options?.programType === 'general') {
    const programs =
      options.programType === 'general' ? getGeneralPrograms() : getCompanySchoolPrograms()
    const stages = {
      scheduled: 0,
      inProgress: 0,
      completed: 0,
    }

    programs.forEach(program => {
      const status = program.lifecycleStatus || ''
      if (
        [
          'recruiting_students',
          'recruiting_instructors',
          'matching_completed',
          'education_before_textbook',
        ].includes(status)
      ) {
        stages.scheduled++
      } else if (status === 'education_after_textbook') {
        stages.inProgress++
      } else if (['education_completed', 'document_processing_completed'].includes(status)) {
        stages.completed++
      }
    })

    return { ...stages, total: programs.length }
  }

  const programs = options?.programType === 'education' ? getEducationPrograms() : mockPrograms

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
      case 'participant_instructor_recruiting':
        stages.studentRecruitment++
        stages.instructorRecruitment++
        break
      case 'matching_completed':
        stages.matchingCompleted++
        break
      case 'participant_instructor_recruitment_completed':
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
        break // planned 등 그 외 상태는 집계 제외
    }
  })

  const total = Object.values(stages).reduce((sum, c) => sum + c, 0)
  return { ...stages, total }
}

/**
 * 특정 프로그램의 7단계 진행 현황 (상세 페이지 위젯용)
 */
export async function getProgramProgressStagesByProgramId(
  programId: string
): Promise<ProgramProgressStages> {
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
      case 'planned':
      case 'instructor_recruitment_planned':
      case 'volunteer_recruitment_planned':
      case 'participant_instructor_recruitment_planned':
        break
      case 'recruiting_students':
        stages.studentRecruitment =
          mockApplications.filter(a => a.programId === programId).length || 1
        break
      case 'recruiting_instructors':
      case 'recruiting_volunteers':
        stages.instructorRecruitment =
          mockApplications.filter(a => a.programId === programId && a.subjectType === 'instructor')
            .length || 1
        break
      case 'participant_instructor_recruiting':
        stages.studentRecruitment = mockApplications.filter(a => a.programId === programId).length || 1
        stages.instructorRecruitment = mockApplications.filter(a => a.programId === programId && a.subjectType === 'instructor').length || 1
        break
      case 'matching_completed':
      case 'participant_instructor_recruitment_completed':
        stages.matchingCompleted = mockMatchings.filter(m => m.programId === programId).length || 1
        break
      case 'education_before_textbook':
        stages.educationBeforeTextbook = 1
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
        stages.studentRecruitment =
          mockApplications.filter(a => a.programId === programId).length || 0
        break
    }
  }

  // 전체 건수는 해당 프로그램이 현재 속한 단계에 1건으로 집계
  const total = Math.max(
    1,
    Object.values(stages).reduce((sum, c) => sum + c, 0)
  )
  return { ...stages, total }
}

/**
 * 모집 신청 현황 위젯용 프로그램 목록
 * 프로그램 리스트 + lifecycleStatus, approvedStudentCount, instructors, instructorCapacity 등
 * 정합성: 일반 교육 프로그램 목록과 동일한 getEducationPrograms() 사용 → 목록·위젯 상태 일치
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

/** 사업 KPI 목표·위젯 공통: 달성/목표 수치 (patternIndex로 목록 간 변주) */
function buildKpiMetricsForPattern(patternIndex: number): KpiMetric[] {
  const achievedParticipants = patternIndex % 3 === 0 ? 100 : 80
  const targetParticipants = 100
  const achievedSchools = 100
  const targetSchools = 100
  const achievedClasses = patternIndex % 2 === 0 ? 100 : 80
  const targetClasses = 100

  return [
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
}

function buildProgramKpiItemFromProgram(program: Program, patternIndex: number): ProgramKpiItem {
  return {
    programId: program.id,
    programTitle: program.title ?? '',
    kpis: buildKpiMetricsForPattern(patternIndex),
    educationInstructorTargets: { instructors: 80, volunteers: 80 },
  }
}

/** 상세 모달 등: id만 알 때 — 목 KPI로 항상 행이 채워지도록 */
function buildDefaultProgramKpiItem(programId: string, title: string): ProgramKpiItem {
  return {
    programId,
    programTitle: title,
    kpis: buildKpiMetricsForPattern(0),
    educationInstructorTargets: { instructors: 80, volunteers: 80 },
  }
}

/**
 * 사업 별 KPI 대비 달성률 위젯용 목록
 * programIds 있으면 해당 id마다 1건씩 반환(교육 목록에 없어도 mockPrograms·기본값으로 채움)
 */
export async function getKpiAchievementList(options?: {
  programIds?: string[]
}): Promise<ProgramKpiItem[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  const educationPrograms = getEducationPrograms()

  if (options?.programIds && options.programIds.length > 0) {
    return options.programIds.map((id, requestIndex) => {
      const inEducation = educationPrograms.find(p => p.id === id)
      if (inEducation) {
        const patternIndex = educationPrograms.indexOf(inEducation)
        return buildProgramKpiItemFromProgram(inEducation, patternIndex)
      }
      const fromRegistry = mockProgramsMap.get(id)
      if (fromRegistry) {
        return buildProgramKpiItemFromProgram(fromRegistry, requestIndex)
      }
      const companySchoolProgram = getCompanySchoolProgramById(id)
      if (companySchoolProgram) {
        return buildProgramKpiItemFromProgram(companySchoolProgram, requestIndex)
      }
      return buildDefaultProgramKpiItem(id, '프로그램')
    })
  }

  return educationPrograms.map((program, index) =>
    buildProgramKpiItemFromProgram(program, index)
  )
}

/** getProgramProgressStages(교육)와 동일한 lifecycle 집계 — 동기·목 데이터 전용 */
function accumulateLifecycleStages(programs: Program[]): ProgramProgressStages {
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
      case 'participant_instructor_recruiting':
        stages.studentRecruitment++
        stages.instructorRecruitment++
        break
      case 'matching_completed':
        stages.matchingCompleted++
        break
      case 'participant_instructor_recruitment_completed':
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
        break
    }
  })

  const total = Object.values(stages).reduce((sum, c) => sum + c, 0)
  return { ...stages, total }
}

function getPendingActionCountsSync(): PendingActionCounts {
  const pendingApplications = mockApplications.filter(
    app => app.status === 'submitted' || app.status === 'reviewing'
  ).length
  const pendingMatchings = mockMatchings.filter(m => m.status === 'pending').length
  const pendingSettlements = mockSettlements.filter(
    s => s.status === 'pending' || s.status === 'calculated'
  ).length
  return {
    pendingApplications,
    pendingMatchings,
    pendingSettlements,
  }
}

/**
 * 메뉴 바로가기 위젯 배지: 목 데이터 기준 미처리·모집·승인 대기 건수 (동기).
 * API 연동 시 이 함수만 서버 집계로 교체하면 된다.
 */
export function getMenuShortcutBadgeCounts(): Record<string, number> {
  const educationPrograms = getEducationPrograms()
  const stages = accumulateLifecycleStages(educationPrograms)
  const companySchoolPrograms = getCompanySchoolPrograms()
  const companySchoolStages = accumulateLifecycleStages(companySchoolPrograms)
  const geminiPrograms = educationPrograms.filter(
    p => (p.title ?? '').includes('제미나이') || (p.mainTitle ?? '').includes('제미나이')
  )
  const geminiStages = accumulateLifecycleStages(geminiPrograms)
  const ujatPrograms = getVolunteerPrograms()
  const ujatStages = accumulateLifecycleStages(ujatPrograms)

  const pending = getPendingActionCountsSync()
  const institutionPending = MOCK_APPLICANT_INSTITUTIONS.filter(s => s.approvalStatus === 'pending').length
  const instructorApplicantPending = MOCK_APPLICANT_INSTRUCTORS.filter(s => s.approvalStatus === 'pending')
    .length
  const inquiryPending = mockInquiries.filter(i => i.status === 'PENDING').length
  const permissionPending = mockPermissionRequests.filter(r => r.status === 'PENDING').length

  const paymentOrderPending =
    mockPaymentOrderAdminProgramList.filter(r => r.processingStatus === 'pending').length +
    mockPaymentOrderAdminInstructorList.filter(r => r.processingStatus === 'pending').length

  const accountPaymentPending = mockAccountPaymentRows.filter(
    r => r.accountPaymentStatus !== 'account_paid'
  ).length

  const mapped: Record<string, number> = {
    'programs-general-education': stages.studentRecruitment,
    'programs-economy': companySchoolStages.studentRecruitment + companySchoolStages.instructorRecruitment,
    'programs-gemini': geminiStages.studentRecruitment + geminiStages.instructorRecruitment,
    'programs-ujat': ujatStages.studentRecruitment + ujatStages.instructorRecruitment,
    'programs-detail': stages.matchingCompleted,
    'users-all': Math.min(
      999,
      institutionPending + instructorApplicantPending + pending.pendingApplications
    ),
    'users-school': institutionPending,
    'users-instructor': instructorApplicantPending,
    'users-admin': 0,
    'permission-requests': permissionPending,
    'settlement-payment-orders': paymentOrderPending,
    'settlement-account-payments': accountPaymentPending,
    'settlement-item-settings': 0,
    notices: 0,
    faq: 0,
    inquiries: inquiryPending,
    'template-management': 0,
    sponsors: 0,
    textbooks: 0,
    performance: pending.pendingSettlements,
    'email-history': 0,
    'file-download-history': 0,
    'privacy-query-history': 0,
    'bug-issue-history': 0,
  }

  const out: Record<string, number> = {}
  for (const item of SHORTCUT_ITEMS) {
    out[item.id] = mapped[item.id] ?? 0
  }
  return out
}
