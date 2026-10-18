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
  ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE,
  ORGANIZATION_APPROVE_SCHEDULE_PROGRAM_MISMATCH_MESSAGE,
  organizationApproveScheduleOptionLabel,
  organizationApproveUnconfirmableScheduleNotice,
  resolveOrganizationApproveScheduleOptionsFromPreferred,
  resolveOrganizationApproveSelectedScheduleId,
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
  const scheduleValidation = useMemo(
    () =>
      resolveOrganizationApproveScheduleOptionsFromPreferred(
        scheduleConfig?.preferredEducationSchedules,
        programSchedulesQuery.data ?? []
      ),
    [scheduleConfig?.preferredEducationSchedules, programSchedulesQuery.data]
  )
  const scheduleOptions = scheduleValidation.options
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedOptionId(null)
  }, [open, scheduleConfig?.preferredEducationSchedules])

  const usesScheduleSection = scheduleConfig != null
  const hasPreferredSchedules = scheduleOptions.length > 0 && !scheduleValidation.invalidReason
  const hasUnconfirmableOnly =
    hasPreferredSchedules && scheduleOptions.every(option => option.confirmableScheduleId == null)
  const hasLoadedEmptyEducationSlots =
    programSchedulesQuery.data != null && programSchedulesQuery.data.length === 0
  const hasProgramScheduleMismatch =
    hasPreferredSchedules &&
    scheduleOptions.some(
      option =>
        option.scheduleId > 0 &&
        option.confirmableScheduleId == null &&
        option.unresolvedReason == null &&
        programSchedulesQuery.data != null &&
        programSchedulesQuery.data.length > 0
    )
  const unconfirmableNotice = useMemo(
    () => organizationApproveUnconfirmableScheduleNotice(scheduleOptions),
    [scheduleOptions]
  )

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
    () => organizationApproveScheduleOptionLabel(scheduleOptions, selectedOptionId),
    [scheduleOptions, selectedOptionId]
  )

  const toggleSchedule = (optionId: number, confirmable: boolean) => {
    if (!confirmable) return
    setSelectedOptionId(prev => (prev === optionId ? null : optionId))
  }

  const handleConfirm = (payload: PermissionModalPayload) => {
    if (!usesScheduleSection) {
      onConfirm(payload)
      return
    }
    if (selectedOptionId == null) {
      onConfirm(payload)
      return
    }
    const selectedScheduleId = resolveOrganizationApproveSelectedScheduleId(
      scheduleConfig?.preferredEducationSchedules,
      selectedOptionId
    )
    if (selectedScheduleId == null) {
      showAlert({
        title: '승인 불가',
        content: ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE,
      })
      return
    }
    onConfirm({ ...payload, selectedScheduleId })
  }

  const scheduleSection = usesScheduleSection ? (
    <div className="institution-approve-modal__schedule-section">
      <span className="institution-approve-modal__schedule-label">교육 일정 선택</span>
      {!hasPreferredSchedules ? (
        <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
          {scheduleValidation.invalidReason ?? UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE}
        </p>
      ) : (
        <>
          <div className="institution-approve-modal__schedule-chips">
            {scheduleOptions.map(option => {
              const selected = selectedOptionId === option.scheduleId
              const confirmable = option.confirmableScheduleId != null
              return (
                <ParagraphChip
                  key={option.scheduleId}
                  selected={selected}
                  disabled={!confirmable}
                  className="institution-approve-modal__schedule-chip"
                  onClick={() => toggleSchedule(option.scheduleId, confirmable)}
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
          {hasUnconfirmableOnly ? (
            <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
              {unconfirmableNotice ??
                (hasLoadedEmptyEducationSlots
                  ? '공통 교육 일정 정보를 불러올 수 없습니다. 백엔드 배포 또는 데이터 migration 상태를 확인해 주세요.'
                  : '희망 일정에 운영 일정 ID가 없어 여기서 확정할 수 없습니다. 승인만 진행하거나 신청 상세의 scheduleId 반영 후 다시 시도해 주세요.')}
            </p>
          ) : null}
          {hasProgramScheduleMismatch ? (
            <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
              {ORGANIZATION_APPROVE_SCHEDULE_PROGRAM_MISMATCH_MESSAGE}
            </p>
          ) : null}
          <p className="institution-approve-modal__notice">
            신청자가 선택한 희망 교육 일정 중 진행할 일정을 선택합니다. 신청 학급 수와 교육 일정 수는
            별도로 관리됩니다. 학년·반 운영 배정은 승인 후 별도 진행됩니다.
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
      confirmDisabled={false}
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
