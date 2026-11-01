/**
 * Allocation-matrix / attendance adapters for UJAT education progress.
 */

import dayjs from 'dayjs'
import { formatArrivalTimeForDisplay } from '@/shared/lib/attendance-arrival-time'
import { toSeoulYmd } from '@/features/program/ujat/api/applications-adapters'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import { fromUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type {
  RegionAssignmentCell,
  RegionAssignmentClassSlot,
  RegionAssignmentColumn,
  RegionAssignmentTableData,
  RegionAssignmentVolunteerRow,
} from '@/features/program/ujat/ui/detail-modal/progress/region/types'
import type {
  UjatAttendanceSessionGroup,
  UjatAttendanceStatus,
  UjatAttendanceVolunteerRow,
} from '@/features/program/ujat/ui/detail-modal/progress/attendance/types'
import type {
  UjatAllocationCellDto,
  UjatAllocationColumnDto,
  UjatAllocationMatrixResponse,
  UjatAllocationVolunteerRowDto,
  UjatAttendanceItemDto,
  UjatVolunteerUnavailabilityResponse,
} from '@/features/program/ujat/api/education-execution-api'
import type { UjatOrganizationScheduleSlotResponse as OrgSlot } from '@/features/program/ujat/api/temporary-schedule-api'

const UI_TO_API_STATUS: Record<Exclude<UjatAttendanceStatus, 'unprocessed'>, string> = {
  present: 'PRESENT',
  late: 'LATE',
  absent: 'ABSENT',
  excused_absence: 'EXCUSED',
}

export function mapApiAttendanceStatusToUjatUi(
  status: string | null | undefined
): UjatAttendanceStatus {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'LATE') return 'late'
  if (normalized === 'ABSENT') return 'absent'
  if (
    normalized === 'EXCUSED' ||
    normalized === 'EXCUSED_ABSENCE' ||
    normalized === 'REASON_ABSENT'
  ) {
    return 'excused_absence'
  }
  if (normalized === 'PRESENT' || normalized === 'ATTEND') return 'present'
  const lower = (status ?? '').trim().toLowerCase()
  if (lower === 'late') return 'late'
  if (lower === 'absent') return 'absent'
  if (lower === 'excused_absence' || lower === 'excused') return 'excused_absence'
  return 'unprocessed'
}

export function mapUjatUiAttendanceStatusToApi(status: UjatAttendanceStatus): string {
  if (status === 'unprocessed') return ''
  return UI_TO_API_STATUS[status]
}

function formatDateLabel(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  return d.isValid() ? d.format('M/D') : '-'
}

function formatIsoDate(iso: string | null | undefined): string {
  // Asia/Seoul 달력일. ❌ UTC slice(0,10) / 로컬 TZ 의존 dayjs.format
  return toSeoulYmd(iso) ?? ''
}

function formatTimeRange(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return `${d.format('HH:mm')}~`
}

/**
 * columnKey 우선, 없으면 scheduleId(+organizationApplicationId)로 매칭.
 * 봉사자 상세 assignment-progress-adapter.cellForColumn 과 동일 계약.
 * scheduleId만으로 열을 invent 하지 않는다.
 */
function cellForColumn(
  volunteer: UjatAllocationVolunteerRowDto,
  column: UjatAllocationColumnDto
): UjatAllocationCellDto | undefined {
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

/**
 * 셀 표시 라벨은 allocation-matrix cell.classLabel만 사용.
 * org temporary-schedule / partner-assignment 등으로 ASSIGNED 라벨을 백필하지 않는다.
 */
function mapCell(
  cell: UjatAllocationCellDto | undefined,
  substituteName?: string
): RegionAssignmentCell {
  if (!cell) return { kind: 'empty' }
  if (cell.unavailable) {
    return substituteName
      ? { kind: 'empty', blockedEmpty: true, substituteName }
      : { kind: 'empty', blockedEmpty: true }
  }

  const status = (cell.assignmentStatus ?? '').trim().toUpperCase()
  const needsReassignment =
    cell.needsReassignment === true || status === 'REASSIGNMENT_REQUIRED'
  const label = cell.classLabel?.trim() || ''

  if (status === 'UNASSIGNED') {
    return { kind: 'empty' }
  }

  // ASSIGNED / 재배정 필요 / 라벨 있음 → 배정 셀. 라벨이 비면 "—"만 (다른 API 보완 금지)
  if (status === 'ASSIGNED' || needsReassignment || label) {
    return {
      kind: 'assigned',
      classLabel: label || '—',
      isAttendanceManager: cell.attendanceManager === true,
      isSolo: cell.singleAssignment === true,
      isInvalidAssignment: needsReassignment,
    }
  }

  return { kind: 'empty' }
}

function buildClassSlotsForColumn(
  column: UjatAllocationColumnDto,
  volunteers: UjatAllocationVolunteerRowDto[],
  orgSlots: OrgSlot[]
): RegionAssignmentClassSlot[] {
  const scheduleId = column.scheduleId
  const orgAppId = column.organizationApplicationId
  const fromOrg = orgSlots.filter(
    slot =>
      slot.scheduleId != null &&
      slot.scheduleId === scheduleId &&
      (orgAppId == null ||
        slot.organizationApplicationId == null ||
        slot.organizationApplicationId === orgAppId)
  )

  if (fromOrg.length > 0) {
    return fromOrg
      .filter(slot => slot.slotId != null)
      .map(slot => ({
        id: String(slot.slotId),
        classLabel:
          slot.classLabel?.trim() ||
          [slot.grade, slot.className].filter(Boolean).join('-') ||
          `학급 ${slot.slotId}`,
      }))
  }

  const columnKey = column.columnKey ?? ''
  const seen = new Map<string, RegionAssignmentClassSlot>()
  for (const volunteer of volunteers) {
    const cell = (volunteer.cells ?? []).find(c => c.columnKey === columnKey)
    if (cell?.educationSlotId != null && cell.classLabel?.trim()) {
      const id = String(cell.educationSlotId)
      if (!seen.has(id)) {
        seen.set(id, { id, classLabel: cell.classLabel.trim() })
      }
    }
  }
  // classCount로 N반 invent 금지 — org slots / 배정 cell의 educationSlotId만 SSOT
  return [...seen.values()]
}

/** 참여 불가 셀이 있는 scheduleId — 대체자 조회(GET unavailability) 대상 */
export function collectUnavailableScheduleIds(matrix: UjatAllocationMatrixResponse): string[] {
  const ids = new Set<string>()
  for (const volunteer of matrix.volunteers ?? []) {
    for (const cell of volunteer.cells ?? []) {
      if (cell.unavailable && cell.scheduleId != null) ids.add(String(cell.scheduleId))
    }
  }
  return [...ids]
}

function volunteerDisplayName(volunteer: UjatAllocationVolunteerRowDto): string {
  return volunteer.volunteerName?.trim() || `봉사자 ${volunteer.participantId ?? ''}`
}

export function mapAllocationMatrixToRegionTableData(params: {
  matrix: UjatAllocationMatrixResponse
  regionKey: UjatInstitutionApplicationRegionKey
  orgSlots?: OrgSlot[]
  unavailabilityByScheduleId?: Record<string, UjatVolunteerUnavailabilityResponse[]>
}): RegionAssignmentTableData {
  const { matrix, regionKey, orgSlots = [], unavailabilityByScheduleId = {} } = params
  const columnsDto = matrix.columns ?? []
  const volunteersDto = matrix.volunteers ?? []
  const nameByParticipantId = new Map(
    volunteersDto
      .filter(volunteer => volunteer.participantId != null)
      .map(volunteer => [String(volunteer.participantId), volunteerDisplayName(volunteer)] as const)
  )

  const resolveSubstituteName = (
    participantId: string,
    cell: UjatAllocationCellDto | undefined
  ): string | undefined => {
    if (!cell?.unavailable || cell.scheduleId == null) return undefined
    const scheduleId = String(cell.scheduleId)
    // 같은 서울 날짜의 다른 일정 활동 불가 행도 섞여 오므로 행의 실제 scheduleId로 맞춘다.
    const record = unavailabilityByScheduleId[scheduleId]?.find(
      item =>
        String(item.participantId ?? '') === participantId &&
        String(item.scheduleId ?? scheduleId) === scheduleId
    )
    const replacementId = record?.replacementParticipantId
    if (replacementId == null) return undefined
    return nameByParticipantId.get(String(replacementId)) ?? `봉사자 ${replacementId}`
  }

  const columns: RegionAssignmentColumn[] = columnsDto.map(col => {
    const columnKey =
      col.columnKey?.trim() ||
      `${col.scheduleId ?? 's'}:${col.organizationApplicationId ?? 'o'}`
    return {
      id: columnKey,
      scheduleId: col.scheduleId != null ? String(col.scheduleId) : undefined,
      organizationApplicationId:
        col.organizationApplicationId != null
          ? String(col.organizationApplicationId)
          : undefined,
      dateLabel: formatDateLabel(col.educationStartAt),
      isoDate: formatIsoDate(col.educationStartAt),
      institutionName: col.organizationName?.trim() || '-',
      location: col.organizationRegion?.trim() || '-',
      classSlots: buildClassSlotsForColumn(col, volunteersDto, orgSlots),
    }
  })

  const rows: RegionAssignmentVolunteerRow[] = volunteersDto.map(volunteer => {
    const participantId = String(volunteer.participantId ?? '')
    const cells = columns.map((column, columnIndex) => {
      const columnDto = columnsDto[columnIndex]
      const cell = columnDto
        ? cellForColumn(volunteer, columnDto)
        : (volunteer.cells ?? []).find(item => item.columnKey === column.id)
      return mapCell(cell, resolveSubstituteName(participantId, cell))
    })
    return {
      id: participantId,
      name: volunteerDisplayName(volunteer),
      totalAssignedDays: volunteer.totalAssignedDays ?? 0,
      isWithdrawnVolunteer: volunteer.giveUp === true,
      cells,
    }
  })

  return {
    regionKey,
    regionLabel: getUjatEducationRegionLabel(regionKey, regionKey),
    volunteerCount: rows.length,
    columns,
    rows,
  }
}

function findAssignedClassLabel(
  volunteer: UjatAllocationVolunteerRowDto,
  columnKey: string
): string {
  const cell = (volunteer.cells ?? []).find(c => c.columnKey === columnKey)
  return cell?.classLabel?.trim() || '-'
}

export function buildUjatAttendanceSessionsFromMatrix(params: {
  matrix: UjatAllocationMatrixResponse
  attendancesByScheduleId: Record<string, UjatAttendanceItemDto[]>
  regionKey: UjatInstitutionApplicationRegionKey
  half: EducationProgressHalfKey
}): UjatAttendanceSessionGroup[] {
  const { matrix, attendancesByScheduleId, regionKey, half } = params
  const columns = matrix.columns ?? []
  const volunteers = matrix.volunteers ?? []

  return columns
    .filter(col => col.scheduleId != null)
    .map(col => {
      const scheduleId = String(col.scheduleId)
      const columnKey =
        col.columnKey?.trim() ||
        `${col.scheduleId}:${col.organizationApplicationId ?? ''}`
      const attendances = attendancesByScheduleId[scheduleId] ?? []
      const byParticipant = new Map(
        attendances
          .filter(a => a.participantId != null)
          .map(a => [String(a.participantId), a] as const)
      )

      const assignedVolunteers = volunteers.filter(v => {
        const cell = (v.cells ?? []).find(c => c.columnKey === columnKey)
        return Boolean(cell?.classLabel?.trim()) || cell?.needsReassignment === true
      })

      const sessionVolunteers: UjatAttendanceVolunteerRow[] = assignedVolunteers.map(v => {
        const participantId = String(v.participantId ?? '')
        const attendance = byParticipant.get(participantId)
        const status = mapApiAttendanceStatusToUjatUi(attendance?.status)
        const arrival = attendance?.arrivalTime
        return {
          id: participantId,
          // VolunteerRow에 phone/email 없음 → 렌더 레이어 `-`만. 다른 API로 보완 금지
          name: v.volunteerName?.trim() || '-',
          assignedClass: findAssignedClassLabel(v, columnKey),
          contact: '-',
          email: '-',
          status,
          checkInTime: formatArrivalTimeForDisplay(arrival),
          excusedReason: attendance?.absenceReason?.trim() || undefined,
          isDropout: v.giveUp === true,
        }
      })

      return {
        id: columnKey,
        regionKey,
        half,
        isoDate: formatIsoDate(col.educationStartAt),
        dateLabel: formatDateLabel(col.educationStartAt),
        institutionName: col.organizationName?.trim() || '-',
        district: col.organizationRegion?.trim() || '-',
        timeRange: formatTimeRange(col.educationStartAt),
        scheduleId,
        volunteers: sessionVolunteers,
      }
    })
}

export function resolveRegionKeyFromMatrixCode(
  code: string | null | undefined,
  fallback: UjatInstitutionApplicationRegionKey
): UjatInstitutionApplicationRegionKey {
  if (!code) return fallback
  return fromUjatEducationRegionCode(code) as UjatInstitutionApplicationRegionKey
}
