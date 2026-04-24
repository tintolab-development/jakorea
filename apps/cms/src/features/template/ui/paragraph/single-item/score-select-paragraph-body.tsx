import type { ScoreSelectParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'

export function ScoreSelectParagraphBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: ScoreSelectParagraph
  onChange: (next: ScoreSelectParagraph) => void
  isEditMode: boolean
}) {
  const { scaleMin, scaleMax, scaleLabels, selectedPreviewValue } = paragraph
  const values: number[] = []
  for (let v = scaleMin; v <= scaleMax; v += 1) values.push(v)

  return (
    <div className="form-editor-body">
      <div className="form-editor-likert">
        <div className="form-editor-likert__labels">
          <span>{scaleLabels[String(scaleMin)] ?? ''}</span>
          <span>{scaleLabels[String(scaleMax)] ?? ''}</span>
        </div>
        <div className="form-editor-likert__buttons" role="group" aria-label="척도 선택">
          {values.map(v => (
            <button
              key={v}
              type="button"
              disabled={!isEditMode}
              className={`form-editor-likert__btn ${selectedPreviewValue === v ? 'form-editor-likert__btn--active' : ''}`}
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
    </div>
  )
}
