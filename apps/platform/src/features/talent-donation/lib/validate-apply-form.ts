import { isValidEmail, parseBirthDate } from '@/features/auth/sign-up'
import {
  TALENT_APPLY_LONG_TEXT_MAX_LENGTH,
  type TalentApplyFieldKey,
  type TalentApplyFormValues,
} from './apply-form'

function isRequiredLongTextInvalid(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length === 0 || trimmed.length > TALENT_APPLY_LONG_TEXT_MAX_LENGTH
}

export type TalentApplyFieldErrors = Partial<Record<TalentApplyFieldKey, boolean>>

export function collectTalentApplyFieldErrors(
  values: TalentApplyFormValues
): TalentApplyFieldErrors {
  const errors: TalentApplyFieldErrors = {}

  if (!values.name.trim()) errors.name = true
  if (!values.birthDate.trim() || parseBirthDate(values.birthDate) == null) {
    errors.birthDate = true
  }
  if (!values.gender) errors.gender = true
  if (!values.phone.trim()) errors.phone = true
  if (!values.email.trim() || !isValidEmail(values.email.trim())) errors.email = true
  if (!values.affiliation.trim()) errors.affiliation = true
  if (!values.sido.trim()) errors.sido = true
  if (!values.sigungu.trim()) errors.sigungu = true
  if (!values.periodStart.trim() || !values.periodEnd.trim()) {
    errors.periodStart = true
    errors.periodEnd = true
  }
  if (isRequiredLongTextInvalid(values.bio)) errors.bio = true
  if (isRequiredLongTextInvalid(values.talentIntro)) errors.talentIntro = true
  if (isRequiredLongTextInvalid(values.motivation)) errors.motivation = true
  if (!values.jaParticipation) errors.jaParticipation = true
  if (!values.privacyAgreed) errors.privacy = true

  return errors
}

export function hasTalentApplyFieldErrors(errors: TalentApplyFieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}
