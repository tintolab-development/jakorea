import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  titlePeriodEndDisplayText,
  titlePeriodStartDisplayText,
} from '@/features/template/lib/title-with-period-settings'
import {
  patchSurveyTitleWritingPeriodCustomRange,
  resolveSurveyTitleWritingPeriodAppliedSurfaceRange,
  resolveSurveyTitleWritingPeriodAppliedWithTime,
  resolveSurveyTitleWritingPeriodPickerValue,
} from '@/features/template/lib/survey-title-writing-period'
import { resolveSurveyTitlePeriodDisabledDate } from '@/features/template/lib/survey-title-period-policy'
import { WritingFormPeriodDatePickerField } from '@/features/template/ui/shared/writing-form-period-date-picker-field'

import './explanation-title-period.css'

const DEFAULT_PERIOD_LABEL = '작성 기간'

/**
 * 설명글 제목형 — 카드 타이틀·설명은 `ParagraphCard`(`paragraphEditableHeading`)에서 처리.
 * 본문 슬롯: 「작성 기간」ON 시 기간 피커 + 모달(`ParagraphDatePicker` dual period).
 */
export function ExplanationTitle({
  paragraph,
  onChange,
  isEditMode,
  periodLabel = DEFAULT_PERIOD_LABEL,
  periodInputDisabled = false,
}: {
  paragraph: TitleWithPeriodParagraph
  onChange: (next: TitleWithPeriodParagraph) => void
  /** false — 비선택 단락: 기간 입력란은 보이되 읽기 전용 */
  isEditMode: boolean
  /** 기간 입력란 위 라벨 (미지정 시 `작성 기간`) */
  periodLabel?: string
  /** 일정별 만족도조사 — 값은 보이되 변경 불가 */
  periodInputDisabled?: boolean
}) {
  const pickerValue = useMemo(
    () => resolveSurveyTitleWritingPeriodPickerValue(paragraph),
    [paragraph]
  )

  const appliedSurfaceRange = useMemo(
    () => resolveSurveyTitleWritingPeriodAppliedSurfaceRange(paragraph),
    [paragraph]
  )

  const appliedSurfaceWithTime = useMemo(() => {
    if (appliedSurfaceRange == null) return false
    return resolveSurveyTitleWritingPeriodAppliedWithTime(appliedSurfaceRange)
  }, [appliedSurfaceRange])

  const anchorDate = useMemo(
    () => pickerValue ?? dayjs(),
    [pickerValue]
  )

  const dualStartPlaceholder = titlePeriodStartDisplayText(paragraph)
  const dualEndPlaceholder = titlePeriodEndDisplayText(paragraph)
  const disabledDate = useMemo(
    () => resolveSurveyTitlePeriodDisabledDate(paragraph.id),
    [paragraph.id]
  )

  if (!(paragraph.showWritingPeriodOnForm ?? false)) {
    return null
  }

  return (
    <div className="explanation-title-period">
      <div className="explanation-title-period__row">
        <span className="explanation-title-period__label">{periodLabel}</span>
        <div className="explanation-title-period__picker">
          <WritingFormPeriodDatePickerField
            style={{ marginTop: 0 }}
            anchorDate={anchorDate}
            value={pickerValue}
            appliedSurfaceRange={appliedSurfaceRange}
            appliedSurfaceWithTime={appliedSurfaceWithTime}
            dualPeriodTrigger
            dualStartPlaceholder={dualStartPlaceholder}
            dualEndPlaceholder={dualEndPlaceholder}
            disabledDate={disabledDate}
            disabled={periodInputDisabled}
            readOnly={!periodInputDisabled && !isEditMode}
            onCommitRange={range => {
              onChange(
                patchSurveyTitleWritingPeriodCustomRange(
                  paragraph,
                  range,
                  resolveSurveyTitleWritingPeriodAppliedWithTime(range)
                )
              )
            }}
            onCommitSingleDay={d => {
              onChange(
                patchSurveyTitleWritingPeriodCustomRange(paragraph, [d, d], false)
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}
