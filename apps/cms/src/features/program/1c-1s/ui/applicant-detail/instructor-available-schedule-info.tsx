import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { buildCompanySchoolInstructorAvailableScheduleLines } from '@/features/program/1c-1s/lib/instructor-available-schedule-lines'

/** 1사1교 강사 신청 상세 — 신청 정보 「강의 진행 가능 일정」(QA 2026-11-13 1사1교 #13) */
export function CompanySchoolInstructorAvailableScheduleInfo({
  instructor,
}: {
  instructor: Pick<ApplicantInstructorRow, 'preferredScheduleSlots'>
}) {
  const lines = buildCompanySchoolInstructorAvailableScheduleLines(instructor)
  return (
    <DetailInfoForm title="신청 정보">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="강의 진행 가능 일정"
          fullRow
          view={
            lines.length === 0 ? (
              '-'
            ) : (
              <div>
                {lines.map(line => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            )
          }
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
