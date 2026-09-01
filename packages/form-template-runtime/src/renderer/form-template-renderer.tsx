import type { ReactNode } from 'react'
import type {
  FormTitleNumberingStyle,
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
import type { FillParagraphBodyOptions, FormUpdateParagraph } from './fill-paragraph-body.js'
import './form-template-renderer.css'
import './fill-paragraph-body.css'

export type FormTemplateRendererProps = {
  draft: WritingFormDraft
  /** @default 'preview' */
  interactionMode?: ParagraphBodyInteractionMode
  surface?: FormTemplateSurface
  /** form-set 라우팅용 — preview renderer 확장 시 사용 */
  rendererKey?: string
  className?: string
  hiddenParagraphIds?: ReadonlySet<string>
  onUpdateParagraph?: FormUpdateParagraph
  fillOptions?: FillParagraphBodyOptions
  /** 단락 본문 대신 Platform sidecar UI (지급조서 기본정보·전자서명 등) */
  renderParagraphSlot?: (paragraph: WritingFormParagraph) => ReactNode | null | undefined
}

function resolveParagraphDisplayTitle(paragraph: WritingFormParagraph): string {
  if (
    paragraph.kind === 'description' &&
    paragraph.variant === 'survey_title_with_period' &&
    'surveyTitle' in paragraph
  ) {
    const surveyTitle = String(paragraph.surveyTitle ?? '').trim()
    if (surveyTitle) return surveyTitle
  }
  return paragraph.paragraphTitle?.trim() || '제목 없음'
}

function shouldHideParagraph(
  paragraph: WritingFormParagraph,
  hiddenParagraphIds?: ReadonlySet<string>
): boolean {
  if (hiddenParagraphIds?.has(paragraph.id)) return true
  if (paragraph.kind === 'description' && paragraph.variant === 'system') return true
  return false
}

function buildParagraphEditableHeading(
  paragraph: WritingFormParagraph,
  titleIndex: number,
  titleNumbering: FormTitleNumberingStyle,
) {
  const displayTitle = resolveParagraphDisplayTitle(paragraph)
  const visibleDescription = getVisibleParagraphDescription(paragraph.paragraphDescription)
  const numberedPrefix =
    paragraph.participatesInTitleNumbering && titleNumbering !== 'none'
      ? `${titleIndex + 1}. `
      : null

  return {
    ...paragraphCardStaticHeading(displayTitle, {
      required: resolveParagraphTitleRequiredMark(paragraph),
    }),
    titleLeading: numberedPrefix ? (
      <span className="paragraph-input__leading">{numberedPrefix}</span>
    ) : undefined,
    descriptionValue: visibleDescription ?? '',
    /** 비어 있어도 「설명 입력」 placeholder 노출 (CMS 미리보기·스크린샷과 동일) */
    showDescription: Boolean(visibleDescription?.trim()),
  }
}

export function FormTemplateRenderer({
  draft,
  interactionMode = 'preview',
  surface = 'cmsAdmin',
  className,
  hiddenParagraphIds,
  onUpdateParagraph,
  fillOptions,
  renderParagraphSlot,
}: FormTemplateRendererProps) {
  const rootClass = ['form-template-renderer', className].filter(Boolean).join(' ')
  let numberedIndex = 0

  return (
    <div className={rootClass}>
      {draft.paragraphs.map(paragraph => {
        if (shouldHideParagraph(paragraph, hiddenParagraphIds)) {
          return null
        }

        const usesNumber = paragraph.participatesInTitleNumbering
        const titleIndex = usesNumber ? numberedIndex++ : numberedIndex

        if (
          paragraph.kind === 'description' &&
          paragraph.variant === 'survey_title_with_period' &&
          surface === 'platformUser'
        ) {
          return null
        }

        const slot = renderParagraphSlot?.(paragraph)
        const body =
          slot != null ? (
            slot
          ) : (
            <PreviewParagraphBody
              paragraph={paragraph}
              interactionMode={interactionMode}
              surface={surface}
              onUpdateParagraph={onUpdateParagraph}
              fillOptions={fillOptions}
            />
          )

        if (
          paragraph.kind === 'description' &&
          (paragraph.variant === 'closing' || paragraph.variant === 'static_description_lines')
        ) {
          return (
            <div key={paragraph.id} className="form-template-renderer__static-block" data-paragraph-id={paragraph.id}>
              {body}
            </div>
          )
        }

        return (
          <ParagraphCard
            key={paragraph.id}
            dataParagraphId={paragraph.id}
            editableHeading={buildParagraphEditableHeading(
              paragraph,
              titleIndex,
              draft.formSettings.titleNumbering,
            )}
          >
            {body}
          </ParagraphCard>
        )
      })}
    </div>
  )
}
