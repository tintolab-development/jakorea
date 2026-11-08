import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatVolunteerAssignmentAssignModalMode } from '../volunteers/detail/volunteer-assign-modal-data'
import './assign-modal.css'

const MODAL_Z_INDEX = 1100

export type UjatAssignmentAssignSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

const VOLUNTEER_MODAL_TITLE: Record<UjatVolunteerAssignmentAssignModalMode, string> = {
  education: '교육 배정 안내',
  partner: '파트너 배정 안내',
}

export type UjatVolunteerAssignmentAssignModalProps = {
  variant: 'volunteer'
  open: boolean
  mode: UjatVolunteerAssignmentAssignModalMode
  volunteerName: string
  scheduleDateLabel: string
  classOptions: ReadonlyArray<UjatAssignmentAssignSelectOption>
  partnerOptions: ReadonlyArray<UjatAssignmentAssignSelectOption>
  /** GET partner-recommendation 로딩 — 후보 invent 없이 대기 */
  partnerOptionsLoading?: boolean
  fixedClassLabel?: string | null
  onCancel: () => void
  onConfirm: (payload: { classValue: string; partnerId: string }) => void
}

export type UjatRegionDirectAssignModalProps = {
  variant: 'region_direct'
  open: boolean
  classOptions: ReadonlyArray<UjatAssignmentAssignSelectOption>
  /** 선택한 학급 슬롯의 서버 후보 (GET direct-assignment-candidates) */
  volunteerOptions: ReadonlyArray<UjatAssignmentAssignSelectOption>
  volunteerOptionsLoading?: boolean
  volunteerOptionsError?: string | null
  onClassSlotChange: (classSlotId: string | undefined) => void
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
  partnerOptionsLoading = false,
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
      return `**[${volunteerName}]** 님의 **${scheduleDateLabel}** 교육을 함께할 파트너를 선택해 주세요`
    }
    if (classOptions.length === 0) {
      return '배정 가능한 미배정 학급이 없습니다. 기관 임시일정의 학급 슬롯을 확인해 주세요.'
    }
    return `**[${volunteerName}]** 님을 **${scheduleDateLabel}** 교육에 배정하시겠습니까?`
  }, [classOptions.length, isPartnerMode, scheduleDateLabel, volunteerName])

  const canConfirm = useMemo(() => {
    if (partnerOptionsLoading || !partnerId) return false
    if (isPartnerMode) return Boolean(fixedClassLabel)
    if (!classValue) return false
    return classOptions.some(option => option.value === classValue)
  }, [
    classOptions,
    classValue,
    fixedClassLabel,
    isPartnerMode,
    partnerId,
    partnerOptionsLoading,
  ])

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
    <AssignModalField label="배정 학급" required={!isPartnerMode}>
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
    <AssignModalField label="파트너" required>
      <CmsSelect
        inputSize="large"
        width="100%"
        withAllOption={false}
        placeholder={
          partnerOptionsLoading
            ? '파트너 후보를 불러오는 중…'
            : partnerOptions.length === 0
              ? '선택 가능한 파트너가 없습니다'
              : '배정할 파트너를 선택해 주세요'
        }
        value={partnerId}
        disabled={partnerOptionsLoading || partnerOptions.length === 0}
        onChange={value => setPartnerId(value == null ? undefined : String(value))}
        options={[...partnerOptions]}
        aria-label="파트너"
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

function resolveRegionDirectVolunteerPlaceholder(input: {
  classSlotId: string | undefined
  loading: boolean
}): string {
  if (!input.classSlotId) return '교육 학급을 먼저 선택해 주세요'
  if (input.loading) return '배정 가능한 봉사자를 불러오는 중입니다'
  return '배정할 봉사자를 선택해 주세요'
}

function UjatRegionDirectAssignModalContent({
  open,
  classOptions,
  volunteerOptions,
  volunteerOptionsLoading = false,
  volunteerOptionsError = null,
  onClassSlotChange,
  onCancel,
  onConfirm,
}: Omit<UjatRegionDirectAssignModalProps, 'variant'>) {
  const [classSlotId, setClassSlotId] = useState<string | undefined>(undefined)
  const [volunteerId, setVolunteerId] = useState<string | undefined>(undefined)
  const onClassSlotChangeRef = useRef(onClassSlotChange)
  useLayoutEffect(() => {
    onClassSlotChangeRef.current = onClassSlotChange
  }, [onClassSlotChange])

  const selectClassSlot = useCallback((next: string | undefined) => {
    setClassSlotId(next)
    setVolunteerId(undefined)
    onClassSlotChangeRef.current(next)
  }, [])

  useEffect(() => {
    if (!open) return
    selectClassSlot(undefined)
  }, [open, selectClassSlot])

  useEffect(() => {
    if (!classSlotId) return
    const selected = classOptions.find(option => option.value === classSlotId)
    if (!selected || selected.disabled) selectClassSlot(undefined)
  }, [classOptions, classSlotId, selectClassSlot])

  const canConfirm = useMemo(() => {
    if (!classSlotId || !volunteerId || volunteerOptionsLoading) return false
    return (
      classOptions.some(option => option.value === classSlotId && !option.disabled) &&
      volunteerOptions.some(option => option.value === volunteerId)
    )
  }, [classOptions, classSlotId, volunteerId, volunteerOptions, volunteerOptionsLoading])

  const handleCancel = useCallback(() => {
    selectClassSlot(undefined)
    onCancel()
  }, [onCancel, selectClassSlot])

  const handleConfirm = useCallback(() => {
    if (!canConfirm || !classSlotId || !volunteerId) return
    onConfirm({ classSlotId, volunteerId })
    selectClassSlot(undefined)
  }, [canConfirm, classSlotId, onConfirm, selectClassSlot, volunteerId])

  return (
    <AssignModalShell
      open={open}
      title="교육일 직접 배정 안내"
      description={
        classOptions.length === 0
          ? '배정 가능한 교육 학급이 없습니다. 기관 임시일정의 학급 슬롯을 확인해 주세요.'
          : '교육 학급을 선택 후 봉사자를 배정해 주세요.'
      }
      confirmLabel="배정"
      canConfirm={canConfirm}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    >
      <AssignModalField label="교육 학급" required>
        <CmsSelect
          inputSize="large"
          width="100%"
          withAllOption={false}
          placeholder="교육 학급을 선택해 주세요"
          value={classSlotId}
          disabled={classOptions.length === 0}
          onChange={value => selectClassSlot(value == null ? undefined : String(value))}
          options={[...classOptions]}
          aria-label="교육 학급"
        />
      </AssignModalField>
      <AssignModalField label="봉사자" required>
        <CmsSelect
          inputSize="large"
          width="100%"
          withAllOption={false}
          placeholder={resolveRegionDirectVolunteerPlaceholder({
            classSlotId,
            loading: volunteerOptionsLoading,
          })}
          value={volunteerId}
          disabled={!classSlotId || volunteerOptionsLoading || volunteerOptions.length === 0}
          onChange={value => setVolunteerId(value == null ? undefined : String(value))}
          options={[...volunteerOptions]}
          aria-label="봉사자"
        />
        {classSlotId && volunteerOptionsError ? (
          <span className="ujat-assignment-assign-modal__error" role="alert">
            {volunteerOptionsError}
          </span>
        ) : null}
      </AssignModalField>
    </AssignModalShell>
  )
}

function AssignModalField({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="ujat-assignment-assign-modal__field">
      <span className="ujat-assignment-assign-modal__label">
        {label}
        {required ? (
          <span className="ujat-assignment-assign-modal__required" aria-hidden>
            *
          </span>
        ) : null}
      </span>
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
        onClick={onConfirm} >
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
