/**
 * @deprecated `ProgramAttendanceCorrectionModal` 사용. UJAT 배정 탭 호환용 re-export.
 */
import {
  ProgramAttendanceCorrectionModal,
  type ProgramAttendanceCorrectionModalProps,
} from '@/features/program/shared/ui/attendance-correction-modal'
import type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
import type { UjatVolunteerAttendanceDisplay } from './assignment-types'

export type AttendanceCorrectionConfirmPayload = ProgramAttendanceCorrectionConfirmPayload

export function UjatVolunteerAttendanceCorrectionModal({
  volunteerName,
  initialAttendance,
  ...rest
}: Omit<ProgramAttendanceCorrectionModalProps, 'subjectName' | 'initialAttendance'> & {
  volunteerName: string
  initialAttendance: UjatVolunteerAttendanceDisplay
}) {
  return (
    <ProgramAttendanceCorrectionModal
      subjectName={volunteerName}
      initialAttendance={initialAttendance}
      {...rest}
    />
  )
}

export type { ProgramAttendanceCorrectionConfirmPayload }
