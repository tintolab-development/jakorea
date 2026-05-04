/** IPS 유형 1차(대분류) — `ProgramRegistrationIpsTypeFields` 1번 셀렉트 */
export type ProgramRegistrationIpsCategory = 'succeed' | 'inspire' | 'prepare'

export const PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS: {
  value: ProgramRegistrationIpsCategory
  label: string
}[] = [
  { value: 'succeed', label: '성공 프로그램' },
  { value: 'inspire', label: '영감 프로그램' },
  { value: 'prepare', label: '준비 프로그램' },
]

/** 성공 프로그램 — 2차 셀렉트 */
export const PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS = [
  { value: 'discovery', label: '탐구형' },
  { value: 'practice', label: '실천형' },
  { value: 'creative', label: '창의형' },
] as const

/** 영감 프로그램 — 2차 셀렉트(채널) */
export const PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온·오프라인' },
] as const

/** 준비 프로그램 — 고정 1옵션 */
export const PROGRAM_REGISTRATION_IPS_PREPARE_ONLY_OPTIONS = [{ value: 'none', label: '해당 없음' }] as const
