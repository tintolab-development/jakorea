/** 프로그램 참여자 신청 폼 (학교) — 성범죄 경력 조회 동의서 단락 정의 */

export const INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION = {
  title: '성범죄 경력 조회 동의서 제출 요청',
  description:
    '강사님들의 성범죄 경력 조회 동의서 제출이 필요하신 경우, 동의서 제출을 요청해 주세요. 미요청 시 전달되지 않습니다.',
} as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION = {
  title: '성범죄 경력 조회 동의서 조회 방식',
  description: '성범죄경력 조회 동의서의 조회 방식을 선택해 주세요.',
} as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS = [
  { value: 'request', label: '동의서 제출 요청' },
  { value: 'no_submit', label: '동의서 미제출' },
] as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS = [
  { value: 'ja_system', label: 'JA 시스템 내에서 동의서 확인' },
  { value: 'criminal_record_site', label: '범죄경력회보서 사이트 이용' },
] as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES = [
  '온라인 제출: 범죄경력회보서를 온라인으로 제출하시려면 기관 ID와 검증번호를 함께 전달해 주세요.',
  '직접 제출: 프로그램 및 배정 정보와 함께 JA 홈페이지 상세 화면에서 동의서를 확인하실 수 있습니다.',
] as const

export const INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_CAUTION =
  '※ 직접 제출 시 조회 동의서만 제공하며, 실제 조회는 별도로 진행해 주셔야 합니다.'

export const INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS = [
  { value: 'direct', label: '직접 제출' },
  { value: 'online', label: '온라인 제출' },
] as const
