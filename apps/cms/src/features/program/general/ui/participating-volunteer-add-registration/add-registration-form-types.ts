export type { JaVolunteerExperience } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import type { JaVolunteerExperience } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'

export type ParticipatingVolunteerAddRegistrationSectionContext = {
  jaVolunteerExperience: JaVolunteerExperience
  /** 회원에 1365 ID가 이미 등록된 경우 — 기본 정보 단락 미노출 */
  hideBasicInfoSection: boolean
}
