import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import {
  fetchProgramAbsenceReasons,
  type ProgramAbsenceReasonItem,
} from '@/features/program/general/api/absence-reasons'
import { resolveParticipantIdForMember } from '@/features/program/ujat/api/ujat-1365-registration-form'
import {
  fetchUjatAllocationMatrix,
  fetchUjatAssignmentSubmissions,
  fetchUjatAttendancesByScheduleIds,
  fetchUjatPartnerAssignments,
  type UjatSemesterType,
} from '@/features/program/ujat/api/education-execution-api'
import { fetchUjatOrganizationScheduleAssignments } from '@/features/program/ujat/api/temporary-schedule-api'
import {
  buildVolunteerAssignmentProgressView,
  UNRESOLVED_VOLUNTEER_ASSIGNMENT_BUNDLE,
  type VolunteerAssignmentAssignOptions,
} from './assignment-progress-adapter'
import type { UjatVolunteerAssignmentProgressBundle } from './assignment-types'

export type VolunteerAssignmentProgressData = {
  participantId: number | null
  /** matrix·과제 제출 조회에 쓴 지역 코드. 희망 지역 GET과 같다. 없으면 ALL */
  educationRegionCode: string
  bundle: UjatVolunteerAssignmentProgressBundle
  assignOptionsByRowId: Record<string, VolunteerAssignmentAssignOptions>
}

function collectScheduleIds(
  matrixColumns: ReadonlyArray<{ scheduleId?: number | null }>
): number[] {
  const ids = new Set<number>()
  for (const column of matrixColumns) {
    if (column.scheduleId != null) ids.add(column.scheduleId)
  }
  return [...ids]
}

async function loadAbsenceReasons(programId: string): Promise<ProgramAbsenceReasonItem[]> {
  const numericId = parseFileObjectId(programId)
  // 프로그램 id가 숫자가 아니면 absence-reasons 경로를 만들 수 없다.
  if (numericId == null) return []
  return fetchProgramAbsenceReasons(numericId)
}

export async function loadVolunteerAssignmentProgress(input: {
  programId: string
  memberId: string
  semesterType: UjatSemesterType
  educationRegionCode?: string
}): Promise<VolunteerAssignmentProgressData> {
  const requestedRegion = input.educationRegionCode?.trim() || ''
  const matrix = await fetchUjatAllocationMatrix(input.programId, {
    semesterType: input.semesterType,
    ...(requestedRegion ? { educationRegionCode: requestedRegion } : {}),
  })
  const participantId = resolveParticipantIdForMember(matrix.volunteers ?? [], input.memberId)
  const fallbackRegion = requestedRegion || 'ALL'
  if (participantId == null) {
    return {
      participantId: null,
      educationRegionCode: fallbackRegion,
      bundle: UNRESOLVED_VOLUNTEER_ASSIGNMENT_BUNDLE,
      assignOptionsByRowId: {},
    }
  }

  const volunteer = (matrix.volunteers ?? []).find(item => item.participantId === participantId)
  // 계약 B: 희망 지역 GET과 같은 CODE로 submissions를 친다. 컬럼 저장 지역(DAEJEON 등)으로 바꾸지 않는다.
  const submissionsRegion =
    requestedRegion ||
    volunteer?.educationRegionCode?.trim() ||
    matrix.educationRegionCode?.trim() ||
    ''
  // educationRegionCode 없이 과제 제출을 조회하면 다른 지역 데이터를 섞을 수 있다.
  const submissions = submissionsRegion
    ? await fetchUjatAssignmentSubmissions(input.programId, {
        semesterType: input.semesterType,
        educationRegionCode: submissionsRegion,
      })
    : { sessions: [] }

  const scheduleIds = collectScheduleIds(matrix.columns ?? [])
  const [partnerEntries, attendancesByScheduleId, absenceReasons, orgAssignments] =
    await Promise.all([
      Promise.all(
        scheduleIds.map(
          async scheduleId =>
            [
              String(scheduleId),
              await fetchUjatPartnerAssignments(input.programId, scheduleId),
            ] as const
        )
      ),
      scheduleIds.length > 0
        ? fetchUjatAttendancesByScheduleIds(input.programId, scheduleIds)
        : Promise.resolve({}),
      loadAbsenceReasons(input.programId),
      fetchUjatOrganizationScheduleAssignments(input.programId, {
        ...(submissionsRegion ? { educationRegionCode: submissionsRegion } : {}),
      }).catch(() => ({ content: [] as const })),
    ])

  const view = buildVolunteerAssignmentProgressView({
    participantId,
    memberId: input.memberId,
    matrix,
    submissions,
    partnerAssignmentsByScheduleId: Object.fromEntries(partnerEntries),
    attendancesByScheduleId,
    absenceReasons,
    orgSlots: orgAssignments.content ?? [],
  })

  return {
    participantId,
    educationRegionCode: submissionsRegion || fallbackRegion,
    bundle: view.bundle,
    assignOptionsByRowId: view.assignOptionsByRowId,
  }
}
