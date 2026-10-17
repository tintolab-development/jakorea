import { useEffect, useMemo, useState } from 'react'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, CmsCheckbox } from '@/shared/ui'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  filterProgramSchedulesForNewEducationAssignment,
  resolveProgramSchedulePhysicalId,
} from '@/features/program/shared/lib/program-schedule-canonical'
import {
  scheduleIdsFromOrganizationAssignmentSlots,
  validateOrganizationScheduleAssignmentReplace,
} from '@/features/program/general/lib/organization-schedule-assignment-save'
import { useOrganizationScheduleAssignmentMutation } from '@/features/program/general/hooks/use-organization-schedule-assignment-mutation'
import './organization-schedule-assignment-section.css'

export type OrganizationScheduleAssignmentSectionProps = {
  programId: string
  organizationApplicationId: string
  canEdit: boolean
  slots?: SlotResponse[]
  slotsLoading?: boolean
  slotsError?: boolean
  programSchedules?: ProgramScheduleResponse[]
  schedulesLoading?: boolean
  schedulesError?: boolean
}

function formatProgramScheduleOptionLabel(schedule: ProgramScheduleResponse): string {
  const name = schedule.scheduleName?.trim()
  const sessionNo = schedule.sessionNo
  const title =
    name || (sessionNo != null && Number.isFinite(sessionNo) ? `${sessionNo}회차` : '교육 일정')
  const startRaw = schedule.startAt ?? schedule.startDate
  const endRaw = schedule.endAt ?? schedule.endDate
  if (!startRaw?.trim() || !endRaw?.trim()) return title
  const start = Date.parse(startRaw)
  const end = Date.parse(endRaw)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return title
  const startDate = new Date(start)
  const endDate = new Date(end)
  const datePart = startDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const startTime = startDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const endTime = endDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${title} · ${datePart} ${startTime} ~ ${endTime}`
}

export function OrganizationScheduleAssignmentSection({
  programId,
  organizationApplicationId,
  canEdit,
  slots,
  slotsLoading = false,
  slotsError = false,
  programSchedules,
  schedulesLoading = false,
  schedulesError = false,
}: OrganizationScheduleAssignmentSectionProps) {
  const scope = useMemo(
    () => ({
      programId: programId.trim(),
      organizationApplicationId: organizationApplicationId.trim(),
    }),
    [organizationApplicationId, programId]
  )

  const mutation = useOrganizationScheduleAssignmentMutation(programId, organizationApplicationId)
  const [isEditing, setIsEditing] = useState(false)
  const [draftScheduleIds, setDraftScheduleIds] = useState<number[]>([])

  const assignableSchedules = useMemo(
    () => filterProgramSchedulesForNewEducationAssignment(programSchedules ?? []),
    [programSchedules]
  )

  const allowedScheduleIds = useMemo(() => {
    const ids: number[] = []
    const seen = new Set<number>()
    for (const schedule of assignableSchedules) {
      const id = resolveProgramSchedulePhysicalId(schedule)
      if (id == null || seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
    return ids
  }, [assignableSchedules])

  const assignedScheduleIds = useMemo(
    () => scheduleIdsFromOrganizationAssignmentSlots(slots ?? [], scope),
    [scope, slots]
  )

  useEffect(() => {
    if (!isEditing) {
      setDraftScheduleIds(assignedScheduleIds)
    }
  }, [assignedScheduleIds, isEditing])

  const scheduleOptions = useMemo(() => {
    const byId = new Map<number, ProgramScheduleResponse>()
    for (const schedule of assignableSchedules) {
      const id = resolveProgramSchedulePhysicalId(schedule)
      if (id == null) continue
      byId.set(id, schedule)
    }
    const orderedIds = [
      ...assignedScheduleIds.filter(id => byId.has(id)),
      ...allowedScheduleIds.filter(id => !assignedScheduleIds.includes(id)),
    ]
    const uniqueOrdered = [...new Set(orderedIds)]
    return uniqueOrdered.map(id => ({
      scheduleId: id,
      label: formatProgramScheduleOptionLabel(byId.get(id)!),
    }))
  }, [allowedScheduleIds, assignableSchedules, assignedScheduleIds])

  const handleToggleSchedule = (scheduleId: number, checked: boolean) => {
    setDraftScheduleIds(prev => {
      if (checked) {
        if (prev.includes(scheduleId)) return prev
        return [...prev, scheduleId]
      }
      return prev.filter(id => id !== scheduleId)
    })
  }

  const handleCancelEdit = () => {
    setDraftScheduleIds(assignedScheduleIds)
    setIsEditing(false)
  }

  const handleSave = async () => {
    const validation = validateOrganizationScheduleAssignmentReplace({
      selectedScheduleIds: draftScheduleIds,
      allowedScheduleIds,
    })
    if (!validation.ok) {
      cmsAlertModal.show({ title: '교육 일정 배정', content: validation.message })
      return
    }
    try {
      await mutation.mutateAsync({
        selectedScheduleIds: draftScheduleIds,
        allowedScheduleIds,
      })
      setIsEditing(false)
    } catch {
      setDraftScheduleIds(assignedScheduleIds)
    }
  }

  const displayScheduleIds = isEditing ? draftScheduleIds : assignedScheduleIds

  const statusMessage = useMemo(() => {
    if (slotsLoading || schedulesLoading) return '교육 일정 배정 정보를 불러오는 중입니다.'
    if (slotsError) return '배정된 교육 일정을 불러오지 못했습니다.'
    if (schedulesError) return '프로그램 교육 일정을 불러오지 못했습니다.'
    if (!canEdit) return '승인된 기관 신청에만 교육 일정을 배정할 수 있습니다.'
    if (scheduleOptions.length === 0) return '배정 가능한 교육 일정이 없습니다.'
    return null
  }, [
    canEdit,
    scheduleOptions.length,
    schedulesError,
    schedulesLoading,
    slotsError,
    slotsLoading,
  ])

  const titleTrailing =
    canEdit && !slotsLoading && !schedulesLoading && scheduleOptions.length > 0 ? (
      isEditing ? (
        <span className="organization-schedule-assignment-section__actions">
          <CmsButton variant="secondary" size="medium" type="button" onClick={handleCancelEdit}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            loading={mutation.isPending}
            onClick={() => void handleSave()}
          >
            저장
          </CmsButton>
        </span>
      ) : (
        <CmsButton variant="secondary" size="medium" type="button" onClick={() => setIsEditing(true)}>
          배정 편집
        </CmsButton>
      )
    ) : null

  return (
    <DetailInfoForm title="교육 일정 배정" mode="view" titleTrailing={titleTrailing}>
      {statusMessage ? (
        <DetailInfoForm.Row type="custom">
          <p className="organization-schedule-assignment-section__status">{statusMessage}</p>
        </DetailInfoForm.Row>
      ) : isEditing ? (
        <DetailInfoForm.Row type="custom">
          <div className="organization-schedule-assignment-section__options">
            {scheduleOptions.map(option => (
              <CmsCheckbox
                key={option.scheduleId}
                checked={draftScheduleIds.includes(option.scheduleId)}
                onChange={event =>
                  handleToggleSchedule(option.scheduleId, event.target.checked)
                }
              >
                {option.label}
              </CmsCheckbox>
            ))}
          </div>
        </DetailInfoForm.Row>
      ) : displayScheduleIds.length === 0 ? (
        <DetailInfoForm.Row type="custom">
          <p className="organization-schedule-assignment-section__status">
            배정된 교육 일정이 없습니다.
          </p>
        </DetailInfoForm.Row>
      ) : (
        scheduleOptions
          .filter(option => displayScheduleIds.includes(option.scheduleId))
          .map(option => (
            <DetailInfoForm.Row type="single" key={option.scheduleId}>
              <DetailInfoForm.Field label="배정 일정" fullRow readOnlyDisplay view={option.label} />
            </DetailInfoForm.Row>
          ))
      )}
    </DetailInfoForm>
  )
}
