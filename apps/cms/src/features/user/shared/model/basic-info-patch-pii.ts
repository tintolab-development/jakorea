import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'

/**
 * 원문 개인정보가 들어가지 않는 회원 기본 정보 패치 필드.
 * 이름은 정책상 마스킹 대상이 아니다. 그 밖의 필드(연락처·이메일·주소·생년월일·성별·1365 ID·소속·약관 스냅샷 등)는
 * 원문으로 취급해 공용 캐시·스토어에 쓰지 않는다.
 */
const PII_FREE_PATCH_KEYS = new Set<keyof PatchUserBasicInfoInput>([
  'adminComment',
  'listMetrics',
  'name',
  'nameEn',
])

export function isPiiFreeBasicInfoPatch(patch: PatchUserBasicInfoInput): boolean {
  return Object.entries(patch).every(
    ([key, value]) => value === undefined || PII_FREE_PATCH_KEYS.has(key as keyof PatchUserBasicInfoInput)
  )
}
