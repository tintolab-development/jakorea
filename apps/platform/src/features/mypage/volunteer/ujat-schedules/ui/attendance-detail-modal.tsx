import { PFButton, PFModal, PFText } from '@/shared/ui'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { useApplicationScheduleAttendanceParticipantsQuery } from '@/features/mypage/education/applications/api/activity-hooks'
import { VolunteerAssignmentPanelSkeleton } from '@/features/mypage/shared/ui'
import type { EducationScheduleItem } from '@/features/mypage/education/schedules/model/types'
import {
  formatUjatAttendanceRosterDate,
  resolveScheduleAttendanceQueryErrorMessage,
} from '../lib/history'
import {
  mapPortalAttendanceParticipantList,
  type UjatAttendanceRosterVolunteer,
} from '../lib/map-attendance'
import styles from './attendance-detail-modal.module.css'

type UjatAttendanceDetailModalProps = {
  open: boolean
  item: EducationScheduleItem | null
  applicationType: ProgramApplicationType | null | undefined
  applicationId: string | null | undefined
  canViewAttendance: boolean
  onClose: () => void
}

function VolunteerCell({ volunteer }: { volunteer: UjatAttendanceRosterVolunteer }) {
  return (
    <PFText as="span" typo="bd-md-md" color="black">
      {volunteer.name}
    </PFText>
  )
}

function StatusCell({ volunteer }: { volunteer: UjatAttendanceRosterVolunteer }) {
  return (
    <PFText
      as="span"
      typo="bd-md-md"
      color={volunteer.attendanceTone === 'absent' ? 'error' : 'black'}
    >
      {volunteer.attendanceLabel}
    </PFText>
  )
}

export function UjatAttendanceDetailModal({
  open,
  item,
  applicationType,
  applicationId,
  canViewAttendance,
  onClose,
}: UjatAttendanceDetailModalProps) {
  const scheduleId = item?.scheduleId ?? null
  const query = useApplicationScheduleAttendanceParticipantsQuery(
    applicationType,
    applicationId,
    scheduleId,
    { enabled: open && canViewAttendance },
  )
  const roster = query.data ? mapPortalAttendanceParticipantList(query.data) : null
  const dateLabel = item?.heldAt ? formatUjatAttendanceRosterDate(item.heldAt) : null

  return (
    <PFModal open={open} onClose={onClose} title="출석현황 보기" size="lg">
      <div className={styles.body}>
        {!canViewAttendance ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            출석현황을 조회할 수 없는 일정입니다.
          </PFText>
        ) : query.isLoading ? (
          <VolunteerAssignmentPanelSkeleton statusMessage="출석현황을 불러오는 중입니다." />
        ) : query.isError ? (
          <>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {resolveScheduleAttendanceQueryErrorMessage(query.error)}
            </PFText>
            <PFButton type="button" variant="tertiary" size="large" onClick={() => void query.refetch()}>
              다시 시도
            </PFButton>
          </>
        ) : roster ? (
          <>
            <div className={styles.toolbar}>
              {/* Figma 11005:342162 — 날짜 18 SemiBold 검정 */}
              <PFText as="p" typo="bd-lg-sb" color="black" className={styles.date}>
                {dateLabel || '-'}
              </PFText>
              <span className={styles.meta}>
                {/* Figma 11005:342162 — 16px · 「출석 담당자」 Regular cool-600 · 이름 SemiBold primary-700 */}
                <PFText as="span" typo="bd-md-rg" color="neutral-cool-600">
                  출석 담당자{' '}
                  <PFText as="span" typo="bd-md-sb" color="primary-700">
                    {roster.managerName}
                  </PFText>
                </PFText>
                <span className={styles.metaDivider} aria-hidden="true" />
                <PFText as="span" typo="bd-md-rg" color="neutral-cool-600">
                  {roster.classCountLabel}
                </PFText>
              </span>
            </div>
            <div className={styles.tableFrame}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>
                      <PFText as="span" typo="bd-md-bd" color="black">
                        교육 학년
                      </PFText>
                    </th>
                    <th>
                      <PFText as="span" typo="bd-md-bd" color="black">
                        교육 학급
                      </PFText>
                    </th>
                    <th>
                      <PFText as="span" typo="bd-md-bd" color="black">
                        봉사자 A
                      </PFText>
                    </th>
                    <th>
                      <PFText as="span" typo="bd-md-bd" color="black">
                        출석 현황
                      </PFText>
                    </th>
                    <th>
                      <PFText as="span" typo="bd-md-bd" color="black">
                        봉사자 B
                      </PFText>
                    </th>
                    <th>
                      <PFText as="span" typo="bd-md-bd" color="black">
                        출석 현황
                      </PFText>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roster.rows.length === 0 ? (
                    <tr>
                      <td className={styles.emptyCell} colSpan={6}>
                        <PFText as="span" typo="bd-md-rg" color="neutral-cool-600">
                          조회할 출석현황이 없어요.
                        </PFText>
                      </td>
                    </tr>
                  ) : (
                    roster.rows.map(row => (
                      <tr key={row.key}>
                        {row.showGrade ? (
                          <td rowSpan={row.gradeRowSpan}>
                            <PFText as="span" typo="bd-md-md" color="black">
                              {row.gradeLabel}
                            </PFText>
                          </td>
                        ) : null}
                        <td>
                          <PFText as="span" typo="bd-md-md" color="black">
                            {row.classLabel}
                          </PFText>
                        </td>
                        <td>
                          <VolunteerCell volunteer={row.volunteerA} />
                        </td>
                        <td>
                          <StatusCell volunteer={row.volunteerA} />
                        </td>
                        <td>
                          <VolunteerCell volunteer={row.volunteerB} />
                        </td>
                        <td>
                          <StatusCell volunteer={row.volunteerB} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            출석현황이 없습니다.
          </PFText>
        )}
      </div>
    </PFModal>
  )
}
