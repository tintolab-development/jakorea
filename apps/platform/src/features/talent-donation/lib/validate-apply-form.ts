import { isValidEmail } from '@/features/auth/sign-up'
import type { TalentApplyFieldKey, TalentApplyFormValues } from './apply-form'

export type TalentApplyFieldErrors = Partial<Record<TalentApplyFieldKey, boolean>>

export function collectTalentApplyFieldErrors(
  values: TalentApplyFormValues
): TalentApplyFieldErrors {
  const errors: TalentApplyFieldErrors = {}

  if (!values.name.trim()) errors.name = true
  if (!values.birthDate.trim()) errors.birthDate = true
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
  if (!values.bio.trim()) errors.bio = true
  if (!values.talentIntro.trim()) errors.talentIntro = true
  if (!values.motivation.trim()) errors.motivation = true
  if (!values.jaParticipation) errors.jaParticipation = true
  if (!values.privacyAgreed) errors.privacy = true

  return errors
}

export function hasTalentApplyFieldErrors(errors: TalentApplyFieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}
