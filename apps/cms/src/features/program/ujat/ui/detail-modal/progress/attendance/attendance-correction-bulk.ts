import { toIsoLocalTime } from '@/shared/lib/attendance-arrival-time'
import { mapUjatUiAttendanceStatusToApi } from '@/features/program/ujat/api/allocation-matrix-adapters'
import type { UjatAttendanceVolunteerRow } from './types'

/**
 * 출결 정정 시 bulk-upsert에 넣을 단일 participant.
 * 정정 UI는 대상 1건만 전송한다. (다른 봉사자 row를 함께 보낼 필요 없음)
 * BE는 status·absenceReason·arrivalTime이 기존과 같으면 item별 no-op 처리하므로,
 * 동일 payload 재전송 시 불참 증빙 revision이 늘지 않는다.
 * UJAT bulk 계약에는 fileObjectIds가 없으므로 사유 문구만 전달한다.
 */
export function buildUjatAttendanceCorrectionBulkItem(row: UjatAttendanceVolunteerRow) {
  if (row.status === 'unprocessed') {
    throw new Error('UNPROCESSED_ATTENDANCE')
  }
  const participantId = Number(row.id)
  if (!Number.isFinite(participantId)) {
    throw new Error('INVALID_PARTICIPANT_ID')
  }
  return {
    participantId,
    status: mapUjatUiAttendanceStatusToApi(row.status),
    absenceReason:
      row.status === 'excused_absence' ? row.excusedReason?.trim() || null : null,
    arrivalTime:
      row.status === 'present' || row.status === 'late'
        ? toIsoLocalTime(row.checkInTime)
        : null,
  }
}
