/**
 * 일반 개인 프로그램 봉사자 — 「교육 배정 안내」 (시안 4121:89621 / 9899:149410)
 * 승인(면접 없음)·2차 면접 합격 확정 직전에 일정을 고른다. 일정 없이 [배정]하면 승인만 한다.
 */

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminProgramEducationSlotsRemote } from '@/features/program/general/api/program-schedules-api-client'
import { fetchVolunteerApplicationDetailRemote } from '@/features/program/general/api/applications-api-client'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { individualApprovalEducationSlotsQueryKey } from '@/features/program/general/lib/individual-approval-education-scope'
import { mapVolunteerActivityScheduleSlotsToPreferred } from '@/features/program/general/lib/volunteer-activity-schedule-slots'
import { ORGANIZATION_EDUCATION_MULTIPLE_SCHEDULE_HINT } from '@/features/program/general/lib/organization-application-approve-slots'
import {
  buildVolunteerEducationAssignPlan,
  toggleVolunteerEducationAssignSelection,
} from '@/features/program/general/lib/volunteer-education-assign'
import { InstructorAssignSessionSlotChip } from '@/features/program/shared/ui/detail-modal/components/instructor-assign-session-slot-chip'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import type { Program } from '@/types/domain'
import './education-assign-modal.css'

const MODAL_Z_INDEX = 2550

export type GeneralVolunteerEducationAssignModalProps = {
  open: boolean
  program: Program
  applicationId: string
  volunteerName: string
  confirmLoading?: boolean
  onCancel: () => void
  onConfirm: (confirmedScheduleIds: number[]) => void
}

export function GeneralVolunteerEducationAssignModal({
  open,
  program,
  applicationId,
  volunteerName,
  confirmLoading = false,
  onCancel,
  onConfirm,
}: GeneralVolunteerEducationAssignModalProps) {
  const programId = program.id
  const slotsQuery = useQuery({
    queryKey: individualApprovalEducationSlotsQueryKey(programId),
    queryFn: () => fetchAdminProgramEducationSlotsRemote(programId),
    enabled: open && Boolean(programId),
    staleTime: 0,
    retry: false,
  })
  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.volunteerDetail(applicationId),
    queryFn: () => fetchVolunteerApplicationDetailRemote(applicationId),
    enabled: open && Boolean(applicationId),
    staleTime: 30_000,
    retry: false,
  })
  const preferred = useMemo(
    () => mapVolunteerActivityScheduleSlotsToPreferred(detailQuery.data?.activityScheduleSlots),
    [detailQuery.data?.activityScheduleSlots]
  )
  const plan = useMemo(
    () => buildVolunteerEducationAssignPlan({ program, slots: slotsQuery.data, preferred }),
    [preferred, program, slotsQuery.data]
  )

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setSelectedIds([])
  }

  const loading = open && (slotsQuery.isLoading || detailQuery.isLoading)
  const toggle = (scheduleId: number) =>
    setSelectedIds(prev => toggleVolunteerEducationAssignSelection(plan, prev, scheduleId))
  const selectedOptions = plan.options.filter(option => selectedIds.includes(option.scheduleId))
  const name = volunteerName.trim() || '봉사자'

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="교육 배정 안내"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="general-volunteer-education-assign-modal"
      description={`**[${name}]** 님을 배정할 일정을 선택해 주세요`}
      footer={
        <div className="general-volunteer-education-assign-modal__footer">
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            loading={confirmLoading}
            disabled={loading || confirmLoading}
            onClick={() => onConfirm(selectedIds)}
          >
            배정
          </CmsButton>
        </div>
      }
    >
      <div className="general-volunteer-education-assign-modal__slots">
        {loading ? (
          <p className="general-volunteer-education-assign-modal__notice" role="status">
            교육 일정을 확인하는 중입니다.
          </p>
        ) : slotsQuery.isError ? (
          <p className="general-volunteer-education-assign-modal__notice general-volunteer-education-assign-modal__notice--warn">
            프로그램 교육 일정을 불러오지 못했습니다. 일정 없이 승인만 할 수 있습니다.
          </p>
        ) : plan.blockedReason ? (
          <p className="general-volunteer-education-assign-modal__notice general-volunteer-education-assign-modal__notice--warn">
            {plan.blockedReason} 일정 없이 승인만 할 수 있습니다.
          </p>
        ) : (
          plan.options.map(option => (
            <InstructorAssignSessionSlotChip
              key={option.scheduleId}
              scheduleLabel={option.scheduleLabel}
              sessionRoundLabel={option.sessionRoundLabel}
              capacityLabel=""
              selected={selectedIds.includes(option.scheduleId)}
              onClick={() => toggle(option.scheduleId)}
            />
          ))
        )}
      </div>
      {plan.mode === 'multiple' && !plan.blockedReason ? (
        <p className="general-volunteer-education-assign-modal__hint">
          {ORGANIZATION_EDUCATION_MULTIPLE_SCHEDULE_HINT}
        </p>
      ) : null}
      <div className="general-volunteer-education-assign-modal__summary">
        <DetailInfoForm title="" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="배정된 일정"
              view={null}
              edit={
                selectedOptions.length > 0 ? (
                  <div className="general-volunteer-education-assign-modal__assigned-list">
                    {selectedOptions.map(option => (
                      <span
                        key={option.scheduleId}
                        className="general-volunteer-education-assign-modal__assigned-item"
                      >
                        <span>{option.scheduleLabel}</span>
                        <ItemDeleteButton
                          className="item-delete-button"
                          aria-label={`${option.scheduleLabel} 배정 삭제`}
                          onClick={() => toggle(option.scheduleId)}
                        />
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="general-volunteer-education-assign-modal__assigned-empty">
                    배정할 일정을 선택해 주세요. 선택하지 않으면 승인만 진행합니다.
                  </span>
                )
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
