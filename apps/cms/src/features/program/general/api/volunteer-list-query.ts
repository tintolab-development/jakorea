import type { ApplicationsListQuery } from '@/features/program/general/api/applications-api-client'
import {
  GENERAL_VOLUNTEER_FILTER_ALL,
  type GeneralVolunteerDoc1Filters,
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

function pickMapped(value: string, map: Record<string, string>): string | undefined {
  if (value === GENERAL_VOLUNTEER_FILTER_ALL) return undefined
  return map[value]
}

/** 1차 서류 심사 대상자 필터 → `GET …/volunteer-applications` query */
export function buildGeneralVolunteerDoc1ListQuery(
  filters: GeneralVolunteerDoc1Filters
): ApplicationsListQuery {
  const keyword = filters.volunteerName.trim()
  const documentStatus = pickMapped(filters.documentScreeningStatus, DOC_STATUS_TO_API)
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
