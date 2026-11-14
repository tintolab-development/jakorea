import type { ProgramApplicationType } from '../../applications/api/types'
import type {
  EducationDisplayStatus,
  EducationWithdrawalPhase,
} from '../../applications/model/types'
import type { EducationSatisfactionAudience, EducationSurveySeedKind } from '../lib/seed-survey-draft'
import { getEducationSurveyTabAvailability } from '../lib/survey-tab-availability'
import { EducationSurveyEmptyPanel } from './empty-panel'
import { EducationSurveyFillPanel } from './fill-panel'

export type EducationSurveySectionProps = {
  kind: EducationSurveySeedKind
  /** satisfaction 전용 — 교육/봉사 student, 강의 teacher */
  satisfactionAudience?: EducationSatisfactionAudience
  displayStatus: EducationDisplayStatus
  withdrawalPhase?: EducationWithdrawalPhase
  configured?: boolean
  remoteDetailEnabled: boolean
  programTitle: string
  educationScheduleLines?: readonly string[]
  educationTargetLabel?: string
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  programId?: string | null
  participantId?: number | null
  pendingSurveyCount?: number
}

/**
 * 교육현황 설문·만족도 탭 본문 SSOT.
 * 일반·UJAT 교육현황, 봉사현황, 강의현황이 동일 패널을 쓴다.
 */
export function EducationSurveySection({
  kind,
  satisfactionAudience,
  displayStatus,
  withdrawalPhase,
  configured,
  remoteDetailEnabled,
  programTitle,
  educationScheduleLines,
  educationTargetLabel,
  applicationType,
  applicationId,
  programId,
  participantId,
  pendingSurveyCount,
}: EducationSurveySectionProps) {
  const availability = getEducationSurveyTabAvailability({
    displayStatus,
    withdrawalPhase,
    configured,
  })
  if (remoteDetailEnabled || availability === 'active') {
    return (
      <EducationSurveyFillPanel
        kind={kind}
        satisfactionAudience={satisfactionAudience}
        programTitle={programTitle}
        educationScheduleLines={educationScheduleLines}
        educationTargetLabel={educationTargetLabel}
        applicationType={applicationType}
        applicationId={applicationId}
        programId={programId}
        participantId={participantId}
        pendingSurveyCount={kind === 'survey' ? pendingSurveyCount : undefined}
        displayStatus={displayStatus}
      />
    )
  }
  return <EducationSurveyEmptyPanel kind={kind} inProgress={displayStatus === 'in_progress'} />
}
