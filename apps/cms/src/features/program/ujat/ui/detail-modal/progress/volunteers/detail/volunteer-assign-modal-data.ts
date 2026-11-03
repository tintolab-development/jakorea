import dayjs from 'dayjs'
import { CMS_WEEKDAY_KO } from '@/shared/utils/date'
import type { UjatPartnerRecommendationCandidate } from '@/features/program/ujat/api/education-execution-api'
import type { UjatVolunteerAssignmentProgressRow } from './assignment-types'

export type UjatVolunteerAssignmentAssignModalMode = 'education' | 'partner'

export type UjatVolunteerPartnerCandidate = {
  id: string
  name: string
  assignmentDayCount: number
  hasPartnerHistoryWithVolunteer: boolean
}

export type UjatVolunteerClassAssignOption = {
  value: string
  label: string
}

export type UjatVolunteerAssignmentAssignModalData = {
  mode: UjatVolunteerAssignmentAssignModalMode
  scheduleRowId: string
  scheduleDateLabel: string
  fixedClassLabel: string | null
  classOptions: UjatVolunteerClassAssignOption[]
  partnerOptions: Array<{ value: string; label: string }>
  defaultInstitutionName: string
}

const DEFAULT_INSTITUTION = ''

/** 모달 본문용 — 예: 5월 8일(금) */
export function formatScheduleShortDateLabel(scheduleLabel: string): string {
  const matched = scheduleLabel.match(
    /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})(?:\s*\(([^)]+)\))?/
  )
  if (!matched) return scheduleLabel
  const year = matched[1]
  const month = Number(matched[2])
  const day = Number(matched[3])
  const base = `${month}월 ${day}일`
  const weekdayFromLabel = matched[4]?.trim()
  if (weekdayFromLabel) return `${base}(${weekdayFromLabel})`
  const parsed = dayjs(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  )
  if (!parsed.isValid()) return base
  const weekday = CMS_WEEKDAY_KO[parsed.day()]
  return weekday ? `${base}(${weekday})` : base
}

export function sortPartnerCandidates(
  candidates: readonly UjatVolunteerPartnerCandidate[]
): UjatVolunteerPartnerCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.assignmentDayCount !== b.assignmentDayCount) {
      return a.assignmentDayCount - b.assignmentDayCount
    }
    if (a.hasPartnerHistoryWithVolunteer !== b.hasPartnerHistoryWithVolunteer) {
      return a.hasPartnerHistoryWithVolunteer ? 1 : -1
    }
    return a.name.localeCompare(b.name, 'ko')
  })
}

export function formatPartnerOptionLabel(candidate: UjatVolunteerPartnerCandidate): string {
  return `${candidate.name} (배정일 : ${candidate.assignmentDayCount}일)`
}

export function partnerOptionsFromRecommendation(
  candidates: readonly UjatPartnerRecommendationCandidate[] | null | undefined
): Array<{ value: string; label: string }> {
  const mapped: UjatVolunteerPartnerCandidate[] = []
  for (const candidate of candidates ?? []) {
    if (candidate.participantId == null) continue
    const name = candidate.volunteerName?.trim() || candidate.memberName?.trim()
    if (!name) continue
    mapped.push({
      id: String(candidate.participantId),
      name,
      assignmentDayCount:
        candidate.assignmentDayCount ??
        candidate.assignedScheduleCount ??
        candidate.totalAssignedDays ??
        0,
      hasPartnerHistoryWithVolunteer: candidate.hasPartnerHistoryWithVolunteer === true,
    })
  }
  return sortPartnerCandidates(mapped).map(candidate => ({
    value: candidate.id,
    label: formatPartnerOptionLabel(candidate),
  }))
}

/**
 * 학급이 이미 있고 파트너만 미정이면 파트너 배정.
 * 학급·파트너가 모두 확정된 행은 게이트에서 차단한 뒤 모달을 열지 않는다.
 */
export function resolveVolunteerAssignmentAssignModalMode(
  row: UjatVolunteerAssignmentProgressRow
): UjatVolunteerAssignmentAssignModalMode {
  if (row.classDisplay.kind === 'class' && row.partner.kind !== 'name') {
    return 'partner'
  }
  return 'education'
}

function getPartnerSelectOptions(
  candidates?: readonly UjatPartnerRecommendationCandidate[]
): Array<{ value: string; label: string }> {
  return partnerOptionsFromRecommendation(candidates)
}

export function getUjatVolunteerAssignmentAssignModalData(
  row: UjatVolunteerAssignmentProgressRow,
  options?: {
    classOptions?: UjatVolunteerClassAssignOption[]
    partnerOptions?: Array<{ value: string; label: string }>
    partnerCandidates?: readonly UjatPartnerRecommendationCandidate[]
  }
): UjatVolunteerAssignmentAssignModalData {
  const mode = resolveVolunteerAssignmentAssignModalMode(row)
  const fixedClassLabel =
    row.classDisplay.kind === 'class' ? row.classDisplay.label : null

  return {
    mode,
    scheduleRowId: row.id,
    scheduleDateLabel: formatScheduleShortDateLabel(row.scheduleLabel),
    fixedClassLabel,
    // 미배정 학급은 remote load의 assignOptions만. 로컬 invent 금지.
    classOptions: mode === 'education' ? (options?.classOptions ?? []) : [],
    partnerOptions:
      options?.partnerOptions ?? getPartnerSelectOptions(options?.partnerCandidates),
    defaultInstitutionName: DEFAULT_INSTITUTION,
  }
}
