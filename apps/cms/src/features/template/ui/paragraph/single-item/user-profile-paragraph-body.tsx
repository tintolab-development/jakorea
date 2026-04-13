import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import type { SurveyUserProfileParagraph } from '@/features/template/model/survey-draft.schema'
import { SurveyParagraphCardActions } from '@/features/template/ui/paragraph/shared/paragraph-actions'
import '@/features/template/ui/survey/survey-editor.css'

export function SurveyUserProfileBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: SurveyUserProfileParagraph
  onChange: (next: SurveyUserProfileParagraph) => void
  isEditMode: boolean
}) {
  const toggleField = (key: string, enabled: boolean) => {
    onChange({
      ...paragraph,
      fields: paragraph.fields.map(f => (f.key === key ? { ...f, enabled } : f)),
    })
  }

  return (
    <div className="survey-editor-body">
      <div className="survey-editor-user-grid">
        {paragraph.fields.map(f => (
          <label key={f.key} className="survey-editor-user-grid__cell">
            <CmsCheckbox
              checkboxSize="large"
              checked={f.enabled}
              disabled={!isEditMode}
              onChange={e => toggleField(f.key, e.target.checked)}
            />
            <span>{f.label}</span>
          </label>
        ))}
      </div>
      {isEditMode ? <SurveyParagraphCardActions /> : null}
    </div>
  )
}
