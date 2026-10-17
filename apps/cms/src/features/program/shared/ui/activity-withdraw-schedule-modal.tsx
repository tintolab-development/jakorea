import { useCallback, useEffect, useMemo, useState } from 'react'
import { Radio } from 'antd'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import type { ActivityWithdrawScheduleOption } from '@/features/program/shared/lib/activity-withdraw-schedule'
import {
  APPLICATION_GIVE_UP_REASON_MAX_LENGTH,
  validateApplicationGiveUpReason,
} from '@/features/program/shared/lib/application-give-up'
import type { ApplicationGiveUpRequestFaultParty } from '@/shared/api/generated/dashboard/schemas/applicationGiveUpRequestFaultParty'
import { ApplicationGiveUpRequestFaultParty as FaultParty } from '@/shared/api/generated/dashboard/schemas/applicationGiveUpRequestFaultParty'
import './activity-withdraw-schedule-modal.css'

const MODAL_Z_INDEX = 1100

const ACTIVITY_WITHDRAW_DESCRIPTION =
  '선택한 교육 일정을 기준으로 해당 일정부터 활동 포기 처리됩니다.\n활동 포기 처리 후에는 되돌릴 수 없으며, 이전 활동 실적은 정책에 따라 인정됩니다.'

export type ActivityWithdrawScheduleModalPayload = {
  stopSessionKey: string
  stopScheduleLabel: string
  reason: string
  faultParty: ApplicationGiveUpRequestFaultParty
}

export type ActivityWithdrawScheduleModalProps = {
  open: boolean
  scheduleOptions: ReadonlyArray<ActivityWithdrawScheduleOption>
  onCancel: () => void
  onConfirm: (payload: ActivityWithdrawScheduleModalPayload) => void | Promise<void>
  /** 확인 API 진행 중 — 중복 제출·취소 차단 */
  confirming?: boolean
}

export function ActivityWithdrawScheduleModal({
  open,
  scheduleOptions,
  onCancel,
  onConfirm,
  confirming = false,
}: ActivityWithdrawScheduleModalProps) {
  const [stopSessionKey, setStopSessionKey] = useState<string | undefined>(undefined)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [faultParty, setFaultParty] = useState<ApplicationGiveUpRequestFaultParty>(FaultParty.USER)

  useEffect(() => {
    if (!open) return
    setStopSessionKey(undefined)
    setReason('')
    setReasonError(null)
    setFaultParty(FaultParty.USER)
  }, [open])

  const hasScheduleOptions = scheduleOptions.length > 0

  const selectedOption = useMemo(
    () => scheduleOptions.find(option => option.value === stopSessionKey),
    [scheduleOptions, stopSessionKey]
  )

  const canConfirm =
    selectedOption != null && reason.trim().length >= 2 && !confirming && hasScheduleOptions

  const handleCancel = useCallback(() => {
    if (confirming) return
    setStopSessionKey(undefined)
    onCancel()
  }, [confirming, onCancel])

  const handleConfirm = useCallback(() => {
    if (!selectedOption || confirming) return
    const validation = validateApplicationGiveUpReason(reason)
    if (validation) {
      setReasonError(validation)
      return
    }
    void onConfirm({
      stopSessionKey: selectedOption.value,
      stopScheduleLabel: selectedOption.label,
      reason: reason.trim(),
      faultParty,
    })
  }, [confirming, faultParty, onConfirm, reason, selectedOption])

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
      title="활동 포기"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="activity-withdraw-schedule-modal"
      wrapClassName="activity-withdraw-schedule-modal-wrap"
      footer={footer}
      description={ACTIVITY_WITHDRAW_DESCRIPTION}
    >
      <div className="activity-withdraw-schedule-modal__form">
        <div className="activity-withdraw-schedule-modal__field">
          <span className="activity-withdraw-schedule-modal__label">교육 일정</span>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder="활동 포기 처리할 일정을 선택해 주세요."
            value={stopSessionKey}
            disabled={!hasScheduleOptions}
            onChange={value =>
              setStopSessionKey(value == null ? undefined : String(value))
            }
            options={[...scheduleOptions]}
            aria-label="교육 일정"
          />
        </div>
        <div className="activity-withdraw-schedule-modal__field">
          <span className="activity-withdraw-schedule-modal__label">귀책</span>
          <Radio.Group
            value={faultParty}
            onChange={event => setFaultParty(event.target.value)}
            disabled={confirming}
          >
            <Radio value={FaultParty.USER}>사용자 귀책</Radio>
            <Radio value={FaultParty.ADMIN}>관리자 귀책</Radio>
          </Radio.Group>
        </div>
        <CmsTextArea
          label="활동 포기 사유"
          required
          value={reason}
          onChange={event => {
            setReason(event.target.value)
            if (reasonError) setReasonError(null)
          }}
          maxLength={APPLICATION_GIVE_UP_REASON_MAX_LENGTH}
          placeholder="활동 포기 사유를 입력해 주세요."
          error={reasonError != null}
          message={reasonError ?? `${APPLICATION_GIVE_UP_REASON_MAX_LENGTH}자 이내`}
          rows={4}
          width="100%"
          disabled={confirming}
        />
      </div>
    </ContentModal>
  )
}
