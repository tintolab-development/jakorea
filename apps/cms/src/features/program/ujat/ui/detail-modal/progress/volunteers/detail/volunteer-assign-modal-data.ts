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

export function formatScheduleShortDateLabel(scheduleLabel: string): string {
  const matched = scheduleLabel.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/)
  if (!matched) return scheduleLabel
  return `${Number(matched[2])}월 ${Number(matched[3])}일`
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

export function resolveVolunteerAssignmentAssignModalMode(
  row: UjatVolunteerAssignmentProgressRow
): UjatVolunteerAssignmentAssignModalMode {
  if (row.assignedInstitution.kind === 'name' && row.classDisplay.kind === 'class') {
    return 'partner'
  }
  return 'education'
}

function getVacantClassOptions(_scheduleRowId: string): UjatVolunteerClassAssignOption[] {
  return []
}

function getPartnerSelectOptions(): Array<{ value: string; label: string }> {
  return []
}

export function getUjatVolunteerAssignmentAssignModalData(
  row: UjatVolunteerAssignmentProgressRow
): UjatVolunteerAssignmentAssignModalData {
  const mode = resolveVolunteerAssignmentAssignModalMode(row)
  const fixedClassLabel =
    row.classDisplay.kind === 'class' ? row.classDisplay.label : null

  return {
    mode,
    scheduleRowId: row.id,
    scheduleDateLabel: formatScheduleShortDateLabel(row.scheduleLabel),
    fixedClassLabel,
    classOptions: mode === 'education' ? getVacantClassOptions(row.id) : [],
    partnerOptions: getPartnerSelectOptions(),
    defaultInstitutionName: DEFAULT_INSTITUTION,
  }
}

export function resolvePartnerNameById(partnerId: string): string {
  return partnerId
}

export type UjatVolunteerAssignmentAssignConfirmPayload = {
  scheduleRowId: string
  mode: UjatVolunteerAssignmentAssignModalMode
  classValue: string
  partnerId: string
}

export function applyVolunteerAssignmentConfirm(
  rows: UjatVolunteerAssignmentProgressRow[],
  payload: UjatVolunteerAssignmentAssignConfirmPayload
): UjatVolunteerAssignmentProgressRow[] {
  const partnerName = resolvePartnerNameById(payload.partnerId)

  return rows.map(row => {
    if (row.id !== payload.scheduleRowId) return row

    if (payload.mode === 'education') {
      return {
        ...row,
        assignedInstitution: { kind: 'name', value: DEFAULT_INSTITUTION },
        classDisplay: { kind: 'class', label: payload.classValue },
        partner:
          partnerName.length > 0
            ? { kind: 'name', value: partnerName }
            : { kind: 'undecided' },
      }
    }

    return {
      ...row,
      partner: { kind: 'name', value: partnerName },
    }
  })
}
