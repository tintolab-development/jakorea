import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFFormSection, PFText } from '@/shared/ui'
import {
  resolveEducationSurveySectionDescription,
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
  onFileAdd?: (paragraphId: string, files: File[], questionKey: string) => void
  onFileRemove?: (paragraphId: string, index: number, questionKey: string) => void
  uploadingFile?: boolean
  /** 설문자 정보 fieldKey → 표시값 */
  userInfoValues?: Record<string, string>
  userInfoEditable?: boolean
  userInfoRequiredFieldKeys?: readonly string[]
  readOnly?: boolean
}

/** 공개(외부) 만족도·설문 공유 — 설문자 정보 중 이름만 필수 */
export const PUBLIC_SURVEY_REQUIRED_USER_INFO_FIELD_KEYS = ['name'] as const

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
  onFileAdd,
  onFileRemove,
  uploadingFile,
  userInfoValues,
  userInfoEditable = false,
  userInfoRequiredFieldKeys,
  readOnly = false,
}: EducationSurveyFormBodyProps) {
  return (
    <div className={styles.form}>
      {draft.paragraphs.flatMap(paragraph => {
        if (shouldSkipParagraph(paragraph)) {
          return []
        }

        if (isUserInfoParagraph(paragraph) && getUserInfoSelectedEntries(paragraph).length === 0) {
          return []
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
        if (!title && paragraph.kind === 'description') return []

        return [
          <PFFormSection
            key={paragraph.id}
            id={paragraph.id}
            title={title || '문항'}
            description={
              isUserInfoParagraph(paragraph)
                ? undefined
                : resolveEducationSurveySectionDescription(paragraph.paragraphDescription)
            }
            required={resolveEducationSurveySectionRequired(paragraph)}
          >
            <PlatformSurveyParagraphBody
              paragraph={paragraph}
              programTitle={programTitle}
              onUpdateParagraph={onUpdateParagraph}
              sidecar={sidecar}
              onSidecarChange={onSidecarChange}
              onFileAdd={onFileAdd}
              onFileRemove={onFileRemove}
              uploadingFile={uploadingFile}
              userInfoValues={userInfoValues}
              userInfoEditable={userInfoEditable}
              userInfoRequiredFieldKeys={userInfoRequiredFieldKeys}
              readOnly={readOnly}
            />
          </PFFormSection>,
        ]
      })}
    </div>
  )
}
