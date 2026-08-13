/** CMS `InstructorCmsProfile` 정렬 — Platform 국소 타입 (CMS generated import 없음) */
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

/** CMS `TermsAgreementRequest` 정렬 */
export type InstructorRoleRequestTermsAgreement = {
  termsType: string
  version: string
  required: boolean
  agreed: boolean
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
