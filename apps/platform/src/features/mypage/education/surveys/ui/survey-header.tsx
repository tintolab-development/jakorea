import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import { resolveEducationSurveyPeriodLabel } from '@/features/mypage/education/surveys/lib/survey-period-label'
import { PFText } from '@/shared/ui'
import styles from './survey-header.module.css'

export { resolveEducationSurveyPeriodLabel }

type EducationSurveyHeaderProps = {
  paragraph: TitleWithPeriodParagraph
  /** 바로 시작(`immediate`)일 때 노출 시작일 — 설문 생성일(ISO) */
  surveyCreatedAt?: string | null
  /** 양식 `surveyTitle`이 비어 있을 때 사용할 설문명·만족도조사명 */
  fallbackTitle?: string
}

export function EducationSurveyHeader({
  paragraph,
  surveyCreatedAt,
  fallbackTitle,
}: EducationSurveyHeaderProps) {
  const title = paragraph.surveyTitle?.trim() || fallbackTitle?.trim() || ''
  const description = paragraph.surveyDescription?.trim() || ''
  const periodLabel = resolveEducationSurveyPeriodLabel(paragraph, surveyCreatedAt)

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <div className={styles.titleDescriptionContainer}>
          {title ? (
            <PFText as="h2" typo="hd-sm" color="black">
              {title}
            </PFText>
          ) : null}
          {description ? (
            <PFText as="p" typo="bd-lg-rg" color="neutral-cool-500">
              {description}
            </PFText>
          ) : null}
        </div>
        <div className={styles.periodContainer}>
          <PFText as="p" typo="hl-lg" color="primary-700" className={styles.period}>
            {periodLabel}
          </PFText>
        </div>
      </div>
    </header>
  )
}
