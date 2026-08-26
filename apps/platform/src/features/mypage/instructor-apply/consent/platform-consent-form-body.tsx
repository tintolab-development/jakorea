import type { PlatformConsentFillOptions } from '@jakorea/form-schema/consent'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import type { ReactNode } from 'react'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFFormSection } from '@/shared/ui'
import {
  PlatformConsentParagraphBody,
  resolvePlatformConsentSectionRequired,
  resolvePlatformConsentSectionTitle,
} from './platform-consent-paragraph-body'
import styles from './consent-form.module.css'

export type PlatformConsentFormBodyProps = {
  draft: WritingFormDraft
  hiddenParagraphIds: ReadonlySet<string>
  onUpdateParagraph: FormUpdateParagraph
  fillOptions?: PlatformConsentFillOptions
  renderParagraphSlot?: (paragraph: WritingFormParagraph) => ReactNode | null | undefined
}

function shouldHideParagraph(
  paragraph: WritingFormParagraph,
  hiddenParagraphIds: ReadonlySet<string>
): boolean {
  if (hiddenParagraphIds.has(paragraph.id)) return true
  if (paragraph.kind === 'description' && paragraph.variant === 'system') return true
  if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
    return true
  }
  return false
}

function isBodyOnlyParagraph(paragraph: WritingFormParagraph): boolean {
  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine) return true
  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm) return true
  if (
    paragraph.kind === 'description' &&
    paragraph.variant === 'system' &&
    paragraph.systemPreset === 'agreement_signature'
  ) {
    return true
  }
  if (
    paragraph.kind === 'single_item' &&
    paragraph.variant === 'agreement_explanation_text' &&
    !paragraph.paragraphTitle?.trim()
  ) {
    return true
  }
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') return true
  return false
}

/** schema draft + Platform `PFFormSection` / `ConsentInfoTable` shell */
export function PlatformConsentFormBody({
  draft,
  hiddenParagraphIds,
  onUpdateParagraph,
  fillOptions,
  renderParagraphSlot,
}: PlatformConsentFormBodyProps) {
  let numberedIndex = 0

  return (
    <>
      {draft.paragraphs.map(paragraph => {
        if (shouldHideParagraph(paragraph, hiddenParagraphIds)) {
          return null
        }

        const usesNumber = paragraph.participatesInTitleNumbering
        const titleIndex = usesNumber ? numberedIndex++ : numberedIndex

        const slot = renderParagraphSlot?.(paragraph)
        if (slot != null) {
          const title = isBodyOnlyParagraph(paragraph)
            ? ''
            : resolvePlatformConsentSectionTitle(paragraph, titleIndex)
          if (title) {
            return (
              <PFFormSection
                key={paragraph.id}
                id={paragraph.id}
                title={title}
                required={resolvePlatformConsentSectionRequired(paragraph)}
              >
                {slot}
              </PFFormSection>
            )
          }
          return (
            <div key={paragraph.id} className={styles.bodyOnlyWrap}>
              {slot}
            </div>
          )
        }

        const title = resolvePlatformConsentSectionTitle(paragraph, titleIndex)
        const body = (
          <PlatformConsentParagraphBody
            paragraph={paragraph}
            onUpdateParagraph={onUpdateParagraph}
            fillOptions={fillOptions}
          />
        )

        if (isBodyOnlyParagraph(paragraph) || !title) {
          return (
            <div key={paragraph.id} className={styles.bodyOnlyWrap}>
              {body}
            </div>
          )
        }

        return (
          <PFFormSection
            key={paragraph.id}
            id={paragraph.id}
            title={title}
            required={resolvePlatformConsentSectionRequired(paragraph)}
          >
            {body}
          </PFFormSection>
        )
      })}
    </>
  )
}
