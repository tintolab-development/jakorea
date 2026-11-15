import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import {
  computeGeneralInterviewTotalScore,
  formatGeneralAssignedInterviewScheduleDisplay,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { mapParticipantToVolunteerScreeningRow } from '@/features/program/general/lib/participant-volunteer-row-adapter'
import { GeneralVolunteerApplicantInterviewEvaluationSection } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/interview-evaluation-section'
import { useIndividualInterviewEvaluationEdit } from './individual-interview-evaluation-context'

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

  // 2차 면접 상세에서 평가 입력이 연결되면 봉사자와 같은 평가 섹션(담당자 A·B 점수·비고)을 쓴다
  const evaluationEdit = useIndividualInterviewEvaluationEdit()
  if (evaluationEdit) {
    const { bindSection, isEditing, canFillBothSlots, currentAdminId, onSave } = evaluationEdit
    return (
      <GeneralVolunteerApplicantInterviewEvaluationSection
        ref={bindSection}
        className="applicant-institution-basic-info__section"
        applicant={screeningRow}
        isEditing={isEditing}
        canFillBothSlots={canFillBothSlots}
        currentAdminId={currentAdminId}
        onSave={onSave}
      />
    )
  }

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
