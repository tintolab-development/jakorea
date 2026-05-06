import type { AgreementExplanationTextParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
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
  const ph =
    (typeof paragraph.bodyPlaceholder === 'string' ? paragraph.bodyPlaceholder.trim() : '') ||
    '텍스트를 작성해 주세요'

  return (
    <div className="form-editor-body">
      <ParagraphInput
        type="description"
        className="paragraph-input--explanation-body"
        isEditMode={isEditMode}
        value={paragraph.bodyText}
        placeholder={ph}
        onChange={
          isEditMode ? next => onChange({ ...paragraph, bodyText: next }) : undefined
        }
      />
    </div>
  )
}
