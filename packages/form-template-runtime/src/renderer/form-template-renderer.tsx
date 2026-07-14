import type { ReactNode } from 'react'
import type {
  WritingFormDraft,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import {
  getVisibleParagraphDescription,
  FormParagraphSectionDescription,
} from '../paragraph/form-paragraph-section-description.js'
import { resolveParagraphDescriptionSurface } from '@jakorea/form-schema/surface'
import type { FormTemplateSurface, ParagraphBodyInteractionMode } from '@jakorea/form-schema/surface'
import { ParagraphCard } from '../paragraph/paragraph-card.js'
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

function renderParagraphTitle(paragraph: WritingFormParagraph, index: number): string {
  const numbered = paragraph.participatesInTitleNumbering ? `${index + 1}. ` : ''
  const title = paragraph.paragraphTitle?.trim() || '제목 없음'
  return `${numbered}${title}`
}

function renderParagraphDescription(
  paragraph: WritingFormParagraph,
  surface: FormTemplateSurface
): ReactNode | null {
  const visible = getVisibleParagraphDescription(paragraph.paragraphDescription)
  if (visible == null) return null
  return (
    <FormParagraphSectionDescription surface={resolveParagraphDescriptionSurface(surface)}>
      {visible}
    </FormParagraphSectionDescription>
  )
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
        const title = renderParagraphTitle(paragraph, titleIndex)

        return (
          <ParagraphCard
            key={paragraph.id}
            dataParagraphId={paragraph.id}
            title={
              <h3 className="paragraph-card__static-title">
                {title}
                {paragraph.requiredMark ? (
                  <span className="paragraph-card__required" aria-hidden>
                    {' '}
                    *
                  </span>
                ) : null}
              </h3>
            }
            description={renderParagraphDescription(paragraph, surface)}
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
