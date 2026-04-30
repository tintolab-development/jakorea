import type {
  FormEditorKind,
  FormTitleNumberingStyle,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type {
  FormDocumentPreviewParagraphGapResolver,
  FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'
import { FormDocumentPreviewParagraph } from '@/features/template/ui/document-preview/form-document-preview-paragraph'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import './form-document-preview-body.css'

export interface FormDocumentPreviewBodyProps {
  paragraphs: WritingFormParagraph[]
  allParagraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  editorKind: FormEditorKind
  className?: string
  /** 단일 단락이 페이지 최대 높이를 넘을 때 스크롤 허용 */
  overflowParagraphIds?: ReadonlySet<string>
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  renderMode?: FormDocumentPreviewRenderMode
  paragraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
}

export function FormDocumentPreviewBody({
  paragraphs,
  allParagraphs,
  titleNumbering,
  editorKind,
  className,
  overflowParagraphIds,
  paragraphBodyOptions,
  renderMode = 'card',
  paragraphGapPx,
}: FormDocumentPreviewBodyProps) {
  const useCustomGaps = paragraphGapPx != null

  const getGapBefore = (paragraph: WritingFormParagraph, index: number) => {
    if (index === 0 || paragraphGapPx == null) return undefined
    if (typeof paragraphGapPx === 'number') return paragraphGapPx
    return paragraphGapPx(paragraph, index, paragraphs)
  }

  return (
    <div
      className={[
        'form-document-preview-body',
        useCustomGaps ? 'form-document-preview-body--custom-gaps' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {paragraphs.map((p, index) => (
        <FormDocumentPreviewParagraph
          key={p.id}
          paragraph={p}
          allParagraphs={allParagraphs}
          titleNumbering={titleNumbering}
          editorKind={editorKind}
          overflow={overflowParagraphIds?.has(p.id) ?? false}
          paragraphBodyOptions={paragraphBodyOptions}
          renderMode={renderMode}
          style={useCustomGaps ? { marginTop: getGapBefore(p, index) } : undefined}
        />
      ))}
    </div>
  )
}
