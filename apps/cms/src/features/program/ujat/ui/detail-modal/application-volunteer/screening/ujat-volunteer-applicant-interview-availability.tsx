import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

export interface UjatVolunteerApplicantInterviewAvailabilityProps {
  applicant: UjatVolunteerApplicantRow
}

export function UjatVolunteerApplicantInterviewAvailability({
  applicant,
}: UjatVolunteerApplicantInterviewAvailabilityProps) {
  const days = applicant.interviewAvailability

  return (
    <section className="ujat-volunteer-applicant-detail__subsection ujat-volunteer-applicant-interview-availability">
      <h3 className="ujat-volunteer-applicant-detail__subsection-title">면접 진행 가능 일정</h3>
      {days.length === 0 ? (
        <p className="ujat-volunteer-applicant-interview-availability__empty">등록된 일정이 없습니다.</p>
      ) : (
        <div className="program-detail-info-tab__table-wrapper ujat-volunteer-applicant-detail__table-wrapper--vertical">
            <table className="program-detail-info-tab__table program-detail-info-tab__table--basic ujat-volunteer-applicant-detail__table--vertical">
              <tbody>
                {days.map(day => (
                  <tr key={day.dateLabel}>
                    <th scope="row">{day.dateLabel}</th>
                    <td>
                      <ProgramDetailTdSegmentWrap>
                        {withProgramDetailTdDivider(day.slots)}
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
