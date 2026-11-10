/**
 * 기관 추가 배정 안내 (B: 기관형 > 참여 강사 상세 > 교육 배정 현황 > 추가 배정)
 * 선택 단계 UI = GeneralParticipantAddAssignModal (Figma CMS 9760:8214 ‘기관 추가 배정 안내’)
 * 이후 기관 선택 배정 안내(알림 예약) → 배정 완료 안내 단계는 기존 그대로
 */
import { useCmsAlert } from '@/shared/ui'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { useEffect, useState } from 'react'
import type { InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import type { InstructorAssignSessionOption } from '@/features/program/general/lib/instructor-assign-session-options'
import {
  INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD,
  formatAssignedInstructorCountLine,
  type AssignmentModalStep,
} from '@/features/program/general/lib/institution-select-assign'
import { InstitutionSelectAssignConfirmModal } from './institution-select-assign-confirm-modal'
import {
  InstitutionAssignCompleteModal,
  type InstitutionAssignCompleteVariant,
} from './institution-assign-complete-modal'
import { GeneralParticipantAddAssignModal } from './general-participant-add-assign-modal'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

type InstitutionOption = {
  value: string
  label: string
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
  /** 배정 완료 모달 문구 — 생략 시 기존(`default`). 일반 기관형은 `result`(Figma 04-2) */
  completeVariant?: InstitutionAssignCompleteVariant
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
  completeVariant = 'default',
}: AssignGuideModalProps) {
  const { showAlert } = useCmsAlert()
  const [step, setStep] = useState<AssignmentModalStep>('select')
  const [confirmedInstitutionName, setConfirmedInstitutionName] = useState('')
  /** 배정 직후 인원 줄 — 확인 시점 인원 + 1 (배정 완료 `result` 문구용) */
  const [completeCountLine, setCompleteCountLine] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStep('select')
      setConfirmedInstitutionName('')
      setCompleteCountLine(null)
    }
  }, [open])

  const selectedInstitutionName =
    institutionOptions.find(option => option.value === selectedInstitutionId)?.label ??
    confirmedInstitutionName

  const handleSelectConfirm = () => {
    if (!selectedInstitutionId) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    if (selectedSessionIds.length === 0) {
      showAlert(NO_SELECTION_ALERT)
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
      if (ok) {
        setCompleteCountLine(
          formatAssignedInstructorCountLine(
            currentCount != null ? currentCount + 1 : null,
            requiredCount
          )
        )
      }
      setStep(ok ? 'complete' : 'confirm')
    } catch {
      setStep('confirm')
    }
  }

  return (
    <>
      <GeneralParticipantAddAssignModal
        open={open && step === 'select'}
        onCancel={onCancel}
        title="기관 추가 배정 안내"
        description={`**[${instructorName}]** 님을 추가 배정할 기관을 선택해 주세요.`}
        onConfirm={handleSelectConfirm}
        role={{ value: role, onChange: onRoleChange }}
        target={{
          label: '기관명',
          placeholder: '배정할 기관을 선택해 주세요',
          options: institutionOptions,
          value: selectedInstitutionId,
          onChange: onInstitutionChange,
        }}
        sessions={{
          label: '교육 배정일 선택',
          options: sessionOptions,
          value: selectedSessionIds,
          onChange: onSessionIdsChange,
          selectionMode: 'multiple',
        }}
      />

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
        variant={completeVariant}
        countLine={completeCountLine}
      />
    </>
  )
}
