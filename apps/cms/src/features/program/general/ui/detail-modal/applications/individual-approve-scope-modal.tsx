import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminProgramEducationSlotsRemote } from '@/features/program/general/api/program-schedules-api-client'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  buildIndividualApprovalSchedulePlan,
  defaultIndividualApprovalScheduleIds,
  individualApprovalEducationSlotsQueryKey,
  individualApprovalProgramShapeFromProgram,
  normalizeIndividualApprovalReason,
  validateIndividualApprovalScheduleSelection,
  type IndividualApprovalScheduleOption,
  type IndividualApprovalSchedulePlan,
} from '@/features/program/general/lib/individual-approval-education-scope'
import {
  PermissionModal,
  PermissionModalMessage,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE,
  ORGANIZATION_EDUCATION_MULTIPLE_SCHEDULE_HINT,
  ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT,
} from '@/features/program/general/lib/organization-application-approve-slots'
import { formatOrganizationApproveScheduleCard } from '@/features/program/general/lib/organization-preferred-schedule-label'
import '@/features/program/shared/ui/detail-modal/components/institution-approve-modal.css'

type ApprovalProgram = Parameters<typeof individualApprovalProgramShapeFromProgram>[0]

function planSelectionKey(open: boolean, plan: IndividualApprovalSchedulePlan): string {
  if (!open) return 'closed'
  return [
    plan.kind,
    plan.lockedScheduleIds.join(','),
    plan.options.map(option => `${option.scheduleId ?? ''}:${option.selectable}`).join('|'),
  ].join(';')
}

export type IndividualApproveScopeConfirmPayload = {
  reason: string
  confirmedScheduleIds: number[]
  expectedScopeRevision: number
  notifyTiming: PermissionModalPayload['notifyTiming']
  manualNotifyAt?: PermissionModalPayload['manualNotifyAt']
}

export type IndividualBulkApproveScopeTarget = {
  id: string
  name: string
  preferredEducationSchedules?: PreferredEducationSchedule[]
}

export type IndividualBulkApproveScopeConfirmPayload = {
  reason: string
  notifyTiming: PermissionModalPayload['notifyTiming']
  manualNotifyAt?: PermissionModalPayload['manualNotifyAt']
  targets: Array<{ applicationId: string; confirmedScheduleIds: number[]; expectedScopeRevision: number }>
}

/** 기관 승인 안내와 같은 문장 구조. 호칭·수신 대상만 참여자용이다. */
export function buildIndividualApproveMessage(participantName: string): string {
  const name = participantName.trim() || '참여자'
  return `**[${name}]** 님의 프로그램 신청을 승인하시겠습니까?\n승인 시 선택한 일정으로 교육이 배정되며, 회원에게 승인 알림이 발송됩니다.`
}

function scheduleCardParts(option: IndividualApprovalScheduleOption): {
  title: string
  detail: string
} {
  const card = formatOrganizationApproveScheduleCard({ label: option.title })
  return {
    title: card.title || option.title,
    detail: card.detail,
  }
}

function ScheduleChoices({
  plan,
  selectedIds,
  onToggle,
}: {
  plan: IndividualApprovalSchedulePlan
  selectedIds: number[]
  onToggle?: (scheduleId: number) => void
}) {
  const selectableOptions = plan.options.filter(
    option => option.selectable && option.scheduleId != null && plan.kind !== 'all-program-slots'
  )
  const selectedOptions = selectableOptions.filter(option =>
    selectedIds.includes(option.scheduleId as number)
  )
  const assignmentHint =
    plan.kind === 'preferred-at-least-one'
      ? ORGANIZATION_EDUCATION_MULTIPLE_SCHEDULE_HINT
      : ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT

  return (
    <>
      {plan.options.length > 0 ? (
        <div className="institution-approve-modal__schedule-cards">
          {plan.options.map(option => {
            const card = scheduleCardParts(option)
            const selected =
              option.scheduleId != null &&
              (plan.kind === 'all-program-slots' || selectedIds.includes(option.scheduleId))
            const selectable = option.selectable && plan.kind !== 'all-program-slots'
            return (
              <button
                key={option.key}
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
                  if (!selectable || option.scheduleId == null) return
                  onToggle?.(option.scheduleId)
                }}
              >
                <span className="institution-approve-modal__schedule-card-title">{card.title}</span>
                {card.detail ? (
                  <span className="institution-approve-modal__schedule-card-detail">
                    {card.detail}
                  </span>
                ) : null}
                {option.blockedReason ? (
                  <span className="institution-approve-modal__schedule-card-note">
                    {option.blockedReason}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
      {plan.blockedReason && plan.options.length === 0 ? (
        <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
          {plan.blockedReason}
        </p>
      ) : null}
      {selectableOptions.length > 0 ? (
        <p className="institution-approve-modal__assignment-hint">{assignmentHint}</p>
      ) : null}
      {selectableOptions.length > 0 ? (
        <div className="institution-approve-modal__assigned">
          <DetailInfoForm title="" hideHeader mode="edit">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="배정된 일정"
                edit={
                  selectedOptions.length > 0 ? (
                    <div className="institution-approve-modal__assigned-list">
                      {selectedOptions.map(option => {
                        const card = scheduleCardParts(option)
                        return (
                          <div key={option.key} className="institution-approve-modal__assigned-item">
                            <span>{card.title}</span>
                            <ItemDeleteButton
                              className="item-delete-button"
                              aria-label={`${card.title} 배정 삭제`}
                              onClick={() => {
                                if (option.scheduleId == null) return
                                onToggle?.(option.scheduleId)
                              }}
                            />
                          </div>
                        )
                      })}
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
      ) : null}
    </>
  )
}

export function IndividualApproveScopeModal({
  open,
  participantName,
  programId,
  program,
  preferredEducationSchedules,
  confirmLoading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  participantName: string
  programId?: string
  program: ApprovalProgram
  preferredEducationSchedules?: PreferredEducationSchedule[]
  confirmLoading?: boolean
  onCancel: () => void
  onConfirm: (payload: IndividualApproveScopeConfirmPayload) => void
}) {
  const { showAlert } = useCmsAlert()
  const programShape = useMemo(
    () => individualApprovalProgramShapeFromProgram(program),
    [program]
  )
  const slotsQuery = useQuery({
    queryKey: individualApprovalEducationSlotsQueryKey(programId ?? ''),
    queryFn: () => fetchAdminProgramEducationSlotsRemote(programId!),
    enabled: open && Boolean(programId?.trim()),
    staleTime: 0,
    retry: false,
  })
  const plan = useMemo(
    () =>
      buildIndividualApprovalSchedulePlan({
        program: programShape,
        preferred: preferredEducationSchedules,
        slots: slotsQuery.data,
        slotsResolved: slotsQuery.isSuccess,
      }),
    [preferredEducationSchedules, programShape, slotsQuery.data, slotsQuery.isSuccess]
  )
  const selectionKey = planSelectionKey(open, plan)
  const [appliedSelectionKey, setAppliedSelectionKey] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  if (appliedSelectionKey !== selectionKey) {
    setAppliedSelectionKey(selectionKey)
    setSelectedIds(open ? defaultIndividualApprovalScheduleIds(plan) : [])
  }

  const selection = validateIndividualApprovalScheduleSelection(plan, selectedIds)
  const slotsPending = open && Boolean(programId?.trim()) && slotsQuery.isLoading
  const confirmDisabled = slotsPending || slotsQuery.isError || !selection.ok

  const toggle = (scheduleId: number) => {
    setSelectedIds(prev => {
      if (plan.kind === 'preferred-exact-one') return [scheduleId]
      if (prev.includes(scheduleId)) return prev.filter(id => id !== scheduleId)
      return [...prev, scheduleId]
    })
  }

  const handleConfirm = (payload: PermissionModalPayload) => {
    const reason = payload.reason.trim()
    if (reason.length > 500) {
      showAlert({ title: '승인 불가', content: '승인 사유는 500자 이하로 입력해 주세요.' })
      return
    }
    const next = validateIndividualApprovalScheduleSelection(plan, selectedIds)
    if (!next.ok) {
      showAlert({ title: '승인 불가', content: next.message })
      return
    }
    onConfirm({
      reason,
      confirmedScheduleIds: next.confirmedScheduleIds,
      expectedScopeRevision: 0,
      notifyTiming: payload.notifyTiming,
      manualNotifyAt: payload.manualNotifyAt,
    })
  }

  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="institution-approve-modal individual-approve-scope-modal"
      title="프로그램 신청 승인 안내"
      confirmLabel="승인"
      confirmLoading={confirmLoading}
      confirmDisabled={confirmDisabled}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      width={600}
    >
      <PermissionModalMessage text={buildIndividualApproveMessage(participantName)} />
      <div className="institution-approve-modal__schedule-section">
        {slotsPending ? (
          <p className="institution-approve-modal__notice">교육 일정을 확인하는 중입니다.</p>
        ) : slotsQuery.isError ? (
          <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
            프로그램 교육 일정을 불러오지 못했습니다.
          </p>
        ) : (
          <ScheduleChoices plan={plan} selectedIds={selectedIds} onToggle={toggle} />
        )}
      </div>
    </PermissionModal>
  )
}

export function IndividualBulkApproveScopeModal({
  open,
  applicants,
  programId,
  program,
  confirmLoading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  applicants: ReadonlyArray<IndividualBulkApproveScopeTarget>
  programId?: string
  program: ApprovalProgram
  confirmLoading?: boolean
  onCancel: () => void
  onConfirm: (payload: IndividualBulkApproveScopeConfirmPayload) => void
}) {
  const { showAlert } = useCmsAlert()
  const programShape = useMemo(
    () => individualApprovalProgramShapeFromProgram(program),
    [program]
  )
  const slotsQuery = useQuery({
    queryKey: individualApprovalEducationSlotsQueryKey(programId ?? ''),
    queryFn: () => fetchAdminProgramEducationSlotsRemote(programId!),
    enabled: open && Boolean(programId?.trim()),
    staleTime: 0,
    retry: false,
  })
  const plans = useMemo(
    () =>
      applicants.map(applicant => ({
        applicant,
        plan: buildIndividualApprovalSchedulePlan({
          program: programShape,
          preferred: applicant.preferredEducationSchedules,
          slots: slotsQuery.data,
          slotsResolved: slotsQuery.isSuccess,
        }),
      })),
    [applicants, programShape, slotsQuery.data, slotsQuery.isSuccess]
  )
  const selectionKey = open
    ? plans.map(item => `${item.applicant.id}:${planSelectionKey(true, item.plan)}`).join('||')
    : 'closed'
  const [appliedSelectionKey, setAppliedSelectionKey] = useState<string | null>(null)
  const [selectedByApplicant, setSelectedByApplicant] = useState<Record<string, number[]>>({})
  if (appliedSelectionKey !== selectionKey) {
    setAppliedSelectionKey(selectionKey)
    if (!open) {
      setSelectedByApplicant({})
    } else {
      const next: Record<string, number[]> = {}
      for (const item of plans) {
        next[item.applicant.id] = defaultIndividualApprovalScheduleIds(item.plan)
      }
      setSelectedByApplicant(next)
    }
  }

  const resolvedTargets = plans.map(item => {
    const selected = selectedByApplicant[item.applicant.id] ?? []
    return {
      applicant: item.applicant,
      plan: item.plan,
      selection: validateIndividualApprovalScheduleSelection(item.plan, selected),
    }
  })
  const slotsPending = open && Boolean(programId?.trim()) && slotsQuery.isLoading
  const confirmDisabled =
    slotsPending || slotsQuery.isError || resolvedTargets.some(item => !item.selection.ok)

  const handleConfirm = (payload: PermissionModalPayload) => {
    const reason = normalizeIndividualApprovalReason(payload.reason)
    if (!reason.ok) {
      showAlert({ title: '승인 불가', content: reason.message })
      return
    }
    if (resolvedTargets.some(item => !item.selection.ok)) {
      showAlert({ title: '승인 불가', content: '신청자별 교육 일정을 확인해 주세요.' })
      return
    }
    onConfirm({
      reason: reason.reason,
      notifyTiming: payload.notifyTiming,
      manualNotifyAt: payload.manualNotifyAt,
      targets: resolvedTargets.map(item => ({
        applicationId: item.applicant.id,
        confirmedScheduleIds: item.selection.ok ? item.selection.confirmedScheduleIds : [],
        expectedScopeRevision: 0,
      })),
    })
  }

  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="individual-bulk-approve-scope-modal"
      title="참여자 일괄 승인 안내"
      confirmLabel="승인"
      confirmLoading={confirmLoading}
      confirmDisabled={confirmDisabled}
      requireReason
      reasonLabel="승인 사유"
      reasonPlaceholder="승인 사유를 입력해 주세요."
      onCancel={onCancel}
      onConfirm={handleConfirm}
      width={640}
    >
      <PermissionModalMessage
        text={`선택한 ${applicants.length}명의 참여자를 각자 확인한 교육 일정으로 승인합니다.\n한 일정을 모든 신청자에게 복사하지 않습니다.`}
      />
      <div className="institution-approve-modal__schedule-section">
        {slotsPending ? (
          <p className="institution-approve-modal__notice">교육 일정을 확인하는 중입니다.</p>
        ) : slotsQuery.isError ? (
          <p className="institution-approve-modal__notice institution-approve-modal__notice--warn">
            프로그램 교육 일정을 불러오지 못했습니다.
          </p>
        ) : (
          resolvedTargets.map(item => (
            <div key={item.applicant.id}>
              <p className="institution-approve-modal__schedule-label">{item.applicant.name}</p>
              <ScheduleChoices
                plan={item.plan}
                selectedIds={selectedByApplicant[item.applicant.id] ?? []}
                onToggle={scheduleId => {
                  setSelectedByApplicant(prev => {
                    const current = prev[item.applicant.id] ?? []
                    const next =
                      item.plan.kind === 'preferred-exact-one'
                        ? [scheduleId]
                        : current.includes(scheduleId)
                          ? current.filter(id => id !== scheduleId)
                          : [...current, scheduleId]
                    return { ...prev, [item.applicant.id]: next }
                  })
                }}
              />
            </div>
          ))
        )}
      </div>
    </PermissionModal>
  )
}
