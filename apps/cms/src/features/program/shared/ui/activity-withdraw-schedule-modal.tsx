import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { ActivityWithdrawScheduleOption } from '@/features/program/shared/lib/activity-withdraw-schedule'
import './activity-withdraw-schedule-modal.css'

const MODAL_Z_INDEX = 1100

const ACTIVITY_WITHDRAW_DESCRIPTION =
  '선택한 교육 일정을 기준으로 해당 일정부터 활동 포기 처리됩니다.\n활동 포기 처리 후에는 되돌릴 수 없으며, 실적에 반영되지 않습니다.'

export type ActivityWithdrawScheduleModalPayload = {
  stopSessionKey: string
  stopScheduleLabel: string
}

export type ActivityWithdrawScheduleModalProps = {
  open: boolean
  scheduleOptions: ReadonlyArray<ActivityWithdrawScheduleOption>
  onCancel: () => void
  onConfirm: (payload: ActivityWithdrawScheduleModalPayload) => void
}

export function ActivityWithdrawScheduleModal({
  open,
  scheduleOptions,
  onCancel,
  onConfirm,
}: ActivityWithdrawScheduleModalProps) {
  const [stopSessionKey, setStopSessionKey] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setStopSessionKey(undefined)
  }, [open])

  const hasScheduleOptions = scheduleOptions.length > 0

  const selectedOption = useMemo(
    () => scheduleOptions.find(option => option.value === stopSessionKey),
    [scheduleOptions, stopSessionKey]
  )

  const canConfirm = selectedOption != null

  const handleCancel = useCallback(() => {
    setStopSessionKey(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!selectedOption) return
    onConfirm({
      stopSessionKey: selectedOption.value,
      stopScheduleLabel: selectedOption.label,
    })
    setStopSessionKey(undefined)
  }, [onConfirm, selectedOption])

  const footer = (
    <div className="activity-withdraw-schedule-modal__footer">
      <CmsButton variant="secondary" size="large" type="button" onClick={handleCancel}>
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
      </div>
    </ContentModal>
  )
}
