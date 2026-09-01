import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import {
  computeGeneralInterviewTotalScore,
  formatGeneralAssignedInterviewScheduleDisplay,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { mapParticipantToVolunteerScreeningRow } from '@/features/program/general/lib/participant-volunteer-row-adapter'

function formatScoreValue(score: number | null | undefined): string {
  return score != null ? String(score) : '-'
}

export function IndividualApplicantInterviewEvaluationSection({
  applicant,
}: {
  applicant: GeneralIndividualApplicantRow
}) {
  const screeningRow = useMemo(() => mapParticipantToVolunteerScreeningRow(applicant), [applicant])

  const scheduleDisplay = useMemo(
    () => formatGeneralAssignedInterviewScheduleDisplay(screeningRow),
    [screeningRow]
  )

  const remarkDisplay = applicant.interviewEvaluationRemark?.trim()
    ? applicant.interviewEvaluationRemark
    : '-'

  const totalScore = useMemo(
    () => computeGeneralInterviewTotalScore(screeningRow),
    [screeningRow]
  )

  return (
    <section className="general-volunteer-applicant-interview-evaluation applicant-institution-basic-info__section">
      <DetailInfoForm title="면접 평가" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="면접 일정" fullRow readOnlyDisplay view={scheduleDisplay} />
        </DetailInfoForm.Row>
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
            label="점수 총합"
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
