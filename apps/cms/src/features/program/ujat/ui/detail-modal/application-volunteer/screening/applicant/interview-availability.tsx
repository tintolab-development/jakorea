import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/user/detail/ui/instructor-resume/resume.css'

export interface InterviewAvailabilitySectionProps {
  applicant: UjatVolunteerApplicantRow
}

export function InterviewAvailabilitySection({
  applicant,
}: InterviewAvailabilitySectionProps) {
  const days = applicant.interviewAvailability

  return (
    <section className="ujat-volunteer-applicant-interview-availability">
      <DetailInfoForm title="면접 진행 가능 일정" mode="view">
        {days.length === 0 ? (
          <DetailInfoForm.Row type="custom">
            <div className="instructor-resume-free-writing-card">
              <p className="instructor-resume-free-writing-text">등록된 일정이 없습니다.</p>
            </div>
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
