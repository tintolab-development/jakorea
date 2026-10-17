import type { GenderType, MemberType } from '../model/sign-up.types'

const STORAGE_KEY = 'platform_signup_wizard_fields'

export type SignupWizardFieldSnapshot = {
  birthDate: string
  gender: GenderType | null
  selectedType: MemberType | null
  /** step 4~8에서 URL phase 없어도 미성년 8단계 유지 */
  under14Flow?: boolean
  /** step 2 확정 — `birthDate`가 보호자 NICE 등으로 바뀌어도 가입·약관 SSOT */
  minorMemberBirthDate?: string
}

function hasSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function isGenderType(value: unknown): value is GenderType {
  return value === 'male' || value === 'female'
}

function isMemberType(value: unknown): value is MemberType {
  return value === 'general' || value === 'teacher'
}

function isValidSnapshot(value: unknown): value is SignupWizardFieldSnapshot {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (typeof o.birthDate !== 'string') return false
  if (o.gender != null && !isGenderType(o.gender)) return false
  if (o.selectedType != null && !isMemberType(o.selectedType)) return false
  if (o.under14Flow != null && typeof o.under14Flow !== 'boolean') return false
  if (o.minorMemberBirthDate != null && typeof o.minorMemberBirthDate !== 'string') return false
  return true
}

export function readSignupWizardFields(): SignupWizardFieldSnapshot | null {
  if (!hasSessionStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeSignupWizardFields(partial: Partial<SignupWizardFieldSnapshot>): void {
  if (!hasSessionStorage()) return
  try {
    const current = readSignupWizardFields()
    const next: SignupWizardFieldSnapshot = {
      birthDate: partial.birthDate ?? current?.birthDate ?? '',
      gender: partial.gender !== undefined ? partial.gender : (current?.gender ?? null),
      selectedType:
        partial.selectedType !== undefined ? partial.selectedType : (current?.selectedType ?? null),
      under14Flow:
        partial.under14Flow !== undefined ? partial.under14Flow : (current?.under14Flow ?? false),
      minorMemberBirthDate:
        partial.under14Flow === false
          ? undefined
          : partial.minorMemberBirthDate !== undefined
            ? partial.minorMemberBirthDate
            : current?.minorMemberBirthDate,
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function clearSignupWizardFields(): void {
  if (!hasSessionStorage()) return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
