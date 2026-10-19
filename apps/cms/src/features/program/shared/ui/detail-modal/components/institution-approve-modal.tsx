import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { fetchProgramPlannedEducationSlots } from '@/features/program/general/lib/program-planned-education-slots'
import {
  PermissionModal,
  PermissionModalMessage,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  buildOrganizationApplicationApproveSchedulePayload,
  organizationApproveScheduleOptionLabel,
  resolveOrganizationApproveScheduleOptionsFromPreferred,
  UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
} from '@/features/program/general/lib/organization-application-approve-slots'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import './instructor-bulk-approve-modal.css'
import './institution-approve-modal.css'

export type InstitutionApproveScheduleConfig = {
  preferredEducationSchedules?: PreferredEducationSchedule[]
}

export type InstitutionApproveConfirmPayload = PermissionModalPayload & {
  selectedScheduleId?: number
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
  const programSchedulesQuery = useQuery({
    queryKey: generalProgramQueryKeys.educationSlots(programId ?? ''),
    queryFn: () => fetchProgramPlannedEducationSlots(programId!),
    enabled: open && Boolean(programId?.trim()),
    staleTime: 30_000,
    retry: false,
  })
  const educationSlots = programSchedulesQuery.isSuccess
    ? (programSchedulesQuery.data ?? [])
    : undefined
  const scheduleValidation = useMemo(
    () =>
      resolveOrganizationApproveScheduleOptionsFromPreferred(
        scheduleConfig?.preferredEducationSchedules,
        educationSlots
      ),
    [educationSlots, scheduleConfig?.preferredEducationSchedules]
  )
  const scheduleOptions = scheduleValidation.options
  const assignableOptions = scheduleValidation.assignableOptions
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedOptionId(null)
  }, [open, scheduleConfig?.preferredEducationSchedules])

  const usesScheduleSection = scheduleConfig != null
  const hasPreferredSchedules = scheduleOptions.length > 0 && !scheduleValidation.invalidReason
  const slotsLoading = usesScheduleSection && programSchedulesQuery.isLoading
  const slotsFailed = usesScheduleSection && programSchedulesQuery.isError

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

  const selectedScheduleLabel = useMemo(
    () => organizationApproveScheduleOptionLabel(assignableOptions, selectedOptionId),
    [assignableOptions, selectedOptionId]
  )

  const toggleSchedule = (optionId: number) => {
    setSelectedOptionId(prev => (prev === optionId ? null : optionId))
  }

  const handleConfirm = (payload: PermissionModalPayload) => {
    if (!usesScheduleSection || selectedOptionId == null) {
      onConfirm(payload)
      return
    }
    const schedulePayload = buildOrganizationApplicationApproveSchedulePayload({
      preferred: scheduleConfig?.preferredEducationSchedules,
      educationSlots,
      selectedSlotId: selectedOptionId,
    })
    if (schedulePayload.selectedScheduleId == null) {
      showAlert({
        title: '승인 불가',
        content:
          '선택한 일정이 현재 프로그램 공통 교육 슬롯이 아니어서 배정할 수 없습니다. 선택 없이 승인하거나 연결된 슬롯을 다시 선택해 주세요.',
      })
      return
    }
    onConfirm({ ...payload, selectedScheduleId: schedulePayload.selectedScheduleId })
  }

  const scheduleSection = usesScheduleSection ? (
    <div className="institution-approve-modal__schedule-section">
      {!hasPreferredSchedules ? (
        <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
          {scheduleValidation.invalidReason ?? UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE}
        </p>
      ) : (
        <>
          <span className="institution-approve-modal__schedule-label">신청 희망 일정</span>
          <ul className="institution-approve-modal__preferred-list">
            {scheduleOptions.map(option => (
              <li key={option.optionKey ?? option.scheduleId} className="institution-approve-modal__preferred-item">
                <span>{option.label}</span>
                {option.assignmentNote ? (
                  <span className="institution-approve-modal__preferred-note">
                    {' '}
                    · {option.assignmentNote}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {slotsLoading ? (
            <p className="institution-approve-modal__notice">공통 교육 일정을 확인하는 중입니다.</p>
          ) : null}
          {slotsFailed ? (
            <p className="institution-approve-modal__notice">
              공통 교육 일정을 불러오지 못했습니다. 승인만 진행할 수 있습니다.
            </p>
          ) : null}
          {assignableOptions.length > 0 ? (
            <>
              <span className="institution-approve-modal__schedule-label">배정할 교육 일정</span>
              <div className="institution-approve-modal__schedule-chips">
                {assignableOptions.map(option => {
                  const selected = selectedOptionId === option.scheduleId
                  return (
                    <ParagraphChip
                      key={option.optionKey ?? option.scheduleId}
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
                <span className="institution-approve-modal__schedule-label">선택한 일정</span>
                {selectedScheduleLabel ? (
                  <p className="institution-approve-modal__notice">{selectedScheduleLabel}</p>
                ) : (
                  <p className="institution-approve-modal__notice">
                    선택하지 않으면 승인만 진행하고, 교육 일정은 승인 후 별도 배정합니다.
                  </p>
                )}
              </div>
            </>
          ) : scheduleValidation.slotsResolved ? (
            <p className="institution-approve-modal__notice">
              선택 가능한 공통 교육 일정이 없습니다. 승인만 진행하고, 교육 일정은 승인 후 별도
              배정합니다.
            </p>
          ) : null}
          <p className="institution-approve-modal__notice">
            신청 희망 일정은 신청 기록으로 표시합니다. 배정은 프로그램 공통 교육 슬롯과 명시적으로
            연결된 일정만 가능합니다. 신청 학급 수와 교육 일정 수는 별도로 관리됩니다.
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
      title={usesScheduleSection ? '프로그램 신청 승인 안내' : '기관 승인 안내'}
      confirmLabel="승인"
      confirmLoading={confirmLoading}
      confirmDisabled={slotsLoading}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      zIndex={zIndex}
      width={usesScheduleSection ? 720 : 600}
    >
      <PermissionModalMessage text={buildInstitutionApproveMessage(schoolName)} />
      {scheduleSection}
    </PermissionModal>
  )
}
