import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatVolunteerAssignmentAssignModalMode } from './assign-mock'
import './assign-modal.css'

const MODAL_Z_INDEX = 1100

const MODAL_TITLE: Record<UjatVolunteerAssignmentAssignModalMode, string> = {
  education: '교육 배정',
  partner: '파트너 배정',
}

export type UjatVolunteerAssignmentAssignModalProps = {
  open: boolean
  mode: UjatVolunteerAssignmentAssignModalMode
  volunteerName: string
  scheduleDateLabel: string
  classOptions: ReadonlyArray<{ value: string; label: string }>
  partnerOptions: ReadonlyArray<{ value: string; label: string }>
  fixedClassLabel?: string | null
  onCancel: () => void
  onConfirm: (payload: { classValue: string; partnerId: string }) => void
}

export function UjatVolunteerAssignmentAssignModal({
  open,
  mode,
  volunteerName,
  scheduleDateLabel,
  classOptions,
  partnerOptions,
  fixedClassLabel = null,
  onCancel,
  onConfirm,
}: UjatVolunteerAssignmentAssignModalProps) {
  const [classValue, setClassValue] = useState<string | undefined>(undefined)
  const [partnerId, setPartnerId] = useState<string | undefined>(undefined)

  const isPartnerMode = mode === 'partner'
  const resolvedClassValue = isPartnerMode ? fixedClassLabel ?? undefined : classValue

  useEffect(() => {
    if (!open) return
    setClassValue(isPartnerMode ? fixedClassLabel ?? undefined : undefined)
    setPartnerId(undefined)
  }, [open, isPartnerMode, fixedClassLabel])

  const description = useMemo(() => {
    if (isPartnerMode) {
      return `**[${volunteerName}]** 봉사자의 **[${scheduleDateLabel}]** 교육 파트너로 배정할 봉사자를 선택해 주세요.`
    }
    return `**[${volunteerName}]** 봉사자를 **[${scheduleDateLabel}]** 교육에 배정하시겠습니까?`
  }, [isPartnerMode, scheduleDateLabel, volunteerName])

  const canConfirm = useMemo(() => {
    if (!partnerId) return false
    if (isPartnerMode) return Boolean(fixedClassLabel)
    if (!classValue) return false
    return classOptions.some(option => option.value === classValue)
  }, [classOptions, classValue, fixedClassLabel, isPartnerMode, partnerId])

  const handleCancel = useCallback(() => {
    setClassValue(undefined)
    setPartnerId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm || !partnerId) return
    const confirmedClass = isPartnerMode ? fixedClassLabel ?? '' : classValue ?? ''
    onConfirm({ classValue: confirmedClass, partnerId })
    setClassValue(undefined)
    setPartnerId(undefined)
  }, [canConfirm, classValue, fixedClassLabel, isPartnerMode, onConfirm, partnerId])

  const footer = (
    <div className="ujat-volunteer-assignment-assign-modal__footer">
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
        배정
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title={MODAL_TITLE[mode]}
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-volunteer-assignment-assign-modal"
      wrapClassName="ujat-volunteer-assignment-assign-modal-wrap"
      footer={footer}
      description={description}
    >
      <div className="ujat-volunteer-assignment-assign-modal__form">
        <div className="ujat-volunteer-assignment-assign-modal__field">
          <span className="ujat-volunteer-assignment-assign-modal__label">배정 학급</span>
          {isPartnerMode ? (
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              value={resolvedClassValue}
              disabled
              options={
                fixedClassLabel
                  ? [{ value: fixedClassLabel, label: fixedClassLabel }]
                  : []
              }
              aria-label="배정 학급"
            />
          ) : (
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder="배정할 학급을 선택해 주세요"
              value={classValue}
              disabled={classOptions.length === 0}
              onChange={value => setClassValue(value == null ? undefined : String(value))}
              options={[...classOptions]}
              aria-label="배정 학급"
            />
          )}
        </div>

        <div className="ujat-volunteer-assignment-assign-modal__field">
          <span className="ujat-volunteer-assignment-assign-modal__label">
            {isPartnerMode ? '파트너' : '파트너명'}
          </span>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder="배정할 파트너를 선택해 주세요"
            value={partnerId}
            disabled={partnerOptions.length === 0}
            onChange={value => setPartnerId(value == null ? undefined : String(value))}
            options={[...partnerOptions]}
            aria-label={isPartnerMode ? '파트너' : '파트너명'}
          />
        </div>
      </div>
    </ContentModal>
  )
}
