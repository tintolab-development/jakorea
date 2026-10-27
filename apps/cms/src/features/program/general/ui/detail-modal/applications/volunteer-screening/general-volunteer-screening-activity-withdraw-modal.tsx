import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsRadio } from '@/shared/ui/cms-radio'
import type { ActivityWithdrawScheduleOption } from '@/features/program/shared/lib/activity-withdraw-schedule'
import { buildGeneralVolunteerScreeningActivityWithdrawDescription } from '@/features/program/general/lib/general-volunteer-activity-withdraw'
import type { ApplicationGiveUpRequestFaultParty } from '@/shared/api/generated/dashboard/schemas/applicationGiveUpRequestFaultParty'
import { ApplicationGiveUpRequestFaultParty as FaultParty } from '@/shared/api/generated/dashboard/schemas/applicationGiveUpRequestFaultParty'
import '@/features/program/shared/ui/activity-withdraw-schedule-modal.css'

const MODAL_Z_INDEX = 2500

export type GeneralVolunteerScreeningActivityWithdrawModalPayload = {
  stopSessionKey: string
  stopScheduleLabel: string
  faultParty: ApplicationGiveUpRequestFaultParty
}

export type GeneralVolunteerScreeningActivityWithdrawModalProps = {
  open: boolean
  volunteerName: string
  scheduleOptions: ReadonlyArray<ActivityWithdrawScheduleOption>
  confirming?: boolean
  onCancel: () => void
  onConfirm: (payload: GeneralVolunteerScreeningActivityWithdrawModalPayload) => void | Promise<void>
}

export function GeneralVolunteerScreeningActivityWithdrawModal({
  open,
  volunteerName,
  scheduleOptions,
  confirming = false,
  onCancel,
  onConfirm,
}: GeneralVolunteerScreeningActivityWithdrawModalProps) {
  const [stopSessionKey, setStopSessionKey] = useState<string | undefined>(undefined)
  const [faultParty, setFaultParty] = useState<ApplicationGiveUpRequestFaultParty>(FaultParty.USER)

  useEffect(() => {
    if (!open) return
    setStopSessionKey(undefined)
    setFaultParty(FaultParty.USER)
  }, [open])

  const hasScheduleOptions = scheduleOptions.length > 0

  const selectedOption = useMemo(
    () => scheduleOptions.find(option => option.value === stopSessionKey),
    [scheduleOptions, stopSessionKey]
  )

  const canConfirm =
    selectedOption != null && hasScheduleOptions && !confirming

  const handleCancel = useCallback(() => {
    if (confirming) return
    onCancel()
  }, [confirming, onCancel])

  const handleConfirm = useCallback(() => {
    if (!selectedOption || confirming) return
    void onConfirm({
      stopSessionKey: selectedOption.value,
      stopScheduleLabel: selectedOption.label,
      faultParty,
    })
  }, [confirming, faultParty, onConfirm, selectedOption])

  const footer = (
    <div className="activity-withdraw-schedule-modal__footer">
      <CmsButton
        variant="secondary"
        size="large"
        type="button"
        disabled={confirming}
        onClick={handleCancel}
      >
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        disabled={!canConfirm}
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
      className="activity-withdraw-schedule-modal"
      wrapClassName="activity-withdraw-schedule-modal-wrap"
      footer={footer}
      description={buildGeneralVolunteerScreeningActivityWithdrawDescription(volunteerName)}
    >
      <div className="activity-withdraw-schedule-modal__form">
        <CmsSelect
          label="교육 일정"
          required
          inputSize="large"
          width="100%"
          withAllOption={false}
          placeholder="활동 포기 처리할 일정을 선택해 주세요."
          value={stopSessionKey}
          disabled={!hasScheduleOptions || confirming}
          onChange={value => setStopSessionKey(value == null ? undefined : String(value))}
          options={[...scheduleOptions]}
        />
        <CmsRadio.Group
          label="귀책 사유"
          required
          size="medium"
          value={faultParty}
          disabled={confirming}
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
