import type { AgreementExplanationTextParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import '@/features/template/ui/form-editor/form-editor.css'
import './text.css'

export type ExplanationTextBodyDisplayMode = 'input' | 'disabled-placeholder'

/** 설명글_텍스트형 — 카드 `title`/`description`은 `ParagraphCard`에서 처리, 슬롯에는 본문(한 줄)만 */
export function ExplanationText({
  paragraph,
  onChange,
  isEditMode,
  bodyDisplayMode = 'input',
}: {
  paragraph: AgreementExplanationTextParagraph
  onChange: (next: AgreementExplanationTextParagraph) => void
  isEditMode: boolean
  /** 작성(authoring) + 구조 잠금 단락에서 본문을 Disabled 입력 영역으로 표시 */
  bodyDisplayMode?: ExplanationTextBodyDisplayMode
}) {
  if (bodyDisplayMode === 'disabled-placeholder') {
    const text =
      typeof paragraph.bodyText === 'string' ? paragraph.bodyText.trim() : ''
    return (
      <div className="form-editor-body">
        <div
          className="explanation-text__disabled-placeholder"
          aria-disabled="true"
          aria-hidden={text.length === 0 ? 'true' : undefined}
        >
          {text.length > 0 ? (
            <span className="explanation-text__disabled-placeholder-text">{text}</span>
          ) : null}
        </div>
      </div>
    )
  }

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
