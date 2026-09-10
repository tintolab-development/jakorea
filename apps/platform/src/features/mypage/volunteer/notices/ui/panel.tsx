import type { ProgramDetail } from '@/features/program'
import { EducationInProgressNoticePanel } from '@/features/mypage/education/notices'
import { VolunteerInstitutionGuide } from './institution-guide'

type VolunteerNoticePanelProps = {
  program: ProgramDetail
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  lastParticipatedSession?: number
}

export function VolunteerNoticePanel({
  program,
  selfIntroMotivation,
  preferredEducationScheduleLabel,
  lastParticipatedSession,
}: VolunteerNoticePanelProps) {
  const showInstitutionGuide = program.programAudience === 'organization'

  return (
    <EducationInProgressNoticePanel
      program={program}
      selfIntroMotivation={selfIntroMotivation}
      preferredEducationScheduleLabel={preferredEducationScheduleLabel}
      leading={
        showInstitutionGuide ? (
          <VolunteerInstitutionGuide lastParticipatedSession={lastParticipatedSession} />
        ) : null
      }
    />
  )
}
