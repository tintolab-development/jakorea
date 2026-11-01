import { getApplicationApiErrorCode } from '../../../../program/lib/application-api-error.ts'
import { toSeoulDateOnly } from '../../../../../shared/lib/format-display-date.ts'
import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import {
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
} from '@jakorea/form-schema/writing-form'
import type { EducationSurveyListEntry, EducationSurveyListStatus } from './survey-list-types.ts'

function startOfLocalDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(part => Number(part))
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function endOfLocalDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(part => Number(part))
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

function parseInstant(iso: string | null | undefined): Date | null {
  const trimmed = iso?.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

type PeriodFields = Pick<
  EducationSurveyListEntry,
  'startAt' | 'endAt' | 'submissionStartAt' | 'submissionEndAt' | 'canSubmit'
>

export type PortalFormSubmissionPeriodBlockReason = 'not_started' | 'closed'

/**
 * BE가 반환한 submissionStartAt/EndAt(목록의 startAt/endAt) 및 canSubmit 기준 작성 가능 여부.
 * FE는 목록에서 항목을 제거하지 않고, 기간 밖이면 안내 문구 또는 read-only로 처리한다.
 */
export function isPortalFormSubmissionPeriodOpen(
  entry: PeriodFields,
  at: Date = new Date(),
): boolean {
  return resolvePortalFormSubmissionPeriodBlockReason(entry, at) == null
}

/** 미제출 목록 배지. 작성 시작 시각 이전이면 진행중이 아니다. */
export function resolveEducationSurveyListStatus(
  submitted: boolean,
  entry: PeriodFields,
  at: Date = new Date(),
): EducationSurveyListStatus {
  if (submitted) return 'submitted'
  if (resolvePortalFormSubmissionPeriodBlockReason(entry, at) === 'not_started') {
    return 'before_start'
  }
  return 'in_progress'
}

/** 미제출 설문·만족도 — 작성 기간 밖일 때 안내 문구 분기 */
/** 목록 API 기간 필드가 비었을 때 양식 제목 단락의 기간을 보조 SSOT로 병합한다. */
export function mergePortalFormSubmissionPeriodFields(
  entry: PeriodFields,
  titleParagraph?: TitleWithPeriodParagraph | null,
): PeriodFields {
  if (!titleParagraph) return entry

  const startMode = resolveTitleStartPeriodMode(titleParagraph)
  const endMode = resolveTitleEndPeriodMode(titleParagraph)
  const titleStart =
    startMode === 'custom' && titleParagraph.startAt?.trim() ? titleParagraph.startAt.trim() : null
  const titleEnd =
    endMode === 'custom' && titleParagraph.endAt?.trim() ? titleParagraph.endAt.trim() : null

  const submissionStartAt = entry.submissionStartAt?.trim() ? entry.submissionStartAt : titleStart
  const submissionEndAt = entry.submissionEndAt?.trim() ? entry.submissionEndAt : titleEnd

  return {
    ...entry,
    submissionStartAt,
    submissionEndAt,
    startAt: entry.startAt?.trim() ? entry.startAt : toSeoulDateOnly(titleStart),
    endAt: entry.endAt?.trim() ? entry.endAt : toSeoulDateOnly(titleEnd),
  }
}

export function resolvePortalFormSubmissionPeriodBlockForEntry(
  entry: EducationSurveyListEntry | undefined,
  titleParagraph?: TitleWithPeriodParagraph | null,
  at: Date = new Date(),
): PortalFormSubmissionPeriodBlockReason | null {
  if (!entry || entry.status === 'submitted') return null
  return resolvePortalFormSubmissionPeriodBlockReason(
    mergePortalFormSubmissionPeriodFields(entry, titleParagraph),
    at,
  )
}

export function resolvePortalFormSubmissionPeriodBlockReason(
  entry: PeriodFields,
  at: Date = new Date(),
): PortalFormSubmissionPeriodBlockReason | null {
  const startInstant = parseInstant(entry.submissionStartAt)
  if (startInstant != null && at < startInstant) return 'not_started'

  const startAt = entry.startAt?.trim()
  if (startAt) {
    const start = startOfLocalDay(startAt)
    if (!Number.isNaN(start.getTime()) && at < start) return 'not_started'
  }

  const endInstant = parseInstant(entry.submissionEndAt)
  if (endInstant != null && at > endInstant) return 'closed'

  const endAt = entry.endAt?.trim()
  if (endAt) {
    const end = endOfLocalDay(endAt)
    if (!Number.isNaN(end.getTime()) && at > end) return 'closed'
  }

  return null
}

export function resolvePortalFormSubmissionPeriodBlockFromApiError(
  error: unknown,
): PortalFormSubmissionPeriodBlockReason | null {
  const code = getApplicationApiErrorCode(error)
  if (code === 'FORM_SUBMISSION_NOT_STARTED') return 'not_started'
  if (code === 'FORM_SUBMISSION_CLOSED') return 'closed'
  return null
}

export type EducationSurveyPeriodNoticeKind = 'survey' | 'satisfaction'

export function portalFormSubmissionPeriodBlockMessage(
  reason: PortalFormSubmissionPeriodBlockReason,
  kind: EducationSurveyPeriodNoticeKind = 'survey',
): string {
  switch (reason) {
    case 'not_started':
      return kind === 'satisfaction'
        ? '아직 만족도조사 작성 기간이 시작되지 않았습니다.'
        : '아직 설문 작성 기간이 시작되지 않았습니다.'
    case 'closed':
      return kind === 'satisfaction'
        ? '만족도조사 작성 기간이 종료되었습니다.'
        : '설문 작성 기간이 종료되었습니다.'
  }
}
