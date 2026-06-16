import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralIndividualApplicantInterviewAvailabilityDay } from '@/data/mock/general-individual-applications-mock'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/general/ui/detail-modal/applications/volunteer-screening/detail.css'

export function IndividualApplicantInterviewAvailabilitySection({
  interviewAvailability,
}: {
  interviewAvailability: GeneralIndividualApplicantInterviewAvailabilityDay[]
}) {
  const days = interviewAvailability

  return (
    <section className="general-volunteer-applicant-interview-availability">
      <DetailInfoForm title="면접 진행 가능 일정" mode="view">
        {days.length === 0 ? (
          <DetailInfoForm.Row type="custom">
            <p className="general-volunteer-applicant-interview-availability__empty">
              등록된 일정이 없습니다.
            </p>
          </DetailInfoForm.Row>
        ) : (
          days.map(day => (
            <DetailInfoForm.Row key={day.dateLabel} type="single">
              <DetailInfoForm.Field
                label={day.dateLabel}
                fullRow
                readOnlyDisplay
                view={
                  <ProgramDetailTdSegmentWrap>
                    {withProgramDetailTdDivider(day.slots)}
                  </ProgramDetailTdSegmentWrap>
                }
              />
            </DetailInfoForm.Row>
          ))
        )}
      </DetailInfoForm>
    </section>
  )
}
