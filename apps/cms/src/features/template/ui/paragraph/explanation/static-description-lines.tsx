import type { StaticDescriptionLinesParagraph } from '@/features/template/model/writing-form-draft.schema'
import './static-description-lines.css'

/** 다중 줄 정적 설명 — 편집 없이 표시만 */
export function StaticDescriptionLines({ paragraph }: { paragraph: StaticDescriptionLinesParagraph }) {
  const lines = paragraph.lines?.length ? paragraph.lines : []
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
