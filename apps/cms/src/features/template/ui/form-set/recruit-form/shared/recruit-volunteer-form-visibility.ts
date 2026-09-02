import { RECRUIT_FORM_VOLUNTEER_IDS } from '@/features/template/model/recruit-form-volunteer-draft'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

/** 면접 없음 시 봉사자 모집 폼 면접 일정 단락 숨김 */
export function getRecruitVolunteerHiddenParagraphIds(): ReadonlySet<string> | undefined {
  const interviewRequired = getGeneralRecruitOverlayRecord()['recruit.volunteer.interviewRequired']
  if (interviewRequired === 'no') {
    return new Set([RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule])
  }
  return undefined
}
