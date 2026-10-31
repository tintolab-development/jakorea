/**
 * 「교육 진행 장소」 노출·필수 규칙 (등록 위저드·상세 공통 정보 공용).
 * - 일반 등록 + 참여자 <개인>(기관 미선택)일 때만 대상. 1사1교·교육받은 교사 제외.
 * - 교육 형태가 「온라인」이면 숨기고 필수에서 뺀다. 「오프라인」「온/오프라인」은 노출·필수.
 * - 교육 형태가 일정 별 상이(복수 회차)면 회차/세부 일정 행마다 판단한다.
 * - 숨겨도 저장값은 지우지 않는다. 검사·미리보기 payload에서만 제외한다.
 */
import {
  DEFAULT_REGISTRATION_EDUCATION_FORM,
  resolveIndexedEducationForm,
} from './program-registration-education-form-options'

export const EDUCATION_PLACE_HIDDEN_EDUCATION_FORM = 'online' as const

function nonEmptyText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isBlankPlace(value: unknown): boolean {
  return nonEmptyText(value) === ''
}

/** 교육 형태 값이 「온라인」이면 교육 진행 장소를 숨긴다 */
export function isEducationPlaceHiddenForEducationForm(form: unknown): boolean {
  return resolveIndexedEducationForm(form) === EDUCATION_PLACE_HIDDEN_EDUCATION_FORM
}

/** 교육 형태 일정 별 상이 — 복수 회차에서만 회차/세부 일정 행 값이 쓰인다 */
export function isEducationFormPerScheduleRows(input: {
  sessionRoundType: string
  educationFormScheduleDetail: string
}): boolean {
  return input.sessionRoundType === 'multi' && input.educationFormScheduleDetail === 'perSchedule'
}

/** 일정 공통 교육 형태 — 단일 회차는 single, 복수 회차는 multiCommon → single → online */
export function resolveEducationPlaceCommonEducationForm(input: {
  sessionRoundType: string
  singleEducationForm: unknown
  multiCommonEducationForm: unknown
}): string {
  if (input.sessionRoundType === 'multi') {
    return (
      nonEmptyText(input.multiCommonEducationForm) ||
      nonEmptyText(input.singleEducationForm) ||
      DEFAULT_REGISTRATION_EDUCATION_FORM
    )
  }
  return (
    nonEmptyText(input.singleEducationForm) ||
    nonEmptyText(input.multiCommonEducationForm) ||
    DEFAULT_REGISTRATION_EDUCATION_FORM
  )
}

export type EducationPlaceVisibilityInput = {
  sessionRoundType: string
  educationFormScheduleDetail: string
  /** `resolveEducationPlaceCommonEducationForm` 결과 */
  commonEducationForm: string
}

/** 유형 설정 「교육 진행 장소」 행 — 교육 형태 일정 별 상이면 행 단위 판단이라 유지 */
export function isEducationPlaceTypeSettingsRowVisible(input: EducationPlaceVisibilityInput): boolean {
  if (isEducationFormPerScheduleRows(input)) return true
  return !isEducationPlaceHiddenForEducationForm(input.commonEducationForm)
}

/** 회차/세부 일정 행 — 교육 형태 일정 별 상이면 그 행 교육 형태, 아니면 일정 공통 교육 형태 */
export function isEducationPlaceRowVisible(
  input: EducationPlaceVisibilityInput & { rowEducationForm: unknown }
): boolean {
  if (isEducationFormPerScheduleRows(input)) {
    return !isEducationPlaceHiddenForEducationForm(input.rowEducationForm)
  }
  return !isEducationPlaceHiddenForEducationForm(input.commonEducationForm)
}

export type EducationPlaceRequiredInput = EducationPlaceVisibilityInput & {
  /** 일반 등록 + 참여자 <개인> (기관 미선택) */
  enabled: boolean
  programType: 'curriculum' | 'schedule'
  /** 회차/세부 일정 교육 형태 맵 (1부터, 사전 교육=0) */
  educationFormByIndex: Record<number, unknown>
  placeScheduleDetail: unknown
  placeAddress: unknown
  /** 회차/세부 일정 교육 진행 장소 맵 (1부터) */
  placeByIndex: Record<number, unknown>
  /** 검사할 행 수 — 커리큘럼 단일=차시 수, 복수=회차 수, 일정형=세부 일정 수 */
  rowCount: number
  /** 교육받은 교사 「교육 연수」 고정 첫 행 등 장소 행이 없는 첫 행 */
  skipFirstRow?: boolean
}

/**
 * 필수 미입력 진단 키. 사전 교육(index 0)은 대상이 아니다.
 * - 일정 공통: `typeSettings.educationPlace`
 * - 일정 별 상이: `curriculum.educationPlace[i]` / `scheduleCurriculum.educationPlace[i]`
 */
export function listIncompleteEducationPlaceReasons(input: EducationPlaceRequiredInput): {
  typeSettings: string[]
  rows: string[]
} {
  const empty = { typeSettings: [] as string[], rows: [] as string[] }
  if (!input.enabled) return empty
  const rowCount = Math.max(1, input.rowCount)
  const visibleRowIndices: number[] = []
  for (let index = 1; index <= rowCount; index += 1) {
    if (input.skipFirstRow && index === 1) continue
    if (
      isEducationPlaceRowVisible({
        ...input,
        rowEducationForm: input.educationFormByIndex[index],
      })
    ) {
      visibleRowIndices.push(index)
    }
  }
  if (input.placeScheduleDetail === 'perSchedule') {
    const prefix = input.programType === 'schedule' ? 'scheduleCurriculum' : 'curriculum'
    return {
      typeSettings: [],
      rows: visibleRowIndices
        .filter(index => isBlankPlace(input.placeByIndex[index]))
        .map(index => `${prefix}.educationPlace[${index}]`),
    }
  }
  const commonRequired = isEducationFormPerScheduleRows(input)
    ? visibleRowIndices.length > 0
    : !isEducationPlaceHiddenForEducationForm(input.commonEducationForm)
  return {
    typeSettings: commonRequired && isBlankPlace(input.placeAddress) ? ['typeSettings.educationPlace'] : [],
    rows: [],
  }
}
