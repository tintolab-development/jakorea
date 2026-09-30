import type { ProgramDetail } from '@/features/program'
import { EducationInProgressNoticePanel } from '@/features/mypage/education/notices'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { VolunteerInstitutionGuide } from './institution-guide'

type VolunteerNoticePanelProps = {
  program: ProgramDetail
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  lastParticipatedSession?: number
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
}

export function VolunteerNoticePanel({
  program,
  selfIntroMotivation,
  preferredEducationScheduleLabel,
  lastParticipatedSession,
  applicationType,
  applicationId,
}: VolunteerNoticePanelProps) {
  const showInstitutionGuide = program.programAudience === 'organization'

  return (
    <EducationInProgressNoticePanel
      program={program}
      selfIntroMotivation={selfIntroMotivation}
      preferredEducationScheduleLabel={preferredEducationScheduleLabel}
      applicationType={applicationType}
      applicationId={applicationId}
      leading={
        showInstitutionGuide ? (
          <VolunteerInstitutionGuide lastParticipatedSession={lastParticipatedSession} />
        ) : null
      }
    />
  )
}
