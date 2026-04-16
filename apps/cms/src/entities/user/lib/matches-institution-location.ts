import type { User } from '@/types/user'

type InstitutionLocationUser = Pick<User, 'role' | 'schoolInfo' | 'detailAddress'>

/** 주소 문자열의 구(舊) 표기를 필터 UI(신) 표기에 맞춰 정규화 */
function normalizeAddressForRegionMatch(address: string): string {
  return address
    .replace(/^강원도/, '강원특별자치도')
    .replace(/^전라북도/, '전북특별자치도')
}

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

  const addrN = normalizeAddressForRegionMatch(addr)
  const tokenN = normalizeAddressForRegionMatch(token)

  if (addr.startsWith(token) || addrN.startsWith(token) || addr.startsWith(tokenN) || addrN.startsWith(tokenN)) {
    return true
  }

  const isProvincialCity =
    token.endsWith('시') &&
    !token.includes('광역시') &&
    !token.includes('특별시') &&
    !token.includes('특별자치')

  if (isProvincialCity) {
    return addr.includes(token) || addrN.includes(token)
  }

  return addr.includes(token) || addrN.includes(token)
}
