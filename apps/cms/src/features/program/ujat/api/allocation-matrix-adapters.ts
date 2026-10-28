/**
 * Allocation-matrix / attendance adapters for UJAT education progress.
 */

import dayjs from 'dayjs'
import { formatArrivalTimeForDisplay } from '@/shared/lib/attendance-arrival-time'
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
  if (!iso) return ''
  const d = dayjs(iso)
  return d.isValid() ? d.format('YYYY-MM-DD') : ''
}

function formatTimeRange(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return `${d.format('HH:mm')}~`
}

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
  const label = cell.classLabel?.trim()
  if (!label) return { kind: 'empty' }
  return {
    kind: 'assigned',
    classLabel: label,
    isAttendanceManager: cell.attendanceManager === true,
    isSolo: cell.singleAssignment === true,
    isInvalidAssignment: cell.needsReassignment === true,
  }
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
  if (seen.size > 0) return [...seen.values()]

  const count = column.classCount ?? 0
  return Array.from({ length: count }, (_, index) => ({
    id: `${columnKey || 'col'}-slot-${index + 1}`,
    classLabel: `${index + 1}반`,
  }))
}

/** 배정 불가 셀이 있는 scheduleId — 대체자 조회(GET unavailability) 대상 */
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
    const cellsByKey = new Map(
      (volunteer.cells ?? [])
        .filter(c => c.columnKey)
        .map(c => [String(c.columnKey), c] as const)
    )
    const cells = columns.map(column => {
      const cell = cellsByKey.get(column.id)
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
          name: v.volunteerName?.trim() || `봉사자 ${participantId}`,
          assignedClass: findAssignedClassLabel(v, columnKey),
          contact: '-',
          email: '-',
          status,
          checkInTime: formatArrivalTimeForDisplay(arrival),
          excusedReason: attendance?.absenceReason || undefined,
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
