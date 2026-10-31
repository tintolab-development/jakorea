import dayjs from 'dayjs'
import { formatArrivalTimeForDisplay } from '@/shared/lib/attendance-arrival-time'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import type { ProgramAbsenceReasonItem } from '@/features/program/general/api/absence-reasons'
import { mapApiAttendanceStatusToUjatUi } from '@/features/program/ujat/api/allocation-matrix-adapters'
import type {
  UjatAllocationColumnDto,
  UjatAllocationMatrixResponse,
  UjatAllocationVolunteerRowDto,
  UjatAssignmentSubmissionsResponse,
  UjatAssignmentVolunteerDto,
  UjatAttendanceItemDto,
  UjatPartnerAssignmentResponse,
} from '@/features/program/ujat/api/education-execution-api'
import type {
  UjatVolunteerAssignmentAbsenceReason,
  UjatVolunteerAssignmentAttendanceSummary,
  UjatVolunteerAssignmentProgressBundle,
  UjatVolunteerAssignmentProgressRow,
  UjatVolunteerAttendanceDisplay,
} from './assignment-types'
import type { UjatVolunteerClassAssignOption } from './volunteer-assign-modal-data'
import {
  formatPartnerOptionLabel,
  formatScheduleShortDateLabel,
  sortPartnerCandidates,
  type UjatVolunteerPartnerCandidate,
} from './volunteer-assign-modal-data'

export type VolunteerAssignmentAssignOptions = {
  classOptions: UjatVolunteerClassAssignOption[]
  partnerOptions: Array<{ value: string; label: string }>
}

export type VolunteerAssignmentProgressSources = {
  participantId: number
  memberId?: string
  matrix: UjatAllocationMatrixResponse
  submissions: UjatAssignmentSubmissionsResponse
  partnerAssignmentsByScheduleId: Record<string, UjatPartnerAssignmentResponse[]>
  attendancesByScheduleId: Record<string, UjatAttendanceItemDto[]>
  absenceReasons: ProgramAbsenceReasonItem[]
}

export type VolunteerAssignmentProgressView = {
  bundle: UjatVolunteerAssignmentProgressBundle
  assignOptionsByRowId: Record<string, VolunteerAssignmentAssignOptions>
}

/** participantId를 해석하지 못했을 때. 수료·지각을 꾸며 넣지 않는다. */
export const UNRESOLVED_VOLUNTEER_ASSIGNMENT_BUNDLE: UjatVolunteerAssignmentProgressBundle = {
  rows: [],
  attendanceSummary: {
    completionStatus: '-',
    lateCountLabel: '-',
  },
  absenceReasons: [],
}

type SubmissionHit = {
  educationDate?: string | null
  volunteer: UjatAssignmentVolunteerDto
}

function isDocumentSubmitted(status: string | null | undefined): boolean {
  const normalized = status?.trim().toUpperCase()
  return normalized === 'SUBMITTED' || normalized === 'REVISED'
}

function isCancelledAssignment(status: string | null | undefined): boolean {
  const normalized = status?.trim().toUpperCase()
  return normalized === 'CANCELLED' || normalized === 'CANCELED'
}

function formResponseId(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function volunteerDisplayName(volunteer: UjatAllocationVolunteerRowDto): string {
  return volunteer.volunteerName?.trim() || `봉사자 ${volunteer.participantId ?? ''}`
}

function scheduleLabelFrom(iso: string | null | undefined): string {
  if (!iso?.trim()) return '-'
  const label = formatDateDotWithWeekday(iso)
  return label === '-' ? '-' : label
}

function absenceDateLabel(item: ProgramAbsenceReasonItem, scheduleLabel: string | undefined): string {
  if (scheduleLabel && scheduleLabel !== '-') {
    const short = formatScheduleShortDateLabel(scheduleLabel)
    if (short !== scheduleLabel) return short
  }
  if (item.scheduleStartAt) {
    const parsed = dayjs(item.scheduleStartAt)
    if (parsed.isValid()) return `${parsed.month() + 1}월 ${parsed.date()}일`
  }
  return '-'
}

function mapAttendance(item: UjatAttendanceItemDto | undefined): UjatVolunteerAttendanceDisplay {
  if (!item?.status?.trim()) return { kind: 'dash' }
  const ui = mapApiAttendanceStatusToUjatUi(item.status)
  if (ui === 'late') {
    return { kind: 'late', time: formatArrivalTimeForDisplay(item.arrivalTime) || '-' }
  }
  if (ui === 'absent') return { kind: 'absence' }
  if (ui === 'excused_absence') return { kind: 'excused_absence' }
  if (ui === 'present') return { kind: 'present' }
  return { kind: 'dash' }
}

function findActivePartnerAssignment(
  assignments: readonly UjatPartnerAssignmentResponse[] | undefined,
  participantId: number
): UjatPartnerAssignmentResponse | undefined {
  const matches = (assignments ?? []).filter(item => {
    if (isCancelledAssignment(item.status) || item.cancelledAt) return false
    return (
      item.primaryParticipantId === participantId || item.secondaryParticipantId === participantId
    )
  })
  if (matches.length === 0) return undefined
  return [...matches].sort((a, b) => (b.assignedAt ?? '').localeCompare(a.assignedAt ?? ''))[0]
}

function findSubmission(
  submissions: UjatAssignmentSubmissionsResponse,
  scheduleId: number,
  participantId: number
): SubmissionHit | undefined {
  for (const session of submissions.sessions ?? []) {
    if (session.scheduleId !== scheduleId) continue
    const volunteer = (session.volunteers ?? []).find(item => item.participantId === participantId)
    if (!volunteer) continue
    return { educationDate: session.educationDate, volunteer }
  }
  return undefined
}

function cellForColumn(
  volunteer: UjatAllocationVolunteerRowDto,
  column: UjatAllocationColumnDto
) {
  const columnKey = column.columnKey?.trim()
  return (volunteer.cells ?? []).find(cell => {
    if (columnKey && cell.columnKey === columnKey) return true
    if (cell.scheduleId == null || cell.scheduleId !== column.scheduleId) return false
    if (
      column.organizationApplicationId != null &&
      cell.organizationApplicationId != null &&
      cell.organizationApplicationId !== column.organizationApplicationId
    ) {
      return false
    }
    return true
  })
}

function numericSlotId(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function classOptionsForSchedule(
  matrix: UjatAllocationMatrixResponse,
  scheduleId: number,
  partnerAssignments: readonly UjatPartnerAssignmentResponse[]
): UjatVolunteerClassAssignOption[] {
  const seen = new Map<string, UjatVolunteerClassAssignOption>()
  const add = (slotId: number | null | undefined, label: string | null | undefined) => {
    const id = numericSlotId(slotId)
    const text = label?.trim()
    if (id == null || !text) return
    const value = String(id)
    if (!seen.has(value)) seen.set(value, { value, label: text })
  }

  for (const column of matrix.columns ?? []) {
    if (column.scheduleId !== scheduleId) continue
    for (const volunteer of matrix.volunteers ?? []) {
      const cell = cellForColumn(volunteer, column)
      add(cell?.educationSlotId, cell?.classLabel)
    }
  }
  for (const assignment of partnerAssignments) {
    if (isCancelledAssignment(assignment.status) || assignment.cancelledAt) continue
    if (assignment.scheduleId != null && assignment.scheduleId !== scheduleId) continue
    add(assignment.educationSlotId, assignment.classLabel)
  }
  return [...seen.values()]
}

function buildPartnerOptions(
  matrix: UjatAllocationMatrixResponse,
  participantId: number,
  partnerAssignmentsByScheduleId: Record<string, UjatPartnerAssignmentResponse[]>
): Array<{ value: string; label: string }> {
  const history = new Set<number>()
  for (const assignments of Object.values(partnerAssignmentsByScheduleId)) {
    for (const assignment of assignments) {
      if (isCancelledAssignment(assignment.status) || assignment.cancelledAt) continue
      const primary = assignment.primaryParticipantId
      const secondary = assignment.secondaryParticipantId
      if (primary === participantId && secondary != null) history.add(secondary)
      if (secondary === participantId && primary != null) history.add(primary)
    }
  }

  const candidates: UjatVolunteerPartnerCandidate[] = []
  for (const volunteer of matrix.volunteers ?? []) {
    if (volunteer.participantId == null || volunteer.participantId === participantId) continue
    if (volunteer.giveUp === true) continue
    candidates.push({
      id: String(volunteer.participantId),
      name: volunteerDisplayName(volunteer),
      assignmentDayCount: volunteer.totalAssignedDays ?? 0,
      hasPartnerHistoryWithVolunteer: history.has(volunteer.participantId),
    })
  }

  return sortPartnerCandidates(candidates).map(candidate => ({
    value: candidate.id,
    label: formatPartnerOptionLabel(candidate),
  }))
}

function buildSummary(
  rows: UjatVolunteerAssignmentProgressRow[],
  giveUp: boolean
): UjatVolunteerAssignmentAttendanceSummary {
  const lateCount = rows.filter(row => row.attendance.kind === 'late').length
  const lateCountLabel = `${lateCount}회`
  if (giveUp || rows.some(row => row.classDisplay.kind === 'withdrawn')) {
    return { completionStatus: '수료 불가(활동 포기)', lateCountLabel }
  }
  const assigned = rows.filter(row => row.classDisplay.kind === 'class')
  if (assigned.length === 0) {
    return { completionStatus: '교육 진행 전', lateCountLabel }
  }
  if (assigned.every(row => row.educationProgress === 'completed')) {
    return { completionStatus: '수료 완료', lateCountLabel }
  }
  return { completionStatus: '교육 진행 중', lateCountLabel }
}

function buildAbsenceReasons(
  items: readonly ProgramAbsenceReasonItem[],
  participantId: number,
  memberId: string | undefined,
  scheduleLabelById: ReadonlyMap<number, string>
): UjatVolunteerAssignmentAbsenceReason[] {
  return items
    .filter(item => {
      if (item.participantId != null && item.participantId === participantId) return true
      if (memberId && item.memberId != null && String(item.memberId) === memberId) return true
      return false
    })
    .map(item => {
      const scheduleLabel =
        item.scheduleId != null ? scheduleLabelById.get(item.scheduleId) : undefined
      const names = item.originalFileNames ?? []
      const fileName = names.find(name => name?.trim())?.trim() ?? null
      return {
        id: String(item.submissionId ?? item.scheduleId ?? 'absence'),
        scheduleRowId: item.scheduleId != null ? String(item.scheduleId) : undefined,
        dateLabel: absenceDateLabel(item, scheduleLabel),
        reason: item.reason?.trim() || '-',
        fileName,
        fileObjectIds: item.fileObjectIds,
        originalFileNames: names,
      }
    })
}

type RowDraft = {
  column?: UjatAllocationColumnDto
  scheduleId: number
  organizationApplicationId?: number | null
  educationDate?: string | null
  index: number
}

function rowIdentity(draft: RowDraft): string {
  const columnKey = draft.column?.columnKey?.trim()
  if (columnKey) return columnKey
  return [
    draft.scheduleId,
    draft.organizationApplicationId ?? 'org',
    draft.index,
  ].join(':')
}

export function buildVolunteerAssignmentProgressView(
  sources: VolunteerAssignmentProgressSources
): VolunteerAssignmentProgressView {
  const { participantId, matrix, submissions } = sources
  const volunteer = (matrix.volunteers ?? []).find(item => item.participantId === participantId)
  const nameByParticipantId = new Map<number, string>()
  for (const item of matrix.volunteers ?? []) {
    if (item.participantId == null) continue
    nameByParticipantId.set(item.participantId, volunteerDisplayName(item))
  }

  const partnerOptions = buildPartnerOptions(
    matrix,
    participantId,
    sources.partnerAssignmentsByScheduleId
  )

  const drafts: RowDraft[] = []
  const seenScheduleIds = new Set<number>()
  ;(matrix.columns ?? []).forEach((column, index) => {
    if (column.scheduleId == null) return
    seenScheduleIds.add(column.scheduleId)
    drafts.push({
      column,
      scheduleId: column.scheduleId,
      organizationApplicationId: column.organizationApplicationId,
      educationDate: column.educationStartAt,
      index,
    })
  })

  ;(submissions.sessions ?? []).forEach((session, index) => {
    if (session.scheduleId == null || seenScheduleIds.has(session.scheduleId)) return
    const listed = (session.volunteers ?? []).some(item => item.participantId === participantId)
    if (!listed) return
    seenScheduleIds.add(session.scheduleId)
    drafts.push({
      scheduleId: session.scheduleId,
      educationDate: session.educationDate,
      index,
    })
  })

  const rows: UjatVolunteerAssignmentProgressRow[] = drafts.map(draft => {
    const scheduleKey = String(draft.scheduleId)
    const cell = draft.column && volunteer ? cellForColumn(volunteer, draft.column) : undefined
    const submission = findSubmission(submissions, draft.scheduleId, participantId)
    const partnerAssignment = findActivePartnerAssignment(
      sources.partnerAssignmentsByScheduleId[scheduleKey],
      participantId
    )
    const attendanceItem = (sources.attendancesByScheduleId[scheduleKey] ?? []).find(
      item => item.participantId === participantId
    )

    const classLabel =
      cell?.classLabel?.trim() ||
      partnerAssignment?.classLabel?.trim() ||
      submission?.volunteer.assignedClass?.trim() ||
      ''
    const abandoned =
      volunteer?.giveUp === true || submission?.volunteer.activityAbandoned === true
    const institutionName =
      draft.column?.organizationName?.trim() || submission?.volunteer.institutionName?.trim() || ''
    const selfIsSecondary = partnerAssignment?.secondaryParticipantId === participantId
    const partnerParticipantId = selfIsSecondary
      ? partnerAssignment?.primaryParticipantId
      : partnerAssignment?.secondaryParticipantId
    const partnerName =
      partnerParticipantId != null ? nameByParticipantId.get(partnerParticipantId)?.trim() : ''

    const plan = submission?.volunteer.plan
    const log = submission?.volunteer.log
    const planSubmitted = isDocumentSubmitted(plan?.status)
    const logSubmitted = isDocumentSubmitted(log?.status)
    const attendance = mapAttendance(attendanceItem)
    const assigned = !abandoned && classLabel.length > 0

    let educationProgress: UjatVolunteerAssignmentProgressRow['educationProgress'] = 'dash'
    if (assigned) {
      const attended =
        attendance.kind === 'present' ||
        attendance.kind === 'late' ||
        attendance.kind === 'excused_absence'
      educationProgress = logSubmitted || attended ? 'completed' : 'scheduled'
    }

    let partner: UjatVolunteerAssignmentProgressRow['partner'] = { kind: 'dash' }
    if (assigned || partnerAssignment) {
      if (partnerName) partner = { kind: 'name', value: partnerName }
      else if (partnerAssignment && partnerAssignment.secondaryParticipantId == null) {
        partner = { kind: 'undecided' }
      } else if (assigned) partner = { kind: 'undecided' }
    }

    const attendanceManager =
      cell?.attendanceManager === true ||
      partnerAssignment?.attendanceManagerParticipantId === participantId

    return {
      id: rowIdentity(draft),
      scheduleLabel: scheduleLabelFrom(draft.educationDate ?? submission?.educationDate),
      role: attendanceManager ? 'attendance_manager' : 'none',
      assignedInstitution: institutionName ? { kind: 'name', value: institutionName } : { kind: 'dash' },
      partner,
      classDisplay: abandoned
        ? { kind: 'withdrawn' }
        : assigned
          ? { kind: 'class', label: classLabel }
          : { kind: 'dash' },
      attendance: abandoned ? { kind: 'dash' } : attendance,
      educationPlanSubmitted: planSubmitted,
      educationLogSubmitted: logSubmitted,
      educationPlanFormResponseId: formResponseId(plan?.formResponseId),
      educationLogFormResponseId: formResponseId(log?.formResponseId),
      educationProgress: abandoned ? 'dash' : educationProgress,
      isWithdrawn: abandoned,
      scheduleId: draft.scheduleId,
      educationSlotId: numericSlotId(cell?.educationSlotId ?? partnerAssignment?.educationSlotId),
      assignmentGroupId: partnerAssignment?.assignmentGroupId ?? cell?.assignmentGroupId ?? null,
      organizationApplicationId:
        draft.organizationApplicationId ??
        partnerAssignment?.organizationApplicationId ??
        cell?.organizationApplicationId ??
        null,
      participantId,
      selfIsSecondary,
    }
  })

  const scheduleLabelById = new Map<number, string>()
  for (const row of rows) {
    if (row.scheduleId != null && !scheduleLabelById.has(row.scheduleId)) {
      scheduleLabelById.set(row.scheduleId, row.scheduleLabel)
    }
  }

  const assignOptionsByRowId: Record<string, VolunteerAssignmentAssignOptions> = {}
  for (const row of rows) {
    if (row.scheduleId == null) continue
    assignOptionsByRowId[row.id] = {
      classOptions: classOptionsForSchedule(
        matrix,
        row.scheduleId,
        sources.partnerAssignmentsByScheduleId[String(row.scheduleId)] ?? []
      ),
      partnerOptions,
    }
  }

  const sorted = [
    ...rows.filter(row => row.classDisplay.kind !== 'withdrawn'),
    ...rows.filter(row => row.classDisplay.kind === 'withdrawn'),
  ]

  return {
    bundle: {
      rows: sorted,
      attendanceSummary: buildSummary(sorted, volunteer?.giveUp === true),
      absenceReasons: buildAbsenceReasons(
        sources.absenceReasons,
        participantId,
        sources.memberId,
        scheduleLabelById
      ),
    },
    assignOptionsByRowId,
  }
}
