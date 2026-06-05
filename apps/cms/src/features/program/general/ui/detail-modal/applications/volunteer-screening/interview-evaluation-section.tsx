import { useMemo } from 'react'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { computeGeneralInterviewTotalScore } from '@/features/program/general/lib/general-volunteer-interview2-display'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

function formatScoreValue(score: number | null | undefined): string {
  return score != null ? String(score) : '-'
}

export interface GeneralVolunteerApplicantInterviewEvaluationSectionProps {
  applicant: GeneralVolunteerApplicantRow
}

export function GeneralVolunteerApplicantInterviewEvaluationSection({
  applicant,
}: GeneralVolunteerApplicantInterviewEvaluationSectionProps) {
  const remarkDisplay = applicant.interviewEvaluationRemark?.trim()
    ? applicant.interviewEvaluationRemark
    : '-'

  const totalScore = useMemo(
    () => computeGeneralInterviewTotalScore(applicant),
    [applicant]
  )

  return (
    <section className="general-volunteer-applicant-detail__subsection general-volunteer-applicant-interview-evaluation">
      <h3 className="general-volunteer-applicant-detail__subsection-title">면접 평가</h3>
      <div className="applicant-instructor-basic-info__table-wrap general-volunteer-applicant-detail__grid-table-wrap">
        <table className="applicant-instructor-basic-info__table general-volunteer-applicant-detail__table--grid">
          <colgroup>
            <col className="col-pair-label" />
            <col />
            <col className="col-pair-label" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                담당자 A 점수
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {formatScoreValue(applicant.managerAScore)}
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                담당자 B 점수
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {formatScoreValue(applicant.managerBScore)}
              </td>
            </tr>
            <tr>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                비고
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {remarkDisplay}
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                점수 종합
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {totalScore != null ? (
                  <span className="general-volunteer-interview2__score-value">{totalScore}</span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
