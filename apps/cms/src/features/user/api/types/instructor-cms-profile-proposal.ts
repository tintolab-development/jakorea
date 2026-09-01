/**
 * CMS 화면 기준 강사 프로필 DTO — BE OpenAPI `InstructorCmsProfile` (2026-08-06 FE 연동)
 *
 * - Mapper SSOT: `map-instructor-cms-profile.ts` · 폼 SSOT: `instructor-profile-form-model.ts`
 * - FE 등록·수정 폼 SSOT: `InstructorRegisterModalFormValues` (`instructor-profile-form-model.ts`)
 * - Mapper: `map-instructor-cms-profile.ts`
 */

/** CMS 「회원 유형」 — API `primaryActivityType` / pre-register `instructorType` */
export type InstructorCmsMemberType = 'GENERAL' | 'SCHOOL_TEACHER'

/** CMS 「재직 현황」 — `SchoolTeacherEmploymentStatus` */
export type InstructorCmsEmploymentStatus = 'ACTIVE' | 'LEAVE' | 'TRANSFER' | 'RESIGNED'

export type InstructorCmsEducationSchoolType = 'high' | 'college23' | 'college4' | 'graduate'

export type InstructorCmsEducationStatus = 'enrolled' | 'graduated' | 'completed'

export type InstructorCmsCareerLevel = 'new' | 'experienced'

export type InstructorCmsGraduateDegree = 'master' | 'doctor'

/** CMS 기본정보 — 소속 (일반: affiliationName / 교사: schoolName + employmentStatus) */
export interface InstructorCmsAffiliation {
  /** CMS 학교 PK — `profile.affiliation.organizationId` */
  organizationId?: number
  /** 교사 회원 — 「소속」학교명 */
  schoolName?: string
  /** 교사 회원 — 「재직 현황」 */
  employmentStatus?: InstructorCmsEmploymentStatus
  /** 일반 강사 — 「소속」 (JA 강사단 등). `affiliationNone`이면 빈 배열 */
  organizationNames?: string[]
  /** 학교 memberId — drill-down · affiliated-teachers 연동 */
  affiliatedSchoolUserId?: string
  /**
   * 학교 검색 선택값. 강사 pre-register 최상위 `schoolSelection`으로 전달.
   * 학교명 snapshot만으로는 서버가 학교를 생성·연결하지 않는다.
   */
  schoolSelection?: import('@/shared/api/generated/members/schemas/portalSchoolSelectionRequest').PortalSchoolSelectionRequest
}

/** CMS 「자택 주소지」 */
export interface InstructorCmsHomeAddress {
  /** 도로명·지번 검색어 (`homeAddress`) */
  line: string
  /** 상세 (`homeAddressDetail`) */
  detail?: string
}

/** CMS 학력 — 학교/대학 row (`EducationSchoolRow`) */
export interface InstructorCmsEducationSchoolRow {
  admitYear?: string
  gradYear?: string
  schoolName: string
  major?: string
}

/** CMS 학력 — 대학원 row (`EducationGraduateRow`) */
export interface InstructorCmsEducationGraduateRow extends InstructorCmsEducationSchoolRow {
  degree?: InstructorCmsGraduateDegree
}

/** CMS 「학력사항」 섹션 */
export interface InstructorCmsEducation {
  /** 최종 학력 — 학교 구분 (`eduSchoolType`) */
  highestSchoolType?: InstructorCmsEducationSchoolType
  /** 최종 학력 — 재학/졸업/수료 (`eduStatus`) */
  highestStatus?: InstructorCmsEducationStatus
  /** 학력 상세 체크 (`educationDetailKeys`) */
  detailKeys?: InstructorCmsEducationSchoolType[]
  highSchool?: InstructorCmsEducationSchoolRow
  college23?: InstructorCmsEducationSchoolRow[]
  college4?: InstructorCmsEducationSchoolRow[]
  graduate?: InstructorCmsEducationGraduateRow[]
}

/** CMS 「경력사항」 — row (`CareerRow`) */
export interface InstructorCmsCareerRow {
  companyName: string
  roleName: string
  periodStart?: string
  periodEnd?: string
  currentlyEmployed: boolean
}

/** CMS 「경력사항」 섹션 */
export interface InstructorCmsCareer {
  /** 경력 구분 (`careerLevel`) */
  level: InstructorCmsCareerLevel
  /** 구조화 경력 rows */
  rows: InstructorCmsCareerRow[]
  /**
   * 기본정보 「강사 경력」 요약 (`instructorCareer`).
   * legacy API `careerText` — 구조화 rows와 **별도** 필드.
   */
  summaryYears?: string
}

/** CMS 「활동 이력」 — JA Korea (`JaKoreaActivityRow`) */
export interface InstructorCmsJaActivityRow {
  periodStart?: string
  periodEnd?: string
  title: string
  note?: string
}

/** CMS 「자격 및 면허」 / 「수상 및 수료」 row */
export interface InstructorCmsLicenseOrAwardRow {
  acquiredYear?: string
  title: string
  issuer?: string
}

/** CMS 「자유작성 1~4」 — `INSTRUCTOR_FREE_WRITE_ITEMS` */
export interface InstructorCmsEssays {
  /** 1. 자기소개 및 지원동기 — legacy `selfIntroduction` */
  freeWrite1?: string
  freeWrite2?: string
  freeWrite3?: string
  freeWrite4?: string
}

/** CMS 「정산 계좌 정보」 */
export interface InstructorCmsSettlement {
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  businessIncome: boolean
  bankAccounts?: Array<{
    id?: number
    bankName: string
    accountNumber?: string
    accountHolder?: string
    current?: boolean
  }>
}

/**
 * CMS 강사 상세·등록 **프로필 본문** (제안).
 * `member`(성명·연락처 등)는 기존 `MemberDetailResponse` 유지.
 */
export interface InstructorCmsProfileProposal {
  memberType: InstructorCmsMemberType
  status?: string
  affiliation: InstructorCmsAffiliation
  /** CMS 「강사 경력」 — legacy `careerText` */
  instructorCareerSummary?: string
  /** CMS 「한 줄 소개」 — legacy `oneLineIntro` */
  oneLineIntro?: string
  homeAddress: InstructorCmsHomeAddress
  education: InstructorCmsEducation
  career: InstructorCmsCareer
  jaKoreaActivities: InstructorCmsJaActivityRow[]
  licenses: InstructorCmsLicenseOrAwardRow[]
  awards: InstructorCmsLicenseOrAwardRow[]
  essays: InstructorCmsEssays
  defaultFeeGrade?: string | null
  defaultJaGrade?: string | null
}

/** `GET/POST …/instructor` 응답·요청 래퍼 (제안) */
export interface InstructorMemberDetailCmsProposal {
  member: Record<string, unknown>
  profile: InstructorCmsProfileProposal
  settlement: InstructorCmsSettlement
  /** `licenses`와 동기화 가능 — 기존 `certifications[]` 호환 */
  certifications?: Array<{
    id?: number
    certificationName: string
    issuer?: string
    issuedDate?: string
  }>
}
