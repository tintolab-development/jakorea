import dayjs from 'dayjs'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { User } from '@/types/user'
import {
  isInstructorSchoolTeacherProfile,
  resolveInstructorMemberProfile,
} from '@/entities/user/lib/resolve-instructor-member-profile'
import { parseSchoolTeacherEmploymentStatus } from '@/features/user/detail/lib/school-teacher-employment-status'
import {
  EMPTY_CAREER,
  EMPTY_JA_KOREA_ROW,
  EMPTY_LICENSE_OR_AWARD_ROW,
  INITIAL_VALUES,
  type ConsentValue,
  type InstructorProfileFormValues,
  type LicenseOrAwardRow,
} from '@/features/user/shared/ui/instructor-profile-form'
import {
  EMPTY_EDUCATION_GRADUATE_ROW,
  EMPTY_EDUCATION_SCHOOL_ROW,
} from '@/features/user/shared/ui/instructor-register-education-section'

function toConsentValue(agreed: boolean | undefined): ConsentValue {
  return agreed === true ? 'agree' : 'disagree'
}

function mapGender(gender: string | undefined): 'male' | 'female' {
  const g = gender?.trim()
  if (
    g === '여' ||
    g === '여성' ||
    g === '여자' ||
    g === 'F' ||
    g === 'FEMALE' ||
    g === 'female' ||
    g === '2'
  ) {
    return 'female'
  }
  return 'male'
}

function birthDateToFormValue(birthDate: User['birthDate']): string {
  if (!birthDate) return ''
  const raw = typeof birthDate === 'string' ? birthDate : new Date(birthDate).toISOString().slice(0, 10)
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 8) return raw.replace(/-/g, '.')
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`
}

function splitEducationLevel(label: string | undefined): { eduSchoolType: string; eduStatus: string } {
  const raw = label?.trim() ?? ''
  if (!raw || raw === '-') return { eduSchoolType: '', eduStatus: '' }
  const [schoolType, status] = raw.split(/\s*\/\s*/).map(part => part.trim())
  if (status) return { eduSchoolType: schoolType ?? '', eduStatus: status }
  return { eduSchoolType: raw, eduStatus: '' }
}

function mapCertificationsToLicenseRows(user: Omit<User, 'password'>): LicenseOrAwardRow[] {
  const certs = user.instructorCertifications ?? []
  if (certs.length === 0) return [{ ...EMPTY_LICENSE_OR_AWARD_ROW }]
  return certs.map(cert => ({
    acquiredYear: cert.issuedDate && dayjs(cert.issuedDate).isValid() ? dayjs(cert.issuedDate) : null,
    title: cert.name,
    issuer: cert.issuer ?? '',
  }))
}

function mapAwardsToRows(instructor: ApplicantInstructorRow | null): LicenseOrAwardRow[] {
  const awards = instructor?.awards ?? []
  if (awards.length === 0) return [{ ...EMPTY_LICENSE_OR_AWARD_ROW }]
  return awards.map(award => ({
    acquiredYear:
      award.year && dayjs(award.year, 'YYYY', true).isValid() ? dayjs(`${award.year}-01-01`) : null,
    title: award.name ?? '',
    issuer: '',
  }))
}

function resolveMemberType(user: Omit<User, 'password'>): 'general' | 'school_teacher' {
  const profile = resolveInstructorMemberProfile(user)
  if (profile === 'school_teacher' || isInstructorSchoolTeacherProfile(user)) return 'school_teacher'
  if (profile === 'instructor_dual') return 'school_teacher'
  return 'general'
}

function resolveAffiliationFields(user: Omit<User, 'password'>): Pick<
  InstructorProfileFormValues,
  'affiliationName' | 'affiliationNone' | 'schoolName' | 'employmentStatus'
> {
  const memberType = resolveMemberType(user)
  const affiliation = user.affiliation?.trim() ?? ''
  const schoolName =
    user.schoolInfo?.schoolName?.trim() ||
    user.affiliatedSchoolName?.trim() ||
    (memberType === 'school_teacher' ? affiliation.split(',')[0]?.trim() ?? '' : '')
  const employment =
    parseSchoolTeacherEmploymentStatus(user.listMetrics?.employmentStatusLabel) ?? ''

  if (memberType === 'school_teacher') {
    return {
      affiliationName: '',
      affiliationNone: false,
      schoolName,
      employmentStatus: employment,
    }
  }

  if (!affiliation) {
    return {
      affiliationName: '',
      affiliationNone: true,
      schoolName: '',
      employmentStatus: '',
    }
  }

  return {
    affiliationName: affiliation,
    affiliationNone: false,
    schoolName: '',
    employmentStatus: '',
  }
}

function resolveHomeAddress(user: Omit<User, 'password'>): {
  homeAddress: string
  homeAddressDetail: string
} {
  return {
    homeAddress: user.detailAddress?.trim() ?? '',
    homeAddressDetail: user.detailAddressDetail?.trim() ?? '',
  }
}

function mapTermsAgreements(
  user: Omit<User, 'password'>
): Pick<
  InstructorProfileFormValues,
  | 'consentTermsOfService'
  | 'consentPersonal'
  | 'consentMarketing'
  | 'consentPortrait'
  | 'consentPaymentStatement'
  | 'consentEducatorPledge'
  | 'consentSexOffenseCheck'
  | 'consentAdministrativeJoint'
> {
  const rows = user.termsAgreements ?? []
  const find = (types: string[]) =>
    rows.find(r => types.includes((r.termsType ?? '').toUpperCase()))

  const service = find(['SERVICE_TERMS', 'TERMS_OF_SERVICE'])
  const privacy = find(['PRIVACY_COLLECTION', 'PRIVACY'])
  const marketing = find(['MARKETING'])
  const portrait = find(['PORTRAIT', 'PORTRAIT_RIGHTS'])
  const payment = find(['PAYMENT_STATEMENT', 'PAYMENT'])
  const educator = find(['EDUCATOR_PLEDGE', 'EDUCATOR'])
  const sexOffense = find(['SEX_OFFENSE_CHECK', 'CRIME_CHECK'])
  const adminJoint = find(['ADMINISTRATIVE_JOINT', 'ADMIN_INFO_JOINT'])

  return {
    consentTermsOfService: service ? toConsentValue(service.agreed) : INITIAL_VALUES.consentTermsOfService,
    consentPersonal: privacy ? toConsentValue(privacy.agreed) : INITIAL_VALUES.consentPersonal,
    consentMarketing: marketing ? toConsentValue(marketing.agreed) : INITIAL_VALUES.consentMarketing,
    consentPortrait: portrait ? toConsentValue(portrait.agreed) : INITIAL_VALUES.consentPortrait,
    consentPaymentStatement: payment
      ? toConsentValue(payment.agreed)
      : INITIAL_VALUES.consentPaymentStatement,
    consentEducatorPledge: educator
      ? toConsentValue(educator.agreed)
      : INITIAL_VALUES.consentEducatorPledge,
    consentSexOffenseCheck: sexOffense
      ? toConsentValue(sexOffense.agreed)
      : INITIAL_VALUES.consentSexOffenseCheck,
    consentAdministrativeJoint: adminJoint
      ? toConsentValue(adminJoint.agreed)
      : INITIAL_VALUES.consentAdministrativeJoint,
  }
}

/** 강사 상세 수정 모드 — User + 이력서 행 → 등록 폼과 동일 스키마 */
export function mapUserToInstructorProfileFormValues(
  user: Omit<User, 'password'>,
  instructorResume: ApplicantInstructorRow | null
): InstructorProfileFormValues {
  const { eduSchoolType, eduStatus } = splitEducationLevel(user.listMetrics?.highestEducationLabel)
  const affiliationFields = resolveAffiliationFields(user)
  const home = resolveHomeAddress(user)
  const careerText =
    user.instructorCareerText?.trim() ||
    user.listMetrics?.instructorCareerSummaryLabel?.trim() ||
    user.listMetrics?.instructorCareerYearsLabel?.trim() ||
    ''

  const freeWrite1 =
    instructorResume?.freeWriting1?.trim() && instructorResume.freeWriting1 !== '-'
      ? instructorResume.freeWriting1
      : user.instructorSelfIntroduction?.trim() || ''
  const freeWrite2 =
    instructorResume?.freeWriting2?.trim() && instructorResume.freeWriting2 !== '-'
      ? instructorResume.freeWriting2
      : ''
  const freeWrite3 =
    instructorResume?.freeWriting3?.trim() && instructorResume.freeWriting3 !== '-'
      ? instructorResume.freeWriting3
      : ''
  const freeWrite4 =
    instructorResume?.freeWriting4?.trim() && instructorResume.freeWriting4 !== '-'
      ? instructorResume.freeWriting4
      : ''

  return {
    ...INITIAL_VALUES,
    name: user.name ?? '',
    gender: mapGender(user.gender),
    birthDate: birthDateToFormValue(user.birthDate),
    contact: user.phone ?? '',
    email: user.email ?? '',
    memberType: resolveMemberType(user),
    ...affiliationFields,
    instructorCareer: careerText,
    isBusinessIncome: user.instructorInfo?.isBusinessIncome === true ? 'yes' : 'no',
    bankName: user.instructorInfo?.bankName ?? '',
    accountNumber: user.instructorInfo?.accountNumber ?? '',
    accountHolder: user.instructorInfo?.accountHolder ?? '',
    homeAddress: home.homeAddress,
    homeAddressDetail: home.homeAddressDetail,
    oneLineIntro: user.bio ?? '',
    ...mapTermsAgreements(user),
    eduSchoolType,
    eduStatus,
    educationDetailKeys: [],
    highSchool: { ...EMPTY_EDUCATION_SCHOOL_ROW },
    college23Rows: [{ ...EMPTY_EDUCATION_SCHOOL_ROW }],
    college4Rows: [{ ...EMPTY_EDUCATION_SCHOOL_ROW }],
    graduateRows: [{ ...EMPTY_EDUCATION_GRADUATE_ROW }],
    careerLevel: 'experienced',
    careers: [{ ...EMPTY_CAREER }],
    jaKoreaRows: [{ ...EMPTY_JA_KOREA_ROW }],
    licenseRows: mapCertificationsToLicenseRows(user),
    awardRows: mapAwardsToRows(instructorResume),
    freeWrite1,
    freeWrite2,
    freeWrite3,
    freeWrite4,
  }
}

/** 폼 값 → 상세 저장용 basicInfo draft partial */
export function mapInstructorProfileFormToBasicInfoDraftPartial(
  values: InstructorProfileFormValues
): {
  name: string
  phone: string
  email: string
  gender: string
  birthDate: string
  affiliationInstitution: string
  affiliationGrade: string
  detailAddressSearch: string
  detailAddressDetail: string
  instructorCareerSummaryLabel: string
  instructorBankName: string
  instructorAccountNumber: string
  instructorAccountHolder: string
  instructorBusinessIncome: '해당' | '해당 없음' | ''
  bio: string
  highestEducationLevel: string
  highestEducationSchoolName: string
} {
  const birthDigits = values.birthDate.replace(/\D/g, '')
  const birthDate =
    birthDigits.length === 8
      ? `${birthDigits.slice(0, 4)}-${birthDigits.slice(4, 6)}-${birthDigits.slice(6, 8)}`
      : values.birthDate.replace(/\./g, '-')

  const affiliationInstitution =
    values.memberType === 'school_teacher'
      ? [
          values.schoolName.trim(),
          values.employmentStatus ? String(values.employmentStatus) : '',
        ]
          .filter(Boolean)
          .join(' | ')
      : values.affiliationNone
        ? ''
        : values.affiliationName.trim()

  return {
    name: values.name.trim(),
    phone: values.contact.trim(),
    email: values.email.trim(),
    gender: values.gender === 'female' ? '여성' : '남성',
    birthDate,
    affiliationInstitution,
    affiliationGrade: '',
    detailAddressSearch: values.homeAddress.trim(),
    detailAddressDetail: values.homeAddressDetail.trim(),
    instructorCareerSummaryLabel: values.instructorCareer.trim(),
    instructorBankName: values.bankName.trim(),
    instructorAccountNumber: values.accountNumber.trim(),
    instructorAccountHolder: values.accountHolder.trim(),
    instructorBusinessIncome: values.isBusinessIncome === 'yes' ? '해당' : '해당 없음',
    bio: values.oneLineIntro.trim(),
    highestEducationLevel: values.eduSchoolType.trim(),
    highestEducationSchoolName: values.eduStatus.trim(),
  }
}
