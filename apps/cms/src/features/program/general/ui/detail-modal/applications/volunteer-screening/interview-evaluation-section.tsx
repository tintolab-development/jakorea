import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { computeGeneralInterviewTotalScore } from '@/features/program/general/lib/general-volunteer-interview2-display'

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
    <section className="general-volunteer-applicant-interview-evaluation">
      <DetailInfoForm title="면접 평가" mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="담당자 A 점수"
            readOnlyDisplay
            view={formatScoreValue(applicant.managerAScore)}
          />
          <DetailInfoForm.Field
            label="담당자 B 점수"
            readOnlyDisplay
            view={formatScoreValue(applicant.managerBScore)}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="비고" readOnlyDisplay view={remarkDisplay} />
          <DetailInfoForm.Field
            label="점수 종합"
            readOnlyDisplay
            view={
              totalScore != null ? (
                <span className="general-volunteer-interview2__score-value">{totalScore}</span>
              ) : (
                '-'
              )
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
