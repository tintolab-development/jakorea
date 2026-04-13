import type { SurveyScoreSelectParagraph } from '@/features/template/model/survey-draft.schema'
import { SurveyParagraphCardActions } from '@/features/template/ui/paragraph/shared/paragraph-actions'
import '@/features/template/ui/survey/survey-editor.css'

export function SurveyScoreSelectBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: SurveyScoreSelectParagraph
  onChange: (next: SurveyScoreSelectParagraph) => void
  isEditMode: boolean
}) {
  const { scaleMin, scaleMax, scaleLabels, selectedPreviewValue } = paragraph
  const values: number[] = []
  for (let v = scaleMin; v <= scaleMax; v += 1) values.push(v)

  return (
    <div className="survey-editor-body">
      <div className="survey-editor-likert">
        <div className="survey-editor-likert__labels">
          <span>{scaleLabels[String(scaleMin)] ?? ''}</span>
          <span>{scaleLabels[String(scaleMax)] ?? ''}</span>
        </div>
        <div className="survey-editor-likert__buttons" role="group" aria-label="척도 선택">
          {values.map(v => (
            <button
              key={v}
              type="button"
              disabled={!isEditMode}
              className={`survey-editor-likert__btn ${selectedPreviewValue === v ? 'survey-editor-likert__btn--active' : ''}`}
              onClick={() => {
                if (!isEditMode) return
                onChange({ ...paragraph, selectedPreviewValue: v })
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {isEditMode ? <SurveyParagraphCardActions /> : null}
    </div>
  )
}
