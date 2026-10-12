import { toApiGender } from '@jakorea/identity-verification'
import type { GenderType } from '../../model/sign-up.types'

/** 본인인증 프로필 `gender` / `genderLabel` → 가입 UI 성별 */
export function signupGenderFromVerifiedIdentity(raw?: string | null): GenderType | null {
  const api = toApiGender(raw?.trim() ?? '')
  if (api === 'M') return 'male'
  if (api === 'F') return 'female'
  return null
}
