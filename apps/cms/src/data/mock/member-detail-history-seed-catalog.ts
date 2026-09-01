/**
 * CMS 회원 상세 — 프로젝트 참여 이력·정산·학교 수강·관리자 담당 mock ↔ BE seed SSOT
 *
 * - FE mock: `applications.ts` · `mypage.ts` · `users.ts` programRoles
 * - BE seed: Flyway fixture numeric id (applicationId / participantId / historyRowId)
 * - 5단계 시나리오 SSOT: `program-lecture-history-demo.ts` (economy-prog-001~005)
 *
 * @see apps/cms/docs/api/members/member-detail-history-seed-v1.spec.json
 * @see apps/cms/docs/api/members/member-management-backend-seed-handoff-2026-08-28.md §11
 */

import type { UserHistory } from '../../types/domain'
import { programLectureHistoryDemoApplications } from './program-lecture-history-demo'

export const MEMBER_DETAIL_HISTORY_SEED_LABEL = 'member-detail-history-v1-2026-08' as const

/** BE Flyway id 범위 — member directory(171xxx)와 분리 */
export const MEMBER_HISTORY_SEED_ID_RANGES = {
  /** GET .../applications item PK (`app-*` remote id) */
  memberApplicationId: [173001, 173400] as const,
  /** GET .../program-history participantId (`part-*` / `ph-*`) */
  memberProgramHistoryParticipantId: [173401, 173800] as const,
  /** 학교 GET .../program-enrollment-history historyRowId */
  schoolEnrollmentHistoryRowId: [174001, 174100] as const,
  /** 관리자 GET .../program-roles row id */
  adminProgramRoleId: [174501, 174550] as const,
  /** 강사 정산 GET .../settlements?instructorMemberId= */
  instructorSettlementId: [175001, 175100] as const,
} as const

/** program-lecture-history-demo 와 동일 programId — BE seed·FE mock 공통 */
export const MEMBER_HISTORY_DEMO_PROGRAM_IDS = [
  'economy-prog-001',
  'economy-prog-002',
  'economy-prog-003',
  'economy-prog-004',
  'economy-prog-005',
] as const

const DEMO_MANAGER_NAMES = [
  '이순신 매니저',
  '홍길동 매니저',
  '김담당 매니저',
  '박운영 매니저',
  '최지원 매니저',
] as const

/** 5단계 시나리오 라벨 (No.5→1 = submitted→completed) */
export const MEMBER_HISTORY_DEMO_STAGES = [
  { stage: 5, label: '신청 결과 대기', appStatus: 'submitted' },
  { stage: 4, label: '반려', appStatus: 'rejected' },
  { stage: 3, label: '교육 예정', appStatus: 'reviewing' },
  { stage: 2, label: '교육 진행 중', appStatus: 'approved', progress: 'IN_PROGRESS' },
  { stage: 1, label: '프로그램 종료', appStatus: 'approved', progress: 'REPORT_SUBMITTED' },
] as const

export type MemberDetailHistoryTab = 'enrollment' | 'lecture' | 'volunteer' | 'settlement' | 'schoolEnrollment' | 'adminProgramRoles'

export interface MemberDetailHistorySeedCase {
  caseId: string
  /** MD-* directory case 또는 SCHOOL-* / ADMIN-* */
  parentCaseId: string
  memberId?: number
  adminAccountId?: number
  organizationId?: number
  mockFeUserId: string
  keywordSearchName?: string
  memberProfile?: 'individual' | 'school_teacher' | 'instructor_only' | 'instructor_dual' | 'instructor_revoked'
  /** LNB 하위 탭 — BE seed 시 동일 탭 데이터 필요 */
  tabs: MemberDetailHistoryTab[]
  /** BE application PK 시작 (5건 연속) */
  applicationIdStart?: number
  /** BE program-history participant PK 시작 (봉사 ph-* 5건) */
  volunteerParticipantIdStart?: number
  /** FE mock application id prefix */
  feApplicationIdPrefix: string
  /** FE mock volunteer history id prefix */
  feVolunteerIdPrefix: string
  /** 강사 정산 BE id (instructor_only/dual/revoked) */
  settlementIdStart?: number
}

export interface SchoolEnrollmentHistorySeedCase {
  caseId: string
  organizationId: number
  mockFeUserId: string
  historyRowIdStart: number
  rowCount: 5
  programIds: readonly string[]
}

export interface AdminProgramRoleSeedCase {
  caseId: string
  adminAccountId: number
  mockFeUserId: string
  programRoleIdStart: number
  programIds: readonly string[]
}

/** 회원 디렉터리 showcase ↔ 상세 이력 — BE memberId 171001~171005 */
export const MEMBER_DETAIL_HISTORY_SEED_CASES: MemberDetailHistorySeedCase[] = [
  {
    caseId: 'MH-MD-INDIVIDUAL',
    parentCaseId: 'MD-INDIVIDUAL',
    memberId: 171001,
    mockFeUserId: 'mock-md-individual-171001',
    keywordSearchName: '김개인',
    memberProfile: 'individual',
    tabs: ['enrollment', 'volunteer'],
    applicationIdStart: 173001,
    volunteerParticipantIdStart: 173401,
    feApplicationIdPrefix: 'md-171001',
    feVolunteerIdPrefix: 'md-171001-vol',
  },
  {
    caseId: 'MH-MD-SCHOOL-TEACHER',
    parentCaseId: 'MD-SCHOOL-TEACHER',
    memberId: 171002,
    mockFeUserId: 'mock-instructor-kang-001',
    keywordSearchName: '강선생',
    memberProfile: 'school_teacher',
    tabs: ['enrollment', 'volunteer'],
    applicationIdStart: 173011,
    volunteerParticipantIdStart: 173411,
    feApplicationIdPrefix: 'md-171002',
    feVolunteerIdPrefix: 'md-171002-vol',
  },
  {
    caseId: 'MH-MD-INSTRUCTOR',
    parentCaseId: 'MD-INSTRUCTOR',
    memberId: 171003,
    mockFeUserId: 'mock-instructor-jung-001',
    keywordSearchName: '정멘토',
    memberProfile: 'instructor_only',
    tabs: ['enrollment', 'lecture', 'volunteer', 'settlement'],
    applicationIdStart: 173021,
    volunteerParticipantIdStart: 173421,
    settlementIdStart: 175001,
    feApplicationIdPrefix: 'md-171003',
    feVolunteerIdPrefix: 'md-171003-vol',
  },
  {
    caseId: 'MH-MD-INSTRUCTOR-DUAL',
    parentCaseId: 'MD-INSTRUCTOR-DUAL',
    memberId: 171004,
    mockFeUserId: 'mock-instructor-choi-001',
    keywordSearchName: '최강사',
    memberProfile: 'instructor_dual',
    tabs: ['enrollment', 'lecture', 'volunteer', 'settlement'],
    applicationIdStart: 173031,
    volunteerParticipantIdStart: 173431,
    settlementIdStart: 175011,
    feApplicationIdPrefix: 'md-171004',
    feVolunteerIdPrefix: 'md-171004-vol',
  },
  {
    caseId: 'MH-MD-INSTRUCTOR-REVOKED',
    parentCaseId: 'MD-INSTRUCTOR-REVOKED',
    memberId: 171005,
    mockFeUserId: 'mock-md-instructor-revoked-171005',
    keywordSearchName: '박박탈',
    memberProfile: 'instructor_revoked',
    tabs: ['enrollment', 'lecture', 'volunteer'],
    applicationIdStart: 173041,
    volunteerParticipantIdStart: 173441,
    feApplicationIdPrefix: 'md-171005',
    feVolunteerIdPrefix: 'md-171005-vol',
  },
]

/** 학교 organization 상세 — program-enrollment-history */
export const SCHOOL_ENROLLMENT_HISTORY_SEED_CASES: SchoolEnrollmentHistorySeedCase[] = [
  {
    caseId: 'MH-SCHOOL-SEOUL',
    organizationId: 171501,
    mockFeUserId: 'mock-school-seoul-001',
    historyRowIdStart: 174001,
    rowCount: 5,
    programIds: MEMBER_HISTORY_DEMO_PROGRAM_IDS,
  },
  {
    caseId: 'MH-SCHOOL-JINWOL',
    organizationId: 171502,
    mockFeUserId: 'mock-school-jinwol-001',
    historyRowIdStart: 174011,
    rowCount: 5,
    programIds: MEMBER_HISTORY_DEMO_PROGRAM_IDS,
  },
]

/** 관리자 상세 — program-roles */
export const ADMIN_PROGRAM_ROLE_SEED_CASES: AdminProgramRoleSeedCase[] = [
  {
    caseId: 'MH-ADMIN-MASTER',
    adminAccountId: 171601,
    mockFeUserId: 'mock-md-admin-171601',
    programRoleIdStart: 174501,
    programIds: MEMBER_HISTORY_DEMO_PROGRAM_IDS,
  },
]

const now = new Date()

function daysAgo(n: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

/** 봉사 탭 program-history (`ph-*`) — 5단계 demo와 동일 programId·담당자 */
export function createMemberDetailVolunteerHistories(
  userId: string,
  idPrefix: string,
  beParticipantIdStart?: number
): UserHistory[] {
  return programLectureHistoryDemoApplications.map((app, i) => {
    const stageIndex = programLectureHistoryDemoApplications.length - 1 - i
    const finalStatuses = ['CONFIRMED', 'CANCELLED', 'CONFIRMED', 'CONFIRMED', 'COMPLETED'] as const
    const hours = [4, 0, 6, 8, 12]
    const beId = beParticipantIdStart != null ? beParticipantIdStart + stageIndex : undefined
    return {
      id: beId != null ? `ph-md-${beId}` : `history-${idPrefix}-vol-${String(stageIndex + 1).padStart(2, '0')}`,
      userId,
      programId: app.programId,
      role: 'VOLUNTEER' as const,
      completedAt: app.submittedAt,
      finalStatus: finalStatuses[stageIndex],
      managerName: DEMO_MANAGER_NAMES[stageIndex],
      volunteerHours: hours[stageIndex],
      certificates:
        stageIndex === 4
          ? [
              {
                id: `cert-${idPrefix}-vol-01`,
                title: '봉사활동 확인서',
                downloadUrl: `/certificates/${idPrefix}-vol-01.pdf`,
                issuedAt: daysAgo(600),
              },
            ]
          : undefined,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }
  })
}

export function getMemberDetailHistoryCaseByMemberId(
  memberId: number
): MemberDetailHistorySeedCase | undefined {
  return MEMBER_DETAIL_HISTORY_SEED_CASES.find(c => c.memberId === memberId)
}

export function getSchoolEnrollmentCaseByOrgId(
  organizationId: number
): SchoolEnrollmentHistorySeedCase | undefined {
  return SCHOOL_ENROLLMENT_HISTORY_SEED_CASES.find(c => c.organizationId === organizationId)
}

export function getAdminProgramRoleCaseByAdminId(
  adminAccountId: number
): AdminProgramRoleSeedCase | undefined {
  return ADMIN_PROGRAM_ROLE_SEED_CASES.find(c => c.adminAccountId === adminAccountId)
}

/** BE seed smoke — 유형별 최소 검증 API */
export const MEMBER_DETAIL_HISTORY_SMOKE_SCENARIOS = [
  'GET /api/admin/users/171001/applications → 5 rows (173001–173005), enrollment tab',
  'GET /api/admin/users/171001/program-history?role=VOLUNTEER → 5 rows (173401–173405)',
  'GET /api/admin/users/171002/applications → 5 student rows, no lecture tab',
  'GET /api/admin/users/171003/applications → 10 rows (5 stu + 5 lec), settlement tab',
  'GET /api/admin/users/171004/applications → dual 3-tab + GET settlements?instructorMemberId=171004',
  'GET /api/admin/users/171005/applications → revoked instructor histories preserved',
  'GET /api/admin/organizations/schools/171501/program-enrollment-history → 174001–174005',
  'GET /api/admin/admin-accounts/171601/program-roles → 174501–174505',
] as const
