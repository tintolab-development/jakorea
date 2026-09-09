import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import {
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
  titlePeriodEndDisplayText,
} from '@jakorea/form-schema/writing-form'
import { PFText } from '@/shared/ui'
import styles from './survey-header.module.css'

type EducationSurveyHeaderProps = {
  paragraph: TitleWithPeriodParagraph
  /** 바로 시작(`immediate`)일 때 노출 시작일 — 설문 생성일(ISO) */
  surveyCreatedAt?: string | null
}

function formatKoreanDatePart(raw: string): string | null {
  const [year, month, day] = raw.slice(0, 10).split('-')
  if (!year || !month || !day) return null
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}

function resolveSurveyStartLabel(
  paragraph: TitleWithPeriodParagraph,
  surveyCreatedAt?: string | null
): string {
  const startMode = resolveTitleStartPeriodMode(paragraph)
  if (startMode === 'custom' && paragraph.startAt) {
    return formatKoreanDatePart(paragraph.startAt) ?? paragraph.startAt
  }

  const createdRaw = surveyCreatedAt ?? new Date().toISOString()
  return formatKoreanDatePart(createdRaw) ?? createdRaw.slice(0, 10)
}

/** 설문 제목형 — 기간 항상 노출. 마감 없음은 종료일 생략(`YYYY년 M월 D일 ~`) */
function resolveEducationSurveyPeriodLabel(
  paragraph: TitleWithPeriodParagraph,
  surveyCreatedAt?: string | null
): string {
  const start = resolveSurveyStartLabel(paragraph, surveyCreatedAt)
  const endMode = resolveTitleEndPeriodMode(paragraph)

  if (endMode === 'immediate') {
    return `${start} ~`
  }

  const endDisplay = titlePeriodEndDisplayText(paragraph)

  if (paragraph.endPeriodPresetLabel?.trim()) {
    return `${start} ~ ${paragraph.endPeriodPresetLabel.trim()}`
  }

  if (paragraph.endAt && formatKoreanDatePart(paragraph.endAt)) {
    const koreanEnd = formatKoreanDatePart(paragraph.endAt)!
    const timeMatch = endDisplay.match(/\((\d{2}:\d{2})\)/)
    const end = timeMatch ? `${koreanEnd} (${timeMatch[1]})` : koreanEnd
    return `${start} ~ ${end}`
  }

  return `${start} ~ ${endDisplay}`
}

export function EducationSurveyHeader({ paragraph, surveyCreatedAt }: EducationSurveyHeaderProps) {
  const title = paragraph.surveyTitle?.trim() || ''
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
