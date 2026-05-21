import { useMemo } from 'react'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { formatInterviewSummary } from './ujat-interview-assign-schedule-utils'
import { parseUjatInterviewDateLabel } from './ujat-volunteer-interview-calendar-events'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

function formatScoreValue(score: number | null | undefined): string {
  return score != null ? String(score) : '-'
}

function formatAssignedInterviewScheduleDisplay(applicant: UjatVolunteerApplicantRow): string {
  const dateLabel = applicant.assignedInterviewDateLabel
  const time = applicant.assignedInterviewTime
  if (!dateLabel || !time) return '—'
  const date = parseUjatInterviewDateLabel(dateLabel)
  if (!date) return `${dateLabel} ${time}`
  return formatInterviewSummary(date, time)
}

export interface UjatVolunteerApplicantInterviewEvaluationSectionProps {
  applicant: UjatVolunteerApplicantRow
}

export function UjatVolunteerApplicantInterviewEvaluationSection({
  applicant,
}: UjatVolunteerApplicantInterviewEvaluationSectionProps) {
  const scheduleDisplay = useMemo(
    () => formatAssignedInterviewScheduleDisplay(applicant),
    [applicant]
  )

  const remarkDisplay = applicant.interviewEvaluationRemark?.trim()
    ? applicant.interviewEvaluationRemark
    : '-'

  return (
    <section className="ujat-volunteer-applicant-detail__subsection ujat-volunteer-applicant-interview-evaluation">
      <h3 className="ujat-volunteer-applicant-detail__subsection-title">면접 평가</h3>
      <div className="program-detail-info-tab__table-wrapper ujat-volunteer-applicant-detail__table-wrapper--horizontal">
        <table className="program-detail-info-tab__table ujat-volunteer-applicant-detail__table--horizontal">
          <tbody>
            <tr>
              <th scope="row" className="ujat-volunteer-applicant-detail__horizontal-label">
                면접 일정
              </th>
              <td
                colSpan={3}
                className="ujat-volunteer-applicant-detail__horizontal-value"
              >
                {scheduleDisplay}
              </td>
            </tr>
            <tr>
              <th scope="row" className="ujat-volunteer-applicant-detail__horizontal-label">
                담당자 A 점수
              </th>
              <td className="ujat-volunteer-applicant-detail__horizontal-value">
                {formatScoreValue(applicant.managerAScore)}
              </td>
              <th scope="row" className="ujat-volunteer-applicant-detail__horizontal-label">
                담당자 B 점수
              </th>
              <td className="ujat-volunteer-applicant-detail__horizontal-value">
                {formatScoreValue(applicant.managerBScore)}
              </td>
            </tr>
            <tr>
              <th scope="row" className="ujat-volunteer-applicant-detail__horizontal-label">
                비고
              </th>
              <td
                colSpan={3}
                className="ujat-volunteer-applicant-detail__horizontal-value"
              >
                {remarkDisplay}
              </td>
            </tr>
            <tr>
              <th scope="row" className="ujat-volunteer-applicant-detail__horizontal-label">
                점수 종합
              </th>
              <td
                colSpan={3}
                className="ujat-volunteer-applicant-detail__horizontal-value"
              >
                {formatScoreValue(applicant.totalScore)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
