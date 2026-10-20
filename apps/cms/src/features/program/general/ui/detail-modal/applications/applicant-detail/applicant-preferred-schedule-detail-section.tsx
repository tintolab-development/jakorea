import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/program/general/ui/detail-modal/applications/volunteer-screening/detail.css'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { formatInstitutionApplicationScheduleRowLabel } from '@/features/program/general/lib/institution-application-session-display'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { GeneralDetailSessionLine } from '@/features/program/shared/ui/program-detail/applicant-list/general-detail-session-line'

export function ApplicantPreferredScheduleDetailSection({
  title = '진행 희망 교육 일정',
  emptyMessage = '등록된 교육 일정이 없습니다.',
  sessions,
  bridge,
  detailScheduleTimeSpan,
  curriculumSessionLabels,
}: {
  title?: string
  emptyMessage?: string
  sessions: readonly ParticipatingSchoolSession[]
  bridge?: InstitutionApplicationProgramBridge | null
  detailScheduleTimeSpan?: string | null
  curriculumSessionLabels?: readonly string[] | null
}) {
  return (
    <DetailInfoForm title={title} mode="view">
      {sessions.length === 0 ? (
        <DetailInfoForm.Row type="custom">
          <p className="general-volunteer-applicant-detail__empty-schedule">{emptyMessage}</p>
        </DetailInfoForm.Row>
      ) : (
        sessions.map((session, index) => (
          <DetailInfoForm.Row type="single" key={`${session.round}-${index}`}>
            <DetailInfoForm.Field
              label={formatInstitutionApplicationScheduleRowLabel(index + 1, bridge)}
              fullRow
              readOnlyDisplay
              view={
                <GeneralDetailSessionLine
                  session={session}
                  bridge={bridge}
                  detailScheduleTimeSpan={detailScheduleTimeSpan}
                  curriculumSessionLabels={curriculumSessionLabels}
                />
              }
            />
          </DetailInfoForm.Row>
        ))
      )}
    </DetailInfoForm>
  )
}
