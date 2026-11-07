/** 개인정보 포함 파일 다운로드 암호 — 가입 비밀번호(12자)와 분리. 최소 8자. */
export const FILE_DOWNLOAD_PASSWORD_MIN_LENGTH = 8

export const FILE_DOWNLOAD_PASSWORD_RULE_MESSAGE =
  '파일을 열 때 사용할 암호는 영문·숫자·특수문자를 조합해 8자 이상 입력해 주세요.'

export const FILE_DOWNLOAD_PASSWORD_NOT_STORED_MESSAGE =
  '입력된 암호는 별도 저장되지 않으므로, 분실에 유의해 주세요.'

export const FILE_DOWNLOAD_PASSWORD_MISMATCH_MESSAGE = '암호가 일치하지 않습니다.'

export const FILE_DOWNLOAD_PASSWORD_INVALID_MESSAGE =
  '영문·숫자·특수문자를 조합해 8자 이상 입력해 주세요.'

/** 영문·숫자·특수문자 포함, 8자 이상, 공백 불가 */
const FILE_DOWNLOAD_PASSWORD_REGEX =
  /^(?!.*\s)(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/

export type ContainedPiiType = 'RESIDENT_REGISTRATION_NUMBER' | 'ACCOUNT_NUMBER'

export const CONTAINED_PII_LABEL: Record<ContainedPiiType, string> = {
  RESIDENT_REGISTRATION_NUMBER: '주민등록번호',
  ACCOUNT_NUMBER: '계좌번호',
}

const CONTAINED_PII_ORDER: readonly ContainedPiiType[] = [
  'RESIDENT_REGISTRATION_NUMBER',
  'ACCOUNT_NUMBER',
]

export function isValidFileDownloadPassword(password: string): boolean {
  return FILE_DOWNLOAD_PASSWORD_REGEX.test(password)
}

export function validateFileDownloadPasswordConfirm(
  password: string,
  confirmPassword: string
): string | null {
  if (!isValidFileDownloadPassword(password)) {
    return FILE_DOWNLOAD_PASSWORD_INVALID_MESSAGE
  }
  if (password !== confirmPassword) {
    return FILE_DOWNLOAD_PASSWORD_MISMATCH_MESSAGE
  }
  return null
}

export function formatContainedPiiLead(types: readonly ContainedPiiType[]): string {
  const unique = CONTAINED_PII_ORDER.filter(type => types.includes(type))
  if (unique.length === 0) {
    return '개인정보가 포함된 파일입니다.'
  }
  const labels = unique.map(type => CONTAINED_PII_LABEL[type])
  return `${labels.join('·')}가 포함된 파일입니다.`
}

export const DOWNLOAD_PASSWORD_REQUIRED_CODE = 'DOWNLOAD_PASSWORD_REQUIRED'
export const DOWNLOAD_PASSWORD_INVALID_CODE = 'DOWNLOAD_PASSWORD_INVALID'
export const CONSENT_SENSITIVE_FILE_FORBIDDEN_CODE = 'CONSENT_SENSITIVE_FILE_FORBIDDEN'

export const DOWNLOAD_PASSWORD_REQUIRED_MESSAGE = '파일 암호를 입력해 주세요.'
export const DOWNLOAD_PASSWORD_INVALID_SERVER_MESSAGE =
  '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.'
export const CONSENT_SENSITIVE_FILE_FORBIDDEN_MESSAGE =
  '성범죄 경력조회 동의서와 행정정보 공동이용 사전동의서는 Master와 해당 프로그램 Program Owner만 열람·다운로드할 수 있습니다.'

export function parseContainedPiiTypes(value: unknown): ContainedPiiType[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set<string>(CONTAINED_PII_ORDER)
  return value.filter((item): item is ContainedPiiType => typeof item === 'string' && allowed.has(item))
}

export function messageForProtectedDownloadErrorCode(code: string | undefined): string | undefined {
  if (code === DOWNLOAD_PASSWORD_REQUIRED_CODE) return DOWNLOAD_PASSWORD_REQUIRED_MESSAGE
  if (code === DOWNLOAD_PASSWORD_INVALID_CODE) return DOWNLOAD_PASSWORD_INVALID_SERVER_MESSAGE
  if (code === CONSENT_SENSITIVE_FILE_FORBIDDEN_CODE) return CONSENT_SENSITIVE_FILE_FORBIDDEN_MESSAGE
  return undefined
}

export function isFileDownloadPasswordErrorCode(code: string | undefined): boolean {
  return code === DOWNLOAD_PASSWORD_REQUIRED_CODE || code === DOWNLOAD_PASSWORD_INVALID_CODE
}

/** 암호 모달 제출 — 서버 DOWNLOAD_PASSWORD_* / field=password 와 같은 문구 */
export function fileDownloadPasswordSubmitFieldErrors(
  password: string,
  confirmPassword: string
): { password?: string; confirm?: string } {
  if (!password.trim()) {
    return { password: DOWNLOAD_PASSWORD_REQUIRED_MESSAGE }
  }
  if (!isValidFileDownloadPassword(password)) {
    return { password: DOWNLOAD_PASSWORD_INVALID_SERVER_MESSAGE }
  }
  if (password !== confirmPassword) {
    return { confirm: FILE_DOWNLOAD_PASSWORD_MISMATCH_MESSAGE }
  }
  return {}
}
