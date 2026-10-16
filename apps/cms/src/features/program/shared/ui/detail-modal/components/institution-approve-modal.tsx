import { useEffect, useMemo, useState } from 'react'
import {
  PermissionModal,
  PermissionModalMessage,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  buildOrganizationApproveAssignedPreview,
  buildOrganizationApproveSlotsForSelection,
  ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE,
  resolveOrganizationApproveScheduleIdsFromSelection,
  resolveOrganizationApproveScheduleOptionsFromPreferred,
  UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
  validateOrganizationApproveSlotsClient,
  type OrganizationApplicationApproveSlot,
} from '@/features/program/general/lib/organization-application-approve-slots'
import type { GeneralProgramSessionRoundKind } from '@/types/domain'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import './instructor-bulk-approve-modal.css'
import './institution-approve-modal.css'

export type InstitutionApproveScheduleConfig = {
  sessionRound: GeneralProgramSessionRoundKind
  educationGrade: string
  classCount: number
  preferredEducationSchedules?: PreferredEducationSchedule[]
}

export type InstitutionApproveConfirmPayload = PermissionModalPayload & {
  slots?: OrganizationApplicationApproveSlot[]
}

export type InstitutionApproveModalProps = {
  open: boolean
  schoolName: string
  scheduleConfig?: InstitutionApproveScheduleConfig | null
  onCancel: () => void
  onConfirm: (payload: InstitutionApproveConfirmPayload) => void
  confirmLoading?: boolean
  zIndex?: number
  programId?: string
  organizationApplicationId?: string
}

/** 기관명·대괄호 전체를 bold (`**[기관명]**`) */
export function buildInstitutionApproveMessage(schoolName: string): string {
  const trimmedName = schoolName.trim() || '기관'
  return `**[${trimmedName}]**의 프로그램 참여를 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.`
}

export function InstitutionApproveModal({
  open,
  schoolName,
  scheduleConfig,
  onCancel,
  onConfirm,
  confirmLoading = false,
  zIndex,
  programId,
  organizationApplicationId,
}: InstitutionApproveModalProps) {
  const { showAlert } = useCmsAlert()
  const scheduleValidation = useMemo(
    () =>
      resolveOrganizationApproveScheduleOptionsFromPreferred(
        scheduleConfig?.preferredEducationSchedules
      ),
    [scheduleConfig?.preferredEducationSchedules]
  )
  const scheduleOptions = scheduleValidation.options
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([])

  useEffect(() => {
    if (!open) return
    setSelectedScheduleIds([])
  }, [open, scheduleConfig?.preferredEducationSchedules])

  const usesScheduleSlots = scheduleConfig != null
  const sessionRound = scheduleConfig?.sessionRound ?? 'single'
  const canSelectSchedules = scheduleOptions.length > 0 && !scheduleValidation.invalidReason

  useEffect(() => {
    if (!open || !scheduleValidation.invalidReason || !import.meta.env.DEV) return
    console.warn('[organization-approval-schedule-invalid]', {
      programId,
      organizationApplicationId,
      preferredEducationSchedules: scheduleConfig?.preferredEducationSchedules,
      invalidReason: scheduleValidation.invalidReason,
      duplicateScheduleIds: scheduleValidation.duplicateScheduleIds,
    })
  }, [
    open,
    organizationApplicationId,
    programId,
    scheduleConfig?.preferredEducationSchedules,
    scheduleValidation.duplicateScheduleIds,
    scheduleValidation.invalidReason,
  ])

  const resolvedSelectedScheduleIds = useMemo(
    () =>
      resolveOrganizationApproveScheduleIdsFromSelection(
        scheduleConfig?.preferredEducationSchedules,
        selectedScheduleIds
      ),
    [scheduleConfig?.preferredEducationSchedules, selectedScheduleIds]
  )

  const assignedPreviewRows = useMemo(() => {
    if (!usesScheduleSlots || selectedScheduleIds.length === 0) return []
    return buildOrganizationApproveAssignedPreview({
      sessionRound,
      selectedOptionIds: selectedScheduleIds,
      scheduleOptions,
      educationGrade: scheduleConfig?.educationGrade ?? '',
      classCount: scheduleConfig?.classCount ?? 1,
    })
  }, [
    scheduleConfig?.classCount,
    scheduleConfig?.educationGrade,
    scheduleOptions,
    selectedScheduleIds,
    sessionRound,
    usesScheduleSlots,
  ])

  const approveSlots = useMemo(() => {
    if (!usesScheduleSlots || resolvedSelectedScheduleIds.length === 0) return []
    return buildOrganizationApproveSlotsForSelection({
      sessionRound,
      selectedScheduleIds: resolvedSelectedScheduleIds,
      educationGrade: scheduleConfig?.educationGrade ?? '',
      classCount: scheduleConfig?.classCount ?? 1,
    })
  }, [
    scheduleConfig?.classCount,
    scheduleConfig?.educationGrade,
    resolvedSelectedScheduleIds,
    sessionRound,
    usesScheduleSlots,
  ])

  const toggleSchedule = (scheduleId: number) => {
    setSelectedScheduleIds(prev => (prev.includes(scheduleId) ? [] : [scheduleId]))
  }

  const handleConfirm = (payload: PermissionModalPayload) => {
    if (!usesScheduleSlots) {
      onConfirm(payload)
      return
    }
    if (!canSelectSchedules) {
      showAlert({
        title: '승인 불가',
        content: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
      })
      return
    }
    if (selectedScheduleIds.length === 0) {
      showAlert({
        title: '필수 항목 확인',
        content: '희망 교육 일정을 선택해 주세요.',
      })
      return
    }
    if (resolvedSelectedScheduleIds.length === 0) {
      showAlert({
        title: '승인 불가',
        content: ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE,
      })
      return
    }
    const validation = validateOrganizationApproveSlotsClient({
      sessionRound,
      slots: approveSlots,
      allowedScheduleIds: resolvedSelectedScheduleIds,
    })
    if (validation) {
      showAlert({
        title: '필수 항목 확인',
        content: validation,
      })
      return
    }
    onConfirm({ ...payload, slots: approveSlots })
  }

  const scheduleSection = usesScheduleSlots ? (
    <div className="institution-approve-modal__schedule-section">
      <span className="institution-approve-modal__schedule-label">교육 일정 선택</span>
      {!canSelectSchedules ? (
        <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
          {scheduleValidation.invalidReason ?? UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE}
        </p>
      ) : (
        <>
          <div className="institution-approve-modal__schedule-chips">
            {scheduleOptions.map(option => {
              const selected = selectedScheduleIds.includes(option.scheduleId)
              return (
                <ParagraphChip
                  key={option.scheduleId}
                  selected={selected}
                  className="institution-approve-modal__schedule-chip"
                  onClick={() => toggleSchedule(option.scheduleId)}
                >
                  {option.label}
                </ParagraphChip>
              )
            })}
          </div>
          <div className="institution-approve-modal__assigned">
            <span className="institution-approve-modal__schedule-label">배정된 일정</span>
            {assignedPreviewRows.length === 0 ? (
              <p className="institution-approve-modal__notice">선택한 교육 일정이 없습니다.</p>
            ) : (
              <div className="institution-approve-modal__assigned-tags">
                {assignedPreviewRows.map((row, index) => (
                  <span
                    key={`${row.label}-${row.className}-${index}`}
                    className="institution-approve-modal__assigned-tag"
                  >
                    {row.label} · {row.grade} {row.className}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="institution-approve-modal__notice">
            {sessionRound === 'single'
              ? '희망 교육 일정 중 하나를 선택합니다. 같은 일정에 신청 학급 수만큼 반이 배정됩니다.'
              : '희망 교육 일정 중 진행할 일정을 하나 선택합니다.'}
          </p>
        </>
      )}
    </div>
  ) : null

  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="institution-approve-modal"
      title={usesScheduleSlots ? '프로그램 신청 승인 안내' : '기관 승인 안내'}
      confirmLabel="승인"
      confirmLoading={confirmLoading}
      confirmDisabled={usesScheduleSlots && !canSelectSchedules}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      zIndex={zIndex}
      width={usesScheduleSlots ? 720 : 600}
    >
      <PermissionModalMessage text={buildInstitutionApproveMessage(schoolName)} />
      {scheduleSection}
    </PermissionModal>
  )
}
