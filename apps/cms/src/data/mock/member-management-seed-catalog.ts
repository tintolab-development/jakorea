/**
 * CMS 회원 관리 — BE DB seed 카탈로그 (FE mock ↔ numeric ID SSOT)
 *
 * - FE mock(`users.ts`)은 UI·오프라인 검증용 string id 유지
 * - BE local/staging seed는 본 파일·`member-management-seed-v1.spec.json` numeric id 사용
 * - 권한 승인 subset: `member-permission-management-seed-v1.spec.json`
 *
 * @see apps/cms/docs/api/members/member-management-backend-seed-handoff-2026-08-28.md
 */

import type { InstructorCmsProfileProposal } from '@/features/user/api/types/instructor-cms-profile-proposal'

export const MEMBER_MANAGEMENT_SEED_LABEL = 'member-management-v1-2026-08' as const

/** BE Flyway/local demo id 범위 — JABACK seed fixture 와 동일하게 유지 */
export const MEMBER_SEED_ID_RANGES = {
  /** GET /api/admin/members/all 디렉터리 */
  memberId: [171001, 171400] as const,
  /** School organization (institutions tab) */
  organizationId: [171501, 171550] as const,
  /** Admin account (admins tab + provisioned) */
  adminAccountId: [171601, 171650] as const,
  /** Instructor role request (permission approval instructor tab) */
  instructorRoleRequestId: [172001, 172040] as const,
  instructorMemberId: [172101, 172140] as const,
  /** Admin self-signup approval queue */
  adminApprovalAccountId: [172201, 172230] as const,
  adminProvisionedExcludeId: [172231, 172235] as const,
} as const

/** FE mock constant → BE memberId (directory 목록·상세 이력) */
export const MOCK_TO_BE_DIRECTORY_MEMBER_ID: Readonly<Record<string, number>> = {
  'mock-md-individual-171001': 171001,
  'mock-instructor-kang-001': 171002,
  'mock-instructor-jung-001': 171003,
  'mock-instructor-choi-001': 171004,
  'mock-md-instructor-revoked-171005': 171005,
  'mock-md-admin-171601': 171601,
  'mock-school-seoul-001': 171501,
  'mock-school-jinwol-001': 171502,
}

/** FE mock constant → BE memberId (권한승인 큐 — directory id 와 다를 수 있음) */
export const MOCK_TO_BE_PERMISSION_MEMBER_ID: Readonly<Record<string, number>> = {
  'mock-instructor-jung-001': 172101,
  'mock-instructor-choi-001': 172107,
  'mock-instructor-kang-001': 172103,
}

/** @deprecated use MOCK_TO_BE_DIRECTORY_MEMBER_ID or MOCK_TO_BE_PERMISSION_MEMBER_ID */
export const MOCK_TO_BE_MEMBER_ID: Readonly<Record<string, number>> = {
  ...MOCK_TO_BE_DIRECTORY_MEMBER_ID,
  ...MOCK_TO_BE_PERMISSION_MEMBER_ID,
}

export type MemberSeedProfileTier = 'full' | 'medium' | 'minimal'

export interface InstructorRoleRequestSeedCase {
  caseId: string
  requestId: number
  memberId: number
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  keywordSearchName?: string
  profileTier: MemberSeedProfileTier
  /** pure instructor only — false면 권한승인 강사 탭 목록 제외 */
  listIncluded: boolean
  excludeReason?: 'SCHOOL_TEACHER_ACTIVE' | 'INSTRUCTOR_DUAL_ACTIVE'
  mockFeUserId?: string
  requestedActivityType?: string
  feeGrade?: string
  jaGrade?: string
  rejectedReason?: string
  notificationResentAt?: string
  socialProviders?: ReadonlyArray<'GOOGLE' | 'KAKAO' | 'NAVER'>
}

export interface AdminApprovalSeedCase {
  caseId: string
  adminAccountId: number
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED_VERIFICATION'
  roleCode: 'MASTER' | 'PM' | 'PARTNER' | 'VIEWER'
  keywordSearchName?: string
  listIncluded: boolean
  excludeReason?: 'ADMIN_CREATED_ACTIVE'
  registeredByAdmin: boolean
  mfaRequired?: boolean
  socialProviders?: ReadonlyArray<'GOOGLE' | 'KAKAO' | 'NAVER'>
}

/** IR-PENDING-PORTAL-FULL — BE detail GET structured profile SSOT (172001) */
export const SEED_IR_PENDING_PORTAL_FULL_PROFILE: InstructorCmsProfileProposal = {
  memberType: 'GENERAL',
  oneLineIntro: '경제·금융 교육 현장 경험을 바탕으로 학생 맞춤형 강의를 진행합니다.',
  affiliation: {
    organizationNames: ['JA Korea 강사단'],
  },
  homeAddress: {
    line: '서울특별시 마포구 월드컵북로 400',
    detail: '101동 1204호',
  },
  education: {
    highestSchoolType: 'college4',
    highestStatus: 'graduated',
    college4: [
      {
        schoolName: '한국경제대학교',
        major: '경제학',
        admitYear: '2012',
        gradYear: '2016',
      },
    ],
  },
  career: {
    level: 'experienced',
    summaryYears: '5',
    rows: [
      {
        companyName: 'JA Korea',
        roleName: '강사',
        periodStart: '2020-03',
        currentlyEmployed: true,
      },
      {
        companyName: '○○교육센터',
        roleName: '외부강사',
        periodStart: '2018-01',
        periodEnd: '2020-02',
        currentlyEmployed: false,
      },
    ],
  },
  licenses: [
    { title: '경제교육지도사 2급', acquiredYear: '2019', issuer: '한국경제교육학회' },
  ],
  awards: [{ title: '우수강사상', acquiredYear: '2023', issuer: 'JA Korea' }],
  jaKoreaActivities: [
    {
      periodStart: '2021-03',
      periodEnd: '2021-12',
      title: 'JA 경제교육 봉사',
      note: '초등 5학년 대상',
    },
  ],
  essays: {
    freeWrite1: '학생들이 경제 개념을 일상과 연결해 이해하도록 돕는 것이 목표입니다.',
    freeWrite2: '팀 프로젝트 기반 수업을 선호합니다.',
    freeWrite3: '',
    freeWrite4: '',
  },
  instructorCareerSummary: 'JA Korea 강의 5년 | 경제교육지도사',
}

export const INSTRUCTOR_ROLE_REQUEST_SEED_CASES: InstructorRoleRequestSeedCase[] = [
  {
    caseId: 'IR-PENDING-PORTAL-FULL',
    requestId: 172001,
    memberId: 172101,
    requestStatus: 'PENDING',
    keywordSearchName: '최지원',
    profileTier: 'full',
    listIncluded: true,
    requestedActivityType: 'JA 강사단',
    socialProviders: ['KAKAO', 'NAVER'],
  },
  {
    caseId: 'IR-APPROVED-RESEND',
    requestId: 172002,
    memberId: 172102,
    requestStatus: 'APPROVED',
    profileTier: 'full',
    listIncluded: true,
    feeGrade: 'GRADE_2',
    jaGrade: 'JA_A',
    notificationResentAt: '2026-08-15T14:30:00Z',
    socialProviders: ['GOOGLE'],
  },
  {
    caseId: 'IR-REJECTED-RESET',
    requestId: 172003,
    memberId: 172103,
    requestStatus: 'REJECTED',
    profileTier: 'full',
    listIncluded: true,
    rejectedReason: '서류 미비',
    mockFeUserId: 'mock-instructor-kang-001',
  },
  {
    caseId: 'IR-BULK-PENDING-A',
    requestId: 172004,
    memberId: 172104,
    requestStatus: 'PENDING',
    profileTier: 'medium',
    listIncluded: true,
  },
  {
    caseId: 'IR-BULK-PENDING-B',
    requestId: 172005,
    memberId: 172105,
    requestStatus: 'PENDING',
    profileTier: 'medium',
    listIncluded: true,
  },
  {
    caseId: 'IR-BULK-PENDING-C',
    requestId: 172006,
    memberId: 172106,
    requestStatus: 'PENDING',
    profileTier: 'medium',
    listIncluded: true,
  },
  {
    caseId: 'IR-EXCLUDED-DUAL',
    requestId: 172007,
    memberId: 172107,
    requestStatus: 'PENDING',
    profileTier: 'medium',
    listIncluded: false,
    excludeReason: 'INSTRUCTOR_DUAL_ACTIVE',
    mockFeUserId: 'mock-instructor-choi-001',
  },
  ...([172008, 172009, 172010, 172011, 172012] as const).map((requestId, i) => ({
    caseId: `IR-DIST-${requestId}`,
    requestId,
    memberId: 172101 + (requestId - 172001),
    requestStatus: (['PENDING', 'APPROVED', 'REJECTED'] as const)[i % 3],
    profileTier: 'medium' as const,
    listIncluded: true,
    socialProviders: requestId === 172009 ? (['GOOGLE'] as const) : requestId === 172012 ? (['NAVER'] as const) : undefined,
  })),
]

export const ADMIN_APPROVAL_SEED_CASES: AdminApprovalSeedCase[] = [
  {
    caseId: 'AA-PENDING-MFA-TERMS',
    adminAccountId: 172201,
    status: 'PENDING_VERIFICATION',
    roleCode: 'VIEWER',
    keywordSearchName: '김승인대기',
    listIncluded: true,
    registeredByAdmin: false,
    mfaRequired: true,
    socialProviders: ['GOOGLE', 'KAKAO'],
  },
  {
    caseId: 'AA-APPROVED-MASTER',
    adminAccountId: 172202,
    status: 'ACTIVE',
    roleCode: 'MASTER',
    listIncluded: true,
    registeredByAdmin: false,
    socialProviders: ['NAVER'],
  },
  {
    caseId: 'AA-REJECTED',
    adminAccountId: 172203,
    status: 'REJECTED_VERIFICATION',
    roleCode: 'VIEWER',
    listIncluded: true,
    registeredByAdmin: false,
  },
  {
    caseId: 'AA-BULK-PENDING-A',
    adminAccountId: 172204,
    status: 'PENDING_VERIFICATION',
    roleCode: 'PARTNER',
    listIncluded: true,
    registeredByAdmin: false,
  },
  {
    caseId: 'AA-BULK-PENDING-B',
    adminAccountId: 172205,
    status: 'PENDING_VERIFICATION',
    roleCode: 'VIEWER',
    listIncluded: true,
    registeredByAdmin: false,
  },
  ...([172206, 172207, 172208, 172209, 172210] as const).map((adminAccountId, i) => ({
    caseId: `AA-DIST-${adminAccountId}`,
    adminAccountId,
    status: (['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED_VERIFICATION'] as const)[i % 3],
    roleCode: (['VIEWER', 'PARTNER', 'PM'] as const)[i % 3],
    listIncluded: true,
    registeredByAdmin: false,
    socialProviders: i % 2 === 0 ? (['GOOGLE'] as const) : undefined,
  })),
  {
    caseId: 'AA-PROVISIONED-NEG',
    adminAccountId: 172231,
    status: 'ACTIVE',
    roleCode: 'MASTER',
    listIncluded: false,
    excludeReason: 'ADMIN_CREATED_ACTIVE',
    registeredByAdmin: true,
  },
]

/** 회원 목록(kind) showcase — BE members/all·users·schools·admin-accounts */
export const MEMBER_DIRECTORY_SEED_CASES = {
  allTab: [
    { caseId: 'MD-INDIVIDUAL', memberId: 171001, roles: ['INDIVIDUAL'], signupType: 'SELF', mockFeUserId: 'mock-md-individual-171001', keyword: '김개인' },
    { caseId: 'MD-SCHOOL-TEACHER', memberId: 171002, roles: ['SCHOOL_TEACHER'], signupType: 'SELF', mockFeUserId: 'mock-instructor-kang-001', keyword: '강선생' },
    { caseId: 'MD-INSTRUCTOR', memberId: 171003, roles: ['INSTRUCTOR'], signupType: 'SELF', mockFeUserId: 'mock-instructor-jung-001', keyword: '정멘토' },
    { caseId: 'MD-INSTRUCTOR-DUAL', memberId: 171004, roles: ['SCHOOL_TEACHER', 'INSTRUCTOR'], signupType: 'SELF', mockFeUserId: 'mock-instructor-choi-001', keyword: '최강사' },
    { caseId: 'MD-INSTRUCTOR-REVOKED', memberId: 171005, roles: ['INSTRUCTOR_REVOKED'], signupType: 'SELF', mockFeUserId: 'mock-md-instructor-revoked-171005', keyword: '박박탈' },
    { caseId: 'MD-ADMIN', adminAccountId: 171601, roles: ['ADMIN'], signupType: 'SELF', mockFeUserId: 'mock-md-admin-171601', roleCode: 'MASTER' },
  ],
  schools: [
    {
      caseId: 'MD-SCHOOL-SEOUL',
      organizationId: 171501,
      name: '서울초등학교',
      regionSido: '서울',
      regionSigungu: '마포구',
      teacherCount: 3,
      programAttendanceCount: 2,
      mockFeUserId: 'mock-school-seoul-001',
    },
    {
      caseId: 'MD-SCHOOL-JINWOL',
      organizationId: 171502,
      name: '진월초등학교',
      regionSido: '서울',
      regionSigungu: '서초구',
      teacherCount: 1,
      programAttendanceCount: 1,
      mockFeUserId: 'mock-school-jinwol-001',
    },
    {
      caseId: 'MD-SCHOOL-NO-TEACHERS',
      organizationId: 171503,
      name: '교사없음테스트학교',
      regionSido: '경기',
      regionSigungu: '성남시',
      teacherCount: 0,
      programAttendanceCount: 0,
      /** 학교 삭제 가능 showcase — Notion: 등록 교사 있으면 삭제 불가 */
      deletable: true,
    },
  ],
} as const

export function getInstructorSeedCaseByRequestId(
  requestId: number
): InstructorRoleRequestSeedCase | undefined {
  return INSTRUCTOR_ROLE_REQUEST_SEED_CASES.find(c => c.requestId === requestId)
}

export function getAdminSeedCaseByAccountId(
  adminAccountId: number
): AdminApprovalSeedCase | undefined {
  return ADMIN_APPROVAL_SEED_CASES.find(c => c.adminAccountId === adminAccountId)
}
