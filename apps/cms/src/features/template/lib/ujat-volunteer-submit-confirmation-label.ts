import { applyUjatVolunteerSubmitConfirmationCohort } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'

/** UJAT 봉사자 신청 — 제출 확인 문구의 기수 placeholder를 모집 활동 기수로 치환 */
export function resolveUjatVolunteerSubmitConfirmationItemLabel(
  label: string,
  cohort: string | undefined
): string {
  return applyUjatVolunteerSubmitConfirmationCohort(label, cohort)
}
