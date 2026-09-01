import { useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
  titlePeriodEndDisplayText,
  titlePeriodStartDisplayText,
} from '@/features/template/lib/title-with-period-settings'
import {
  WritingFormPeriodDatePickerField,
  dateRangeUsesClockTime,
} from '@/features/template/ui/shared/writing-form-period-date-picker-field'

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
}: {
  paragraph: TitleWithPeriodParagraph
  onChange: (next: TitleWithPeriodParagraph) => void
  isEditMode: boolean
  /** 기간 입력란 위 라벨 (미지정 시 `작성 기간`) */
  periodLabel?: string
}) {
  const startMode = resolveTitleStartPeriodMode(paragraph)
  const endMode = resolveTitleEndPeriodMode(paragraph)

  const anchorDate = useMemo((): Dayjs => {
    if (paragraph.startAt) {
      const d = dayjs(paragraph.startAt)
      if (d.isValid()) return d
    }
    if (paragraph.endAt) {
      const d = dayjs(paragraph.endAt)
      if (d.isValid()) return d
    }
    return dayjs()
  }, [paragraph.startAt, paragraph.endAt])

  const appliedSurfaceRange = useMemo((): [Dayjs, Dayjs] | null => {
    if (startMode === 'custom' && paragraph.startAt) {
      const start = dayjs(paragraph.startAt)
      if (!start.isValid()) return null
      if (endMode === 'custom' && paragraph.endAt) {
        const end = dayjs(paragraph.endAt)
        if (end.isValid()) return [start, end]
      }
      return [start, start]
    }
    if (endMode === 'custom' && paragraph.endAt) {
      const end = dayjs(paragraph.endAt)
      if (end.isValid()) return [end, end]
    }
    return null
  }, [endMode, paragraph.endAt, paragraph.startAt, startMode])

  const appliedSurfaceWithTime = useMemo(() => {
    if (appliedSurfaceRange == null) return false
    return dateRangeUsesClockTime(appliedSurfaceRange[0], appliedSurfaceRange[1])
  }, [appliedSurfaceRange])

  const dualStartPlaceholder = titlePeriodStartDisplayText(paragraph)
  const dualEndPlaceholder = titlePeriodEndDisplayText(paragraph)

  if (!isEditMode) {
    return null
  }

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
            appliedSurfaceRange={appliedSurfaceRange}
            appliedSurfaceWithTime={appliedSurfaceWithTime}
            dualPeriodTrigger
            dualStartPlaceholder={dualStartPlaceholder}
            dualEndPlaceholder={dualEndPlaceholder}
            onCommitRange={([a, b]) => {
              onChange({
                ...paragraph,
                startPeriodMode: 'custom',
                endPeriodMode: 'custom',
                startAt: a.toISOString(),
                endAt: b.toISOString(),
                endPeriodPresetLabel: null,
                periodMode: 'custom',
              })
            }}
            onCommitSingleDay={d => {
              onChange({
                ...paragraph,
                startPeriodMode: 'custom',
                endPeriodMode: 'custom',
                startAt: d.startOf('day').toISOString(),
                endAt: d.endOf('day').toISOString(),
                endPeriodPresetLabel: null,
                periodMode: 'custom',
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}
