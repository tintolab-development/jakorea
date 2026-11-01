import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { ParticipatingInstructorActivityWithdrawScheduleOption } from '@/features/program/general/lib/participating-instructor-activity-withdraw'
import {
  INSTRUCTOR_JA_FAULT_PARTY_HINT,
  INSTRUCTOR_JA_FAULT_PARTY_REQUIRED_MESSAGE,
} from '@/shared/constants/messages'
import './participating-instructor-activity-withdraw-modal.css'

const MODAL_Z_INDEX = 1100

const ACTIVITY_WITHDRAW_CONFIRM_VALUE = '활동 포기'

const ACTIVITY_WITHDRAW_CONFIRM_PLACEHOLDER =
  '활동 포기 처리하시려면 해당란에 [활동 포기]를 입력해 주세요.'

export type ParticipatingInstructorActivityWithdrawModalPayload = {
  stopScheduleId?: string
  faultParty: 'USER' | 'ADMIN'
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
  const [faultParty, setFaultParty] = useState<'USER' | 'ADMIN' | undefined>(undefined)
  const [faultPartyError, setFaultPartyError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
    setFaultParty(undefined)
    setFaultPartyError(null)
  }, [open])

  const hasScheduleOptions = scheduleOptions.length > 0

  const canConfirm = useMemo(() => {
    if (confirmKeyword.trim() !== ACTIVITY_WITHDRAW_CONFIRM_VALUE) return false
    if (faultParty !== 'USER' && faultParty !== 'ADMIN') return false
    if (!hasScheduleOptions) return true
    if (!stopScheduleRowId) return false
    return scheduleOptions.some(option => option.value === stopScheduleRowId)
  }, [confirmKeyword, faultParty, hasScheduleOptions, scheduleOptions, stopScheduleRowId])

  const handleCancel = useCallback(() => {
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return
    if (faultParty !== 'USER' && faultParty !== 'ADMIN') {
      setFaultPartyError(INSTRUCTOR_JA_FAULT_PARTY_REQUIRED_MESSAGE)
      return
    }
    onConfirm({
      stopScheduleId: hasScheduleOptions ? stopScheduleRowId : undefined,
      faultParty,
    })
    setConfirmKeyword('')
    setStopScheduleRowId(undefined)
  }, [canConfirm, faultParty, hasScheduleOptions, onConfirm, stopScheduleRowId])

  const description = hasScheduleOptions
    ? `**[${instructorName}]** 강사의 프로그램 참여 활동을 포기 처리하시겠습니까?\n진행된 교육 일정이 있으면 활동 중단일까지 실적에 반영되며, 이후 일정은 반영되지 않습니다.\n활동을 중단할 교육 일정을 선택해 주세요.`
    : `**[${instructorName}]** 강사의 프로그램 참여 활동을 포기 처리하시겠습니까?\n진행된 교육 일정이 없어 즉시 활동 포기 처리됩니다.`

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
      className="participating-instructor-activity-withdraw-modal"
      wrapClassName="participating-instructor-activity-withdraw-modal-wrap"
      footer={footer}
      description={description}
    >
      <div className="participating-instructor-activity-withdraw-modal__form">
        <div className="participating-instructor-activity-withdraw-modal__field">
          <span className="participating-instructor-activity-withdraw-modal__label">
            취소 귀책
          </span>
          <CmsRadio.Group
            size="medium"
            value={faultParty}
            onChange={event => {
              const next = event.target.value
              if (next !== 'USER' && next !== 'ADMIN') return
              setFaultParty(next)
              setFaultPartyError(null)
            }}
          >
            <CmsRadio value="USER" size="medium">
              강사 사유
            </CmsRadio>
            <CmsRadio value="ADMIN" size="medium">
              운영 사유
            </CmsRadio>
          </CmsRadio.Group>
          <p className="participating-instructor-activity-withdraw-modal__hint">
            {INSTRUCTOR_JA_FAULT_PARTY_HINT}
          </p>
          {faultPartyError ? (
            <span className="participating-instructor-activity-withdraw-modal__error" role="alert">
              {faultPartyError}
            </span>
          ) : null}
        </div>
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
