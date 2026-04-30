import { useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  WritingFormPeriodDatePickerField,
  dateRangeUsesClockTime,
} from '@/features/template/ui/paragraph/shared/writing-form-period-date-picker-field'

const DEFAULT_PERIOD_LABEL = '작성 기간'

/**
 * 설명글 제목형 — 카드 타이틀·설명은 `ParagraphCard`(`paragraphEditableHeading`)에서 처리.
 * 본문 슬롯: 「작성 기간」ON 시 단일항목 날짜형과 동일한 트리거 + 모달(`ParagraphDatePicker` single).
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
  const anchorDate = useMemo((): Dayjs => {
    if (paragraph.startAt) {
      const d = dayjs(paragraph.startAt)
      if (d.isValid()) return d
    }
    return dayjs()
  }, [paragraph.startAt])

  const appliedSurfaceRange = useMemo((): [Dayjs, Dayjs] | null => {
    if (paragraph.periodMode === 'custom' && paragraph.startAt && paragraph.endAt) {
      const a = dayjs(paragraph.startAt)
      const b = dayjs(paragraph.endAt)
      if (a.isValid() && b.isValid()) return [a, b]
    }
    return null
  }, [paragraph.periodMode, paragraph.startAt, paragraph.endAt])

  const appliedSurfaceWithTime = useMemo(() => {
    if (appliedSurfaceRange == null) return false
    return dateRangeUsesClockTime(appliedSurfaceRange[0], appliedSurfaceRange[1])
  }, [appliedSurfaceRange])

  if (!isEditMode) {
    return null
  }

  if (!(paragraph.showWritingPeriodOnForm ?? false)) {
    return null
  }

  return (
    <div className="form-editor-body" style={{ padding: '0 8px' }}>
      <WritingFormPeriodDatePickerField
        style={{ marginTop: 0 }}
        label={periodLabel}
        anchorDate={anchorDate}
        appliedSurfaceRange={appliedSurfaceRange}
        appliedSurfaceWithTime={appliedSurfaceWithTime}
        onCommitRange={([a, b]) => {
          onChange({
            ...paragraph,
            startAt: a.toISOString(),
            endAt: b.toISOString(),
            periodMode: 'custom',
          })
        }}
        onCommitSingleDay={d => {
          onChange({
            ...paragraph,
            startAt: d.startOf('day').toISOString(),
            endAt: d.endOf('day').toISOString(),
            periodMode: 'custom',
          })
        }}
      />
    </div>
  )
}
