import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import './activity-withdraw-modal.css'

const MODAL_Z_INDEX = 1100

const ACTIVITY_WITHDRAW_CONFIRM_VALUE = '활동 포기'

const ACTIVITY_WITHDRAW_CONFIRM_PLACEHOLDER =
  '활동 포기 처리하시려면 해당란에 [활동 포기]를 입력해 주세요.'

export type UjatEducationProgressActivityWithdrawPayload = {
  stopScheduleRowId?: string
}

export type UjatEducationProgressActivityWithdrawScheduleOption = {
  value: string
  label: string
}

export type UjatEducationProgressActivityWithdrawModalProps = {
  open: boolean
  /** 기관명 또는 봉사자명 */
  participantName: string
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
  scheduleOptions,
  requireSchedule = true,
  submitting = false,
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
    if (confirmKeyword.trim() !== ACTIVITY_WITHDRAW_CONFIRM_VALUE) return false
    if (!requireSchedule) return true
    if (!hasScheduleOptions || !stopScheduleRowId) return false
    return scheduleOptions.some(option => option.value === stopScheduleRowId)
  }, [confirmKeyword, hasScheduleOptions, requireSchedule, scheduleOptions, stopScheduleRowId])

  const handleCancel = useCallback(() => {
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return
    if (requireSchedule && !stopScheduleRowId) return
    onConfirm(stopScheduleRowId ? { stopScheduleRowId } : {})
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
  }, [canConfirm, onConfirm, requireSchedule, stopScheduleRowId])

  const footer = (
    <div className="ujat-education-progress-activity-withdraw-modal__footer">
      <CmsButton
        variant="secondary"
        size="large"
        type="button"
        disabled={submitting}
        onClick={handleCancel}
      >
        취소
      </CmsButton>
      <CmsButton
        variant="delete"
        size="large"
        type="button"
        loading={submitting}
        disabled={!canConfirm || submitting}
        onClick={handleConfirm} >
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
      description={`**[${participantName}]**의 프로그램 참여 활동을 포기 처리하시겠습니까?\n활동을 중단할 교육 일정을 선택해 주세요`}
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
