import dayjs from 'dayjs'
import './survey-period-readonly.css'

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatSurveyPeriodDate(isoDate: string | null | undefined): string {
  if (isoDate == null || isoDate === '') return '—'
  const parsed = dayjs(isoDate)
  if (!parsed.isValid()) return '—'
  const weekday = WEEKDAYS_KO[parsed.day()] ?? '—'
  return `${parsed.year()}년 ${parsed.month() + 1}월 ${parsed.date()}일(${weekday})`
}

export function formatSurveyPeriodRangeText(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  periodLabel = '설문 기간'
): string {
  return `${periodLabel} : ${formatSurveyPeriodDate(startAt)} ~ ${formatSurveyPeriodDate(endAt)}`
}

export function ExplanationSurveyPeriodReadonly({
  startAt,
  endAt,
  periodLabel = '설문 기간',
  className,
}: {
  startAt: string | null | undefined
  endAt: string | null | undefined
  periodLabel?: string
  className?: string
}) {
  return (
    <p
      className={['explanation-survey-period-readonly', className].filter(Boolean).join(' ')}
    >
      {formatSurveyPeriodRangeText(startAt, endAt, periodLabel)}
    </p>
  )
}
