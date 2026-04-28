import dayjs, { type Dayjs } from 'dayjs'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'

const DEFAULT_PERIOD_LABEL = '작성 기간'

/**
 * 설명글 제목형 — 카드 타이틀·설명은 `ParagraphCard`(`paragraphEditableHeading`)에서 처리.
 * 본문 슬롯에는 작성 기간 입력만 노출.
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
  if (!isEditMode) {
    return null
  }

  if (!(paragraph.showWritingPeriodOnForm ?? false)) {
    return null
  }

  const rangeValue: [Dayjs | null, Dayjs | null] = [
    paragraph.startAt ? dayjs(paragraph.startAt) : null,
    paragraph.endAt ? dayjs(paragraph.endAt) : null,
  ]

  return (
    <div className="form-editor-body" style={{ padding: '0 8px' }}>
      <ParagraphDatePicker
        mode="range"
        style={{ marginTop: 0 }}
        label={periodLabel}
        value={rangeValue}
        placeholder={['바로 시작', '마감 없음']}
        onChange={([start, end]) => {
          if (start && end) {
            onChange({
              ...paragraph,
              startAt: start.toISOString(),
              endAt: end.toISOString(),
              periodMode: 'custom',
            })
          } else {
            onChange({
              ...paragraph,
              startAt: null,
              endAt: null,
              periodMode: 'immediate',
            })
          }
        }}
      />
    </div>
  )
}
