import { useMemo, useState } from 'react'
import { EducationSessionListSkeleton } from '@/features/mypage/shared/ui'
import { DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE } from '@/features/program/lib/application-api-error'
import { PFButton, PFText } from '@/shared/ui'
import { useApplicationSchedulesQuery } from '@/features/mypage/education/applications/api/activity-hooks'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { EducationSessionList } from '@/features/mypage/education/shared'
import type { EducationScheduleItem } from '@/features/mypage/education/schedules/model/types'
import {
  canViewUjatScheduleAttendance,
  groupUjatVolunteerSchedulesByMonth,
  isUjatVolunteerOwnScheduleRecord,
} from '../lib/history'
import { UjatAttendanceDetailModal } from './attendance-detail-modal'
import { UjatVolunteerScheduleRow } from './schedule-row'
import styles from './panel.module.css'

type UjatVolunteerSchedulePanelProps = {
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  listTitle?: string
  readOnly?: boolean
}

export function UjatVolunteerSchedulePanel({
  applicationType,
  applicationId,
  listTitle = '배정 및 출결 현황',
  readOnly = false,
}: UjatVolunteerSchedulePanelProps) {
  const [attendanceSchedule, setAttendanceSchedule] = useState<EducationScheduleItem | null>(null)
  const remoteSchedules = useApplicationSchedulesQuery(applicationType, applicationId)

  const ownItems = useMemo(
    () =>
      remoteSchedules.items.filter(item =>
        isUjatVolunteerOwnScheduleRecord(item, {
          includeAssignedWithoutAttendance: !readOnly,
        }),
      ),
    [readOnly, remoteSchedules.items],
  )
  const monthGroups = useMemo(() => groupUjatVolunteerSchedulesByMonth(ownItems), [ownItems])

  if (remoteSchedules.isLoading) {
    return <EducationSessionListSkeleton statusMessage={`${listTitle}을 불러오는 중입니다.`} />
  }
  if (remoteSchedules.isError) {
    const errorMessage =
      remoteSchedules.errorCode === 'DATABASE_ERROR'
        ? DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE
        : `${listTitle}을 불러오지 못했습니다.`
    return (
      <div className={styles.status}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {errorMessage}
        </PFText>
        {remoteSchedules.traceId ? (
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500">
            traceId: {remoteSchedules.traceId}
          </PFText>
        ) : null}
        <PFButton
          type="button"
          variant="tertiary"
          size="large"
          disabled={remoteSchedules.isRefetching}
          onClick={() => void remoteSchedules.refetch()}
        >
          다시 시도
        </PFButton>
      </div>
    )
  }

  return (
    <>
      <EducationSessionList
        title={listTitle}
        totalCount={ownItems.length}
        currentPage={1}
        totalPages={1}
        onPageChange={() => undefined}
        emptyMessage="조회할 배정·출결 이력이 없어요."
      >
        {monthGroups.map(group => (
          <section key={group.monthKey} className={styles.month}>
            <PFText as="h3" typo="bd-md-md" color="neutral-cool-600" className={styles.monthLabel}>
              {group.monthLabel}
            </PFText>
            <div className={styles.monthList}>
              {group.items.map(item => (
                <UjatVolunteerScheduleRow
                  key={item.id}
                  item={item}
                  canViewAttendance={canViewUjatScheduleAttendance(item)}
                  onViewAttendance={
                    canViewUjatScheduleAttendance(item)
                      ? selected => setAttendanceSchedule(selected)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </EducationSessionList>
      <UjatAttendanceDetailModal
        open={attendanceSchedule != null}
        applicationType={applicationType}
        applicationId={applicationId}
        scheduleId={attendanceSchedule?.scheduleId ?? null}
        canViewAttendance={
          attendanceSchedule != null && canViewUjatScheduleAttendance(attendanceSchedule)
        }
        onClose={() => setAttendanceSchedule(null)}
      />
    </>
  )
}
