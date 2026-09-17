/**
 * 관리자 대시보드 서비스
 * Phase 4.5: 관리자 홈 대시보드
 * FR-C01: 전체 프로그램 진행 현황 7단계 세분화
 *
 * 데이터 소스: 현재는 `@/data/mock/*` 기반(로컬 목). API 연동 시 이 모듈에서 분기·어댑터만 교체.
 */

import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import type { Program } from '@/types/domain'
import { countGeneralProgramOverviewStages } from '@/features/program/general/lib/overview-stage-counts'
import { countCompanySchoolOverviewStages } from '@/features/program/1c-1s/lib/overview-stage-counts'
import { mockApplications } from '@/data/mock/applications'
import { mockMatchings } from '@/data/mock/matchings'
import { mockSettlements } from '@/data/mock/settlements'
import { MOCK_APPLICANT_INSTITUTIONS } from '@/features/program/shared/model/applicant-institution'
import { MOCK_APPLICANT_INSTRUCTORS } from '@/features/program/shared/model/applicant-instructor'
import { mockInquiries } from '@/data/mock/inquiries'
import { mockInstructors } from '@/data/mock/instructors'
import { mockPermissionRequests } from '@/data/mock/permission-requests'
import {
  mockPaymentOrderAdminProgramList,
  mockPaymentOrderAdminInstructorList,
} from '@/data/mock/payment-order-admin-list'
import { mockAccountPaymentRows } from '@/data/mock/account-payments-list'
import { SHORTCUT_ITEMS, DASHBOARD_HOME_PATH } from '@/features/dashboard/model/dashboard-settings-store'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import {
  fetchDashboardHomeRemote,
  fetchDashboardKpiProgressRemote,
  fetchDashboardNotificationCountRemote,
  fetchDashboardProgramInquiriesRemote,
  fetchDashboardProgramSchedulesRemote,
  fetchDashboardRecruitmentsRemote,
  fetchDashboardShortcutsRemote,
  fetchDashboardShortcutBadgesRemote,
  readDashboardShortcutBadgeRemote,
  fetchAdminNotificationsRemote,
  markAdminNotificationReadRemote,
  markAllAdminNotificationsReadRemote,
  hideAdminNotificationRemote,
  toDashboardQueryParams,
} from '@/features/dashboard/api/dashboard-api-client'
import {
  mapDashboardHomeResponse,
  mapKpiProgressListResponse,
  mapProgramInquiryListResponse,
  mapProgramOptionsFromRecruitmentList,
  mapProgramScheduleListResponse,
  mapRecruitmentListResponse,
  type DashboardHomeSummary,
  type DashboardProgramOption,
  type DashboardScheduleEventDto,
  type ProgramInquiryRow,
} from '@/features/dashboard/api/adapters/dashboard-adapters'
import { mapNotificationInboxPage } from '@/features/dashboard/api/adapters/notification-adapters'
import type { Notification } from '@/features/dashboard/api/notification-service'
import { getDashboardProgramTypeParamForWidget } from '@/features/dashboard/lib/dashboard-widget-program-type'

export type { DashboardHomeSummary, ProgramInquiryRow, DashboardScheduleEventDto, DashboardProgramOption }

/** dashboard 실 API — 유효 JWT 없으면 mock fallback (403 방지) */
export function shouldUseDashboardRemoteApi(): boolean {
  return isRealApiModuleEnabled('dashboard') && hasRemoteAdminJwt()
}

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
  /** 참여 기관 모집 중 */
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
  /** null = API 미제공(달성 실적 없음) */
  achieved: number | null
  target: number
  /** false = 개인 대상·교육받은 교사 등 해당 없음(비활성) */
  applicable: boolean
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
  notifyProgramApiUnavailable('dashboard-program-progress-summary', '대시보드 · 프로그램 진행 현황')
  return {
    total: 0,
    byStatus: {
      RECEIVED: 0,
      MATCHING_IN_PROGRESS: 0,
      MATCHING_COMPLETED: 0,
      MATERIAL_PREPARING: 0,
      MATERIAL_SHIPPED: 0,
      IN_PROGRESS: 0,
      SURVEY_SUBMITTED: 0,
      REPORT_SUBMITTED: 0,
    },
  }
}

/**
 * 프로그램 진행 현황 집계 (상태별 세분화)
 * - programType 'education' | 'volunteer' 시 7단계 집계
 * - programType 'company_school' | 'general' 시 4카드(예정/진행/완료) 집계
 */
export async function getProgramProgressStages(options?: {
  programType?: 'education' | 'company_school' | 'general' | 'trained_teachers' | 'volunteer' | 'all'
}): Promise<ProgramProgressStagesResult> {
  await new Promise(resolve => setTimeout(resolve, 300))

  if (
    options?.programType === 'company_school' ||
    options?.programType === 'general' ||
    options?.programType === 'trained_teachers'
  ) {
    notifyProgramApiUnavailable('dashboard-program-progress-stages', '대시보드 · 프로그램 진행 현황')
    const programs: Program[] = []

    if (options.programType === 'general') {
      return countGeneralProgramOverviewStages(programs)
    }

    if (options.programType === 'company_school') {
      return countCompanySchoolOverviewStages(programs)
    }

    return { scheduled: 0, inProgress: 0, completed: 0, total: 0 }
  }

  notifyProgramApiUnavailable('dashboard-program-progress-stages-legacy', '대시보드 · 프로그램 진행 현황')
  const programs: Program[] = []

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
  _programId: string
): Promise<ProgramProgressStages> {
  void _programId
  notifyProgramApiUnavailable(
    'dashboard-program-progress-stages-by-id',
    '대시보드 · 프로그램 진행 현황'
  )
  return {
    studentRecruitment: 0,
    instructorRecruitment: 0,
    matchingCompleted: 0,
    educationBeforeTextbook: 0,
    educationAfterTextbook: 0,
    educationCompleted: 0,
    documentProcessingCompleted: 0,
    total: 0,
  }
}

/**
 * 모집 신청 현황 위젯용 프로그램 목록
 * remote dashboard recruitments API. mock 카탈로그 없음.
 */
export async function getRecruitmentStatusList(options?: {
  programIds?: string[]
}): Promise<Program[]> {
  if (shouldUseDashboardRemoteApi()) {
    const queryParams = toDashboardQueryParams({ programIds: options?.programIds })
    const dto = await fetchDashboardRecruitmentsRemote(queryParams)
    return mapRecruitmentListResponse(dto)
  }
  notifyProgramApiUnavailable('dashboard-recruitment-status', '대시보드 · 모집 신청 현황')
  return []
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

/**
 * 사업 별 KPI 대비 달성률 위젯용 목록
 */
export async function getKpiAchievementList(options?: {
  programIds?: string[]
}): Promise<ProgramKpiItem[]> {
  if (shouldUseDashboardRemoteApi()) {
    const queryParams = toDashboardQueryParams({ programIds: options?.programIds })
    const dto = await fetchDashboardKpiProgressRemote(queryParams)
    return mapKpiProgressListResponse(dto)
  }
  notifyProgramApiUnavailable('dashboard-kpi-achievement', '대시보드 · 사업 KPI')
  return []
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
  const emptyStages = accumulateLifecycleStages([])

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
    'programs-general-education': emptyStages.studentRecruitment,
    'programs-economy': 0,
    'programs-gemini': 0,
    'programs-ujat': 0,
    'programs-detail': emptyStages.matchingCompleted,
    'users-all': Math.min(
      999,
      institutionPending + instructorApplicantPending + pending.pendingApplications
    ),
    'users-school': institutionPending,
    'users-instructor': instructorApplicantPending,
    'users-admin': 0,
    'permission-requests': permissionPending,
    'admin-permission-settings': 0,
    'program-permission-settings': 0,
    'settlement-payment-orders': paymentOrderPending,
    'settlement-account-payments': accountPaymentPending,
    'settlement-item-settings': 0,
    notices: 0,
    faq: 0,
    inquiries: inquiryPending,
    'template-management': 0,
    sponsors: 0,
    textbooks: 0,
    'notification-messages': 0,
    performance: pending.pendingSettlements,
    'member-login-history': 0,
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

/** Swagger: GET /api/admin/dashboard/home */
export async function getDashboardHomeSummary(): Promise<DashboardHomeSummary> {
  if (shouldUseDashboardRemoteApi()) {
    const dto = await fetchDashboardHomeRemote()
    return mapDashboardHomeResponse(dto)
  }
  notifyProgramApiUnavailable('dashboard-home-summary', '대시보드 · 홈 요약')
  return {
    version: 'mock',
    programCount: 0,
    memberCount: mockInstructors.length,
    unreadNotificationCount: 0,
  }
}

/** Swagger: GET /api/admin/dashboard/notifications/count */
export async function getDashboardNotificationCount(): Promise<number> {
  if (shouldUseDashboardRemoteApi()) {
    const dto = await fetchDashboardNotificationCountRemote()
    return dto.unreadCount ?? 0
  }
  return 0
}

/** Swagger: GET /api/admin/dashboard/program-inquiries */
export async function getProgramInquiryStatusList(options?: {
  programIds?: string[]
}): Promise<ProgramInquiryRow[]> {
  if (shouldUseDashboardRemoteApi()) {
    const queryParams = toDashboardQueryParams({ programIds: options?.programIds })
    const dto = await fetchDashboardProgramInquiriesRemote(queryParams)
    return mapProgramInquiryListResponse(dto)
  }
  return getProgramInquiryStatusListFromMock()
}

function getProgramInquiryStatusListFromMock(): ProgramInquiryRow[] {
  const grouped = new Map<string, { pending: number; answered: number; total: number }>()
  for (const inquiry of mockInquiries) {
    const programName = inquiry.category
    const bucket = grouped.get(programName) ?? { pending: 0, answered: 0, total: 0 }
    bucket.total += 1
    if (inquiry.status === 'PENDING') bucket.pending += 1
    else bucket.answered += 1
    grouped.set(programName, bucket)
  }
  return [...grouped.entries()].map(([programName, counts]) => ({
    key: programName,
    programName,
    unreadCount: counts.pending,
    ...counts,
  }))
}

/** Swagger: GET /api/admin/dashboard/program-schedules */
export async function getDashboardScheduleEvents(options?: {
  programIds?: string[]
  dateFrom?: string
  dateTo?: string
  programType?: string
}): Promise<DashboardScheduleEventDto[]> {
  if (shouldUseDashboardRemoteApi()) {
    const extra: Record<string, string> = {}
    if (options?.dateFrom) extra.dateFrom = options.dateFrom
    if (options?.dateTo) extra.dateTo = options.dateTo
    if (options?.programType) extra.programType = options.programType
    const queryParams = toDashboardQueryParams({
      programIds: options?.programIds,
      extra,
    })
    const dto = await fetchDashboardProgramSchedulesRemote(queryParams)
    return mapProgramScheduleListResponse(dto)
  }
  return []
}

/** Swagger: GET /api/admin/dashboard/recruitments — 위젯별 프로그램 선택 옵션 */
export async function getDashboardProgramOptions(widgetKey: string): Promise<DashboardProgramOption[]> {
  if (shouldUseDashboardRemoteApi()) {
    const programType = getDashboardProgramTypeParamForWidget(widgetKey)
    const extra = programType ? { programType } : undefined
    const queryParams = toDashboardQueryParams({ extra })
    const dto = await fetchDashboardRecruitmentsRemote(queryParams)
    return mapProgramOptionsFromRecruitmentList(dto)
  }
  return []
}

export interface DashboardShortcutItem {
  id: string
  label: string
  path: string
  iconKey?: string
  useYn: boolean
}

/** Swagger: GET /api/admin/dashboard/shortcuts */
export async function getDashboardShortcuts(): Promise<DashboardShortcutItem[]> {
  if (shouldUseDashboardRemoteApi()) {
    const dto = await fetchDashboardShortcutsRemote()
    const items = dto.items ?? []
    return items
      .filter(item => item.shortcutKey)
      .map(item => ({
        id: item.shortcutKey!,
        label: item.shortcutName ?? item.shortcutKey!,
        path: item.targetUrl ?? DASHBOARD_HOME_PATH,
        iconKey: item.iconKey,
        useYn: item.useYn !== false,
      }))
  }
  return SHORTCUT_ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    path: item.path,
    useYn: true,
  }))
}

export interface DashboardLogAlertItem {
  id: string
  actionType: string
  targetType: string
  targetId?: number
  adminId?: number
  accessedAt: string
}

/** 백엔드 v9 스펙에서 GET /api/admin/dashboard/log-alerts 제거됨 — 위젯은 빈 목록 유지 */
export async function getDashboardLogAlerts(): Promise<DashboardLogAlertItem[]> {
  return []
}

/** Swagger: GET /api/admin/me/dashboard-shortcut-badges */
export async function getDashboardShortcutBadges(): Promise<Record<string, number>> {
  if (shouldUseDashboardRemoteApi()) {
    const dto = await fetchDashboardShortcutBadgesRemote()
    return { ...(dto.counts ?? {}) }
  }
  return getMenuShortcutBadgeCounts()
}

/** Swagger: POST /api/admin/me/dashboard-shortcut-badges/{shortcutId}/read */
export async function readDashboardShortcutBadge(shortcutId: string): Promise<void> {
  if (!shouldUseDashboardRemoteApi()) return
  await readDashboardShortcutBadgeRemote(shortcutId, {
    shortcutId,
    readAt: new Date().toISOString(),
  })
}

/** Swagger: GET /api/admin/notifications */
export async function getAdminNotifications(options?: {
  page?: number
  size?: number
  unreadOnly?: boolean
}): Promise<Notification[]> {
  if (!shouldUseDashboardRemoteApi()) {
    return []
  }
  const dto = await fetchAdminNotificationsRemote({
    page: options?.page ?? 0,
    size: options?.size ?? 20,
    unreadOnly: options?.unreadOnly,
  })
  return mapNotificationInboxPage(dto.items)
}

/** Swagger: PATCH /api/admin/notifications/{recipientId}/read */
export async function markAdminNotificationAsRead(recipientId: string): Promise<void> {
  if (!shouldUseDashboardRemoteApi()) return
  await markAdminNotificationReadRemote(recipientId)
}

/** Swagger: PATCH /api/admin/notifications/read-all */
export async function markAllAdminNotificationsAsRead(): Promise<void> {
  if (!shouldUseDashboardRemoteApi()) return
  await markAllAdminNotificationsReadRemote()
}

/** Swagger: PATCH /api/admin/notifications/{recipientId}/hidden */
export async function hideAdminNotification(recipientId: string): Promise<void> {
  if (!shouldUseDashboardRemoteApi()) return
  await hideAdminNotificationRemote(recipientId)
}
