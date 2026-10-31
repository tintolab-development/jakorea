import {
  fetchUjatAllocationMatrix,
  fetchUjatPartnerAssignments,
  type UjatAllocationMatrixResponse,
  type UjatPartnerAssignmentResponse,
  type UjatSemesterType,
} from '@/features/program/ujat/api/education-execution-api'

export type InstitutionAssignmentSources = {
  matrix: UjatAllocationMatrixResponse
  partnerAssignmentsByScheduleId: Readonly<Record<string, UjatPartnerAssignmentResponse[]>>
  organizationApplicationId: number
}

const UNASSIGNED_VOLUNTEER = '-'
const UNASSIGNED_MANAGER = '미정'

function isCancelledAssignment(assignment: UjatPartnerAssignmentResponse): boolean {
  if (assignment.cancelledAt) return true
  const status = assignment.status?.trim().toUpperCase()
  return status === 'CANCELLED' || status === 'CANCELED'
}

export function parseUjatAssignmentClassLabel(
  classLabel: string | null | undefined
): { gradeLabel: string; classNo: number } | null {
  const raw = classLabel?.trim().replace(/\s+/g, ' ')
  if (!raw) return null
  const matched =
    raw.match(/^(\d+)\s*학년\s*(\d+)\s*반?$/) ??
    raw.match(/^(\d+)\s*[-/:|]\s*(\d+)\s*반?$/) ??
    raw.match(/^(\d+)\s+(\d+)\s*반?$/)
  if (!matched) return null
  const classNo = Number(matched[2])
  if (!Number.isFinite(classNo) || classNo < 1) return null
  return { gradeLabel: `${matched[1]}학년`, classNo }
}

function gradeNumber(gradeLabel: string): number | null {
  const parsed = Number.parseInt(gradeLabel, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function assignmentClassMatches(
  classLabel: string | null | undefined,
  gradeLabel: string,
  classNo: number
): boolean {
  const parsed = parseUjatAssignmentClassLabel(classLabel)
  if (!parsed || parsed.classNo !== classNo) return false
  return gradeNumber(parsed.gradeLabel) === gradeNumber(gradeLabel)
}

function activeAssignments(
  assignments: readonly UjatPartnerAssignmentResponse[] | undefined
): UjatPartnerAssignmentResponse[] {
  return (assignments ?? []).filter(item => !isCancelledAssignment(item))
}

export function volunteerNameByParticipantId(
  matrix: UjatAllocationMatrixResponse
): Map<number, string> {
  const names = new Map<number, string>()
  for (const volunteer of matrix.volunteers ?? []) {
    if (volunteer.participantId == null) continue
    const name = volunteer.volunteerName?.trim()
    if (name) names.set(volunteer.participantId, name)
  }
  return names
}

function displayName(names: ReadonlyMap<number, string>, participantId: number | null | undefined): string {
  if (participantId == null) return UNASSIGNED_VOLUNTEER
  return names.get(participantId)?.trim() || UNASSIGNED_VOLUNTEER
}

export function volunteersForClassFromSources(
  sources: InstitutionAssignmentSources,
  scheduleId: number,
  gradeLabel: string,
  classNo: number
): { volunteerA: string; volunteerB: string } {
  const names = volunteerNameByParticipantId(sources.matrix)
  const assignment = activeAssignments(sources.partnerAssignmentsByScheduleId[String(scheduleId)]).find(
    item =>
      (item.organizationApplicationId == null ||
        item.organizationApplicationId === sources.organizationApplicationId) &&
      assignmentClassMatches(item.classLabel, gradeLabel, classNo)
  )
  if (assignment) {
    return {
      volunteerA: displayName(names, assignment.primaryParticipantId),
      volunteerB: displayName(names, assignment.secondaryParticipantId),
    }
  }

  const matched = (sources.matrix.volunteers ?? []).filter(volunteer =>
    (volunteer.cells ?? []).some(
      cell =>
        cell.scheduleId === scheduleId &&
        (cell.organizationApplicationId == null ||
          cell.organizationApplicationId === sources.organizationApplicationId) &&
        assignmentClassMatches(cell.classLabel, gradeLabel, classNo)
    )
  )
  return {
    volunteerA: displayName(names, matched[0]?.participantId),
    volunteerB: displayName(names, matched[1]?.participantId),
  }
}

export function attendanceManagerForScheduleFromSources(
  sources: InstitutionAssignmentSources,
  scheduleId: number
): string {
  const names = volunteerNameByParticipantId(sources.matrix)
  const managerId = activeAssignments(
    sources.partnerAssignmentsByScheduleId[String(scheduleId)]
  ).find(
    item =>
      item.attendanceManagerParticipantId != null &&
      (item.organizationApplicationId == null ||
        item.organizationApplicationId === sources.organizationApplicationId)
  )?.attendanceManagerParticipantId

  if (managerId != null) {
    return names.get(managerId)?.trim() || UNASSIGNED_MANAGER
  }

  const fromCell = (sources.matrix.volunteers ?? []).find(volunteer =>
    (volunteer.cells ?? []).some(
      cell =>
        cell.scheduleId === scheduleId &&
        cell.attendanceManager === true &&
        (cell.organizationApplicationId == null ||
          cell.organizationApplicationId === sources.organizationApplicationId)
    )
  )
  return fromCell?.volunteerName?.trim() || UNASSIGNED_MANAGER
}

export function isoDateFromScheduleValue(value: string | null | undefined): string {
  if (!value) return ''
  const day = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : ''
}

export function scheduleIdForInstitutionDate(
  sources: InstitutionAssignmentSources,
  isoDate: string
): number | null {
  const column = (sources.matrix.columns ?? []).find(item => {
    if (item.scheduleId == null) return false
    if (item.organizationApplicationId !== sources.organizationApplicationId) return false
    return isoDateFromScheduleValue(item.educationStartAt) === isoDate
  })
  return column?.scheduleId ?? null
}

export async function loadInstitutionAssignmentSources(input: {
  programId: string
  organizationApplicationId: number
  semesterType: UjatSemesterType
}): Promise<InstitutionAssignmentSources> {
  const matrix = await fetchUjatAllocationMatrix(input.programId, {
    semesterType: input.semesterType,
  })
  const scheduleIds = [
    ...new Set(
      (matrix.columns ?? [])
        .filter(column => column.organizationApplicationId === input.organizationApplicationId)
        .map(column => column.scheduleId)
        .filter((scheduleId): scheduleId is number => scheduleId != null)
    ),
  ]
  const pairs = await Promise.all(
    scheduleIds.map(
      async scheduleId =>
        [
          String(scheduleId),
          await fetchUjatPartnerAssignments(
            input.programId,
            scheduleId,
            input.organizationApplicationId
          ),
        ] as const
    )
  )
  return {
    matrix,
    partnerAssignmentsByScheduleId: Object.fromEntries(pairs),
    organizationApplicationId: input.organizationApplicationId,
  }
}
