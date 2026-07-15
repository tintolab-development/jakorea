import type {
  WritingFormDraft,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import {
  getVisibleParagraphDescription,
} from '../paragraph/form-paragraph-section-description.js'
import type { FormTemplateSurface, ParagraphBodyInteractionMode } from '@jakorea/form-schema/surface'
import {
  ParagraphCard,
  paragraphCardStaticHeading,
} from '../paragraph/paragraph-card.js'
import { resolveParagraphTitleRequiredMark } from '../lib/paragraph-required-mark.js'
import { PreviewParagraphBody } from './preview-paragraph-body.js'
import './form-template-renderer.css'

export type FormTemplateRendererProps = {
  draft: WritingFormDraft
  /** @default 'preview' */
  interactionMode?: ParagraphBodyInteractionMode
  surface?: FormTemplateSurface
  /** form-set 라우팅용 — preview renderer 확장 시 사용 */
  rendererKey?: string
  className?: string
}

function buildParagraphEditableHeading(
  paragraph: WritingFormParagraph,
  titleIndex: number,
) {
  const displayTitle = paragraph.paragraphTitle?.trim() || '제목 없음'
  const visibleDescription = getVisibleParagraphDescription(paragraph.paragraphDescription)
  const numberedPrefix = paragraph.participatesInTitleNumbering ? `${titleIndex + 1}. ` : null

  return {
    ...paragraphCardStaticHeading(displayTitle, {
      required: resolveParagraphTitleRequiredMark(paragraph),
    }),
    titleLeading: numberedPrefix ? (
      <span className="paragraph-input__leading">{numberedPrefix}</span>
    ) : undefined,
    descriptionValue: visibleDescription ?? '',
    showDescription: visibleDescription != null,
  }
}

export function FormTemplateRenderer({
  draft,
  interactionMode = 'preview',
  surface = 'cmsAdmin',
  className,
}: FormTemplateRendererProps) {
  const rootClass = ['form-template-renderer', className].filter(Boolean).join(' ')
  let numberedIndex = 0

  return (
    <div className={rootClass}>
      {draft.paragraphs.map(paragraph => {
        const usesNumber = paragraph.participatesInTitleNumbering
        const titleIndex = usesNumber ? numberedIndex++ : numberedIndex

        return (
          <ParagraphCard
            key={paragraph.id}
            dataParagraphId={paragraph.id}
            editableHeading={buildParagraphEditableHeading(paragraph, titleIndex)}
          >
            <PreviewParagraphBody
              paragraph={paragraph}
              interactionMode={interactionMode}
              surface={surface}
            />
          </ParagraphCard>
        )
      })}
    </div>
  )
}
