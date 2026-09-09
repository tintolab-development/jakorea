import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFFormSection, PFText } from '@/shared/ui'
import {
  resolveEducationSurveySectionRequired,
  resolveEducationSurveySectionTitle,
} from '../lib/survey-section-title'
import type { SurveySidecarState } from '../lib/survey-sidecar'
import { PlatformSurveyParagraphBody } from './platform-survey-paragraph-body'
import styles from './survey-form-body.module.css'

export type EducationSurveyFormBodyProps = {
  draft: WritingFormDraft
  programTitle: string
  onUpdateParagraph: FormUpdateParagraph
  sidecar: SurveySidecarState
  onSidecarChange: (next: SurveySidecarState) => void
}

function isBodyOnlyParagraph(paragraph: WritingFormParagraph): boolean {
  return paragraph.kind === 'description' && paragraph.variant === 'closing'
}

function shouldSkipParagraph(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
    return true
  }
  return false
}

export function EducationSurveyFormBody({
  draft,
  programTitle,
  onUpdateParagraph,
  sidecar,
  onSidecarChange,
}: EducationSurveyFormBodyProps) {
  return (
    <div className={styles.form}>
      {draft.paragraphs.flatMap(paragraph => {
        if (shouldSkipParagraph(paragraph)) {
          return []
        }

        if (isUserInfoParagraph(paragraph)) {
          const entries = getUserInfoSelectedEntries(paragraph)
          return entries.map(entry => {
            const title = resolveEducationSurveySectionTitle(draft, paragraph, entry)
            return (
              <PFFormSection
                key={`${paragraph.id}::${entry.key}`}
                id={`${paragraph.id}::${entry.key}`}
                title={title}
                required={resolveEducationSurveySectionRequired(paragraph)}
              >
                <PlatformSurveyParagraphBody
                  paragraph={paragraph}
                  programTitle={programTitle}
                  onUpdateParagraph={onUpdateParagraph}
                  sidecar={sidecar}
                  onSidecarChange={onSidecarChange}
                  userInfoWriteField={entry}
                />
              </PFFormSection>
            )
          })
        }

        if (isBodyOnlyParagraph(paragraph)) {
          const body = 'body' in paragraph ? String(paragraph.body ?? '').trim() : ''
          if (!body) return []
          return [
            <PFText
              key={paragraph.id}
              as="p"
              typo="bd-md-md"
              color="neutral-cool-600"
              className={styles.closing}
            >
              {body}
            </PFText>,
          ]
        }

        const title = resolveEducationSurveySectionTitle(draft, paragraph)
        if (!title) return []

        return [
          <PFFormSection
            key={paragraph.id}
            id={paragraph.id}
            title={title}
            description={paragraph.paragraphDescription?.trim() || undefined}
            required={resolveEducationSurveySectionRequired(paragraph)}
          >
            <PlatformSurveyParagraphBody
              paragraph={paragraph}
              programTitle={programTitle}
              onUpdateParagraph={onUpdateParagraph}
              sidecar={sidecar}
              onSidecarChange={onSidecarChange}
            />
          </PFFormSection>,
        ]
      })}
    </div>
  )
}
