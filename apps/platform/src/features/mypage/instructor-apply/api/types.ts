/** CMS `InstructorCmsProfile` 정렬 — Platform 국소 타입 (CMS generated import 없음) */
/** PATCH /api/portal/me/profile — 강사가 포탈에서 직접 수정 가능한 프로필 */
export type InstructorPortalEditableProfile = Omit<InstructorRoleRequestProfile, 'memberType'>

export type InstructorRoleRequestProfile = {
  memberType: 'GENERAL' | 'SCHOOL_TEACHER'
  affiliation: {
    schoolName?: string
    employmentStatus?: 'ACTIVE' | 'LEAVE' | 'TRANSFER' | 'RESIGNED'
    organizationNames?: string[]
  }
  instructorCareerSummary?: string
  oneLineIntro?: string
  homeAddress: {
    line: string
    detail?: string
  }
  education: {
    highestSchoolType?: 'high' | 'college23' | 'college4' | 'graduate'
    highestStatus?: 'enrolled' | 'graduated' | 'completed'
    detailKeys?: Array<'high' | 'college23' | 'college4' | 'graduate'>
    highSchool?: InstructorRoleRequestEducationSchoolRow
    college23?: InstructorRoleRequestEducationSchoolRow[]
    college4?: InstructorRoleRequestEducationSchoolRow[]
    graduate?: InstructorRoleRequestEducationGraduateRow[]
  }
  career: {
    level: 'new' | 'experienced'
    rows: InstructorRoleRequestCareerRow[]
    summaryYears?: string
  }
  jaKoreaActivities: InstructorRoleRequestJaActivityRow[]
  licenses: InstructorRoleRequestLicenseOrAwardRow[]
  awards: InstructorRoleRequestLicenseOrAwardRow[]
  essays: {
    freeWrite1?: string
    freeWrite2?: string
    freeWrite3?: string
    freeWrite4?: string
  }
  /** 조회 전용 — 포탈/CMS 프로필. 응답 코드는 response-codes mapper에서 표시 라벨로 변환한다. */
  /** API `GRADE_1` | `GRADE_2` | `GRADE_3` 또는 이미 변환된 표시 라벨 */
  defaultFeeGrade?: string
  /** API `A` | `B` | `C` | `D` 또는 이미 변환된 표시 라벨 */
  defaultJaGrade?: string
}

export type InstructorRoleRequestEducationSchoolRow = {
  schoolName: string
  major?: string
  admitYear?: string
  gradYear?: string
}

export type InstructorRoleRequestEducationGraduateRow = InstructorRoleRequestEducationSchoolRow & {
  degree?: 'master' | 'doctor'
}

export type InstructorRoleRequestCareerRow = {
  companyName: string
  roleName: string
  periodStart?: string
  periodEnd?: string
  currentlyEmployed: boolean
}

export type InstructorRoleRequestJaActivityRow = {
  title: string
  note?: string
  periodStart?: string
  periodEnd?: string
}

export type InstructorRoleRequestLicenseOrAwardRow = {
  title: string
  issuer?: string
  acquiredYear?: string
}

/** CMS `InstructorCmsSettlement` 정렬 */
export type InstructorRoleRequestSettlement = {
  businessIncome: boolean
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  bankAccounts?: Array<{
    bankName: string
    accountNumber?: string
    accountHolder?: string
    current?: boolean
  }>
}

/** CMS `TermsAgreement` / 요청 DTO 정렬 */
export type InstructorRoleRequestTermsAgreement = {
  termsType: string
  version: string
  required: boolean
  agreed: boolean
  agreedAt?: string
}

/** GET /api/portal/me/instructor-role-requests/current/detail — CMS `InstructorRoleRequestDetailResponse` 정렬 */
export type InstructorRoleRequestDetail = {
  requestId?: number
  memberId?: number
  status?: string
  requestedActivityType?: string
  requestedAt?: string
  decidedAt?: string
  rejectedReason?: string
  name?: string
  gender?: string
  birthDate?: string
  phone?: string
  email?: string
  profile?: InstructorRoleRequestProfile
  settlement?: InstructorRoleRequestSettlement
  termsAgreements?: InstructorRoleRequestTermsAgreement[]
}

/** POST /api/portal/me/instructor-role-requests — InstructorRoleRequestCreateRequest */
export type InstructorRoleRequestCreateRequest = {
  requestedActivityType: string
  name: string
  gender: string
  /** API `YYYY-MM-DD` */
  birthDate: string
  phone: string
  email: string
  profile: InstructorRoleRequestProfile
  settlement: InstructorRoleRequestSettlement
  termsAgreements: InstructorRoleRequestTermsAgreement[]
}

/** POST 응답 — InstructorRoleWorkflowResponse */
export type InstructorRoleWorkflowResponse = {
  requestId?: number
  memberId?: number
  instructorProfileId?: number
  status?: string
  message?: string
}

/** GET /api/portal/me/instructor-role-requests/current */
export type InstructorRoleRequestSummary = {
  status?: string
  requestId?: number
  requestedAt?: string
  decidedAt?: string
  rejectedReason?: string
  canRequest?: boolean
  canReapply?: boolean
}
