/** 교육받은 교사 프로그램 등록 폼 — 기본 정보 기본값 (템플릿 시드) */
export const TRAINED_TEACHERS_REGISTRATION_BASIC_INFO_PREFIX =
  'trainedTeachersRegistration.basicInfo' as const

export const TRAINED_TEACHERS_REGISTRATION_REP_KO = '1사1교 경제금융교육'
export const TRAINED_TEACHERS_REGISTRATION_REP_EN =
  '1 Company 1 School Economics and Finance Education'

/** CmsSelect 「전체」 옵션과 동일 — value `''` (라벨만 전체) */
export const TRAINED_TEACHERS_REGISTRATION_ALL_VALUE = ''

export function normalizeTrainedTeachersAllSelectValue(value: string): string {
  return value === '__all__' || value === 'ALL' ? TRAINED_TEACHERS_REGISTRATION_ALL_VALUE : value
}

export const TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_VALUE = '__economy_1c1s_main__'
export const TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_OPTION = {
  value: TRAINED_TEACHERS_REGISTRATION_DETAILED_PROGRAM_VALUE,
  label: '1사1교 경제금융교육',
} as const
