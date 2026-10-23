import { PFButton, PFModal, PFText } from '@/shared/ui'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { useApplicationScheduleAttendanceQuery } from '@/features/mypage/education/applications/api/activity-hooks'
import { VolunteerAssignmentPanelSkeleton } from '@/features/mypage/shared/ui'
import {
  resolveScheduleAttendanceQueryErrorMessage,
} from '../lib/history'
import { mapPortalScheduleAttendanceDetail } from '../lib/map-attendance'
import styles from './attendance-detail-modal.module.css'

type UjatAttendanceDetailModalProps = {
  open: boolean
  applicationType: ProgramApplicationType | null | undefined
  applicationId: string | null | undefined
  scheduleId: number | null
  canViewAttendance: boolean
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <PFText as="dt" typo="bd-md-rg" color="neutral-cool-500">
        {label}
      </PFText>
      <PFText as="dd" typo="bd-md-md" color="black">
        {value}
      </PFText>
    </div>
  )
}

export function UjatAttendanceDetailModal({
  open,
  applicationType,
  applicationId,
  scheduleId,
  canViewAttendance,
  onClose,
}: UjatAttendanceDetailModalProps) {
  const query = useApplicationScheduleAttendanceQuery(
    applicationType,
    applicationId,
    scheduleId,
    { enabled: open && canViewAttendance },
  )
  const detail = query.data ? mapPortalScheduleAttendanceDetail(query.data) : null

  return (
    <PFModal open={open} onClose={onClose} title="출결 상세" size="sm">
      <div className={styles.body}>
        {!canViewAttendance ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            출결 상세를 조회할 수 없는 일정입니다.
          </PFText>
        ) : query.isLoading ? (
          <VolunteerAssignmentPanelSkeleton statusMessage="출결 상세를 불러오는 중입니다." />
        ) : query.isError ? (
          <>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {resolveScheduleAttendanceQueryErrorMessage(query.error)}
            </PFText>
            <PFButton type="button" variant="tertiary" size="large" onClick={() => void query.refetch()}>
              다시 시도
            </PFButton>
          </>
        ) : detail ? (
          <dl className={styles.list}>
            <DetailRow label="출결 상태" value={detail.attendanceLabel} />
            <DetailRow label="배정 학급" value={detail.classLabel} />
            <DetailRow label="배정 상태" value={detail.assignmentStatusLabel} />
            <DetailRow label="기관" value={detail.locationName} />
            <DetailRow label="결석 사유" value={detail.absenceReason} />
          </dl>
        ) : (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            출결 상세가 없습니다.
          </PFText>
        )}
      </div>
    </PFModal>
  )
}
