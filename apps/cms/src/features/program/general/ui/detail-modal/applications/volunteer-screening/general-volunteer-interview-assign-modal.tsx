import { useEffect, useMemo } from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { useGeneralInterviewSlots } from '@/features/program/general/hooks/use-general-interview-slots'
import {
  parseGeneralInterviewScheduleFromProgram,
  parseGeneralInterviewScheduleFromRemoteSlots,
  shouldUseRemoteInterviewSchedule,
} from '@/features/program/general/lib/general-interview-assign-schedule-utils'
import { resolveGeneralProgramForDetail } from '@/features/program/general/lib/detail-meta'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
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
  /** 신청 목록이 remote인지. false면 면접 스케줄 API 미사용(unavailable 안내). */
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
  const localProgramDetail = resolveGeneralProgramForDetail(program.id)
  const useLocalInterviewSchedule = !useRemoteSchedule && localProgramDetail != null
  const slotsQuery = useGeneralInterviewSlots(program.id, open && useRemoteSchedule, {
    applicationsUseRemote,
  })

  useEffect(() => {
    if (!open || useRemoteSchedule || useLocalInterviewSchedule) return
    notifyProgramApiUnavailable('general-volunteer-interview-assign-schedule', '봉사자 면접일 배정')
    onCancel()
  }, [open, onCancel, useLocalInterviewSchedule, useRemoteSchedule])

  const schedule = useMemo(() => {
    if (useRemoteSchedule) {
      return parseGeneralInterviewScheduleFromRemoteSlots(slotsQuery.data ?? [])
    }
    if (useLocalInterviewSchedule && localProgramDetail) {
      return parseGeneralInterviewScheduleFromProgram(localProgramDetail)
    }
    return parseGeneralInterviewScheduleFromRemoteSlots([])
  }, [localProgramDetail, slotsQuery.data, useLocalInterviewSchedule, useRemoteSchedule])

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
