import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import '../shared/assign-modal.css'

const MODAL_Z_INDEX = 1100

export type RegionBlockedDateModalPayload = {
  volunteerId: string
  blockedDateLabels: string[]
  substituteVolunteerId: string
}

export type RegionBlockedDateModalProps = {
  open: boolean
  volunteerOptions: ReadonlyArray<{ value: string; label: string }>
  educationDateOptions: ReadonlyArray<{ value: string; label: string }>
  getSubstituteVolunteerOptions: (
    volunteerId: string,
    blockedDateLabels: string[]
  ) => ReadonlyArray<{ value: string; label: string }>
  onCancel: () => void
  onConfirm: (payload: RegionBlockedDateModalPayload) => void
}

export function RegionBlockedDateModal({
  open,
  volunteerOptions,
  educationDateOptions,
  getSubstituteVolunteerOptions,
  onCancel,
  onConfirm,
}: RegionBlockedDateModalProps) {
  const [volunteerId, setVolunteerId] = useState<string | undefined>(undefined)
  const [blockedDateLabels, setBlockedDateLabels] = useState<string[]>([])
  const [substituteVolunteerId, setSubstituteVolunteerId] = useState<string | undefined>(
    undefined
  )

  const substituteVolunteerOptions = useMemo(() => {
    if (!volunteerId || blockedDateLabels.length === 0) return []
    return getSubstituteVolunteerOptions(volunteerId, blockedDateLabels)
  }, [blockedDateLabels, getSubstituteVolunteerOptions, volunteerId])

  useEffect(() => {
    if (!open) return
    setVolunteerId(undefined)
    setBlockedDateLabels([])
    setSubstituteVolunteerId(undefined)
  }, [open])

  useEffect(() => {
    setSubstituteVolunteerId(undefined)
  }, [volunteerId, blockedDateLabels])

  const canConfirm = useMemo(() => {
    if (!volunteerId || blockedDateLabels.length === 0 || !substituteVolunteerId) {
      return false
    }
    return (
      volunteerOptions.some(option => option.value === volunteerId) &&
      blockedDateLabels.every(label =>
        educationDateOptions.some(option => option.value === label)
      ) &&
      substituteVolunteerOptions.some(option => option.value === substituteVolunteerId)
    )
  }, [
    blockedDateLabels,
    educationDateOptions,
    substituteVolunteerId,
    substituteVolunteerOptions,
    volunteerId,
    volunteerOptions,
  ])

  const handleCancel = useCallback(() => {
    setVolunteerId(undefined)
    setBlockedDateLabels([])
    setSubstituteVolunteerId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm || !volunteerId || !substituteVolunteerId) return
    onConfirm({
      volunteerId,
      blockedDateLabels,
      substituteVolunteerId,
    })
    setVolunteerId(undefined)
    setBlockedDateLabels([])
    setSubstituteVolunteerId(undefined)
  }, [blockedDateLabels, canConfirm, onConfirm, substituteVolunteerId, volunteerId])

  const footer = (
    <div className="ujat-assignment-assign-modal__footer">
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
        배정 불가 설정
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="배정 불가일 설정"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-assignment-assign-modal"
      wrapClassName="ujat-assignment-assign-modal-wrap"
      footer={footer}
      description={
        '배정이 불가한 일정을 설정할 봉사자 및 날짜를 선택해 주세요.\n해당 일정에 교육이 배정되어 있는 경우, 다른 봉사자를 지정해 주세요.'
      }
    >
      <div className="ujat-assignment-assign-modal__form">
        <div className="ujat-assignment-assign-modal__field">
          <span className="ujat-assignment-assign-modal__label">봉사자명</span>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder="봉사자명을 선택해 주세요"
            value={volunteerId}
            disabled={volunteerOptions.length === 0}
            onChange={value => {
              setVolunteerId(value == null ? undefined : String(value))
              setSubstituteVolunteerId(undefined)
            }}
            options={[...volunteerOptions]}
            aria-label="봉사자명"
          />
        </div>

        <div className="ujat-assignment-assign-modal__field">
          <span className="ujat-assignment-assign-modal__label">배정 불가일</span>
          <CmsSelect
            mode="multiple"
            inputSize="large"
            width="100%"
            withAllOption={false}
            allowClear
            placeholder="배정 불가한 날짜를 선택해 주세요"
            value={blockedDateLabels}
            disabled={!volunteerId || educationDateOptions.length === 0}
            onChange={value => {
              const next = Array.isArray(value) ? value.map(String) : []
              setBlockedDateLabels(next)
              setSubstituteVolunteerId(undefined)
            }}
            options={[...educationDateOptions]}
            aria-label="배정 불가일"
          />
        </div>

        <div className="ujat-assignment-assign-modal__field">
          <span className="ujat-assignment-assign-modal__label">대체 봉사자</span>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder={
              !volunteerId
                ? '봉사자명을 먼저 선택해 주세요'
                : blockedDateLabels.length === 0
                  ? '배정 불가일을 먼저 선택해 주세요'
                  : substituteVolunteerOptions.length === 0
                    ? '선택 가능한 대체 봉사자가 없습니다'
                    : '대체 봉사자를 선택해 주세요'
            }
            value={substituteVolunteerId}
            disabled={!volunteerId || blockedDateLabels.length === 0}
            onChange={value =>
              setSubstituteVolunteerId(value == null ? undefined : String(value))
            }
            options={[...substituteVolunteerOptions]}
            aria-label="대체 봉사자"
          />
        </div>
      </div>
    </ContentModal>
  )
}
