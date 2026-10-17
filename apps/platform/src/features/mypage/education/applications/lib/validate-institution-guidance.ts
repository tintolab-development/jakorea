import { INSTITUTION_GUIDANCE_FIELDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import type { ApplyInstitutionGuidanceAnswers } from '@/features/program/ui/apply-institution-guidance/apply-institution-guidance'
import {
  findIncompleteSexOffenseMessage,
  type ApplyInstitutionSexOffenseValues,
} from '@/features/program/ui/apply-institution-sex-offense/apply-institution-sex-offense'

export function findIncompleteInstitutionGuidanceFields(
  guidance: ApplyInstitutionGuidanceAnswers,
): boolean {
  return INSTITUTION_GUIDANCE_FIELDS.some(field => !(guidance[field.id] ?? '').trim())
}

export function isTeacherInstitutionGuidanceSubmitIncomplete(
  guidance: ApplyInstitutionGuidanceAnswers,
  sexOffense: ApplyInstitutionSexOffenseValues,
): boolean {
  if (findIncompleteInstitutionGuidanceFields(guidance)) return true
  return findIncompleteSexOffenseMessage(sexOffense) != null
}
