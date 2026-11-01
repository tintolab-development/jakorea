import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import '../shared/assign-modal.css'

const MODAL_Z_INDEX = 1100

export type RegionBlockedDateModalPayload = {
  volunteerId: string
  blockedDateLabels: string[]
  /** 활성 배정이 있는 불가일이 있을 때만 전송 */
  substituteVolunteerId?: string
}

export type RegionBlockedDateModalProps = {
  open: boolean
  volunteerOptions: ReadonlyArray<{ value: string; label: string }>
  educationDateOptions: ReadonlyArray<{ value: string; label: string }>
  getRequiresReplacement: (volunteerId: string, blockedDateLabels: string[]) => boolean
  getSubstituteVolunteerOptions: (
    volunteerId: string,
    blockedDateLabels: string[]
  ) => ReadonlyArray<{ value: string; label: string }>
  onCancel: () => void
  onConfirm: (payload: RegionBlockedDateModalPayload) => void
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <span className="ujat-assignment-assign-modal__label">
      {children}
      <span className="ujat-assignment-assign-modal__required" aria-hidden>
        *
      </span>
    </span>
  )
}

export function RegionBlockedDateModal({
  open,
  volunteerOptions,
  educationDateOptions,
  getRequiresReplacement,
  getSubstituteVolunteerOptions,
  onCancel,
  onConfirm,
}: RegionBlockedDateModalProps) {
  const [volunteerId, setVolunteerId] = useState<string | undefined>(undefined)
  const [blockedDateLabels, setBlockedDateLabels] = useState<string[]>([])
  const [substituteVolunteerId, setSubstituteVolunteerId] = useState<string | undefined>(
    undefined
  )
  const [formError, setFormError] = useState<string | null>(null)

  const requiresReplacement = useMemo(() => {
    if (!volunteerId || blockedDateLabels.length === 0) return false
    return getRequiresReplacement(volunteerId, blockedDateLabels)
  }, [blockedDateLabels, getRequiresReplacement, volunteerId])

  const substituteVolunteerOptions = useMemo(() => {
    if (!requiresReplacement || !volunteerId || blockedDateLabels.length === 0) return []
    return getSubstituteVolunteerOptions(volunteerId, blockedDateLabels)
  }, [blockedDateLabels, getRequiresReplacement, getSubstituteVolunteerOptions, requiresReplacement, volunteerId])

  useEffect(() => {
    if (!open) return
    setVolunteerId(undefined)
    setBlockedDateLabels([])
    setSubstituteVolunteerId(undefined)
    setFormError(null)
  }, [open])

  useEffect(() => {
    setSubstituteVolunteerId(undefined)
    setFormError(null)
  }, [volunteerId, blockedDateLabels, requiresReplacement])

  const canConfirm = useMemo(() => {
    if (!volunteerId || blockedDateLabels.length === 0) return false
    if (
      !volunteerOptions.some(option => option.value === volunteerId) ||
      !blockedDateLabels.every(label => educationDateOptions.some(option => option.value === label))
    ) {
      return false
    }
    if (!requiresReplacement) return true
    if (!substituteVolunteerId) return false
    return substituteVolunteerOptions.some(option => option.value === substituteVolunteerId)
  }, [
    blockedDateLabels,
    educationDateOptions,
    requiresReplacement,
    substituteVolunteerId,
    substituteVolunteerOptions,
    volunteerId,
    volunteerOptions,
  ])

  const handleCancel = useCallback(() => {
    setVolunteerId(undefined)
    setBlockedDateLabels([])
    setSubstituteVolunteerId(undefined)
    setFormError(null)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!volunteerId || blockedDateLabels.length === 0) return
    if (requiresReplacement) {
      if (!substituteVolunteerId) {
        setFormError('배정된 교육이 있는 날짜에는 대체 봉사자를 선택해 주세요.')
        return
      }
      if (!substituteVolunteerOptions.some(option => option.value === substituteVolunteerId)) {
        setFormError('선택한 대체 봉사자를 다시 확인해 주세요.')
        return
      }
    }
    onConfirm({
      volunteerId,
      blockedDateLabels,
      substituteVolunteerId: requiresReplacement ? substituteVolunteerId : undefined,
    })
    setVolunteerId(undefined)
    setBlockedDateLabels([])
    setSubstituteVolunteerId(undefined)
    setFormError(null)
  }, [
    blockedDateLabels,
    onConfirm,
    requiresReplacement,
    substituteVolunteerId,
    substituteVolunteerOptions,
    volunteerId,
  ])

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
        설정
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="참여 불가일 설정"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-assignment-assign-modal"
      wrapClassName="ujat-assignment-assign-modal-wrap"
      footer={footer}
      description={
        '봉사자가 교육에 참여할 수 없는 날짜를 선택해 주세요.\n해당 날짜에 이미 배정된 교육이 있다면 대체 봉사자를 지정해 주세요.'
      }
    >
      <div className="ujat-assignment-assign-modal__form">
        <div className="ujat-assignment-assign-modal__field">
          <RequiredLabel>봉사자</RequiredLabel>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder={
              volunteerOptions.length === 0
                ? '선택 가능한 봉사자가 없습니다'
                : '봉사자명을 선택해 주세요'
            }
            value={volunteerId}
            disabled={volunteerOptions.length === 0}
            onChange={value => {
              setVolunteerId(value == null ? undefined : String(value))
              setSubstituteVolunteerId(undefined)
            }}
            options={[...volunteerOptions]}
            aria-label="봉사자"
          />
        </div>

        <div className="ujat-assignment-assign-modal__field">
          <RequiredLabel>참여 불가일</RequiredLabel>
          <CmsSelect
            mode="multiple"
            inputSize="large"
            width="100%"
            withAllOption={false}
            allowClear
            placeholder={
              educationDateOptions.length === 0
                ? '선택 가능한 교육일이 없습니다'
                : '참여 불가한 날짜를 선택해 주세요'
            }
            value={blockedDateLabels}
            disabled={!volunteerId || educationDateOptions.length === 0}
            onChange={value => {
              const next = Array.isArray(value) ? value.map(String) : []
              setBlockedDateLabels(next)
              setSubstituteVolunteerId(undefined)
            }}
            options={[...educationDateOptions]}
            aria-label="참여 불가일"
          />
        </div>

        {volunteerId && blockedDateLabels.length > 0 && !requiresReplacement ? (
          <p className="form-editor-template-field-hint-text" role="status">
            선택한 교육일에 배정이 없습니다. 활동 불가만 등록되며 자동 배정에서 제외됩니다.
          </p>
        ) : null}

        {requiresReplacement ? (
          <div className="ujat-assignment-assign-modal__field">
            <RequiredLabel>대체 봉사자</RequiredLabel>
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder={
                substituteVolunteerOptions.length === 0
                  ? '선택 가능한 대체 봉사자가 없습니다'
                  : '대체 봉사자를 선택해 주세요'
              }
              value={substituteVolunteerId}
              disabled={substituteVolunteerOptions.length === 0}
              onChange={value => {
                setSubstituteVolunteerId(value == null ? undefined : String(value))
                setFormError(null)
              }}
              options={[...substituteVolunteerOptions]}
              aria-label="대체 봉사자"
            />
          </div>
        ) : null}

        {formError ? (
          <p
            className="form-editor-template-field-hint-text ujat-assignment-assign-modal__form-error"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
      </div>
    </ContentModal>
  )
}
