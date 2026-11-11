import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'

/**
 * 회원·강사 수정 폼 성별 (Step 6.1).
 * - 모르는 값·미등록·마스킹(`**`)은 성별로 추정하지 않는다(폼 값 undefined, draft 값 '').
 * - 사용자가 실제로 바꾼 경우에만 저장 payload에 성별을 넣는다(기존 성별 덮어쓰기 방지).
 */
export type ProfileFormGender = 'male' | 'female'

const FEMALE_VALUES = new Set(['여', '여성', '여자', 'F', 'FEMALE', 'female', '2'])
const MALE_VALUES = new Set(['남', '남성', '남자', 'M', 'MALE', 'male', '1'])

/** API/User 성별 → 폼 라디오 값. 판단할 수 없으면 undefined(선택 안 됨). */
export function toProfileFormGender(gender: string | null | undefined): ProfileFormGender | undefined {
  const g = gender?.trim() ?? ''
  if (FEMALE_VALUES.has(g)) return 'female'
  if (MALE_VALUES.has(g)) return 'male'
  return undefined
}

/** 폼 라디오 값 → draft 라벨. 선택되지 않았으면 ''(저장 payload에서 제외). */
export function profileFormGenderToDraftLabel(value: ProfileFormGender | undefined | null): '' | '여성' | '남성' {
  if (value === 'female') return '여성'
  if (value === 'male') return '남성'
  return ''
}

/** User 성별 → draft 라벨. 마스킹·미등록은 ''(성별 데이터로 바꾸지 않음). */
export function userGenderToDraftLabel(gender: string | null | undefined): '' | '여성' | '남성' {
  const display = toDisplayGender(gender ?? undefined)
  return display === '여성' || display === '남성' ? display : ''
}

/** 저장 payload 성별: 비어 있거나 원래 값과 같으면 undefined(보내지 않음). */
export function genderPatchValue(current: string | null | undefined, original: string | null | undefined): string | undefined {
  const next = current?.trim() ?? ''
  if (!next) return undefined
  if (original != null && next === original.trim()) return undefined
  return next
}

/**
 * 신규 등록 payload 성별 (Step 6.2): 관리자가 명시적으로 고른 값만 '남성'/'여성'으로 보낸다.
 * 미선택은 undefined — 남성·여성 어느 쪽으로도 추정하지 않으며, 필수 여부는 각 폼 검증이 막는다.
 */
export function registerFormGenderToApiLabel(value: ProfileFormGender | undefined | null): '남성' | '여성' | undefined {
  return profileFormGenderToDraftLabel(value) || undefined
}
