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
  periodLabel = '설문 기간',
  startFallback?: string,
  endFallback?: string
): string {
  const start = formatSurveyPeriodDate(startAt)
  const end = formatSurveyPeriodDate(endAt)
  const startText = start === '—' && startFallback?.trim() ? startFallback.trim() : start
  const endText = end === '—' && endFallback?.trim() ? endFallback.trim() : end
  return `${periodLabel} : ${startText} ~ ${endText}`
}

export function ExplanationSurveyPeriodReadonly({
  startAt,
  endAt,
  periodLabel = '설문 기간',
  startFallback,
  endFallback,
  className,
}: {
  startAt: string | null | undefined
  endAt: string | null | undefined
  periodLabel?: string
  /** 날짜가 없을 때 템플릿 기간 모드 문구 (바로 시작, 마감 없음 등) */
  startFallback?: string
  endFallback?: string
  className?: string
}) {
  return (
    <p
      className={['explanation-survey-period-readonly', className].filter(Boolean).join(' ')}
    >
      {formatSurveyPeriodRangeText(startAt, endAt, periodLabel, startFallback, endFallback)}
    </p>
  )
}
