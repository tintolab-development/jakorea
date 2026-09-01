import type {
  FormEditorKind,
  FormTitleNumberingStyle,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type {
  FormDocumentPreviewParagraphGapResolver,
  FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'
import { resolveAgreementA4DocumentHiddenParagraphIds } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import { FormDocumentPreviewParagraph } from '@/features/template/ui/document-preview/form-document-preview-paragraph'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { AgreementSheetClosingFooter } from '@/features/template/ui/paragraph/explanation/agreement-sheet-closing-footer'
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
  /** 작성 화면에서 선택한 단락 id — 미리보기 강조·스크롤 */
  focusedParagraphId?: string | null
  /** 동의 양식 하단 귀하·작성완료. 미지정이면 agreement일 때 귀하만 노출 */
  agreementClosingFooter?: {
    onSubmit?: () => void
    submitDisabled?: boolean
    showSubmitButton?: boolean
  }
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
  focusedParagraphId = null,
  agreementClosingFooter,
}: FormDocumentPreviewBodyProps) {
  const useCustomGaps = paragraphGapPx != null
  /** A4: 대리작성 shadow 카드 대신 날짜·서명 플랫 스택 */
  const resolvedParagraphBodyOptions: RenderFormParagraphBodyOptions | undefined =
    renderMode === 'contentOnly' && paragraphBodyOptions != null
      ? {
          ...paragraphBodyOptions,
          agreementAdminProxyConfirm: false,
          hiddenParagraphIds: resolveAgreementA4DocumentHiddenParagraphIds(
            paragraphBodyOptions.hiddenParagraphIds
          ),
        }
      : paragraphBodyOptions
  const hiddenParagraphIds = resolvedParagraphBodyOptions?.hiddenParagraphIds
  const visibleParagraphs =
    hiddenParagraphIds == null
      ? paragraphs
      : paragraphs.filter(paragraph => !hiddenParagraphIds.has(paragraph.id))
  const visibleAllParagraphs =
    hiddenParagraphIds == null
      ? allParagraphs
      : allParagraphs.filter(paragraph => !hiddenParagraphIds.has(paragraph.id))

  const getGapBefore = (paragraph: WritingFormParagraph, index: number) => {
    if (index === 0 || paragraphGapPx == null) return undefined
    if (typeof paragraphGapPx === 'number') return paragraphGapPx
    return paragraphGapPx(paragraph, index, visibleParagraphs.slice(0, index))
  }

  /** A4 페이지 분할 시 귀하는 전체 문서의 마지막 단락이 있는 페이지에만 노출 */
  const lastDocumentParagraphId = visibleAllParagraphs[visibleAllParagraphs.length - 1]?.id
  const isLastDocumentPage =
    lastDocumentParagraphId == null ||
    visibleParagraphs.some(paragraph => paragraph.id === lastDocumentParagraphId)

  const showSubmitButton =
    agreementClosingFooter?.showSubmitButton ?? renderMode !== 'contentOnly'
  const closingFooter =
    editorKind === 'agreement' && isLastDocumentPage ? (
      <AgreementSheetClosingFooter
        onSubmit={agreementClosingFooter?.onSubmit}
        submitDisabled={agreementClosingFooter?.submitDisabled}
        showSubmitButton={showSubmitButton}
        variant={showSubmitButton ? 'sheet' : 'document'}
      />
    ) : null

  return (
    <div
      className={[
        'form-document-preview-body',
        useCustomGaps ? 'form-document-preview-body--custom-gaps' : '',
        paragraphBodyOptions?.documentPreviewClassName,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {visibleParagraphs.map((p, index) => (
        <FormDocumentPreviewParagraph
          key={p.id}
          paragraph={p}
          allParagraphs={visibleAllParagraphs}
          titleNumbering={titleNumbering}
          editorKind={editorKind}
          overflow={overflowParagraphIds?.has(p.id) ?? false}
          paragraphBodyOptions={resolvedParagraphBodyOptions}
          renderMode={renderMode}
          style={useCustomGaps ? { marginTop: getGapBefore(p, index) } : undefined}
          isAuthoringSyncFocused={
            renderMode === 'contentOnly'
              ? false
              : focusedParagraphId != null && focusedParagraphId === p.id
          }
        />
      ))}
      {closingFooter}
    </div>
  )
}
