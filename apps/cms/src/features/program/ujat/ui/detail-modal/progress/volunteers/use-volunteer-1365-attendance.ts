import { useQuery } from '@tanstack/react-query'
import {
  fetchUjatAllocationMatrix,
  fetchUjatProgramAttendancesBulk,
  type UjatAttendanceItemDto,
} from '@/features/program/ujat/api/education-execution-api'
import { groupAttendancesByScheduleId } from '@/features/program/general/lib/program-attendance-bulk'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import type { UjatInstitutionScheduleAssignDateEntry } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { filterScheduleDatesByHalf } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import type { EducationProgressHalfKey } from '../tabs'
import {
  volunteer1365AttendanceKey,
  type Volunteer1365AttendanceLookup,
  type Volunteer1365SheetCellValue,
} from './volunteer-1365-fortune-data'

function formatAttendanceCell(item: UjatAttendanceItemDto): Volunteer1365SheetCellValue | null {
  const label = item.volunteer1365DurationLabel?.trim()
  const minutes = item.volunteer1365Minutes
  const text = label || (typeof minutes === 'number' ? `${minutes}분` : '')
  if (!text) return null
  return { text, warn: item.internalLate === true }
}

/** 1365 시트 출석 칸 — allocation-matrix(memberId→participantId) × 일정별 attendances */
export function useVolunteer1365Attendance(input: {
  programId?: string | null
  half: EducationProgressHalfKey
  scheduleDates: readonly UjatInstitutionScheduleAssignDateEntry[]
  enabled: boolean
}) {
  const { programId, half, scheduleDates, enabled } = input
  const schedules = filterScheduleDatesByHalf(scheduleDates, half).filter(
    (entry): entry is UjatInstitutionScheduleAssignDateEntry & { scheduleId: number } =>
      typeof entry.scheduleId === 'number'
  )
  const scheduleIdsKey = schedules.map(entry => entry.scheduleId).join(',')
  const remoteEnabled =
    enabled && shouldUseUjatApplicationsRemoteApi() && Boolean(programId) && schedules.length > 0

  return useQuery({
    queryKey: ujatQueryKeys.volunteer1365Attendance(String(programId ?? ''), half, scheduleIdsKey),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<Volunteer1365AttendanceLookup> => {
      const id = String(programId)
      const scheduleIds = schedules.map(entry => entry.scheduleId)
      const [matrix, bulkAttendanceItems] = await Promise.all([
        fetchUjatAllocationMatrix(id, {
          semesterType: half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF',
        }),
        fetchUjatProgramAttendancesBulk(id, scheduleIds),
      ])
      const attendancesByScheduleId = groupAttendancesByScheduleId(
        bulkAttendanceItems as Parameters<typeof groupAttendancesByScheduleId>[0]
      )

      const memberIdByParticipant = new Map<number, string>()
      for (const volunteer of matrix.volunteers ?? []) {
        if (volunteer.participantId != null && volunteer.memberId != null) {
          memberIdByParticipant.set(volunteer.participantId, String(volunteer.memberId))
        }
      }

      const lookup = new Map<string, Volunteer1365SheetCellValue>()
      schedules.forEach(entry => {
        for (const item of attendancesByScheduleId[String(entry.scheduleId)] ?? []) {
          if (item.participantId == null) continue
          const memberId = memberIdByParticipant.get(item.participantId)
          if (!memberId) continue
          const cell = formatAttendanceCell(item)
          if (cell) lookup.set(volunteer1365AttendanceKey(memberId, entry.isoDate), cell)
        }
      })
      return lookup
    },
  })
}
