import { z } from 'zod'
import type {
  CareersTalentApplyFieldKey,
  CareersTalentApplyFormValues,
  CareersTalentCareerType,
  CareersTalentEducationLevel,
  CareersTalentJobInterest,
} from './talent-apply-form'

const JOB_INTEREST_VALUES = [
  'managementPlanning',
  'prDesign',
  'accounting',
  'hrAdmin',
  'educationOps',
  'other',
] as const satisfies readonly CareersTalentJobInterest[]

const CAREER_TYPE_VALUES = ['newbie', 'experienced'] as const satisfies readonly CareersTalentCareerType[]

const EDUCATION_LEVEL_VALUES = [
  'highSchool',
  'college',
  'university',
  'master',
  'doctor',
  'other',
] as const satisfies readonly CareersTalentEducationLevel[]

const jobInterestSchema = z.enum(JOB_INTEREST_VALUES)
const careerTypeSchema = z.enum(CAREER_TYPE_VALUES)
const educationLevelSchema = z.enum(EDUCATION_LEVEL_VALUES)

const requiredText = z.string().trim().min(1)

export const careersTalentApplyFormSchema = z.object({
  jobInterest: jobInterestSchema,
  name: requiredText,
  phone: requiredText,
  email: requiredText.email(),
  addressRoad: requiredText,
  addressDetail: requiredText,
  educationLevel: educationLevelSchema,
  schoolName: z.string(),
  major: z.string(),
  educationInfo: requiredText,
  careerType: careerTypeSchema,
  careerInfo: requiredText,
  privacyAgreed: z.literal(true),
})

export type CareersTalentApplySchemaValues = z.infer<typeof careersTalentApplyFormSchema>
export type CareersTalentApplyFormInput = CareersTalentApplyFormValues

export type CareersTalentApplyFieldErrors = Partial<Record<CareersTalentApplyFieldKey, boolean>>

const SCHEMA_KEY_TO_FIELD_KEY: Record<keyof CareersTalentApplyFormInput, CareersTalentApplyFieldKey> =
  {
    jobInterest: 'jobInterest',
    name: 'name',
    phone: 'phone',
    email: 'email',
    addressRoad: 'addressRoad',
    addressDetail: 'addressDetail',
    educationLevel: 'educationLevel',
    schoolName: 'schoolName',
    major: 'major',
    educationInfo: 'educationInfo',
    careerType: 'careerType',
    careerInfo: 'careerInfo',
    privacyAgreed: 'privacy',
  }

export function mapCareersTalentApplyFormErrors(
  formErrors: Partial<Record<keyof CareersTalentApplyFormInput, unknown>>
): CareersTalentApplyFieldErrors {
  const next: CareersTalentApplyFieldErrors = {}
  for (const key of Object.keys(formErrors) as Array<keyof CareersTalentApplyFormInput>) {
    if (formErrors[key]) {
      next[SCHEMA_KEY_TO_FIELD_KEY[key]] = true
    }
  }
  return next
}

export function hasCareersTalentApplyFieldErrors(errors: CareersTalentApplyFieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}

/** schema 단위 검증(selfcheck·비 RHF 경로용) */
export function collectCareersTalentApplyFieldErrors(
  values: CareersTalentApplyFormInput
): CareersTalentApplyFieldErrors {
  const parsed = careersTalentApplyFormSchema.safeParse(values)
  if (parsed.success) {
    return {}
  }

  const next: CareersTalentApplyFieldErrors = {}
  for (const issue of parsed.error.issues) {
    const pathKey = issue.path[0]
    if (typeof pathKey !== 'string') continue
    const fieldKey = SCHEMA_KEY_TO_FIELD_KEY[pathKey as keyof CareersTalentApplyFormInput]
    if (fieldKey) {
      next[fieldKey] = true
    }
  }
  return next
}
