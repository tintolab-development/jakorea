export type { JaVolunteerExperience } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import type { JaVolunteerExperience } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'

export type ParticipatingVolunteerAddRegistrationSectionContext = {
  jaVolunteerExperience: JaVolunteerExperience
  /** 회원에 1365 ID가 이미 등록된 경우 — 기본 정보 단락 미노출 */
  hideBasicInfoSection: boolean
  /** 증빙 업로드 PROGRAM owner id */
  programId?: string | number | null
  /**
   * true — 자유 작성 1~4번 문항 라벨 옆 `*` 숨김(단락 제목에만 `*`).
   * UJAT preset(Figma 14672:63639)에서만 켠다. 생략 시 기존 표시 유지.
   */
  hideFreeTextQuestionRequiredMark?: boolean
}
