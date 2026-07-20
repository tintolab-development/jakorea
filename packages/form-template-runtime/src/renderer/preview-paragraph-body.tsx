import type {
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormTemplateSurface, ParagraphBodyInteractionMode } from '@jakorea/form-schema/surface'
import { DetailInfoForm } from '../detail-info-form/detail-info-form.js'
import { horizontalTableToDetailInfoRows } from './horizontal-table-preview.js'

export type PreviewParagraphBodyProps = {
  paragraph: WritingFormParagraph
  interactionMode: ParagraphBodyInteractionMode
  surface: FormTemplateSurface
}

export function PreviewParagraphBody({
  paragraph,
  interactionMode,
}: PreviewParagraphBodyProps) {
  if (interactionMode === 'authoring') {
    return (
      <p className="form-template-preview-placeholder">
        authoring 모드는 CMS 편집기에서만 지원됩니다.
      </p>
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    const rows = horizontalTableToDetailInfoRows(paragraph)
    return (
      <DetailInfoForm title={paragraph.paragraphTitle} hideHeader mode="view">
        {rows.map((row, index) => (
          <DetailInfoForm.Row key={`${paragraph.id}-row-${index}`}>
            <DetailInfoForm.Field label={row.label} view={row.value} />
          </DetailInfoForm.Row>
        ))}
      </DetailInfoForm>
    )
  }

  if (paragraph.kind === 'description') {
    if (paragraph.variant === 'closing') {
      const body = 'body' in paragraph ? String(paragraph.body ?? '').trim() : ''
      if (body) {
        return <div className="form-template-preview-text">{body}</div>
      }
    }
    if (paragraph.variant === 'static_description_lines') {
      const lines = 'lines' in paragraph ? paragraph.lines : []
      return (
        <ul className="form-template-preview-lines">
          {lines.map((line, index) => (
            <li key={`${paragraph.id}-line-${index}`}>{line}</li>
          ))}
        </ul>
      )
    }
  }

  if (
    paragraph.kind === 'single_item' &&
    paragraph.variant === 'agreement_explanation_text'
  ) {
    const body = 'body' in paragraph ? String(paragraph.body ?? '').trim() : ''
    if (body) {
      return <div className="form-template-preview-text">{body}</div>
    }
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'short_essay') {
    return <div className="form-template-preview-text form-template-preview-text--muted">-</div>
  }

  return (
    <div className="form-template-preview-placeholder">
      {paragraph.kind}/{paragraph.variant} — runtime preview 확장 예정
    </div>
  )
}
