import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { isAssignedInterviewSlot, mergeAssignedInterviewIntoAvailability } from '@/features/program/general/lib/interview-availability-utils'
import {
  formatDisplayTimeRange,
  normalizeTimeRangeKey,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/user/detail/ui/instructor-resume/resume.css'

export interface GeneralVolunteerApplicantInterviewAvailabilityProps {
  applicant: GeneralVolunteerApplicantRow
}

function renderInterviewSlot(
  applicant: GeneralVolunteerApplicantRow,
  dateLabel: string,
  slot: string
): ReactNode {
  if (!isAssignedInterviewSlot(applicant, dateLabel, slot)) {
    return formatDisplayTimeRange(slot)
  }

  return (
    <span className="general-volunteer-applicant-interview-availability__slot--assigned">
      {normalizeTimeRangeKey(slot)} (배정)
    </span>
  )
}

export function GeneralVolunteerApplicantInterviewAvailability({
  applicant,
}: GeneralVolunteerApplicantInterviewAvailabilityProps) {
  const days = mergeAssignedInterviewIntoAvailability(applicant)

  return (
    <section className="general-volunteer-applicant-interview-availability">
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
                    {withProgramDetailTdDivider(
                      day.slots.map(slot => renderInterviewSlot(applicant, day.dateLabel, slot))
                    )}
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
