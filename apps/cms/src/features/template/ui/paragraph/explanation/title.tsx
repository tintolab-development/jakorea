import dayjs, { type Dayjs } from 'dayjs'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'

const DEFAULT_TITLE_PLACEHOLDER = '타이틀을 입력해 주세요'
const DEFAULT_PERIOD_LABEL = '작성 기간'

/** 설명글 제목형 */
export function ExplanationTitle({
  paragraph,
  onChange,
  isEditMode,
  titlePh = DEFAULT_TITLE_PLACEHOLDER,
  periodLabel = DEFAULT_PERIOD_LABEL,
}: {
  paragraph: TitleWithPeriodParagraph
  onChange: (next: TitleWithPeriodParagraph) => void
  isEditMode: boolean
  /** 제목 입력 placeholder (미지정 시 `타이틀을 입력해 주세요`) */
  titlePh?: string
  /** 기간 입력란 위 라벨 (미지정 시 `작성 기간`) */
  periodLabel?: string
}) {
  if (!isEditMode) {
    return null
  }

  const rangeValue: [Dayjs | null, Dayjs | null] = [
    paragraph.startAt ? dayjs(paragraph.startAt) : null,
    paragraph.endAt ? dayjs(paragraph.endAt) : null,
  ]

  return (
    <div className="form-editor-body">
      <ParagraphInput
        type="title"
        isEditMode={isEditMode}
        required
        value={paragraph.surveyTitle}
        onChange={next => onChange({ ...paragraph, surveyTitle: next })}
        placeholder={titlePh}
      />

      <ParagraphInput
        type="description"
        isEditMode={isEditMode}
        value={paragraph.surveyDescription}
        onChange={next => onChange({ ...paragraph, surveyDescription: next })}
        placeholder="설명 입력"
      />

      {paragraph.showWritingPeriodOnForm ? (
        <ParagraphDatePicker
          mode="range"
          style={{ marginTop: '16px' }}
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
      ) : null}
    </div>
  )
}
