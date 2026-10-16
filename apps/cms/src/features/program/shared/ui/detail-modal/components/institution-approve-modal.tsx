import { useEffect, useMemo, useState } from 'react'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import {
  PermissionModal,
  PermissionModalMessage,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  buildOrganizationApproveSlotsForSelection,
  UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
  validateOrganizationApproveScheduleOptions,
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
  programSchedules?: ProgramScheduleResponse[]
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
      validateOrganizationApproveScheduleOptions(
        scheduleConfig?.preferredEducationSchedules,
        scheduleConfig?.programSchedules
      ),
    [scheduleConfig?.preferredEducationSchedules, scheduleConfig?.programSchedules]
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

  const assignedSlots = useMemo(() => {
    if (!usesScheduleSlots || selectedScheduleIds.length === 0) return []
    return buildOrganizationApproveSlotsForSelection({
      sessionRound,
      selectedScheduleIds,
      educationGrade: scheduleConfig?.educationGrade ?? '',
      classCount: scheduleConfig?.classCount ?? 1,
    })
  }, [
    scheduleConfig?.classCount,
    scheduleConfig?.educationGrade,
    selectedScheduleIds,
    sessionRound,
    usesScheduleSlots,
  ])

  const toggleSchedule = (scheduleId: number) => {
    if (sessionRound === 'single') {
      setSelectedScheduleIds(prev => (prev.includes(scheduleId) ? [] : [scheduleId]))
      return
    }
    setSelectedScheduleIds(prev =>
      prev.includes(scheduleId) ? prev.filter(id => id !== scheduleId) : [...prev, scheduleId]
    )
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
    const validation = validateOrganizationApproveSlotsClient({
      sessionRound,
      slots: assignedSlots,
      allowedScheduleIds: scheduleOptions.map(option => option.scheduleId),
    })
    if (validation) {
      showAlert({
        title: '필수 항목 확인',
        content: validation,
      })
      return
    }
    onConfirm({ ...payload, slots: assignedSlots })
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
            {assignedSlots.length === 0 ? (
              <p className="institution-approve-modal__notice">선택한 교육 일정이 없습니다.</p>
            ) : (
              <div className="institution-approve-modal__assigned-tags">
                {assignedSlots.map((slot, index) => {
                  const label =
                    scheduleOptions.find(option => option.scheduleId === slot.scheduleId)?.label ??
                    `일정 ${slot.scheduleId}`
                  return (
                    <span
                      key={`${slot.scheduleId}-${slot.className}-${index}`}
                      className="institution-approve-modal__assigned-tag"
                    >
                      {label} · {slot.grade} {slot.className}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          <p className="institution-approve-modal__notice">
            {sessionRound === 'single'
              ? '단일 회차 프로그램은 하나의 교육 일정을 선택합니다. 같은 일정에 신청 학급 수만큼 반이 배정됩니다.'
              : '복수 회차 프로그램은 희망 교육 일정 중 진행할 일정을 모두 선택합니다.'}
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
