/**
 * 등록 overlay 저장 키 이름(값·스토어 아님). 스토어 모듈 없이 키만 필요한 곳에서 쓴다.
 */

/** 일반 등록 기본정보 — controlled editor state와 동기화하는 overlay 키 */
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY =
  'generalRegistration.basicInfo.localSponsorId' as const
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY =
  'generalRegistration.basicInfo.localSponsorIds' as const
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY =
  'generalRegistration.basicInfo.localManagerContactId' as const
/** 후원사 담당자 ref 다중 선택 (`sponsorManagementId::contactId`) */
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY =
  'generalRegistration.basicInfo.localManagerContactIds' as const
/** 후원사 담당자 표시 문구 (`직책 이름 | 연락처`) — create/상세 조회용 */
export const GENERAL_REGISTRATION_OVERLAY_SPONSOR_MANAGER_LINE_KEY =
  'generalRegistration.basicInfo.sponsorManagerLine' as const
export const GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY =
  'generalRegistration.basicInfo.localProgramTitleKo' as const
export const GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY =
  'generalRegistration.educationScheduleSettings.scheduleLines' as const
export const GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY =
  'generalRegistration.educationScheduleCurriculum.groupTimesByDetail' as const
