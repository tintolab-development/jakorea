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

export function isTeacherInstitutionGuidanceSubmitIncomplete(
  guidance: ApplyInstitutionGuidanceAnswers,
  sexOffense: ApplyInstitutionSexOffenseValues,
  options?: {
    ujat?: boolean
    isEdit?: boolean
    ujatExtras?: ApplyUjatInstitutionGuidanceExtras
  },
): boolean {
  if (findIncompleteInstitutionGuidanceFields(guidance)) return true
  if (options?.ujat) {
    if (
      options.ujatExtras &&
      findIncompleteUjatInstitutionGuidanceExtrasMessage(options.ujatExtras)
    ) {
      return true
    }
    if (options.isEdit) {
      return findIncompleteSexOffenseMessage({
        ...sexOffense,
        submissionRequest: sexOffense.submissionRequest || 'request',
      }) != null
    }
    return findIncompleteUjatSexOffenseWriteMessage(sexOffense) != null
  }
  return findIncompleteSexOffenseMessage(sexOffense) != null
}
