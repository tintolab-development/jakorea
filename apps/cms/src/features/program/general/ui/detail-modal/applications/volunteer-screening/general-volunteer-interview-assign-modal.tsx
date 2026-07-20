import { useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { parseGeneralInterviewScheduleFromProgram } from '@/features/program/general/lib/general-interview-assign-schedule-utils'
import {
  toInterviewAssignModalApplicant,
  toInterviewAssignModalApplicants,
} from '@/features/program/general/lib/interview-assign-applicant-adapter'
import { UjatVolunteerInterviewAssignModal } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/modal'

export type GeneralInterviewAssignNotifyTiming = 'immediate' | 'manual'

export type GeneralInterviewAssignConfirmPayload = {
  dateLabel: string
  timeRange: string
  notifyTiming: GeneralInterviewAssignNotifyTiming
  manualNotifyAt?: Dayjs
}

export type GeneralVolunteerInterviewAssignModalProps = {
  open: boolean
  program: Program
  applicant: GeneralVolunteerApplicantRow
  allApplicants: GeneralVolunteerApplicantRow[]
  mode: 'assign' | 'reassign'
  onCancel: () => void
  onConfirm: (payload: GeneralInterviewAssignConfirmPayload) => void
}

/** UJAT `면접일 배정 안내` 모달 UI 재사용 — 일반 프로그램 스케줄·row 타입만 general 레이어에서 처리 */
export function GeneralVolunteerInterviewAssignModal({
  open,
  program,
  applicant,
  allApplicants,
  mode,
  onCancel,
  onConfirm,
}: GeneralVolunteerInterviewAssignModalProps) {
  const schedule = useMemo(() => parseGeneralInterviewScheduleFromProgram(program), [program])

  const modalApplicant = useMemo(
    () =>
      toInterviewAssignModalApplicant(applicant, {
        clearExistingAssignment: mode === 'reassign',
      }),
    [applicant, mode]
  )

  return (
    <UjatVolunteerInterviewAssignModal
      open={open}
      applicant={modalApplicant}
      programId={program.id}
      allApplicants={toInterviewAssignModalApplicants(allApplicants)}
      mode={mode}
      schedule={schedule}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
