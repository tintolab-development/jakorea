import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { fetchProgramPlannedEducationSlots } from '@/features/program/general/lib/program-planned-education-slots'
import {
  PermissionModal,
  PermissionModalMessage,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import { organizationRequestedSchedulesQueryOptions } from '@/features/program/general/api/organization-requested-schedules-query'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import {
  ABSENT_PREFERRED_SCHEDULE_MESSAGE,
  allowsMultipleOrganizationEducationScheduleAssignment,
  buildOrganizationApplicationApproveSchedulePayload,
  buildPeriodSingleRequestedScheduleApprovePayload,
  isGeneralOrganizationPeriodSingleRequestedScheduleApproval,
  ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE,
  ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT,
  organizationEducationScheduleAssignmentHint,
  resolveOrganizationApproveScheduleOptionsFromPreferred,
  resolveOrganizationScheduleMultiAutoAssign,
  selectOrganizationApprovePreferredSchedules,
  type OrganizationApproveEducationScheduleMode,
} from '@/features/program/general/lib/organization-application-approve-slots'
import { formatOrganizationApproveScheduleCard } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import './instructor-bulk-approve-modal.css'
import './institution-approve-modal.css'

export type InstitutionApproveScheduleConfig = {
  preferredEducationSchedules?: PreferredEducationSchedule[]
}

export type InstitutionApproveConfirmPayload = PermissionModalPayload & {
  /** 기간형 단일 회차 희망 일정 행 id. selectedScheduleId·slots와 함께 두지 않는다. */
  requestedScheduleId?: number
  selectedScheduleId?: number
  slots?: Array<{ scheduleId: number }>
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
  /** 기간 지정은 공통 예정 슬롯과 비교하지 않는다. 생략하면 날짜 지정 검증을 유지한다. */
  educationScheduleMode?: OrganizationApproveEducationScheduleMode
  /** 단일 회차는 한 일정, 복수 회차는 여러 일정. 생략하면 단일로 본다. */
  sessionRound?: 'single' | 'multi' | null
  /** 기간 지정 신청 가능 최대 일정 수 */
  maxScheduleCount?: number | null
  /** 커리큘럼·단일·날짜 지정의 일일 차시. 신청 폼과 같은 접미사만 쓴다. */
  educationStructure?: 'curriculum' | 'schedule' | null
  curriculumChartSessionCount?: number | null
  curriculumSessions?: readonly { sessionLabel?: string; title?: string }[] | null
  sessionsPerRound?: number | null
  educationRoundCount?: number | null
}

/** 기관명·대괄호 전체를 bold (`**[기관명]**`) */
export function buildInstitutionApproveMessage(
  schoolName: string,
  withScheduleAssignment = false,
  autoAssignEducationSchedules = false
): string {
  const trimmedName = schoolName.trim() || '기관'
  if (autoAssignEducationSchedules) {
    return `**[${trimmedName}]**의 프로그램 신청을 승인하시겠습니까?\n담당 교사에게 승인 알림이 발송됩니다.`
  }
  if (withScheduleAssignment) {
    return `**[${trimmedName}]**의 프로그램 신청을 승인하시겠습니까?\n승인 시 선택한 일정으로 교육이 배정되며, 담당 교사에게 승인 알림이 발송됩니다.`
  }
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
  educationScheduleMode = 'date',
  sessionRound = 'single',
  maxScheduleCount = null,
  educationStructure = null,
  curriculumChartSessionCount = null,
  curriculumSessions = null,
  sessionsPerRound = null,
  educationRoundCount = null,
}: InstitutionApproveModalProps) {
  const { showAlert } = useCmsAlert()
  const periodSchedule = educationScheduleMode === 'period'
  const preferredFromDetail = scheduleConfig?.preferredEducationSchedules
  const preferredDetailCount = preferredFromDetail?.length ?? 0
  const requestedApplicationId = organizationApplicationId?.trim() ?? ''
  const requestedSchedulesQuery = useQuery({
    ...organizationRequestedSchedulesQueryOptions(requestedApplicationId),
    enabled: open && requestedApplicationId.length > 0,
  })
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
  const requestedSchedules = requestedSchedulesQuery.isSuccess
    ? requestedSchedulesQuery.data
    : undefined
  const scheduleValidation = useMemo(
    () =>
      resolveOrganizationApproveScheduleOptionsFromPreferred(
        preferredFromDetail,
        educationSlots,
        educationScheduleMode,
        requestedSchedules
      ),
    [educationScheduleMode, educationSlots, preferredFromDetail, requestedSchedules]
  )
  const scheduleOptions = scheduleValidation.options
  const preferredSource = useMemo(
    () => selectOrganizationApprovePreferredSchedules(preferredFromDetail, requestedSchedules),
    [preferredFromDetail, requestedSchedules]
  )
  const autoAssign = useMemo(
    () => resolveOrganizationScheduleMultiAutoAssign(educationSlots),
    [educationSlots]
  )
  const requestedRowsForDetail = useMemo(() => {
    if (!requestedSchedules?.length) return []
    return [...requestedSchedules].sort(
      (left, right) => (left.preferenceOrder ?? 99) - (right.preferenceOrder ?? 99)
    )
  }, [requestedSchedules])
  const scheduleCards = useMemo(
    () =>
      scheduleOptions
        .filter(option => option.preferredRecord)
        .map(option => {
          const index = option.optionKey?.startsWith('preferred:')
            ? Number(option.optionKey.slice('preferred:'.length))
            : -1
          const source = index >= 0 ? preferredSource[index] : undefined
          const requestedRow: RequestedScheduleResponse | undefined =
            index >= 0 ? requestedRowsForDetail[index] : undefined
          const card = formatOrganizationApproveScheduleCard({
            label: source?.label ?? option.label,
            startAt: source?.startAt,
            endAt: source?.endAt,
            preferenceOrder: requestedRow?.preferenceOrder,
            sessionCount: requestedRow?.sessionCount,
            educationScheduleMode,
            educationStructure,
            sessionRound,
            curriculumChartSessionCount,
            curriculumSessions,
            sessionsPerRound,
            educationRoundCount,
          })
          return {
            key: option.optionKey ?? String(option.scheduleId),
            title: card.title || option.label,
            detail: card.detail,
            confirmableScheduleId: option.confirmableScheduleId,
            requestedScheduleId: undefined as number | undefined,
            note: option.assignmentNote ?? null,
          }
        }),
    [
      curriculumChartSessionCount,
      curriculumSessions,
      educationRoundCount,
      educationScheduleMode,
      educationStructure,
      preferredSource,
      requestedRowsForDetail,
      scheduleOptions,
      sessionRound,
      sessionsPerRound,
    ]
  )
  const periodSingleRequestedApproval = isGeneralOrganizationPeriodSingleRequestedScheduleApproval({
    educationScheduleMode,
    sessionRound,
    educationStructure,
  })
  const requestedScheduleCards = useMemo(() => {
    if (!periodSingleRequestedApproval) return []
    return requestedRowsForDetail.flatMap(row => {
      if (typeof row.id !== 'number' || !Number.isInteger(row.id) || row.id <= 0) return []
      const requestedDate = row.requestedDate?.trim() || row.periodStartDate?.trim() || ''
      const card = formatOrganizationApproveScheduleCard({
        label: row.label,
        startAt: requestedDate || row.periodStartDate,
        endAt: requestedDate || row.periodEndDate || row.periodStartDate,
        preferenceOrder: row.preferenceOrder,
        sessionCount: row.sessionCount,
        educationScheduleMode,
        educationStructure,
        sessionRound,
        curriculumChartSessionCount,
        curriculumSessions,
        sessionsPerRound,
        educationRoundCount,
      })
      return [
        {
          key: `requested-schedule:${row.id}`,
          title: card.title || requestedDate || String(row.id),
          detail: card.detail,
          confirmableScheduleId: null as number | null,
          requestedScheduleId: row.id,
          note: null as string | null,
        },
      ]
    })
  }, [
    curriculumChartSessionCount,
    curriculumSessions,
    educationRoundCount,
    educationScheduleMode,
    educationStructure,
    periodSingleRequestedApproval,
    requestedRowsForDetail,
    sessionRound,
    sessionsPerRound,
  ])
  const scheduleCardsForView = periodSingleRequestedApproval ? requestedScheduleCards : scheduleCards
  const allowsMultipleSchedules = periodSingleRequestedApproval
    ? false
    : allowsMultipleOrganizationEducationScheduleAssignment({
        sessionRound,
        educationScheduleMode,
        maxScheduleCount,
      })
  const assignmentHint = periodSingleRequestedApproval
    ? ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT
    : organizationEducationScheduleAssignmentHint({
        sessionRound,
        educationScheduleMode,
        maxScheduleCount,
      })
  const [selectedOptionKeys, setSelectedOptionKeys] = useState<string[]>([])
  const selectionResetQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.organizationApproveSelectionReset(
      requestedApplicationId || '__none__'
    ),
    queryFn: () => 0,
    enabled: false,
    initialData: 0,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!open) return
    setSelectedOptionKeys([])
  }, [open, scheduleConfig?.preferredEducationSchedules, selectionResetQuery.data])

  const usesScheduleSection = scheduleConfig != null
  const autoAssignSchedule =
    usesScheduleSection && educationStructure === 'schedule' && sessionRound === 'multi'
  const hasPreferredSchedules = periodSingleRequestedApproval
    ? requestedScheduleCards.length > 0
    : scheduleOptions.length > 0
  const awaitingRequestedSchedules = periodSingleRequestedApproval
    ? usesScheduleSection &&
      requestedApplicationId.length > 0 &&
      requestedSchedulesQuery.isLoading
    : usesScheduleSection &&
      !autoAssignSchedule &&
      preferredDetailCount === 0 &&
      requestedSchedulesQuery.isLoading
  const slotsLoading = usesScheduleSection && programSchedulesQuery.isLoading

  useEffect(() => {
    if (
      !open ||
      awaitingRequestedSchedules ||
      !scheduleValidation.invalidReason ||
      scheduleValidation.invalidReason === ABSENT_PREFERRED_SCHEDULE_MESSAGE ||
      scheduleOptions.length > 0 ||
      !import.meta.env.DEV
    ) {
      return
    }
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
    awaitingRequestedSchedules,
    scheduleOptions.length,
    scheduleValidation.duplicateScheduleIds,
    scheduleValidation.invalidReason,
  ])

  const commonAssignmentCards = useMemo(() => {
    if (periodSchedule || hasPreferredSchedules) return []
    return scheduleValidation.commonSlotOptions.map(option => ({
      key: option.optionKey ?? `common:${option.scheduleId}`,
      title: option.label,
      detail: null as string | null,
      confirmableScheduleId: option.scheduleId,
      requestedScheduleId: undefined as number | undefined,
      note: null as string | null,
    }))
  }, [hasPreferredSchedules, periodSchedule, scheduleValidation.commonSlotOptions])
  const selectableCards = periodSingleRequestedApproval
    ? requestedScheduleCards
    : hasPreferredSchedules
      ? scheduleCards.filter(card => periodSchedule || card.confirmableScheduleId != null)
      : commonAssignmentCards
  const selectedCards = selectableCards.filter(card => selectedOptionKeys.includes(card.key))

  const toggleSchedule = (optionKey: string) => {
    setSelectedOptionKeys(prev => {
      if (prev.includes(optionKey)) return prev.filter(key => key !== optionKey)
      if (!allowsMultipleSchedules) return [optionKey]
      return [...prev, optionKey]
    })
  }

  const scheduleSelectionRequired = usesScheduleSection && !autoAssignSchedule
  const handleConfirm = (payload: PermissionModalPayload) => {
    if (autoAssignSchedule) {
      const schedulePayload = autoAssign.payload
      const hasAutoSchedule =
        schedulePayload.selectedScheduleId != null || (schedulePayload.slots?.length ?? 0) > 0
      if (!hasAutoSchedule) {
        showAlert({
          title: '승인 불가',
          content: '등록된 교육 진행 일정이 없습니다.',
        })
        return
      }
      onConfirm({
        ...payload,
        ...(schedulePayload.slots?.length
          ? { slots: schedulePayload.slots }
          : { selectedScheduleId: schedulePayload.selectedScheduleId }),
      })
      return
    }
    if (!scheduleSelectionRequired) {
      onConfirm(payload)
      return
    }
    if (selectedCards.length === 0) {
      showAlert({
        title: '승인 불가',
        content: ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE,
      })
      return
    }
    if (periodSingleRequestedApproval) {
      const requestedPayload = buildPeriodSingleRequestedScheduleApprovePayload(
        selectedCards.flatMap(card =>
          card.requestedScheduleId != null ? [card.requestedScheduleId] : []
        )
      )
      if (requestedPayload == null) {
        showAlert({
          title: '승인 불가',
          content: ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE,
        })
        return
      }
      onConfirm({
        ...payload,
        requestedScheduleId: requestedPayload.requestedScheduleId,
      })
      return
    }
    if (periodSchedule) {
      const scheduleIds = selectedCards.flatMap(card =>
        card.confirmableScheduleId != null && card.confirmableScheduleId > 0
          ? [card.confirmableScheduleId]
          : []
      )
      onConfirm({
        ...payload,
        ...(scheduleIds.length === 1
          ? { selectedScheduleId: scheduleIds[0] }
          : scheduleIds.length > 1
            ? { slots: scheduleIds.map(scheduleId => ({ scheduleId })) }
            : {}),
      })
      return
    }
    const schedulePayload = buildOrganizationApplicationApproveSchedulePayload({
      preferred: preferredSource,
      educationSlots,
      selectedSlotIds: selectedCards.map(card => card.confirmableScheduleId ?? 0),
      educationScheduleMode,
    })
    const hasSchedule =
      schedulePayload.selectedScheduleId != null || (schedulePayload.slots?.length ?? 0) > 0
    if (!hasSchedule) {
      showAlert({
        title: '승인 불가',
        content:
          '선택한 일정이 현재 프로그램 공통 교육 슬롯이 아니어서 배정할 수 없습니다. 연결된 슬롯을 다시 선택해 주세요.',
      })
      return
    }
    onConfirm({
      ...payload,
      ...(schedulePayload.slots?.length
        ? { slots: schedulePayload.slots }
        : { selectedScheduleId: schedulePayload.selectedScheduleId }),
    })
  }

  const autoAssignSection = (
    <div className="institution-approve-modal__schedule-section">
      <div className="institution-approve-modal__common-slots">
        {slotsLoading ? (
          <p className="institution-approve-modal__notice">교육 진행 일정을 확인하는 중입니다.</p>
        ) : autoAssign.items.length > 0 ? (
          <DetailInfoForm title="" hideHeader mode="view">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교육 진행 일정"
                view={
                  <div className="institution-approve-modal__assigned-list">
                    {autoAssign.items.map(item => (
                      <div
                        key={item.scheduleId}
                        className="institution-approve-modal__assigned-item"
                      >
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        ) : (
          <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
            등록된 교육 진행 일정이 없습니다.
          </p>
        )}
      </div>
    </div>
  )

  const scheduleSection = autoAssignSchedule ? (
    autoAssignSection
  ) : usesScheduleSection ? (
    <div className="institution-approve-modal__schedule-section">
      {awaitingRequestedSchedules ? (
        <p className="institution-approve-modal__notice">신청 희망 일정을 확인하는 중입니다.</p>
      ) : hasPreferredSchedules ? (
        <div className="institution-approve-modal__schedule-cards">
          {scheduleCardsForView.map(card => {
            const selectable = selectableCards.some(item => item.key === card.key)
            const selected = selectedOptionKeys.includes(card.key)
            return (
              <button
                key={card.key}
                type="button"
                className={[
                  'institution-approve-modal__schedule-card',
                  selected ? 'institution-approve-modal__schedule-card--selected' : '',
                  selectable ? '' : 'institution-approve-modal__schedule-card--readonly',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={selectable ? selected : undefined}
                disabled={!selectable}
                onClick={() => {
                  if (!selectable) return
                  toggleSchedule(card.key)
                }}
              >
                <span className="institution-approve-modal__schedule-card-title">{card.title}</span>
                {card.detail ? (
                  <span className="institution-approve-modal__schedule-card-detail">
                    {card.detail}
                  </span>
                ) : null}
                {card.note ? (
                  <span className="institution-approve-modal__schedule-card-note">{card.note}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
          {scheduleValidation.invalidReason ?? ABSENT_PREFERRED_SCHEDULE_MESSAGE}
        </p>
      )}

      {commonAssignmentCards.length > 0 ? (
        <div className="institution-approve-modal__common-slots">
          <span className="institution-approve-modal__schedule-label">공통 교육 예정 일정</span>
          <div className="institution-approve-modal__schedule-cards">
            {commonAssignmentCards.map(card => {
              const selected = selectedOptionKeys.includes(card.key)
              return (
                <button
                  key={card.key}
                  type="button"
                  className={[
                    'institution-approve-modal__schedule-card',
                    selected ? 'institution-approve-modal__schedule-card--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={selected}
                  onClick={() => toggleSchedule(card.key)}
                >
                  <span className="institution-approve-modal__schedule-card-title">{card.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {selectableCards.length > 0 ? (
        <p className="institution-approve-modal__assignment-hint">{assignmentHint}</p>
      ) : null}
      {selectableCards.length > 0 ? (
        <div className="institution-approve-modal__assigned">
          <DetailInfoForm title="" hideHeader mode="edit">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="배정된 일정"
                edit={
                  selectedCards.length > 0 ? (
                    <div className="institution-approve-modal__assigned-list">
                      {selectedCards.map(card => (
                        <div key={card.key} className="institution-approve-modal__assigned-item">
                          <span>{card.title}</span>
                          <ItemDeleteButton
                            className="item-delete-button"
                            aria-label={`${card.title} 배정 삭제`}
                            onClick={() => toggleSchedule(card.key)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="institution-approve-modal__assigned-empty">
                      {ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE}
                    </span>
                  )
                }
                view={null}
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      ) : !periodSchedule && hasPreferredSchedules && scheduleValidation.slotsResolved ? (
        <p className="institution-approve-modal__notice">
          신청 희망 일정과 연결된 배정 후보가 없습니다.{' '}
          {ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE}
        </p>
      ) : null}
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
      confirmDisabled={
        slotsLoading ||
        awaitingRequestedSchedules ||
        (autoAssignSchedule
          ? autoAssign.items.length === 0
          : scheduleSelectionRequired && selectedCards.length === 0)
      }
      onCancel={onCancel}
      onConfirm={handleConfirm}
      zIndex={zIndex}
      width={600}
    >
      <PermissionModalMessage
        text={buildInstitutionApproveMessage(
          schoolName,
          usesScheduleSection,
          autoAssignSchedule
        )}
      />
      {scheduleSection}
    </PermissionModal>
  )
}
