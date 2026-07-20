import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { ParticipatingInstructorActivityWithdrawScheduleOption } from '@/features/program/general/lib/participating-instructor-activity-withdraw'
import './participating-instructor-activity-withdraw-modal.css'

const MODAL_Z_INDEX = 1100

const ACTIVITY_WITHDRAW_CONFIRM_VALUE = '활동 포기'

const ACTIVITY_WITHDRAW_CONFIRM_PLACEHOLDER =
  '활동 포기 처리하시려면 해당란에 [활동 포기]를 입력해 주세요.'

export type ParticipatingInstructorActivityWithdrawModalPayload = {
  stopScheduleId?: string
}

export type ParticipatingInstructorActivityWithdrawModalProps = {
  open: boolean
  instructorName: string
  scheduleOptions: ReadonlyArray<ParticipatingInstructorActivityWithdrawScheduleOption>
  onCancel: () => void
  onConfirm: (payload: ParticipatingInstructorActivityWithdrawModalPayload) => void
}

export function ParticipatingInstructorActivityWithdrawModal({
  open,
  instructorName,
  scheduleOptions,
  onCancel,
  onConfirm,
}: ParticipatingInstructorActivityWithdrawModalProps) {
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
    if (!hasScheduleOptions) return true
    if (!stopScheduleRowId) return false
    return scheduleOptions.some(option => option.value === stopScheduleRowId)
  }, [confirmKeyword, hasScheduleOptions, scheduleOptions, stopScheduleRowId])

  const handleCancel = useCallback(() => {
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return
    onConfirm({
      stopScheduleId: hasScheduleOptions ? stopScheduleRowId : undefined,
    })
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
  }, [canConfirm, hasScheduleOptions, onConfirm, stopScheduleRowId])

  const description = hasScheduleOptions
    ? `**[${instructorName}]** 강사의 프로그램 참여 활동을 기관 사유로 포기 처리하시겠습니까?\n진행된 교육 일정이 있으면 활동 중단일까지 실적에 반영되며, 이후 일정은 반영되지 않습니다.\n활동을 중단할 교육 일정을 선택해 주세요.`
    : `**[${instructorName}]** 강사의 프로그램 참여 활동을 기관 사유로 포기 처리하시겠습니까?\n진행된 교육 일정이 없어 즉시 활동 포기 처리됩니다.`

  const footer = (
    <div className="participating-instructor-activity-withdraw-modal__footer">
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
      className="participating-instructor-activity-withdraw-modal"
      wrapClassName="participating-instructor-activity-withdraw-modal-wrap"
      footer={footer}
      description={description}
    >
      <div className="participating-instructor-activity-withdraw-modal__form">
        <CmsInput
          inputSize="large"
          width="100%"
          placeholder={ACTIVITY_WITHDRAW_CONFIRM_PLACEHOLDER}
          value={confirmKeyword}
          onChange={event => setConfirmKeyword(event.target.value)}
          autoComplete="off"
          aria-label="활동 포기 확인 입력"
        />

        {hasScheduleOptions ? (
          <div className="participating-instructor-activity-withdraw-modal__field">
            <span className="participating-instructor-activity-withdraw-modal__label">
              활동 중단일
            </span>
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder="활동 중단일을 선택해 주세요"
              value={stopScheduleRowId}
              onChange={value =>
                setStopScheduleRowId(value == null ? undefined : String(value))
              }
              options={[...scheduleOptions]}
              aria-label="활동 중단일"
            />
          </div>
        ) : null}
      </div>
    </ContentModal>
  )
}
