import { useId } from 'react'
import { PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import {
  useApplicationScheduleAttendanceQuery,
  useSubmitApplicationScheduleCheckIn,
} from '@/features/mypage/education/applications/api/activity-hooks'
import { VolunteerAssignmentPanelSkeleton } from '@/features/mypage/shared/ui'
import type { EducationScheduleItem } from '@/features/mypage/education/schedules/model/types'
import { formatDisplayDateTime } from '@/shared/lib/format-display-date'
import {
  resolveScheduleAttendanceQueryErrorMessage,
  resolveScheduleCheckInErrorMessage,
} from '../lib/history'
import { joinSchedulePlaceLabel } from '../lib/map-attendance'
import styles from './check-in-modal.module.css'

type UjatCheckInModalProps = {
  open: boolean
  item: EducationScheduleItem | null
  applicationType: ProgramApplicationType | null | undefined
  applicationId: string | null | undefined
  onClose: () => void
}

export function UjatCheckInModal({
  open,
  item,
  applicationType,
  applicationId,
  onClose,
}: UjatCheckInModalProps) {
  const descriptionId = useId()
  const scheduleId = item?.scheduleId ?? null
  const query = useApplicationScheduleAttendanceQuery(applicationType, applicationId, scheduleId, {
    enabled: open && scheduleId != null,
  })
  const checkInMutation = useSubmitApplicationScheduleCheckIn(applicationType, applicationId)
  const sessionTime =
    item?.progressTimeLabel?.trim() ||
    formatDisplayDateTime(item?.heldAt) ||
    '-'
  const assignedPlace = joinSchedulePlaceLabel(
    query.data?.organizationName ?? query.data?.locationName ?? item?.locationName,
    query.data?.classLabel ?? item?.classLabel,
  )
  const canSubmit =
    scheduleId != null &&
    !query.isLoading &&
    !query.isError &&
    query.data?.canCheckIn !== false &&
    !checkInMutation.isPending

  return (
    <PFModal
      showCloseButton={false}
      open={open}
      onClose={onClose}
      title="출석하기"
      size="md"
      ariaDescribedBy={descriptionId}
      closeOnBackdropClick={!checkInMutation.isPending}
      closeOnEscape={!checkInMutation.isPending}
    >
      <div className={styles.body}>
        <div id={descriptionId} className={styles.description}>
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600">
            지정된 모집 장소에 도착 후 출석을 확인해 주세요. 수업시간 30분 전까지 모집 장소에
            도착해야 하며, 이후 불참 건은 지각 처리됩니다.
          </PFText>
        </div>
        {query.isLoading ? (
          <VolunteerAssignmentPanelSkeleton statusMessage="출석 정보를 불러오는 중입니다." />
        ) : query.isError ? (
          <>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {resolveScheduleAttendanceQueryErrorMessage(query.error)}
            </PFText>
            <PFButton type="button" variant="tertiary" size="large" onClick={() => void query.refetch()}>
              다시 시도
            </PFButton>
          </>
        ) : (
          <div className={styles.fields}>
            <PFTextInput size="xlarge" label="수업 시간" value={sessionTime} disabled />
            <PFTextInput size="xlarge" label="배정 기관 및 학급" value={assignedPlace} disabled />
          </div>
        )}
        {checkInMutation.isError ? (
          <PFText as="p" typo="bd-md-rg" color="error">
            {resolveScheduleCheckInErrorMessage(checkInMutation.error)}
          </PFText>
        ) : null}
        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            disabled={checkInMutation.isPending}
            onClick={onClose}
          >
            취소
          </PFButton>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            disabled={!canSubmit}
            onClick={() => {
              if (scheduleId == null || !canSubmit) return
              checkInMutation.mutate(scheduleId, { onSuccess: onClose })
            }}
          >
            {checkInMutation.isPending ? '출석 중…' : '출석'}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
