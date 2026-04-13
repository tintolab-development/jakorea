import dayjs, { type Dayjs } from 'dayjs'
import type { SurveyDescriptionTitleWithPeriodParagraph } from '@/features/template/model/survey-draft.schema'
import { CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import { SurveyParagraphCardActionsMinimal } from '@/features/template/ui/paragraph/shared/paragraph-actions'

/** 설명글 제목형 */
export function ExplanationTitle({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: SurveyDescriptionTitleWithPeriodParagraph
  onChange: (next: SurveyDescriptionTitleWithPeriodParagraph) => void
  isEditMode: boolean
}) {
  if (!isEditMode) {
    return null
  }

  const rangeValue: [Dayjs | null, Dayjs | null] = [
    paragraph.startAt ? dayjs(paragraph.startAt) : null,
    paragraph.endAt ? dayjs(paragraph.endAt) : null,
  ]

  return (
    <div className="survey-editor-body">
      <ParagraphInput
        type="title"
        isEditMode={isEditMode}
        required
        value={paragraph.surveyTitle}
        onChange={next => onChange({ ...paragraph, surveyTitle: next })}
        placeholder="타이틀을 입력해 주세요"
      />

      <ParagraphInput
        type="description"
        isEditMode={isEditMode}
        value={paragraph.surveyDescription}
        onChange={next => onChange({ ...paragraph, surveyDescription: next })}
        placeholder="설명 입력"
      />

      {paragraph.showWritingPeriodOnForm ? (
        <div>
          <span>설문 기간</span>
          <CmsDateRangePicker
            width="100%"
            value={rangeValue}
            placeholder={['바로 시작', '마감 없음']}
            onChange={dates => {
              const start = dates?.[0] ?? null
              const end = dates?.[1] ?? null
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
      ) : null}

      <div>
        <div>
          <CmsToggle
            label="작성 기간"
            checked={paragraph.showWritingPeriodOnForm}
            onChange={checked => onChange({ ...paragraph, showWritingPeriodOnForm: checked })}
          />
        </div>
        <div>
          <SurveyParagraphCardActionsMinimal />
        </div>
      </div>
    </div>
  )
}
