import type { WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { PFText } from '@/shared/ui'
import styles from './survey-header.module.css'

type EducationSurveyHeaderProps = {
  paragraph: Extract<
    WritingFormParagraph,
    { kind: 'description'; variant: 'survey_title_with_period' }
  >
}

function formatPeriodLabel(startAt: string | null | undefined, endAt: string | null | undefined): string | null {
  const format = (raw: string) => {
    const [year, month, day] = raw.split('-')
    if (!year || !month || !day) return raw
    return `${year}년 ${month}월 ${day}일`
  }

  if (startAt && endAt) {
    return `${format(startAt)} ~ ${format(endAt)}`
  }
  if (startAt) return format(startAt)
  if (endAt) return format(endAt)
  return null
}

export function EducationSurveyHeader({ paragraph }: EducationSurveyHeaderProps) {
  const title = paragraph.surveyTitle?.trim() || ''
  const description = paragraph.surveyDescription?.trim() || ''
  const periodLabel = formatPeriodLabel(paragraph.startAt, paragraph.endAt)

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        {title ? (
          <PFText as="h2" typo="hd-lg" color="black" className={styles.title}>
            {title}
          </PFText>
        ) : null}
        {periodLabel ? (
          <PFText as="p" typo="bd-sm-md" color="primary-500" className={styles.period}>
            {periodLabel}
          </PFText>
        ) : null}
      </div>
      {description ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
          {description}
        </PFText>
      ) : null}
    </header>
  )
}
