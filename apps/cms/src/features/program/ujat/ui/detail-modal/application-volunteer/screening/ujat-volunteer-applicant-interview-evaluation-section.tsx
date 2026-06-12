import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { formatInterviewSummary } from './ujat-interview-assign-schedule-utils'
import { parseUjatInterviewDateLabel } from './ujat-volunteer-interview-calendar-events'

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
    <section className="ujat-volunteer-applicant-interview-evaluation">
      <DetailInfoForm title="면접 평가" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="면접 일정"
            fullRow
            readOnlyDisplay
            view={scheduleDisplay}
          />
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
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="비고" fullRow readOnlyDisplay view={remarkDisplay} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="점수 종합"
            fullRow
            readOnlyDisplay
            view={formatScoreValue(applicant.totalScore)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
