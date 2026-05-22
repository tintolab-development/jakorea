import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import './ujat-education-progress-activity-withdraw-modal.css'

const MODAL_Z_INDEX = 1100

const ACTIVITY_WITHDRAW_CONFIRM_VALUE = '활동 포기'

const ACTIVITY_WITHDRAW_CONFIRM_PLACEHOLDER =
  '활동 포기 처리하시려면 해당란에 [활동 포기]를 입력해 주세요.'

export type UjatEducationProgressActivityWithdrawPayload = {
  stopScheduleRowId: string
}

export type UjatEducationProgressActivityWithdrawScheduleOption = {
  value: string
  label: string
}

export type UjatEducationProgressActivityWithdrawModalProps = {
  open: boolean
  institutionName: string
  scheduleOptions: ReadonlyArray<UjatEducationProgressActivityWithdrawScheduleOption>
  onCancel: () => void
  onConfirm: (payload: UjatEducationProgressActivityWithdrawPayload) => void
}

export function UjatEducationProgressActivityWithdrawModal({
  open,
  institutionName,
  scheduleOptions,
  onCancel,
  onConfirm,
}: UjatEducationProgressActivityWithdrawModalProps) {
  const [confirmKeyword, setConfirmKeyword] = useState('')
  const [stopScheduleRowId, setStopScheduleRowId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
  }, [open])

  const hasScheduleOptions = scheduleOptions.length > 0

  const canConfirm = useMemo(() => {
    if (!hasScheduleOptions) return false
    if (confirmKeyword.trim() !== ACTIVITY_WITHDRAW_CONFIRM_VALUE) return false
    if (!stopScheduleRowId) return false
    return scheduleOptions.some(option => option.value === stopScheduleRowId)
  }, [confirmKeyword, hasScheduleOptions, scheduleOptions, stopScheduleRowId])

  const handleCancel = useCallback(() => {
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm || !stopScheduleRowId) return
    onConfirm({ stopScheduleRowId })
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
  }, [canConfirm, onConfirm, stopScheduleRowId])

  const footer = (
    <div className="ujat-education-progress-activity-withdraw-modal__footer">
      <CmsButton variant="secondary" size="large" type="button" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton
        variant="delete"
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
      className="ujat-education-progress-activity-withdraw-modal"
      wrapClassName="ujat-education-progress-activity-withdraw-modal-wrap"
      footer={footer}
      description={`**[${institutionName}]**의 프로그램 참여 활동을 포기 처리하시겠습니까?\n활동을 중단할 교육 일정을 선택해 주세요`}
    >
      <div className="ujat-education-progress-activity-withdraw-modal__form">
        <CmsInput
          inputSize="large"
          width="100%"
          placeholder={ACTIVITY_WITHDRAW_CONFIRM_PLACEHOLDER}
          value={confirmKeyword}
          onChange={event => setConfirmKeyword(event.target.value)}
          autoComplete="off"
          aria-label="활동 포기 확인 입력"
        />

        <div className="ujat-education-progress-activity-withdraw-modal__field">
          <span className="ujat-education-progress-activity-withdraw-modal__label">활동 중단일</span>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder="활동 중단일을 선택해 주세요"
            value={stopScheduleRowId}
            disabled={!hasScheduleOptions}
            onChange={value =>
              setStopScheduleRowId(value == null ? undefined : String(value))
            }
            options={[...scheduleOptions]}
            aria-label="활동 중단일"
          />
        </div>
      </div>
    </ContentModal>
  )
}
