/** 일반 프로그램 상세 LNB 아이콘 (20×20, currentColor) */

import { LnbMemberIcon } from '@/shared/ui/icons'

export { LnbIconProjectInfo, LnbIconProgress, LnbIconManagers } from './program-detail-lnb-icons'
export { UjatLnbInstitutionApplicationIcon as GeneralLnbInstitutionApplicationIcon } from '@/features/program/ujat/ui/detail-modal/application-institution/lnb-icon'
export { LnbVolunteerHandshakeIcon as GeneralLnbVolunteerHandshakeIcon } from '@/features/program/ujat/ui/detail-modal/application-volunteer/lnb-icon'
export { UjatLnbSurveyManagementIcon as GeneralLnbSurveyManagementIcon } from '@/features/program/ujat/ui/detail-modal/survey-management/ujat-lnb-survey-management-icon'

/** 강사 신청 목록 — 시안 `Icon / LNB / w24` member 원본 */
export function GeneralLnbInstructorApplicationIcon() {
  return <LnbMemberIcon className="detail-fullpage-modal__lnb-icon" />
}
