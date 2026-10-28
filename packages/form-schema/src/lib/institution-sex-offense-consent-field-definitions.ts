/** 프로그램 참여자 신청 폼 (학교) — 성범죄 경력 조회 동의서 단락 정의 */

export const INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION = {
  title: '성범죄 경력 조회 동의서 제출 요청',
  description:
    '강사님들의 성범죄 경력 조회 동의서 제출이 필요하신 경우, 동의서 제출을 요청해 주세요. 미요청 시 전달되지 않습니다.',
} as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION = {
  title: '성범죄 경력 조회 동의서 조회 방식',
  description:
    '성범죄경력 조회 동의서의 조회 방식을 선택해 주세요. ‘범죄경력회보서 사이트 이용’ 선택 시에는 제출 방식과 성범죄 경력조회용 정보 입력란이 노출됩니다.',
} as const

/** 2026-10 reseed 이전 — 이 설명만 현행 설명으로 교체 */
export const LEGACY_INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_DESCRIPTIONS = [
  '성범죄경력 조회 동의서의 조회 방식을 선택해 주세요.',
  '성범죄 경력 조회 동의서의 조회 방식을 선택해 주세요. 범죄경력회보서의 온라인 제출을 희망하는 경우, 기관 ID와 검증번호를 함께 전달해 주세요.',
  '성범죄 경력 조회 동의서의 조회 방식을 선택해 주세요. 범죄경력회보서의 온라인 제출을 희망하는 경우, 기관 ID와 검증번호를 함께 전달해 주세요.\nJA 시스템 내에서 확인 선택 시, 프로그램 및 배정 정보와 함께 JA 홈페이지 상세에서 동의서 확인이 가능합니다. (조회 동의서만 제공하며, 실제 조회는 별도로 진행해 주셔야 합니다.)',
] as const

export function isLegacyInstitutionSexOffenseConsentInquiryDescription(
  description: string
): boolean {
  return LEGACY_INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_DESCRIPTIONS.some(
    legacy => legacy === description
  )
}

export const INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS = [
  { value: 'request', label: '동의서 제출 요청' },
  { value: 'no_submit', label: '동의서 미제출' },
] as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS = [
  { value: 'ja_system', label: 'JA 시스템 내에서 동의서 확인' },
  { value: 'criminal_record_site', label: '범죄경력회보서 사이트 이용' },
] as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES = [
  'JA 시스템 내에서 동의서 확인 선택 시 : 프로그램 및 배정 정보와 함께 JA 홈페이지 상세 화면에서 동의서를 확인하실 수 있습니다. (조회 동의서만 제공, 실제 조회는 별도 진행 필요)',
  '범죄경력회보서 사이트 이용 선택 시 : 사이트 제출 방식을 선택 후 기관 ID와 검증번호를 함께 전달해 주세요.',
  '온라인 제출 : 강사님이 범죄경력회보서 사이트에서 온라인으로 제출하며, 기관은 사이트에서 확인하실 수 있습니다.',
  '직접 제출 : 강사님이 범죄경력회보서를 직접 출력하여 기관에 제출합니다.',
] as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS = [
  { value: 'direct', label: '직접 제출' },
  { value: 'online', label: '온라인 제출' },
] as const

export const DEFAULT_SEX_OFFENSE_INQUIRY_METHOD = 'ja_system' as const
export const DEFAULT_SEX_OFFENSE_SITE_SUBMISSION = 'direct' as const

export type SexOffenseInquiryMethod = 'ja_system' | 'criminal_record_site'
export type SexOffenseSiteSubmission = 'direct' | 'online'
export type SexOffenseInquiryCase = 'ja_system' | 'site_direct' | 'site_online'

export const SEX_OFFENSE_TEACHER_GUIDANCE_JA_SYSTEM_VALUE =
  '기관이 JA 시스템 내에서 동의서 확인 후 직접 조회'

export const SEX_OFFENSE_INSTRUCTOR_CARD_DIRECT_MESSAGE =
  '강사님께서 범죄경력회보서를\n직접 출력하여 기관에 제출 예정입니다.'

export const SEX_OFFENSE_INSTRUCTOR_CARD_ONLINE_MESSAGE =
  '강사님의 성범죄경력 조회는\n범죄경력회보서 사이트에서 확인 가능합니다.'

export function isSexOffenseInquiryMethod(value: unknown): value is SexOffenseInquiryMethod {
  return value === 'ja_system' || value === 'criminal_record_site'
}

export function isSexOffenseSiteSubmission(value: unknown): value is SexOffenseSiteSubmission {
  return value === 'direct' || value === 'online'
}

/** 저장된 코드값만으로 CASE를 판정한다. 미설정·레거시 누락은 null */
export function resolveSexOffenseInquiryCase(input: {
  inquiryMethod?: string | null
  siteSubmission?: string | null
}): SexOffenseInquiryCase | null {
  if (input.inquiryMethod === 'ja_system') return 'ja_system'
  if (input.inquiryMethod === 'criminal_record_site') {
    if (input.siteSubmission === 'direct') return 'site_direct'
    if (input.siteSubmission === 'online') return 'site_online'
    return null
  }
  return null
}

export function shouldShowSexOffenseSiteFields(inquiryMethod: string | null | undefined): boolean {
  return inquiryMethod === 'criminal_record_site'
}

export function normalizeSexOffenseInquiryAnswer(input: {
  inquiryMethod?: string | null
  siteSubmission?: string | null
  institutionId?: string | null
  verificationNumber?: string | null
}): Record<string, unknown> | null {
  if (!isSexOffenseInquiryMethod(input.inquiryMethod)) return null
  if (input.inquiryMethod === 'ja_system') {
    return { inquiryMethod: 'ja_system' }
  }
  return {
    inquiryMethod: 'criminal_record_site',
    siteSubmission: isSexOffenseSiteSubmission(input.siteSubmission) ? input.siteSubmission : '',
    institutionId: input.institutionId?.trim() ?? '',
    verificationNumber: input.verificationNumber?.trim() ?? '',
  }
}

export function formatSexOffenseTeacherGuidanceValue(input: {
  inquiryMethod?: string | null
  siteSubmission?: string | null
  institutionId?: string | null
  verificationNumber?: string | null
}): string | undefined {
  const inquiryCase = resolveSexOffenseInquiryCase(input)
  if (inquiryCase === 'ja_system') return SEX_OFFENSE_TEACHER_GUIDANCE_JA_SYSTEM_VALUE
  if (inquiryCase === 'site_direct' || inquiryCase === 'site_online') {
    const siteLabel = inquiryCase === 'site_online' ? '온라인 제출' : '직접 제출'
    const institutionId = input.institutionId?.trim() ?? ''
    const verificationNumber = input.verificationNumber?.trim() ?? ''
    return [
      siteLabel,
      institutionId ? `ID : ${institutionId}` : null,
      verificationNumber ? `검증번호 : ${verificationNumber}` : null,
    ]
      .filter((part): part is string => Boolean(part))
      .join(' | ')
  }
  return undefined
}
