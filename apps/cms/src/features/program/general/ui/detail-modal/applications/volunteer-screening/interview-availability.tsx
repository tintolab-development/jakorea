import type { ReactNode } from 'react'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { isAssignedInterviewSlot, mergeAssignedInterviewIntoAvailability } from '@/features/program/general/lib/interview-availability-utils'
import {
  formatDisplayTimeRange,
  normalizeTimeRangeKey,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-interview-assign-schedule-utils'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

export interface GeneralVolunteerApplicantInterviewAvailabilityProps {
  applicant: GeneralVolunteerApplicantRow
}

function renderInterviewSlot(
  applicant: GeneralVolunteerApplicantRow,
  dateLabel: string,
  slot: string
): ReactNode {
  if (!isAssignedInterviewSlot(applicant, dateLabel, slot)) {
    return formatDisplayTimeRange(slot)
  }

  return (
    <span className="general-volunteer-applicant-interview-availability__slot--assigned">
      {normalizeTimeRangeKey(slot)} (배정)
    </span>
  )
}

export function GeneralVolunteerApplicantInterviewAvailability({
  applicant,
}: GeneralVolunteerApplicantInterviewAvailabilityProps) {
  const days = mergeAssignedInterviewIntoAvailability(applicant)

  return (
    <section className="general-volunteer-applicant-detail__subsection general-volunteer-applicant-interview-availability">
      <h3 className="general-volunteer-applicant-detail__subsection-title">면접 진행 가능 일정</h3>
      {days.length === 0 ? (
        <p className="general-volunteer-applicant-interview-availability__empty">
          등록된 일정이 없습니다.
        </p>
      ) : (
        <div className="program-detail-info-tab__table-wrapper general-volunteer-applicant-detail__table-wrapper--vertical">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic general-volunteer-applicant-detail__table--vertical">
            <tbody>
              {days.map(day => (
                <tr key={day.dateLabel}>
                  <th scope="row">{day.dateLabel}</th>
                  <td>
                    <ProgramDetailTdSegmentWrap>
                      {withProgramDetailTdDivider(
                        day.slots.map(slot => renderInterviewSlot(applicant, day.dateLabel, slot))
                      )}
                    </ProgramDetailTdSegmentWrap>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
