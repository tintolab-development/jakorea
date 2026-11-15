import { INSTITUTION_GUIDANCE_FIELDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import type { ApplyInstitutionGuidanceAnswers } from '@/features/program/ui/apply-institution-guidance/apply-institution-guidance'
import {
  findIncompleteUjatInstitutionGuidanceExtrasMessage,
  type ApplyUjatInstitutionGuidanceExtras,
} from '@/features/program/ui/apply-institution-guidance/ujat-institution-guidance-fields'
import {
  findIncompleteSexOffenseMessage,
  findIncompleteUjatSexOffenseWriteMessage,
  type ApplyInstitutionSexOffenseValues,
} from '@/features/program/ui/apply-institution-sex-offense/apply-institution-sex-offense'

export function findIncompleteInstitutionGuidanceFields(
  guidance: ApplyInstitutionGuidanceAnswers,
): boolean {
  return INSTITUTION_GUIDANCE_FIELDS.some(field => !(guidance[field.id] ?? '').trim())
}

/** 비어 있는 안내사항 항목명 — 필수 항목 미입력 팝업(항목명 노출)에 쓴다 */
export function collectIncompleteInstitutionGuidanceFieldLabels(
  guidance: ApplyInstitutionGuidanceAnswers,
): string[] {
  return INSTITUTION_GUIDANCE_FIELDS.filter(field => !(guidance[field.id] ?? '').trim()).map(
    field => field.title,
  )
}

type InstitutionGuidanceSubmitOptions = {
  ujat?: boolean
  ujatExtras?: ApplyUjatInstitutionGuidanceExtras
}

/** 안내사항 항목 밖(성범죄 조회·UJAT 추가 항목)에 빠진 값이 있는지 — 항목명을 알 수 없는 부분 */
export function isInstitutionGuidanceOtherSectionIncomplete(
  sexOffense: ApplyInstitutionSexOffenseValues,
  options?: InstitutionGuidanceSubmitOptions,
): boolean {
  if (options?.ujat) {
    if (
      options.ujatExtras &&
      findIncompleteUjatInstitutionGuidanceExtrasMessage(options.ujatExtras)
    ) {
      return true
    }
    return findIncompleteUjatSexOffenseWriteMessage(sexOffense) != null
  }
  return findIncompleteSexOffenseMessage(sexOffense) != null
}

export function isTeacherInstitutionGuidanceSubmitIncomplete(
  guidance: ApplyInstitutionGuidanceAnswers,
  sexOffense: ApplyInstitutionSexOffenseValues,
  options?: InstitutionGuidanceSubmitOptions,
): boolean {
  if (findIncompleteInstitutionGuidanceFields(guidance)) return true
  return isInstitutionGuidanceOtherSectionIncomplete(sexOffense, options)
}
