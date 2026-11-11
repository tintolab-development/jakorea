import { profileFormGenderToDraftLabel, toProfileFormGender } from '@/features/user/detail/lib/profile-form-gender'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import type { User } from '@/types/user'
import type { AdminRegisterModalFormValues } from '@/features/user/shared/ui/admin-register-modal'

/** 모르는 값·마스킹은 남성으로 추정하지 않는다(선택 안 됨). */
function mapGender(gender: string | undefined): 'male' | 'female' | undefined {
  return toProfileFormGender(gender)
}

function birthDateToFormValue(birthDate: User['birthDate']): string {
  if (!birthDate) return ''
  const raw = typeof birthDate === 'string' ? birthDate : new Date(birthDate).toISOString().slice(0, 10)
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 8) return raw.replace(/-/g, '.')
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`
}

export function mapUserToAdminProfileFormValues(
  user: Omit<User, 'password'>
): AdminRegisterModalFormValues {
  return {
    name: user.name ?? '',
    gender: mapGender(user.gender),
    birthDate: birthDateToFormValue(user.birthDate),
    contact: formatKoreanPhoneNumber(user.phone ?? ''),
    email: user.email ?? '',
    consentTermsOfService: 'agree',
    consentPersonalInfo: 'agree',
    consentMarketing: 'disagree',
    consentMfaSetup: 'agree',
  }
}

export function mapAdminProfileFormToBasicInfoDraftPartial(
  values: AdminRegisterModalFormValues
): {
  name: string
  phone: string
  email: string
  gender: string
  birthDate: string
} {
  const birthDigits = values.birthDate.replace(/\D/g, '')
  const birthDate =
    birthDigits.length === 8
      ? `${birthDigits.slice(0, 4)}-${birthDigits.slice(4, 6)}-${birthDigits.slice(6, 8)}`
      : values.birthDate.replace(/\./g, '-')

  return {
    name: values.name.trim(),
    phone: values.contact.trim(),
    email: values.email.trim(),
    gender: profileFormGenderToDraftLabel(values.gender),
    birthDate,
  }
}
