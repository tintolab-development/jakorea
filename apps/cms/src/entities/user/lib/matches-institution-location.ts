import type { User } from '@/types/user'

type InstitutionLocationUser = Pick<User, 'role' | 'schoolInfo' | 'detailAddress'>

/**
 * 학교 회원 주소(`schoolInfo.address` 등)가 선택한 행정구역 토큰과 일치하는지 여부
 */
export function matchesUserInstitutionLocation(
  user: InstitutionLocationUser,
  locationToken: string
): boolean {
  const token = locationToken.trim()
  if (!token) return true
  if (user.role !== 'SCHOOL') return false

  const addr = user.schoolInfo?.address ?? user.detailAddress ?? ''
  if (!addr) return false

  if (addr.startsWith(token)) return true

  const isProvincialCity =
    token.endsWith('시') &&
    !token.includes('광역시') &&
    !token.includes('특별시') &&
    !token.includes('특별자치')

  if (isProvincialCity) {
    return addr.includes(token)
  }

  return addr.includes(token)
}
