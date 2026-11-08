import { toSeoulYmd } from '@/features/program/ujat/api/applications-adapters'
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

/** 엄격 숫자 비교 — API number vs URL string "1691554" 불일치로 0건 되는 것 방지 */
export function sameOrganizationApplicationId(
  left: number | string | null | undefined,
  right: number | string | null | undefined
): boolean {
  if (left == null || right == null) return false
  const a = typeof left === 'number' ? left : Number(left)
  const b = typeof right === 'number' ? right : Number(right)
  return Number.isFinite(a) && Number.isFinite(b) && a === b
}

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

function asParticipantId(value: number | string | null | undefined): number | null {
  if (value == null) return null
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(id) ? id : null
}

export function volunteerNameByParticipantId(
  matrix: UjatAllocationMatrixResponse
): Map<number, string> {
  const names = new Map<number, string>()
  for (const volunteer of matrix.volunteers ?? []) {
    const participantId = asParticipantId(volunteer.participantId)
    if (participantId == null) continue
    const name = volunteer.volunteerName?.trim()
    if (name) names.set(participantId, name)
  }
  return names
}

function displayName(
  names: ReadonlyMap<number, string>,
  participantId: number | string | null | undefined
): string {
  const id = asParticipantId(participantId)
  if (id == null) return UNASSIGNED_VOLUNTEER
  return names.get(id)?.trim() || UNASSIGNED_VOLUNTEER
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
        sameOrganizationApplicationId(
          item.organizationApplicationId,
          sources.organizationApplicationId
        )) &&
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
          sameOrganizationApplicationId(
            cell.organizationApplicationId,
            sources.organizationApplicationId
          )) &&
        assignmentClassMatches(cell.classLabel, gradeLabel, classNo)
    )
  )
  const nameFromVolunteer = (
    volunteer: (typeof matched)[number] | undefined
  ): string => {
    const fromRow = volunteer?.volunteerName?.trim()
    if (fromRow) return fromRow
    return displayName(names, volunteer?.participantId)
  }
  return {
    volunteerA: nameFromVolunteer(matched[0]),
    volunteerB: nameFromVolunteer(matched[1]),
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
      sameOrganizationApplicationId(
        item.organizationApplicationId,
        sources.organizationApplicationId
      )
  )?.attendanceManagerParticipantId

  const resolvedManagerId = asParticipantId(managerId)
  if (resolvedManagerId != null) {
    return names.get(resolvedManagerId)?.trim() || UNASSIGNED_MANAGER
  }

  const fromCell = (sources.matrix.volunteers ?? []).find(volunteer =>
    (volunteer.cells ?? []).some(
      cell =>
        cell.scheduleId === scheduleId &&
        cell.attendanceManager === true &&
        (cell.assignmentStatus ?? '').trim().toUpperCase() === 'ASSIGNED' &&
        sameOrganizationApplicationId(
          cell.organizationApplicationId,
          sources.organizationApplicationId
        )
    )
  )
  return fromCell?.volunteerName?.trim() || UNASSIGNED_MANAGER
}

/**
 * educationStartAt → Asia/Seoul 달력일 YYYY-MM-DD.
 * ❌ `value.slice(0, 10)` — KST 자정 UTC 저장 시 하루 밀림
 */
export function isoDateFromScheduleValue(value: string | null | undefined): string {
  return toSeoulYmd(value) ?? ''
}

export function scheduleIdForInstitutionDate(
  sources: InstitutionAssignmentSources,
  isoDate: string
): number | null {
  const column = (sources.matrix.columns ?? []).find(item => {
    if (item.scheduleId == null) return false
    if (
      !sameOrganizationApplicationId(
        item.organizationApplicationId,
        sources.organizationApplicationId
      )
    ) {
      return false
    }
    return isoDateFromScheduleValue(item.educationStartAt) === isoDate
  })
  return column?.scheduleId ?? null
}

export function organizationMatrixColumns(sources: InstitutionAssignmentSources) {
  return (sources.matrix.columns ?? []).filter(column =>
    sameOrganizationApplicationId(
      column.organizationApplicationId,
      sources.organizationApplicationId
    )
  )
}

export function activePartnerAssignmentsForSchedule(
  sources: InstitutionAssignmentSources,
  scheduleId: number
): UjatPartnerAssignmentResponse[] {
  return activeAssignments(sources.partnerAssignmentsByScheduleId[String(scheduleId)]).filter(
    item =>
      item.organizationApplicationId == null ||
      sameOrganizationApplicationId(
        item.organizationApplicationId,
        sources.organizationApplicationId
      )
  )
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
        .filter(column =>
          sameOrganizationApplicationId(
            column.organizationApplicationId,
            input.organizationApplicationId
          )
        )
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
