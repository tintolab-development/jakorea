import type { User } from '@/types/user'
import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'
import { buildInstructorRegisterCertifications, type InstructorRegisterLicenseRow } from '@/features/user/api/map-instructor-register-extras'
import type {
  InstructorCmsProfileProposal,
  InstructorCmsSettlement,
} from '@/features/user/api/types/instructor-cms-profile-proposal'
import {
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import type { TermsAgreementRequest } from '@/shared/api/generated/members/schemas/termsAgreementRequest'
import {
  filterEditableTermsAgreementsForBasicInfoPatch,
  termsAgreementRowsToRequests,
} from '@/features/user/api/member-basic-info-terms-patch'

/** `user.affiliation` 저장 시 기관·학년 구분에 사용 (목·API와 동일) */
export const USER_AFFILIATION_PIPE_SEP = ' | ' as const

export type AdminProvisionedMemberBasicInfoDraft = {
  name: string
  phone: string
  email: string
  detailAddress: string
  /** 기관(학교명 등) */
  affiliationInstitution: string
  /** 담당·소속 학년 */
  affiliationGrade: string
  /** 개인 회원 — 현재 학교 재학 여부 (등록 폼과 동일) */
  schoolEnrollmentStatus?: 'enrolled' | 'not_enrolled' | ''
  /** 재학 중 CMS 학교 PK */
  schoolOrganizationId?: number | null
  schoolProvider?: string
  schoolExternalCode?: string
  schoolLevel?: string
  schoolAddress?: string
  schoolZipcode?: string
  schoolRegionSido?: string
  schoolRegionSigungu?: string
  /** 1365 자원봉사 ID */
  id1365?: string
  gender: string
  birthDate: string
  socialAccount: string
  adminComment: string
  /** SCHOOL(기관) 상세 — 기관명 */
  schoolName?: string
  /** 도로명·지번 등 주소 검색으로 채운 기본 주소 */
  institutionAddressSearch?: string
  /** 상세 주소(동·호 등) */
  institutionAddressDetail?: string
  /** 강사 — 강사비 등급 */
  instructorFeeGrade?: string
  /** 강사 — 정산 계좌 정보 */
  instructorBankName?: string
  instructorAccountNumber?: string
  instructorAccountHolder?: string
  /** 강사 — 사업소득자 여부 */
  instructorBusinessIncome?: '해당' | '해당 없음' | ''
  /** 강사 — 최종 학력 */
  highestEducationLabel?: string
  /** 강사 — 소속 및 강사 경력 요약 */
  instructorCareerSummaryLabel?: string
  /** 강사 — JA 평가 등급 */
  jaEvaluationGrade?: string
  /** 강사 — 한 줄 소개 */
  bio?: string
  /** 강사/개인 — 자택 주소(검색어) */
  detailAddressSearch?: string
  /** 강사/개인 — 자택 주소(상세) */
  detailAddressDetail?: string
  /** 강사 — 최종 학력(예: 4년제 졸업) */
  highestEducationLevel?: string
  /** 강사 — 최종 졸업 학교명 */
  highestEducationSchoolName?: string
  /** 강사 — 자격 및 면허 (상세 수정 저장용) */
  licenseRows?: InstructorRegisterLicenseRow[]
  /** BE §3.8 — CMS 강사 profile (상세 수정 저장) */
  instructorCmsProfile?: InstructorCmsProfileProposal
  /** BE §3.8 — CMS 강사 settlement */
  instructorCmsSettlement?: InstructorCmsSettlement
  /** 약관·동의 수정 — PATCH `termsAgreements` */
  termsAgreements?: TermsAgreementRequest[]
  /** 이번 수정 세션에서 재작성한 동의서 본문 */
  consentWriteSnapshots?: import('@/features/user/shared/lib/member-register-consent-write-snapshot').MemberRegisterConsentWriteSnapshots
  /** 강사 상세 — 이번 수정 세션에서 약관·동의를 변경했을 때만 PATCH에 termsAgreements 포함 */
  consentTermsDirty?: boolean
  /** 관리자 — 권한 유형 태그 */
  adminPermissionVariant?: AdminPermissionTagVariant | ''
}

export function splitUserAffiliationForDraft(affiliation: string | undefined): {
  affiliationInstitution: string
  affiliationGrade: string
} {
  const s = (affiliation ?? '').trim()
  if (!s) return { affiliationInstitution: '', affiliationGrade: '' }
  const idx = s.indexOf(USER_AFFILIATION_PIPE_SEP)
  if (idx === -1) return { affiliationInstitution: s, affiliationGrade: '' }
  return {
    affiliationInstitution: s.slice(0, idx).trim(),
    affiliationGrade: s.slice(idx + USER_AFFILIATION_PIPE_SEP.length).trim(),
  }
}

export function composeUserAffiliation(institution: string, grade: string): string | undefined {
  const i = institution.trim()
  const g = grade.trim()
  if (i && g) return `${i}${USER_AFFILIATION_PIPE_SEP}${g}`
  if (i) return i
  if (g) return g
  return undefined
}

export function individualEnrollmentStatusToDraft(
  status: User['schoolEnrollmentStatus'] | undefined,
  affiliationGrade: string
): 'enrolled' | 'not_enrolled' {
  if (status === 'NOT_ENROLLED') return 'not_enrolled'
  if (status === 'ENROLLED') return 'enrolled'
  if (affiliationGrade.trim()) return 'enrolled'
  return 'enrolled'
}

export function composeIndividualAffiliationFromDraft(
  draft: Pick<
    AdminProvisionedMemberBasicInfoDraft,
    'schoolEnrollmentStatus' | 'affiliationInstitution' | 'affiliationGrade'
  >
): string | undefined {
  if (draft.schoolEnrollmentStatus === 'not_enrolled') {
    return draft.affiliationInstitution.trim() || undefined
  }
  return composeUserAffiliation(draft.affiliationInstitution, draft.affiliationGrade)
}

function splitAddressForDraft(
  address: string | undefined,
  addressDetail?: string | undefined
): {
  detailAddressSearch: string
  detailAddressDetail: string
} {
  const main = (address ?? '').trim()
  const detail = (addressDetail ?? '').trim()
  if (detail) {
    return { detailAddressSearch: main, detailAddressDetail: detail }
  }
  if (!main) return { detailAddressSearch: '', detailAddressDetail: '' }
  return { detailAddressSearch: main, detailAddressDetail: '' }
}

function splitHighestEducationForDraft(highestEducationLabel: string | undefined): {
  highestEducationLevel: string
  highestEducationSchoolName: string
} {
  const t = (highestEducationLabel ?? '').trim()
  if (!t) return { highestEducationLevel: '', highestEducationSchoolName: '' }
  const idx = t.indexOf(USER_AFFILIATION_PIPE_SEP)
  if (idx === -1) return { highestEducationLevel: t, highestEducationSchoolName: '' }
  return {
    highestEducationLevel: t.slice(0, idx).trim(),
    highestEducationSchoolName: t.slice(idx + USER_AFFILIATION_PIPE_SEP.length).trim(),
  }
}

function birthDateToInputValue(birthDate: User['birthDate']): string {
  if (!birthDate) return ''
  if (typeof birthDate === 'string') return birthDate.slice(0, 10)
  try {
    return new Date(birthDate).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

const EMPTY_ADMIN_PROVISIONED_DRAFT: AdminProvisionedMemberBasicInfoDraft = {
  name: '',
  phone: '',
  email: '',
  detailAddress: '',
  affiliationInstitution: '',
  affiliationGrade: '',
  gender: '',
  birthDate: '',
  socialAccount: '',
  adminComment: '',
}

/** 학교(기관) 계정 — 기본 정보 수정용 초안 */
export function userToSchoolInstitutionEditDraft(
  user: Omit<User, 'password'>
): AdminProvisionedMemberBasicInfoDraft {
  return {
    ...EMPTY_ADMIN_PROVISIONED_DRAFT,
    schoolName: user.schoolInfo?.schoolName ?? user.name ?? '',
    institutionAddressSearch: user.schoolInfo?.address?.trim() ?? '',
    institutionAddressDetail: user.schoolInfo?.addressDetail?.trim() ?? '',
    adminComment: user.adminComment ?? '',
  }
}

export function composeInstitutionAddressFromDraft(
  draft: Pick<AdminProvisionedMemberBasicInfoDraft, 'institutionAddressSearch' | 'institutionAddressDetail'>
): string {
  const a = (draft.institutionAddressSearch ?? '').trim()
  const b = (draft.institutionAddressDetail ?? '').trim()
  if (a && b) return `${a} ${b}`
  return a || b
}

export function composeDetailAddressFromDraft(
  draft: Pick<AdminProvisionedMemberBasicInfoDraft, 'detailAddressSearch' | 'detailAddressDetail' | 'detailAddress'>
): string {
  const a = (draft.detailAddressSearch ?? '').trim()
  const b = (draft.detailAddressDetail ?? '').trim()
  if (a && b) return `${a} ${b}`
  if (a || b) return a || b
  return (draft.detailAddress ?? '').trim()
}

/** 일반 교사(INSTRUCTOR · school_teacher) — 관리자 코멘트만 인라인 수정 */
export function userToAdminCommentOnlyDraft(user: Omit<User, 'password'>): AdminProvisionedMemberBasicInfoDraft {
  return {
    ...EMPTY_ADMIN_PROVISIONED_DRAFT,
    adminComment: user.adminComment ?? '',
    instructorFeeGrade:
      user.role === 'INSTRUCTOR' ? user.listMetrics?.instructorFeeGradeLabel ?? '' : '',
    adminPermissionVariant: user.role === 'ADMIN' ? getAdminPermissionVariant(user) : '',
  }
}

export function userToAdminProvisionedBasicDraft(
  user: Omit<User, 'password'>
): AdminProvisionedMemberBasicInfoDraft {
  const { affiliationInstitution, affiliationGrade } = splitUserAffiliationForDraft(user.affiliation)
  const { detailAddressSearch, detailAddressDetail } = splitAddressForDraft(
    user.detailAddress,
    user.detailAddressDetail
  )
  const { highestEducationLevel, highestEducationSchoolName } = splitHighestEducationForDraft(
    user.role === 'INSTRUCTOR' ? user.listMetrics?.highestEducationLabel : undefined
  )
  return {
    name: user.name ?? '',
    phone: user.phone ?? '',
    email: user.email ?? '',
    detailAddress: user.detailAddress ?? '',
    affiliationInstitution,
    affiliationGrade,
    gender: (() => {
      const display = toDisplayGender(user.gender)
      return display === '-' ? '' : display
    })(),
    birthDate: birthDateToInputValue(user.birthDate),
    socialAccount: user.socialAccounts?.[0] ?? '',
    adminComment: user.adminComment ?? '',
    instructorFeeGrade:
      user.role === 'INSTRUCTOR' ? user.listMetrics?.instructorFeeGradeLabel ?? '' : '',
    instructorBankName: user.role === 'INSTRUCTOR' ? user.instructorInfo?.bankName ?? '' : '',
    instructorAccountNumber: user.role === 'INSTRUCTOR' ? user.instructorInfo?.accountNumber ?? '' : '',
    instructorAccountHolder: user.role === 'INSTRUCTOR' ? user.instructorInfo?.accountHolder ?? '' : '',
    instructorBusinessIncome:
      user.role === 'INSTRUCTOR'
        ? user.instructorInfo?.isBusinessIncome === true
          ? '해당'
          : user.instructorInfo?.isBusinessIncome === false
            ? '해당 없음'
            : ''
        : '',
    highestEducationLabel: user.role === 'INSTRUCTOR' ? user.listMetrics?.highestEducationLabel ?? '' : '',
    instructorCareerSummaryLabel:
      user.role === 'INSTRUCTOR'
        ? user.listMetrics?.instructorCareerSummaryLabel?.trim() ||
          user.listMetrics?.instructorCareerYearsLabel?.trim() ||
          user.instructorCareerText?.trim() ||
          ''
        : '',
    jaEvaluationGrade: user.role === 'INSTRUCTOR' ? user.listMetrics?.jaEvaluationGrade ?? '' : '',
    bio: user.role === 'INSTRUCTOR' ? user.bio ?? '' : '',
    adminPermissionVariant: user.role === 'ADMIN' ? getAdminPermissionVariant(user) : '',
    detailAddressSearch,
    detailAddressDetail,
    highestEducationLevel,
    highestEducationSchoolName,
    ...(user.role === 'INDIVIDUAL'
      ? {
          schoolEnrollmentStatus: individualEnrollmentStatusToDraft(
            user.schoolEnrollmentStatus,
            affiliationGrade
          ),
          id1365: user.id1365 ?? '',
        }
      : {}),
    ...((user.role === 'INDIVIDUAL' || user.role === 'ADMIN' || user.role === 'INSTRUCTOR')
      ? {
          termsAgreements: filterEditableTermsAgreementsForBasicInfoPatch(
            termsAgreementRowsToRequests(user.termsAgreements)
          ),
          consentTermsDirty: false,
        }
      : {}),
  }
}

/** 관리자 회원 상세 — 비마스터(또는 코멘트 전용 세션) 저장 시: 코멘트 + 권한 유형만 패치 */
export function draftToAdminMemberRestrictedPatch(draft: AdminProvisionedMemberBasicInfoDraft): PatchUserBasicInfoInput {
  const adminTrimmed = draft.adminComment.trim()
  const v = (draft.adminPermissionVariant ?? '').trim()
  const listMetrics =
    v === 'manager' || v === 'partner' || v === 'viewer'
      ? { adminPermissionVariant: v as AdminPermissionTagVariant }
      : undefined
  return {
    adminComment: adminTrimmed ? adminTrimmed : undefined,
    ...(listMetrics ? { listMetrics } : {}),
  }
}

export function draftToBasicInfoPatch(draft: AdminProvisionedMemberBasicInfoDraft): Partial<
  Pick<
    User,
    | 'name'
    | 'phone'
    | 'email'
    | 'detailAddress'
    | 'detailAddressDetail'
    | 'affiliation'
    | 'gender'
    | 'birthDate'
    | 'socialAccounts'
    | 'adminComment'
    | 'listMetrics'
  >
> {
  const social = draft.socialAccount.trim()
  const adminTrimmed = draft.adminComment.trim()
  const affiliation = composeIndividualAffiliationFromDraft(draft)
  const detailAddressSearch = (draft.detailAddressSearch ?? '').trim()
  const detailAddressDetail = (draft.detailAddressDetail ?? '').trim()
  const detailAddressFallback = (draft.detailAddress ?? '').trim()
  const adminPermissionVariant = (draft.adminPermissionVariant ?? '').trim()
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim() || undefined,
    email: draft.email.trim(),
    detailAddress: detailAddressSearch || detailAddressFallback || undefined,
    detailAddressDetail,
    affiliation,
    gender: draft.gender.trim() || undefined,
    birthDate: draft.birthDate.trim() || undefined,
    socialAccounts: social ? [social] : [],
    adminComment: adminTrimmed ? adminTrimmed : undefined,
    listMetrics:
      adminPermissionVariant === 'manager' ||
      adminPermissionVariant === 'partner' ||
      adminPermissionVariant === 'viewer'
        ? { adminPermissionVariant }
        : undefined,
  }
}

function draftToIndividualAffiliationPatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): Pick<
  PatchUserBasicInfoInput,
  | 'schoolEnrollmentStatus'
  | 'individualSchoolName'
  | 'individualGrade'
  | 'individualSchoolOrganizationId'
  | 'individualSchoolProvider'
  | 'individualSchoolExternalCode'
  | 'individualSchoolLevel'
  | 'individualSchoolAddress'
  | 'individualSchoolZipcode'
  | 'individualSchoolRegionSido'
  | 'individualSchoolRegionSigungu'
> {
  const enrollment = draft.schoolEnrollmentStatus
  if (enrollment !== 'enrolled' && enrollment !== 'not_enrolled') {
    return {}
  }
  const enrolled = enrollment === 'enrolled'
  const grade = enrolled ? draft.affiliationGrade.trim() : ''
  const schoolName = enrolled ? draft.affiliationInstitution.trim() : ''

  if (!enrolled) {
    return {
      schoolEnrollmentStatus: 'NOT_ENROLLED',
      individualSchoolName: '',
      individualSchoolOrganizationId: null,
    }
  }

  return {
    schoolEnrollmentStatus: 'ENROLLED',
    individualSchoolName: schoolName,
    ...(grade ? { individualGrade: grade } : {}),
    ...(draft.schoolOrganizationId != null && Number.isFinite(draft.schoolOrganizationId)
      ? { individualSchoolOrganizationId: draft.schoolOrganizationId }
      : {
          individualSchoolOrganizationId: null,
          ...(draft.schoolProvider?.trim()
            ? { individualSchoolProvider: draft.schoolProvider.trim() }
            : {}),
          ...(draft.schoolExternalCode?.trim()
            ? { individualSchoolExternalCode: draft.schoolExternalCode.trim() }
            : {}),
          ...(draft.schoolLevel?.trim() ? { individualSchoolLevel: draft.schoolLevel.trim() } : {}),
          ...(draft.schoolAddress?.trim()
            ? { individualSchoolAddress: draft.schoolAddress.trim() }
            : {}),
          ...(draft.schoolZipcode?.trim()
            ? { individualSchoolZipcode: draft.schoolZipcode.trim() }
            : {}),
          ...(draft.schoolRegionSido?.trim()
            ? { individualSchoolRegionSido: draft.schoolRegionSido.trim() }
            : {}),
          ...(draft.schoolRegionSigungu?.trim()
            ? { individualSchoolRegionSigungu: draft.schoolRegionSigungu.trim() }
            : {}),
        }),
  }
}

/** 관리자 등록 개인 — 기본정보 + 선택 동의만 PATCH */
export function draftToAdminProvisionedIndividualBasicInfoPatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  const base = draftToBasicInfoPatch(draft)
  const termsAgreements = filterEditableTermsAgreementsForBasicInfoPatch(draft.termsAgreements)
  return {
    ...base,
    ...draftToIndividualAffiliationPatch(draft),
    ...(termsAgreements ? { termsAgreements } : {}),
    ...(draft.consentWriteSnapshots
      ? { consentWriteSnapshots: draft.consentWriteSnapshots }
      : {}),
  }
}

/** 관리자 계정 상세 — 기본정보 + 선택 동의(MARKETING) PATCH */
export function draftToAdminAccountBasicInfoPatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  return draftToAdminProvisionedIndividualBasicInfoPatch(draft)
}

/** 학교 계정 — 본인 가입 완료 후 등: 기본 정보는 잠금일 때 `adminComment`만 patch */
export function draftToSchoolAdminCommentOnlyPatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  const adminTrimmed = draft.adminComment.trim()
  return { adminComment: adminTrimmed ? adminTrimmed : undefined }
}

export function draftToAdminCommentAndInstructorFeePatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  const adminTrimmed = draft.adminComment.trim()
  const feeGrade = (draft.instructorFeeGrade ?? '').trim()
  return {
    adminComment: adminTrimmed ? adminTrimmed : undefined,
    listMetrics: feeGrade ? { instructorFeeGradeLabel: feeGrade } : undefined,
  }
}

/** 어드민 등록 강사 — 본인인증 완료 후 제한 수정: 강사비 등급·JA 평가 등급만 */
export function draftToInstructorFeeAndJaGradePatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  const feeGrade = (draft.instructorFeeGrade ?? '').trim()
  const jaGrade = (draft.jaEvaluationGrade ?? '').trim()
  return {
    listMetrics: {
      ...(feeGrade ? { instructorFeeGradeLabel: feeGrade } : {}),
      ...(jaGrade ? { jaEvaluationGrade: jaGrade } : {}),
    },
  }
}

export function draftToAdminProvisionedInstructorBasicInfoPatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  const base = draftToBasicInfoPatch(draft)
  const feeGrade = (draft.instructorFeeGrade ?? '').trim()
  const jaGrade = (draft.jaEvaluationGrade ?? '').trim()
  const highestEducation = [draft.highestEducationLevel, draft.highestEducationSchoolName]
    .map(v => (v ?? '').trim())
    .filter(Boolean)
    .join(USER_AFFILIATION_PIPE_SEP)
  const careerSummary = (draft.instructorCareerSummaryLabel ?? '').trim()
  const businessIncome =
    draft.instructorBusinessIncome === '해당'
      ? true
      : draft.instructorBusinessIncome === '해당 없음'
        ? false
        : undefined
  const bankName = (draft.instructorBankName ?? '').trim()
  const accountNumber = (draft.instructorAccountNumber ?? '').trim()
  const accountHolder = (draft.instructorAccountHolder ?? '').trim()
  const bio = (draft.bio ?? '').trim()
  const certifications = buildInstructorRegisterCertifications(draft.licenseRows)
  return {
    ...base,
    ...(bio ? { bio } : {}),
    instructorInfo: {
      ...(bankName ? { bankName } : {}),
      ...(accountNumber ? { accountNumber } : {}),
      ...(accountHolder ? { accountHolder } : {}),
      ...(businessIncome !== undefined ? { isBusinessIncome: businessIncome } : {}),
    } as NonNullable<User['instructorInfo']>,
    ...(certifications != null ? { instructorCertifications: certifications } : {}),
    ...(draft.instructorCmsProfile ? { instructorCmsProfile: draft.instructorCmsProfile } : {}),
    ...(draft.instructorCmsSettlement ? { instructorCmsSettlement: draft.instructorCmsSettlement } : {}),
    ...(() => {
      if (!draft.consentTermsDirty) return {}
      const termsAgreements = filterEditableTermsAgreementsForBasicInfoPatch(draft.termsAgreements)
      return {
        ...(termsAgreements ? { termsAgreements } : {}),
        ...(draft.consentWriteSnapshots
          ? { consentWriteSnapshots: draft.consentWriteSnapshots }
          : {}),
      }
    })(),
    listMetrics: {
      ...(feeGrade ? { instructorFeeGradeLabel: feeGrade } : {}),
      ...(jaGrade ? { jaEvaluationGrade: jaGrade } : {}),
      ...(highestEducation ? { highestEducationLabel: highestEducation } : {}),
      ...(careerSummary ? { instructorCareerSummaryLabel: careerSummary } : {}),
    },
  } as PatchUserBasicInfoInput
}

/** 학교(기관) 관리자 등록 계정 — 기관명·주소·관리자 코멘트 저장 (프로그램 신청/수강 횟수는 시스템 지표로 CMS에서 수정 불가) */
export function draftToSchoolInstitutionBasicInfoPatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  const schoolName = (draft.schoolName ?? '').trim()
  const address = composeInstitutionAddressFromDraft(draft).trim()
  const adminTrimmed = draft.adminComment.trim()
  const patch: PatchUserBasicInfoInput = {
    adminComment: adminTrimmed ? adminTrimmed : undefined,
  }
  if (schoolName || address) {
    patch.name = schoolName || undefined
    // `patchUserBasicInfo`는 schoolInfo를 base와 병합하나, Patch 타입은 전체 객체 형태를 요구한다.
    patch.schoolInfo = {
      ...(schoolName ? { schoolName } : {}),
      ...(address ? { address } : {}),
    } as NonNullable<User['schoolInfo']>
  }
  return patch
}
