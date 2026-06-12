import { VolunteerFreeTextItemsParagraph } from '@/features/template/ui/form-set/application-form/shared/volunteer-free-text-items-paragraph'
import type { ParticipatingVolunteerAddRegistrationSectionContext } from './add-registration-form-types'

/** 참여 봉사자 추가 등록 — 자유 작성 항목 plugin 본문 */
export function ParticipatingVolunteerAddRegistrationFreeTextParagraph(
  _props: ParticipatingVolunteerAddRegistrationSectionContext
) {
  return <VolunteerFreeTextItemsParagraph />
}
