import { useMemo } from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { useGeneralInterviewSlots } from '@/features/program/general/hooks/use-general-interview-slots'
import {
  parseGeneralInterviewScheduleFromDefaultMock,
  parseGeneralInterviewScheduleFromRemoteSlots,
  shouldUseRemoteInterviewSchedule,
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
  /**
   * 신청 목록이 remote인지. false면 목록 mock과 동일하게 면접 스케줄도 mock.
   * (참여자 합격자 목록 등 — 프로그램이 remote여도 신청 mock이면 mock 스케줄)
   */
  applicationsUseRemote?: boolean
  /** 본문 호칭 — 기본 `봉사자` */
  subjectNoun?: string
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
  applicationsUseRemote = false,
  subjectNoun = '봉사자',
  onCancel,
  onConfirm,
}: GeneralVolunteerInterviewAssignModalProps) {
  const useRemoteSchedule = shouldUseRemoteInterviewSchedule(program.id, {
    applicationsUseRemote,
  })
  const slotsQuery = useGeneralInterviewSlots(program.id, open && useRemoteSchedule, {
    applicationsUseRemote,
  })

  const schedule = useMemo(() => {
    if (useRemoteSchedule) {
      return parseGeneralInterviewScheduleFromRemoteSlots(slotsQuery.data ?? [])
    }
    // mock 신청 목록·mock 프로그램: DEFAULT(2026.09~10) — 목록 slotCount·연민트와 동일 SSOT
    return parseGeneralInterviewScheduleFromDefaultMock()
  }, [slotsQuery.data, useRemoteSchedule])

  const modalApplicant = useMemo(
    () =>
      toInterviewAssignModalApplicant(applicant, {
        clearExistingAssignment: mode === 'reassign',
      }),
    [applicant, mode]
  )

  const waitingRemoteSlots = useRemoteSchedule && open && slotsQuery.isLoading

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
          subjectNoun={subjectNoun}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )}
    </>
  )
}
