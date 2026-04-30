import type { FormEditorKind, FormTitleNumberingStyle, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { FormDocumentPreviewParagraph } from '@/features/template/ui/document-preview/form-document-preview-paragraph'
import './form-document-preview-body.css'

export interface FormDocumentPreviewBodyProps {
  paragraphs: WritingFormParagraph[]
  allParagraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  editorKind: FormEditorKind
  className?: string
  /** 단일 단락이 페이지 최대 높이를 넘을 때 스크롤 허용 */
  overflowParagraphIds?: ReadonlySet<string>
}

export function FormDocumentPreviewBody({
  paragraphs,
  allParagraphs,
  titleNumbering,
  editorKind,
  className,
  overflowParagraphIds,
}: FormDocumentPreviewBodyProps) {
  return (
    <div className={['form-document-preview-body', className].filter(Boolean).join(' ')}>
      {paragraphs.map(p => (
        <FormDocumentPreviewParagraph
          key={p.id}
          paragraph={p}
          allParagraphs={allParagraphs}
          titleNumbering={titleNumbering}
          editorKind={editorKind}
          overflow={overflowParagraphIds?.has(p.id) ?? false}
        />
      ))}
    </div>
  )
}
