import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton, CmsRadio } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  buildActivityWithdrawGuideDescription,
  type ActivityWithdrawGuideSubjectKind,
} from '@/features/program/shared/lib/activity-withdraw-schedule'
import type { ApplicationGiveUpRequestFaultParty } from '@/shared/api/generated/dashboard/schemas/applicationGiveUpRequestFaultParty'
import { ApplicationGiveUpRequestFaultParty as FaultParty } from '@/shared/api/generated/dashboard/schemas/applicationGiveUpRequestFaultParty'
import './activity-withdraw-modal.css'

const MODAL_Z_INDEX = 1100

export type UjatEducationProgressActivityWithdrawPayload = {
  stopScheduleRowId?: string
  faultParty: ApplicationGiveUpRequestFaultParty
}

export type UjatEducationProgressActivityWithdrawScheduleOption = {
  value: string
  label: string
}

export type UjatEducationProgressActivityWithdrawModalProps = {
  open: boolean
  /** 기관명 또는 봉사자명 */
  participantName: string
  /** 본문 `[이름] 님의` / `[기관명]의` */
  subjectKind?: ActivityWithdrawGuideSubjectKind
  scheduleOptions: ReadonlyArray<UjatEducationProgressActivityWithdrawScheduleOption>
  /** 기본 true. false면 일정 없이 확인 가능(stopScheduleId 생략) */
  requireSchedule?: boolean
  submitting?: boolean
  onCancel: () => void
  onConfirm: (payload: UjatEducationProgressActivityWithdrawPayload) => void
}

export function UjatEducationProgressActivityWithdrawModal({
  open,
  participantName,
  subjectKind = 'institution',
  scheduleOptions,
  requireSchedule = true,
  submitting = false,
  onCancel,
  onConfirm,
}: UjatEducationProgressActivityWithdrawModalProps) {
  const [stopScheduleRowId, setStopScheduleRowId] = useState<string | undefined>(undefined)
  const [faultParty, setFaultParty] = useState<ApplicationGiveUpRequestFaultParty>(FaultParty.USER)

  useEffect(() => {
    if (!open) return
    setStopScheduleRowId(undefined)
    setFaultParty(FaultParty.USER)
  }, [open])

  const hasScheduleOptions = scheduleOptions.length > 0

  const canConfirm = useMemo(() => {
    if (submitting) return false
    if (!requireSchedule) return true
    if (!hasScheduleOptions || !stopScheduleRowId) return false
    return scheduleOptions.some(option => option.value === stopScheduleRowId)
  }, [hasScheduleOptions, requireSchedule, scheduleOptions, stopScheduleRowId, submitting])

  const handleCancel = useCallback(() => {
    if (submitting) return
    setStopScheduleRowId(undefined)
    setFaultParty(FaultParty.USER)
    onCancel()
  }, [onCancel, submitting])

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return
    if (requireSchedule && !stopScheduleRowId) return
    onConfirm({
      ...(stopScheduleRowId ? { stopScheduleRowId } : {}),
      faultParty,
    })
    setStopScheduleRowId(undefined)
    setFaultParty(FaultParty.USER)
  }, [canConfirm, faultParty, onConfirm, requireSchedule, stopScheduleRowId])

  const footer = (
    <div className="ujat-education-progress-activity-withdraw-modal__footer">
      <CmsButton
        variant="secondary"
        size="h40"
        type="button"
        disabled={submitting}
        onClick={handleCancel}
      >
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="h40"
        type="button"
        loading={submitting}
        disabled={!canConfirm || submitting}
        onClick={handleConfirm}
      >
        활동 포기
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="활동 포기 안내"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-education-progress-activity-withdraw-modal"
      wrapClassName="ujat-education-progress-activity-withdraw-modal-wrap"
      footer={footer}
      description={buildActivityWithdrawGuideDescription(participantName, subjectKind)}
    >
      <div className="ujat-education-progress-activity-withdraw-modal__form">
        <CmsSelect
          label="교육 일정"
          required
          inputSize="medium"
          width="100%"
          withAllOption={false}
          placeholder="활동 포기 처리할 일정을 선택해 주세요"
          value={stopScheduleRowId}
          disabled={!hasScheduleOptions || submitting}
          onChange={value => setStopScheduleRowId(value == null ? undefined : String(value))}
          options={[...scheduleOptions]}
          aria-label="교육 일정"
        />
        <CmsRadio.Group
          label="귀책 사유"
          required
          size="medium"
          value={faultParty}
          disabled={submitting}
          onChange={event => {
            const next = event.target.value
            if (next !== FaultParty.USER && next !== FaultParty.ADMIN) return
            setFaultParty(next)
          }}
        >
          <CmsRadio value={FaultParty.USER} size="medium">
            사용자 귀책
          </CmsRadio>
          <CmsRadio value={FaultParty.ADMIN} size="medium">
            관리자 귀책
          </CmsRadio>
        </CmsRadio.Group>
      </div>
    </ContentModal>
  )
}
