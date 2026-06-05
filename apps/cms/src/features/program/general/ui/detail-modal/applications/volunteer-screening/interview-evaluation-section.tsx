import { useMemo } from 'react'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

function formatScoreValue(score: number | null | undefined): string {
  return score != null ? String(score) : '-'
}

function formatAssignedInterviewScheduleDisplay(applicant: GeneralVolunteerApplicantRow): string {
  const dateLabel = applicant.assignedInterviewDateLabel
  const time = applicant.assignedInterviewTime
  if (!dateLabel || !time) return '—'
  return `${dateLabel} ${time}`
}

export interface GeneralVolunteerApplicantInterviewEvaluationSectionProps {
  applicant: GeneralVolunteerApplicantRow
}

export function GeneralVolunteerApplicantInterviewEvaluationSection({
  applicant,
}: GeneralVolunteerApplicantInterviewEvaluationSectionProps) {
  const scheduleDisplay = useMemo(
    () => formatAssignedInterviewScheduleDisplay(applicant),
    [applicant]
  )

  const remarkDisplay = applicant.interviewEvaluationRemark?.trim()
    ? applicant.interviewEvaluationRemark
    : '-'

  return (
    <section className="general-volunteer-applicant-detail__subsection general-volunteer-applicant-interview-evaluation">
      <h3 className="general-volunteer-applicant-detail__subsection-title">면접 평가</h3>
      <div className="program-detail-info-tab__table-wrapper general-volunteer-applicant-detail__table-wrapper--horizontal">
        <table className="program-detail-info-tab__table general-volunteer-applicant-detail__table--horizontal">
          <tbody>
            <tr>
              <th scope="row" className="general-volunteer-applicant-detail__horizontal-label">
                면접 일정
              </th>
              <td colSpan={3} className="general-volunteer-applicant-detail__horizontal-value">
                {scheduleDisplay}
              </td>
            </tr>
            <tr>
              <th scope="row" className="general-volunteer-applicant-detail__horizontal-label">
                담당자 A 점수
              </th>
              <td className="general-volunteer-applicant-detail__horizontal-value">
                {formatScoreValue(applicant.managerAScore)}
              </td>
              <th scope="row" className="general-volunteer-applicant-detail__horizontal-label">
                담당자 B 점수
              </th>
              <td className="general-volunteer-applicant-detail__horizontal-value">
                {formatScoreValue(applicant.managerBScore)}
              </td>
            </tr>
            <tr>
              <th scope="row" className="general-volunteer-applicant-detail__horizontal-label">
                비고
              </th>
              <td colSpan={3} className="general-volunteer-applicant-detail__horizontal-value">
                {remarkDisplay}
              </td>
            </tr>
            <tr>
              <th scope="row" className="general-volunteer-applicant-detail__horizontal-label">
                점수 종합
              </th>
              <td colSpan={3} className="general-volunteer-applicant-detail__horizontal-value">
                {formatScoreValue(applicant.totalScore)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
