import { useMemo } from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { shouldUseApplicationsHttpRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { useGeneralInterviewSlots } from '@/features/program/general/hooks/use-general-interview-slots'
import {
  parseGeneralInterviewScheduleFromProgram,
  parseGeneralInterviewScheduleFromRemoteSlots,
} from '@/features/program/general/lib/general-interview-assign-schedule-utils'
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
  const remote = shouldUseApplicationsHttpRemoteApi()
  const slotsQuery = useGeneralInterviewSlots(program.id, open)

  const schedule = useMemo(() => {
    if (remote && slotsQuery.data != null) {
      return parseGeneralInterviewScheduleFromRemoteSlots(slotsQuery.data)
    }
    return parseGeneralInterviewScheduleFromProgram(program)
  }, [program, remote, slotsQuery.data])

  const modalApplicant = useMemo(
    () =>
      toInterviewAssignModalApplicant(applicant, {
        clearExistingAssignment: mode === 'reassign',
      }),
    [applicant, mode]
  )

  const waitingRemoteSlots = remote && open && slotsQuery.isLoading

  return (
    <>
      {waitingRemoteSlots ? (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45"
          role="status"
          aria-live="polite"
        >
          <Spin size="large" tip="면접 일정을 불러오는 중…" />
        </div>
      ) : (
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
      )}
    </>
  )
}
