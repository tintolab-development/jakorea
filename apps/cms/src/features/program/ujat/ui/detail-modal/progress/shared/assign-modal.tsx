import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatVolunteerAssignmentAssignModalMode } from '../volunteers/detail/assign-mock'
import './assign-modal.css'

const MODAL_Z_INDEX = 1100

export type UjatAssignmentAssignSelectOption = {
  value: string
  label: string
}

const VOLUNTEER_MODAL_TITLE: Record<UjatVolunteerAssignmentAssignModalMode, string> = {
  education: '교육 배정',
  partner: '파트너 배정',
}

export type UjatVolunteerAssignmentAssignModalProps = {
  variant: 'volunteer'
  open: boolean
  mode: UjatVolunteerAssignmentAssignModalMode
  volunteerName: string
  scheduleDateLabel: string
  classOptions: ReadonlyArray<UjatAssignmentAssignSelectOption>
  partnerOptions: ReadonlyArray<UjatAssignmentAssignSelectOption>
  fixedClassLabel?: string | null
  onCancel: () => void
  onConfirm: (payload: { classValue: string; partnerId: string }) => void
}

export type UjatRegionDirectAssignModalProps = {
  variant: 'region_direct'
  open: boolean
  classOptions: ReadonlyArray<UjatAssignmentAssignSelectOption>
  getVolunteerOptions: (classSlotId: string) => ReadonlyArray<UjatAssignmentAssignSelectOption>
  onCancel: () => void
  onConfirm: (payload: { classSlotId: string; volunteerId: string }) => void
}

export type UjatAssignmentAssignModalProps =
  | UjatVolunteerAssignmentAssignModalProps
  | UjatRegionDirectAssignModalProps

/** @deprecated Use `UjatAssignmentAssignModal` */
export const UjatVolunteerAssignmentAssignModal = UjatAssignmentAssignModal

export function UjatAssignmentAssignModal(props: UjatAssignmentAssignModalProps) {
  if (props.variant === 'region_direct') {
    return <UjatRegionDirectAssignModalContent {...props} />
  }
  return <UjatVolunteerAssignModalContent {...props} />
}

function UjatVolunteerAssignModalContent({
  open,
  mode,
  volunteerName,
  scheduleDateLabel,
  classOptions,
  partnerOptions,
  fixedClassLabel = null,
  onCancel,
  onConfirm,
}: Omit<UjatVolunteerAssignmentAssignModalProps, 'variant'>) {
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

  const firstField = (
    <AssignModalField label="배정 학급">
      {isPartnerMode ? (
        <CmsSelect
          inputSize="large"
          width="100%"
          withAllOption={false}
          value={resolvedClassValue}
          disabled
          options={fixedClassLabel ? [{ value: fixedClassLabel, label: fixedClassLabel }] : []}
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
    </AssignModalField>
  )

  const secondField = (
    <AssignModalField label={isPartnerMode ? '파트너' : '파트너명'}>
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
    </AssignModalField>
  )

  return (
    <AssignModalShell
      open={open}
      title={VOLUNTEER_MODAL_TITLE[mode]}
      description={description}
      confirmLabel="배정"
      canConfirm={canConfirm}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    >
      {firstField}
      {secondField}
    </AssignModalShell>
  )
}

function UjatRegionDirectAssignModalContent({
  open,
  classOptions,
  getVolunteerOptions,
  onCancel,
  onConfirm,
}: Omit<UjatRegionDirectAssignModalProps, 'variant'>) {
  const [classSlotId, setClassSlotId] = useState<string | undefined>(undefined)
  const [volunteerId, setVolunteerId] = useState<string | undefined>(undefined)

  const volunteerOptions = useMemo(() => {
    if (!classSlotId) return []
    return getVolunteerOptions(classSlotId)
  }, [classSlotId, getVolunteerOptions])

  useEffect(() => {
    if (!open) return
    setClassSlotId(undefined)
    setVolunteerId(undefined)
  }, [open])

  useEffect(() => {
    setVolunteerId(undefined)
  }, [classSlotId])

  const canConfirm = useMemo(() => {
    if (!classSlotId || !volunteerId) return false
    return (
      classOptions.some(option => option.value === classSlotId) &&
      volunteerOptions.some(option => option.value === volunteerId)
    )
  }, [classOptions, classSlotId, volunteerId, volunteerOptions])

  const handleCancel = useCallback(() => {
    setClassSlotId(undefined)
    setVolunteerId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm || !classSlotId || !volunteerId) return
    onConfirm({ classSlotId, volunteerId })
    setClassSlotId(undefined)
    setVolunteerId(undefined)
  }, [canConfirm, classSlotId, onConfirm, volunteerId])

  return (
    <AssignModalShell
      open={open}
      title="교육일 직접 배정"
      description="직접 배정할 교육 학급을 선택 후 봉사자를 배정해 주세요."
      confirmLabel="직접 배정"
      canConfirm={canConfirm}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    >
      <AssignModalField label="교육 학급">
        <CmsSelect
          inputSize="large"
          width="100%"
          withAllOption={false}
          placeholder="직접 배정할 교육 학급을 선택해 주세요"
          value={classSlotId}
          disabled={classOptions.length === 0}
          onChange={value => {
            setClassSlotId(value == null ? undefined : String(value))
            setVolunteerId(undefined)
          }}
          options={[...classOptions]}
          aria-label="교육 학급"
        />
      </AssignModalField>
      <AssignModalField label="봉사자명">
        <CmsSelect
          inputSize="large"
          width="100%"
          withAllOption={false}
          placeholder={
            classSlotId
              ? '배정할 봉사자명을 선택해 주세요'
              : '교육 학급을 먼저 선택해 주세요'
          }
          value={volunteerId}
          disabled={!classSlotId || volunteerOptions.length === 0}
          onChange={value => setVolunteerId(value == null ? undefined : String(value))}
          options={[...volunteerOptions]}
          aria-label="봉사자명"
        />
      </AssignModalField>
    </AssignModalShell>
  )
}

function AssignModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ujat-assignment-assign-modal__field">
      <span className="ujat-assignment-assign-modal__label">{label}</span>
      {children}
    </div>
  )
}

function AssignModalShell({
  open,
  title,
  description,
  confirmLabel,
  canConfirm,
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  canConfirm: boolean
  onCancel: () => void
  onConfirm: () => void
  children: ReactNode
}) {
  const footer = (
    <div className="ujat-assignment-assign-modal__footer">
      <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        disabled={!canConfirm}
        onClick={onConfirm}
      >
        {confirmLabel}
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-assignment-assign-modal"
      wrapClassName="ujat-assignment-assign-modal-wrap"
      footer={footer}
      description={description}
    >
      <div className="ujat-assignment-assign-modal__form">{children}</div>
    </ContentModal>
  )
}
