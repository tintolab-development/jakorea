/**
 * `DetailInfoForm.InputsSeparator` 한 개가 가로로 차지하는 px.
 * `apps/cms/src/index.css` 의 `.detail-info-form-inputs-separator` (width 1px + margin 0 12px) 와 동기화할 것.
 */
export const DETAIL_INFO_FORM_SEPARATOR_WIDTH = 26

export type FormInputsWidthOptions = {
  /** 한 Field `edit` 안에 나란히 두는 컨트롤 개수 */
  inputCount: number
  /**
   * `DetailInfoForm.InputsSeparator` 개수.
   * 생략 시 `inputCount >= 2` 이면 `inputCount - 1`, 아니면 0 (컨트롤 사이마다 구분선 1개 가정).
   */
  separatorCount?: number
  /** 구분선 1개당 가로 점유(px). 기본 `DETAIL_INFO_FORM_SEPARATOR_WIDTH` */
  separatorWidthPx?: number
}

/**
 * `(100% - separatorWidthPx × separatorCount) / inputCount`
 * — `detail-info-form-inputs-wrapper-no-gap` + 다중 컨트롤 + `InputsSeparator` 행에 맞춘 `width` 문자열.
 */
export function getFormInputsWidth(options: FormInputsWidthOptions): string {
  const { inputCount, separatorWidthPx = DETAIL_INFO_FORM_SEPARATOR_WIDTH } = options
  if (inputCount <= 0) {
    return '100%'
  }

  const separatorCount =
    options.separatorCount !== undefined
      ? Math.max(0, options.separatorCount)
      : inputCount >= 2
        ? inputCount - 1
        : 0

  if (inputCount === 1 && separatorCount === 0) {
    return '100%'
  }

  const deductedPx = separatorWidthPx * separatorCount
  return `calc((100% - ${deductedPx}px) / ${inputCount})`
}
