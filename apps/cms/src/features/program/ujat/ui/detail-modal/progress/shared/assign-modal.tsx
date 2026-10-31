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
  /** 선택한 학급 슬롯의 서버 후보 (GET direct-assignment-candidates) */
  volunteerOptions: ReadonlyArray<UjatAssignmentAssignSelectOption>
  volunteerOptionsLoading?: boolean
  volunteerOptionsError?: string | null
  /** 1인 슬롯이면 기존 배정 봉사자 이름 — 두 번째 봉사자 배정 안내 */
  existingPrimaryVolunteerName?: string | null
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

function resolveRegionDirectVolunteerPlaceholder(input: {
  classSlotId: string | undefined
  loading: boolean
  optionCount: number
}): string {
  if (!input.classSlotId) return '교육 학급을 먼저 선택해 주세요'
  if (input.loading) return '배정 가능한 봉사자를 불러오는 중입니다'
  if (input.optionCount === 0) return '배정 가능한 봉사자가 없습니다'
  return '배정할 봉사자명을 선택해 주세요'
}

function UjatRegionDirectAssignModalContent({
  open,
  classOptions,
  volunteerOptions,
  volunteerOptionsLoading = false,
  volunteerOptionsError = null,
  existingPrimaryVolunteerName = null,
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

  const isSecondaryAssign = Boolean(classSlotId && existingPrimaryVolunteerName)

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
      title="교육일 직접 배정"
      description={
        isSecondaryAssign
          ? `**[${existingPrimaryVolunteerName}]** 봉사자 1인이 배정된 학급입니다. 함께 진행할 두 번째 봉사자를 선택해 주세요.`
          : '직접 배정할 교육 학급을 선택 후 봉사자를 배정해 주세요.'
      }
      confirmLabel={isSecondaryAssign ? '두 번째 봉사자 배정' : '직접 배정'}
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
          onChange={value => selectClassSlot(value == null ? undefined : String(value))}
          options={[...classOptions]}
          aria-label="교육 학급"
        />
      </AssignModalField>
      <AssignModalField label={isSecondaryAssign ? '두 번째 봉사자' : '봉사자명'}>
        <CmsSelect
          inputSize="large"
          width="100%"
          withAllOption={false}
          placeholder={resolveRegionDirectVolunteerPlaceholder({
            classSlotId,
            loading: volunteerOptionsLoading,
            optionCount: volunteerOptions.length,
          })}
          value={volunteerId}
          disabled={!classSlotId || volunteerOptionsLoading || volunteerOptions.length === 0}
          onChange={value => setVolunteerId(value == null ? undefined : String(value))}
          options={[...volunteerOptions]}
          aria-label={isSecondaryAssign ? '두 번째 봉사자' : '봉사자명'}
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
