import { Input } from 'antd'
import type { SurveySubjectiveParagraph } from '@/features/template/model/survey-draft.schema'
import { SurveyParagraphCardActions } from '@/features/template/ui/paragraph/shared/paragraph-actions'
import '@/features/template/ui/survey/survey-editor.css'

export function SurveySubjectiveBody({
  paragraph,
  isEditMode,
}: {
  paragraph: SurveySubjectiveParagraph
  isEditMode: boolean
}) {
  const ph = paragraph.items[0]?.placeholder ?? '답변을 입력해 주세요'
  return (
    <div className="survey-editor-body">
      <Input.TextArea className="survey-editor-subjective" readOnly placeholder={ph} rows={5} />
      {isEditMode ? <SurveyParagraphCardActions /> : null}
    </div>
  )
}
