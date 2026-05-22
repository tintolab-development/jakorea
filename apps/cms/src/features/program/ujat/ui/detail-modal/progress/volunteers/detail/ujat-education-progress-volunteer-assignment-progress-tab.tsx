import { useMemo } from 'react'
import { getUjatVolunteerAssignmentProgressBundle } from './ujat-education-progress-volunteer-assignment-mock'
import { UjatEducationProgressVolunteerAssignmentAttendanceInfo } from './ujat-education-progress-volunteer-assignment-attendance-info'
import { UjatEducationProgressVolunteerAssignmentTable } from './ujat-education-progress-volunteer-assignment-table'
import './ujat-education-progress-volunteer-assignment.css'

export function UjatEducationProgressVolunteerAssignmentProgressTab({
  volunteerId,
}: {
  volunteerId: string
}) {
  const bundle = useMemo(
    () => getUjatVolunteerAssignmentProgressBundle(volunteerId),
    [volunteerId]
  )

  return (
    <div className="ujat-volunteer-assignment-progress-tab">
      <section className="ujat-volunteer-assignment-progress-tab__table-section">
        <h3 className="program-detail-info-tab__section-title">교육 배정 및 진행 현황</h3>
        <UjatEducationProgressVolunteerAssignmentTable initialRows={bundle.rows} />
      </section>

      <UjatEducationProgressVolunteerAssignmentAttendanceInfo
        attendanceSummary={bundle.attendanceSummary}
        absenceReasons={bundle.absenceReasons}
      />
    </div>
  )
}
