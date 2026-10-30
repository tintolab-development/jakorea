import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsRadio, CmsSelect, useCmsAlert } from '@/shared/ui'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { useEffect, useState, type ReactNode } from 'react'
import {
  INSTRUCTOR_ROLE_LABELS,
  type InstructorRoleKey,
} from '@/features/program/general/model/school-detail-types'
import type { InstructorAssignSessionOption } from '@/features/program/general/lib/instructor-assign-session-options'
import { InstructorAssignSessionSlotChip } from '@/features/program/shared/ui/detail-modal/components/instructor-assign-session-slot-chip'
import {
  INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD,
  type AssignmentModalStep,
} from '@/features/program/general/lib/institution-select-assign'
import { InstitutionSelectAssignConfirmModal } from './institution-select-assign-confirm-modal'
import { InstitutionAssignCompleteModal } from './institution-assign-complete-modal'
import './school-detail-add-instructor-assign-modal.css'

type InstitutionOption = {
  value: string
  label: string
}

const MODAL_WIDTH = 600

function RequiredFieldLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <span className="school-detail-add-instructor-assign-modal__required" aria-hidden>
        *
      </span>
    </>
  )
}

function AssignSessionTags({
  value,
  onChange,
  options,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  options: InstructorAssignSessionOption[]
}) {
  if (options.length === 0) {
    return (
      <p className="school-detail-add-instructor-assign-modal__session-empty">
        선택 가능한 교육 일정이 없습니다.
      </p>
    )
  }

  return (
    <div
      className="school-detail-add-instructor-assign-modal__session-grid"
      role="group"
      aria-label="교육 배정일 선택"
    >
      {options.map(opt => {
        const selected = value.includes(opt.id)
        const disabled = Boolean(opt.disabled)
        return (
          <InstructorAssignSessionSlotChip
            key={opt.id}
            scheduleLabel={opt.scheduleLabel}
            sessionRoundLabel={opt.sessionRoundLabel}
            capacityLabel={opt.capacityLabel}
            selected={selected}
            disabled={disabled}
            onClick={() => {
              if (disabled) return
              onChange(selected ? value.filter(id => id !== opt.id) : [...value, opt.id])
            }}
          />
        )
      })}
    </div>
  )
}

export interface AssignGuideModalProps {
  open: boolean
  instructorName: string
  institutionOptions: InstitutionOption[]
  selectedInstitutionId: string | null
  role: InstructorRoleKey
  sessionOptions: InstructorAssignSessionOption[]
  selectedSessionIds: string[]
  currentCount: number | null
  requiredCount: number | null
  onInstitutionChange: (id: string | null) => void
  onRoleChange: (role: InstructorRoleKey) => void
  onSessionIdsChange: (ids: string[]) => void
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => boolean | Promise<boolean>
  onComplete: () => void
  confirmLoading?: boolean
}

export function AssignGuideModal({
  open,
  instructorName,
  institutionOptions,
  selectedInstitutionId,
  role,
  sessionOptions,
  selectedSessionIds,
  currentCount,
  requiredCount,
  onInstitutionChange,
  onRoleChange,
  onSessionIdsChange,
  onCancel,
  onConfirm,
  onComplete,
  confirmLoading = false,
}: AssignGuideModalProps) {
  const { showAlert } = useCmsAlert()
  const [step, setStep] = useState<AssignmentModalStep>('select')
  const [confirmedInstitutionName, setConfirmedInstitutionName] = useState('')

  useEffect(() => {
    if (!open) {
      setStep('select')
      setConfirmedInstitutionName('')
    }
  }, [open])

  const selectedInstitutionName =
    institutionOptions.find(option => option.value === selectedInstitutionId)?.label ??
    confirmedInstitutionName

  const handleSelectConfirm = () => {
    if (!selectedInstitutionId) {
      showAlert({
        title: '기관 추가 배정 안내',
        content: '배정할 기관을 선택해 주세요.',
      })
      return
    }
    if (selectedSessionIds.length === 0) {
      showAlert({
        title: '기관 추가 배정 안내',
        content: '교육 배정일을 선택해 주세요.',
      })
      return
    }
    setConfirmedInstitutionName(
      institutionOptions.find(option => option.value === selectedInstitutionId)?.label ?? ''
    )
    setStep('confirm')
  }

  const handleConfirmCancel = () => {
    if (step === 'submitting' || confirmLoading) return
    setStep('select')
  }

  const handleAssign = async () => {
    if (step === 'submitting' || confirmLoading) return
    setStep('submitting')
    try {
      const ok = await onConfirm(INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD)
      setStep(ok ? 'complete' : 'confirm')
    } catch {
      setStep('confirm')
    }
  }

  return (
    <>
      <ContentModal
        open={open && step === 'select'}
        onCancel={onCancel}
        title="기관 추가 배정 안내"
        width={MODAL_WIDTH}
        description={`**[${instructorName}]** 님을 추가 배정할 기관을 선택해 주세요`}
        footer={
          <>
            <CmsButton variant="secondary" size="medium" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="medium" onClick={handleSelectConfirm}>
              배정
            </CmsButton>
          </>
        }
        className="school-detail-add-instructor-assign-modal"
      >
        <div className="school-detail-add-instructor-assign-modal__body">
          <div className="school-detail-add-instructor-assign-modal__fields">
            <div className="school-detail-add-instructor-assign-modal__field">
              <div className="school-detail-add-instructor-assign-modal__field-label">
                <RequiredFieldLabel>대표 강사 지정</RequiredFieldLabel>
              </div>
              <CmsRadio.Group
                className="school-detail-add-instructor-assign-modal__role-radios"
                size="medium"
                value={role}
                onChange={e => onRoleChange(e.target.value as InstructorRoleKey)}
                options={[
                  { label: INSTRUCTOR_ROLE_LABELS.lead, value: 'lead' as InstructorRoleKey },
                  {
                    label: INSTRUCTOR_ROLE_LABELS.assistant,
                    value: 'assistant' as InstructorRoleKey,
                  },
                ]}
              />
            </div>
            <div className="school-detail-add-instructor-assign-modal__field">
              <div className="school-detail-add-instructor-assign-modal__field-label">
                <RequiredFieldLabel>기관명</RequiredFieldLabel>
              </div>
              <CmsSelect
                inputSize="medium"
                width="100%"
                withAllOption={false}
                placeholder="배정할 기관을 선택해 주세요"
                options={institutionOptions}
                value={selectedInstitutionId ?? undefined}
                onChange={value => onInstitutionChange(value ? String(value) : null)}
                getPopupContainer={() => document.body}
              />
            </div>
            <div className="school-detail-add-instructor-assign-modal__field school-detail-add-instructor-assign-modal__field--sessions">
              <div className="school-detail-add-instructor-assign-modal__field-label">
                <RequiredFieldLabel>교육 배정일 선택</RequiredFieldLabel>
              </div>
              <AssignSessionTags
                value={selectedSessionIds}
                onChange={onSessionIdsChange}
                options={sessionOptions}
              />
            </div>
          </div>
        </div>
      </ContentModal>

      <InstitutionSelectAssignConfirmModal
        open={open && (step === 'confirm' || step === 'submitting')}
        onCancel={handleConfirmCancel}
        onConfirm={() => {
          void handleAssign()
        }}
        institutionName={selectedInstitutionName}
        instructorName={instructorName}
        currentCount={currentCount}
        requiredCount={requiredCount}
        confirmLoading={step === 'submitting' || confirmLoading}
      />

      <InstitutionAssignCompleteModal
        open={open && step === 'complete'}
        onClose={onComplete}
        institutionName={selectedInstitutionName}
        instructorName={instructorName}
      />
    </>
  )
}
