import type { AgreementExplanationTextParagraph } from '@/features/template/model/writing-form-draft.schema'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-editor/form-editor.css'

/** 설명글_텍스트형 — 카드 `title`/`description`은 `ParagraphCard`에서 처리, 슬롯에는 본문(한 줄)만 */
export function ExplanationText({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: AgreementExplanationTextParagraph
  onChange: (next: AgreementExplanationTextParagraph) => void
  isEditMode: boolean
}) {
  const ph = paragraph.bodyPlaceholder.trim() || '텍스트를 작성해 주세요'

  return (
    <div className="form-editor-body">
      <CmsInput
        width="100%"
        readOnly={!isEditMode}
        value={paragraph.bodyText}
        placeholder={ph}
        onChange={
          isEditMode ? e => onChange({ ...paragraph, bodyText: e.target.value }) : undefined
        }
      />
    </div>
  )
}
