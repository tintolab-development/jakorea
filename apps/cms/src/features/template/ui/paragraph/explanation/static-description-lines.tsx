import type { StaticDescriptionLinesParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/shared/paragraph-input'
import './static-description-lines.css'

/**
 * 다중 줄 정적 설명 — 회원 화면·미리보기·A4는 표시만.
 * 템플릿 관리 작성(authoring)에서 `onChange`를 주면 줄 문구를 편집한다(줄 추가·삭제는 없음).
 */
export function StaticDescriptionLines({
  paragraph,
  isEditMode = false,
  onChange,
}: {
  paragraph: StaticDescriptionLinesParagraph
  /** 카드 선택 여부 — `onChange`가 있을 때만 의미 있음 */
  isEditMode?: boolean
  onChange?: (next: StaticDescriptionLinesParagraph) => void
}) {
  const lines = paragraph.lines?.length ? paragraph.lines : []
  if (onChange == null) {
    return (
      <div className="form-editor-body static-description-lines">
        {lines.map((line, i) => (
          <p key={i} className="static-description-lines__line paragraph-input--explanation-body">
            {line}
          </p>
        ))}
      </div>
    )
  }
  return (
    <div className="form-editor-body static-description-lines">
      {lines.map((line, i) => (
        <ParagraphInput
          key={i}
          type="description"
          className="paragraph-input--explanation-body static-description-lines__line-input"
          isEditMode={isEditMode}
          value={line}
          placeholder="텍스트를 작성해 주세요"
          onChange={
            isEditMode
              ? next => {
                  const nextLines = [...lines]
                  nextLines[i] = next
                  onChange({ ...paragraph, lines: nextLines })
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}
