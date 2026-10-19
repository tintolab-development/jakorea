import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchIndividualApplicationDetailRemote } from '@/features/program/general/api/applications-api-client'
import {
  fetchGeneralParticipantEducationScope,
  saveGeneralParticipantEducationScope,
} from '@/features/program/general/api/admin-program-progress-service'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { fetchAdminProgramEducationSlotsRemote } from '@/features/program/general/api/program-schedules-api-client'
import type { IndividualApplicationDetailEnriched } from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  buildIndividualApprovalSchedulePlan,
  defaultIndividualApprovalScheduleIds,
  formatIndividualApprovalScopeErrorMessage,
  individualApprovalEducationSlotsQueryKey,
  individualApprovalProgramShapeFromProgram,
  invalidateIndividualApprovalScopeQueries,
  isEducationScopeCertificateLocked,
  isEducationScopeRevisionConflict,
  normalizeIndividualApprovalReason,
  validateIndividualApprovalScheduleSelection,
} from '@/features/program/general/lib/individual-approval-education-scope'
import type { Program } from '@/types/domain'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, CmsInput } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import '@/features/program/shared/ui/detail-modal/components/institution-approve-modal.css'

export function IndividualEducationScopeSection({
  program,
  participantId,
  applicationId,
}: {
  program: Program
  participantId: string
  applicationId?: string
}) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [certificateLocked, setCertificateLocked] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const programShape = useMemo(
    () => individualApprovalProgramShapeFromProgram(program),
    [program]
  )
  const slotsQuery = useQuery({
    queryKey: individualApprovalEducationSlotsQueryKey(program.id),
    queryFn: () => fetchAdminProgramEducationSlotsRemote(program.id),
    enabled: Boolean(program.id.trim()),
    staleTime: 0,
    retry: false,
  })
  const scopeQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.educationScope(program.id, participantId),
    queryFn: () => fetchGeneralParticipantEducationScope(program.id, participantId),
    enabled: Boolean(program.id.trim() && participantId.trim()),
    staleTime: 0,
    retry: false,
  })
  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.individualDetail(applicationId ?? ''),
    queryFn: () => fetchIndividualApplicationDetailRemote(applicationId!),
    enabled: Boolean(applicationId?.trim()),
    staleTime: 0,
    retry: false,
  })
  const preferred = (detailQuery.data as IndividualApplicationDetailEnriched | undefined)?.application
    ?.preferredEducationSchedules
  const preferredResolved = !applicationId?.trim() || detailQuery.isSuccess || detailQuery.isError
  const plan = useMemo(
    () =>
      buildIndividualApprovalSchedulePlan({
        program: programShape,
        preferred,
        slots: slotsQuery.data,
        slotsResolved: slotsQuery.isSuccess && preferredResolved,
      }),
    [preferred, preferredResolved, programShape, slotsQuery.data, slotsQuery.isSuccess]
  )
  const assignedIds = scopeQuery.data?.scheduleIds ?? []
  const selectableIds = new Set(
    plan.options.map(option => option.scheduleId).filter((id): id is number => id != null)
  )
  const serverOnlyIds = assignedIds.filter(id => !selectableIds.has(id) && !plan.lockedScheduleIds.includes(id))
  const sourceKey = [
    plan.kind,
    plan.lockedScheduleIds.join(','),
    plan.options.map(option => `${option.key}:${option.scheduleId ?? ''}:${option.selectable}`).join('|'),
    assignedIds.join(','),
  ].join(';')
  const [appliedSourceKey, setAppliedSourceKey] = useState<string | null>(null)
  if (!editing && appliedSourceKey !== sourceKey) {
    setAppliedSourceKey(sourceKey)
    if (plan.kind === 'all-program-slots') {
      setSelectedIds(defaultIndividualApprovalScheduleIds(plan))
    } else {
      const allowed = new Set(
        plan.options.filter(option => option.selectable).map(option => option.scheduleId)
      )
      setSelectedIds(assignedIds.filter(id => allowed.has(id)))
    }
  }

  const selection = validateIndividualApprovalScheduleSelection(plan, selectedIds)
  const canEdit = !certificateLocked && !scopeQuery.isError

  const toggle = (scheduleId: number) => {
    setSelectedIds(prev => {
      if (plan.kind === 'preferred-exact-one') return [scheduleId]
      if (prev.includes(scheduleId)) return prev.filter(id => id !== scheduleId)
      return [...prev, scheduleId]
    })
  }

  const save = async () => {
    const normalized = normalizeIndividualApprovalReason(reason)
    if (!normalized.ok) {
      showAlert({ title: '재배정 불가', content: normalized.message })
      return
    }
    if (!selection.ok) {
      showAlert({ title: '재배정 불가', content: selection.message })
      return
    }
    const revision = scopeQuery.data?.revision
    if (revision == null) {
      showAlert({ title: '재배정 불가', content: '교육 일정 개정 번호를 확인한 뒤 다시 저장해 주세요.' })
      return
    }
    setSaving(true)
    try {
      await saveGeneralParticipantEducationScope(program.id, participantId, {
        scheduleIds: selection.confirmedScheduleIds,
        expectedRevision: revision,
        reason: normalized.reason,
      })
      await invalidateIndividualApprovalScopeQueries(queryClient, {
        programId: program.id,
        applicationIds: applicationId ? [applicationId] : [],
        participantIds: [participantId],
      })
      setEditing(false)
      setReason('')
      showAlert({ title: '재배정 완료', content: '교육 일정을 변경했습니다.' })
    } catch (error) {
      await scopeQuery.refetch()
      if (isEducationScopeCertificateLocked(error)) setCertificateLocked(true)
      const message = formatIndividualApprovalScopeErrorMessage(error)
      showAlert({
        title: isEducationScopeRevisionConflict(error) ? '교육 일정 갱신' : '재배정 실패',
        content: isEducationScopeRevisionConflict(error)
          ? `${message}\n최신 교육 일정을 다시 불러왔습니다. 선택을 확인한 뒤 다시 저장해 주세요.`
          : message,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailInfoForm
      title="교육 일정"
      mode="view"
      titleTrailing={
        canEdit && !editing ? (
          <CmsButton variant="secondary" size="medium" type="button" onClick={() => setEditing(true)}>
            재배정
          </CmsButton>
        ) : null
      }
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="배정 일정"
          view={
            <div className="institution-approve-modal__schedule-section">
              {slotsQuery.isLoading || scopeQuery.isLoading ? (
                <p className="institution-approve-modal__notice">교육 일정을 확인하는 중입니다.</p>
              ) : plan.blockedReason && !editing ? (
                <p className="institution-approve-modal__notice">{plan.blockedReason}</p>
              ) : (
                <div className="institution-approve-modal__schedule-cards">
                  {plan.options.map(option => {
                    const selected =
                      option.scheduleId != null &&
                      (plan.kind === 'all-program-slots' || selectedIds.includes(option.scheduleId))
                    const selectable = editing && option.selectable && plan.kind !== 'all-program-slots'
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
                        disabled={!selectable}
                        onClick={() => {
                          if (!selectable || option.scheduleId == null) return
                          toggle(option.scheduleId)
                        }}
                      >
                        <span className="institution-approve-modal__schedule-card-title">
                          {option.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              {serverOnlyIds.length > 0 ? (
                <p className="institution-approve-modal__notice">
                  서버가 포함한 일정: {serverOnlyIds.join(', ')}
                </p>
              ) : null}
              {editing ? (
                <>
                  <CmsInput
                    inputSize="small"
                    width="100%"
                    value={reason}
                    maxLength={500}
                    placeholder="재배정 사유를 입력해 주세요."
                    onChange={event => setReason(event.target.value)}
                  />
                  <div className="institution-approve-modal__assigned-tags">
                    <CmsButton
                      variant="secondary"
                      size="medium"
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setEditing(false)
                        setReason('')
                        setAppliedSourceKey(null)
                      }}
                    >
                      취소
                    </CmsButton>
                    <CmsButton
                      variant="primary"
                      size="medium"
                      type="button"
                      loading={saving}
                      disabled={saving || !selection.ok}
                      onClick={() => {
                        void save()
                      }}
                    >
                      저장
                    </CmsButton>
                  </div>
                </>
              ) : null}
            </div>
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
