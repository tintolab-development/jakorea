import {
  DETAIL_INFO_FORM_SEPARATOR_WIDTH,
  getFormInputsWidth,
} from '@/shared/lib/form-inputs-width'

/**
 * 템플릿 `DetailInfoForm` 한 Field 안, `InputsSeparator` 1개당 가로 점유(px).
 * 계산식: `(100% - TEMPLATE_FORM_SEPARATOR_WIDTH_PX × separatorCount) / inputCount`
 * 값은 `DETAIL_INFO_FORM_SEPARATOR_WIDTH`(26)와 동기화.
 */
export const TEMPLATE_FORM_SEPARATOR_WIDTH_PX = DETAIL_INFO_FORM_SEPARATOR_WIDTH

const w2 = getFormInputsWidth({
  inputCount: 2,
  separatorWidthPx: TEMPLATE_FORM_SEPARATOR_WIDTH_PX,
})
/** 나란히 2개 컨트롤 + 구분선 1 — 각 슬롯에 동일 `width` (인덱스는 모두 같은 문자열) */
export const FORM_INPUTS_2_WIDTHS = [w2, w2] as const

const w3 = getFormInputsWidth({
  inputCount: 3,
  separatorWidthPx: TEMPLATE_FORM_SEPARATOR_WIDTH_PX,
})
export const FORM_INPUTS_3_WIDTHS = [w3, w3, w3] as const

const w4 = getFormInputsWidth({
  inputCount: 4,
  separatorWidthPx: TEMPLATE_FORM_SEPARATOR_WIDTH_PX,
})
export const FORM_INPUTS_4_WIDTHS = [w4, w4, w4, w4] as const

const w5 = getFormInputsWidth({
  inputCount: 5,
  separatorWidthPx: TEMPLATE_FORM_SEPARATOR_WIDTH_PX,
})
export const FORM_INPUTS_5_WIDTHS = [w5, w5, w5, w5, w5] as const
