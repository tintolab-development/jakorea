import {
  GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_ID,
  GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'

/** 일반 기관 기본 4유형 — QA case mock을 적용하는 프로그램만 명시한다. */
export const GENERAL_INSTITUTION_CASE_PROGRAM_IDS = [
  GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
  GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_ID,
] as const

export type GeneralInstitutionCaseProgramId =
  (typeof GENERAL_INSTITUTION_CASE_PROGRAM_IDS)[number]

const programIdSet = new Set<string>(GENERAL_INSTITUTION_CASE_PROGRAM_IDS)

export function isGeneralInstitutionCaseProgramId(
  programId: string | undefined | null
): programId is GeneralInstitutionCaseProgramId {
  return Boolean(programId && programIdSet.has(programId))
}

export function isGeneralInstitutionCaseEntityId(id: string | undefined | null): boolean {
  return Boolean(
    id && GENERAL_INSTITUTION_CASE_PROGRAM_IDS.some(programId => id.startsWith(`${programId}:`))
  )
}

/**
 * 회원관리 BE seed SSOT의 기존 회원·기관만 사용한다.
 * @see data/mock/member-management-seed-catalog.ts
 * @see docs/api/members/member-management-seed-v1.spec.json
 */
export const GENERAL_INSTITUTION_MEMBER_ROSTER = {
  individual: {
    memberId: 171001,
    name: '김개인',
    email: 'individual1@jakorea.org',
    contact: '010-1710-0101',
  },
  schoolTeacher: {
    memberId: 171002,
    name: '강선생',
    email: 'instructor3@example.com',
    contact: '010-3456-7890',
  },
  instructor: {
    memberId: 171003,
    name: '정멘토',
    email: 'instructor2@example.com',
    contact: '010-2345-6789',
  },
  dualInstructor: {
    memberId: 171004,
    name: '최강사',
    email: 'instructor1@example.com',
    contact: '010-1234-5678',
  },
  revokedInstructor: {
    memberId: 171005,
    name: '박박탈',
    email: 'instructor-revoked-171005@jakorea.org',
    contact: '010-1710-0505',
  },
  admin: {
    memberId: 171601,
    name: '김관리',
    email: 'admin1@jakorea.org',
    contact: '02-1234-5001',
  },
} as const

export const GENERAL_INSTITUTION_ORGANIZATION_ROSTER = [
  {
    organizationId: 171501,
    name: '서울초등학교',
    region: '서울특별시 마포구',
    address: '서울특별시 마포구 월드컵북로 400',
  },
  {
    organizationId: 171502,
    name: '진월초등학교',
    region: '서울특별시 서초구',
    address: '서울특별시 서초구 서초대로 171',
  },
  {
    organizationId: 171503,
    name: '교사없음테스트학교',
    region: '경기도 성남시',
    address: '경기도 성남시 분당구 판교로 171',
  },
] as const

export function buildGeneralInstitutionCaseId(
  programId: GeneralInstitutionCaseProgramId,
  surface: string,
  caseKey: string
): string {
  return `${programId}:${surface}:${caseKey}`
}
