import type { ApplicationsListQuery } from '@/features/program/general/api/applications-api-client'
import {
  GENERAL_VOLUNTEER_FILTER_ALL,
  type GeneralVolunteerDoc1Filters,
  type GeneralVolunteerDocPassedFilters,
  type GeneralVolunteerInterview2Filters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'

const MANAGER_EVAL_TO_API: Record<string, string> = {
  pass: 'PASS',
  neutral: 'NEUTRAL',
  fail: 'FAIL',
  unreviewed: 'UNREVIEWED',
}

const DOC_STATUS_TO_API: Record<string, string> = {
  pass: 'PASS',
  fail: 'FAIL',
  pending: 'PENDING',
}

const INTERVIEW_ASSIGN_TO_API: Record<string, string> = {
  assigned: 'ASSIGNED',
  waiting: 'WAITING',
  withdrawn: 'WITHDRAWN',
  not_required: 'NOT_REQUIRED',
}

/** 2차 면접 stage — `interviewStatus`와 동시 전송 시 400 */
export const GENERAL_VOLUNTEER_INTERVIEW2_STAGE = 'SECOND_ROUND'

const SECOND_INTERVIEW_STATUS_TO_FINAL_API: Record<string, string> = {
  pass: 'PASS',
  fail: 'FAIL',
  reserve1: 'RESERVE',
  reserve2: 'RESERVE',
  reserve3: 'RESERVE',
  reserve4: 'RESERVE',
}

const EFFECTIVE_SECOND_INTERVIEW_STATUS_TO_API: Record<'waiting' | 'completed', string> = {
  waiting: 'WAITING',
  completed: 'COMPLETED',
}

function pickMapped(value: string, map: Record<string, string>): string | undefined {
  if (value === GENERAL_VOLUNTEER_FILTER_ALL) return undefined
  return map[value]
}

function trimKeyword(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

/** 목록 표시 `YYYY.MM.DD` → `YYYY-MM-DD` */
function interviewDateLabelToIso(label: string): string | undefined {
  const match = label.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined
}

function numericScoreFilter(value: string): number | undefined {
  if (value === GENERAL_VOLUNTEER_FILTER_ALL || value === 'empty') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

type TotalScoreListQuery = Pick<ApplicationsListQuery, 'totalScore' | 'totalScoreUnevaluated'>

/** UI 면접 시간(슬롯 표시 문자열) → 서버 `assignedInterviewTime` LocalTime */
export function assignedInterviewTimeLabelToLocalTimeParam(label: string): string | undefined {
  const trimmed = label.trim()
  if (!trimmed || trimmed === GENERAL_VOLUNTEER_FILTER_ALL) return undefined

  const startPart = trimmed.split('~')[0]?.trim() ?? ''
  const match = startPart.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return undefined

  const hour = match[1].padStart(2, '0')
  const minute = match[2]
  const second = match[3] ?? '00'
  return `${hour}:${minute}:${second}`
}

function resolveInterview2TotalScoreQuery(totalScoreFilter: string): TotalScoreListQuery {
  if (totalScoreFilter === 'empty') {
    return { totalScoreUnevaluated: true }
  }
  const totalScore = numericScoreFilter(totalScoreFilter)
  return totalScore != null ? { totalScore } : {}
}

function buildInterview2SharedListQuery(
  filters: GeneralVolunteerInterview2Filters
): Pick<
  ApplicationsListQuery,
  'keyword' | 'assignedInterviewDate' | 'assignedInterviewTime' | 'totalScore' | 'totalScoreUnevaluated'
> {
  const keyword = trimKeyword(filters.volunteerName)
  const assignedInterviewDate = interviewDateLabelToIso(
    filters.interviewDate !== GENERAL_VOLUNTEER_FILTER_ALL ? filters.interviewDate : ''
  )
  const assignedInterviewTime =
    filters.interviewTime !== GENERAL_VOLUNTEER_FILTER_ALL
      ? assignedInterviewTimeLabelToLocalTimeParam(filters.interviewTime)
      : undefined

  return {
    ...(keyword ? { keyword } : {}),
    ...(assignedInterviewDate ? { assignedInterviewDate } : {}),
    ...(assignedInterviewTime ? { assignedInterviewTime } : {}),
    ...resolveInterview2TotalScoreQuery(filters.totalScore),
  }
}

/** 1차 서류 심사 대상자 필터 → `GET …/volunteer-applications` query */
export function buildGeneralVolunteerDoc1ListQuery(
  filters: GeneralVolunteerDoc1Filters
): ApplicationsListQuery {
  const keyword = trimKeyword(filters.volunteerName)
  const documentStatus =
    filters.documentScreeningStatus !== GENERAL_VOLUNTEER_FILTER_ALL
      ? DOC_STATUS_TO_API[filters.documentScreeningStatus]
      : undefined
  const managerAEvaluation = pickMapped(filters.managerAEvaluation, MANAGER_EVAL_TO_API)
  const managerBEvaluation = pickMapped(filters.managerBEvaluation, MANAGER_EVAL_TO_API)
  const isReparticipation =
    filters.jaVolunteerExperience === 'yes'
      ? true
      : filters.jaVolunteerExperience === 'no'
        ? false
        : undefined

  return {
    ...(keyword ? { keyword } : {}),
    ...(documentStatus ? { documentStatus } : {}),
    ...(managerAEvaluation ? { managerAEvaluation } : {}),
    ...(managerBEvaluation ? { managerBEvaluation } : {}),
    ...(isReparticipation != null ? { isReparticipation } : {}),
  }
}

/** 1차 서류 합격자 필터 → volunteer-applications query */
export function buildGeneralVolunteerDocPassedListQuery(
  filters: GeneralVolunteerDocPassedFilters
): ApplicationsListQuery {
  const keyword = trimKeyword(filters.volunteerName)
  const interviewStatus = pickMapped(filters.interviewAssignmentStatus, INTERVIEW_ASSIGN_TO_API)

  return {
    documentStatus: 'PASS',
    ...(keyword ? { keyword } : {}),
    ...(interviewStatus ? { interviewStatus } : {}),
  }
}

/**
 * 2차 면접 대상자 필터 → volunteer-applications query.
 * `interviewStage`와 `interviewStatus`는 동시에 보내지 않는다.
 */
export function buildGeneralVolunteerInterview2ListQuery(
  filters: GeneralVolunteerInterview2Filters
): ApplicationsListQuery {
  const shared = buildInterview2SharedListQuery(filters)

  if (filters.secondInterviewScreeningStatus === 'withdrawn') {
    return {
      documentStatus: 'PASS',
      interviewStatus: 'WITHDRAWN',
      ...shared,
    }
  }

  const status = filters.secondInterviewScreeningStatus
  const effectiveSecondInterviewStatus =
    status === 'waiting' || status === 'completed'
      ? EFFECTIVE_SECOND_INTERVIEW_STATUS_TO_API[status]
      : undefined
  const finalResultStatus =
    status !== GENERAL_VOLUNTEER_FILTER_ALL &&
    status !== 'waiting' &&
    status !== 'completed'
      ? SECOND_INTERVIEW_STATUS_TO_FINAL_API[status]
      : undefined

  return {
    documentStatus: 'PASS',
    interviewStage: GENERAL_VOLUNTEER_INTERVIEW2_STAGE,
    ...(effectiveSecondInterviewStatus ? { effectiveSecondInterviewStatus } : {}),
    ...(finalResultStatus ? { finalResultStatus } : {}),
    ...shared,
  }
}
