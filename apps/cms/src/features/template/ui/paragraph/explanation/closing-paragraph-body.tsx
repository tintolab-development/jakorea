import { Input } from 'antd'
import type { SurveyClosingParagraph } from '@/features/template/model/survey-draft.schema'
import { SurveyParagraphCardActionsMinimal } from '@/features/template/ui/paragraph/shared/paragraph-actions'
import '@/features/template/ui/survey/survey-editor.css'

export function SurveyClosingBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: SurveyClosingParagraph
  onChange: (next: SurveyClosingParagraph) => void
  isEditMode: boolean
}) {
  if (!isEditMode) {
    const text = paragraph.body.trim()
    return (
      <div className="survey-editor-body survey-editor-body--view survey-editor-body--closing-view">
        <p className="survey-editor-closing-view__text">{text || '마무리글 없음'}</p>
      </div>
    )
  }

  return (
    <div className="survey-editor-body survey-editor-body--closing">
      <Input.TextArea
        value={paragraph.body}
        onChange={e => onChange({ ...paragraph, body: e.target.value })}
        rows={4}
        placeholder="마무리 문구를 입력해 주세요"
      />
      <SurveyParagraphCardActionsMinimal />
    </div>
  )
}
