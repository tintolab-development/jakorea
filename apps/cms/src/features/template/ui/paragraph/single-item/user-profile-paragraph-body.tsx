import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import type { UserProfileParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'

export function UserProfileParagraphBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: UserProfileParagraph
  onChange: (next: UserProfileParagraph) => void
  isEditMode: boolean
}) {
  const toggleField = (key: string, enabled: boolean) => {
    onChange({
      ...paragraph,
      fields: paragraph.fields.map(f => (f.key === key ? { ...f, enabled } : f)),
    })
  }

  return (
    <div className="form-editor-body">
      <div
        className={[
          'form-editor-user-grid',
          !isEditMode ? 'form-editor-user-grid--non-interactive' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {paragraph.fields.map(f => (
          <label key={f.key} className="form-editor-user-grid__cell">
            <CmsCheckbox
              checkboxSize="medium"
              checked={f.enabled}
              onChange={e => {
                if (!isEditMode) return
                toggleField(f.key, e.target.checked)
              }}
            />
            <span>{f.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
