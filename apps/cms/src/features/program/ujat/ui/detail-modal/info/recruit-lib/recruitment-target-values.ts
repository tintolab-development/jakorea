import {
  formatVolunteerTargetLabel,
  normalizeVolunteerTargetList,
  parseVolunteerTargetsSelectValue,
  VOLUNTEER_TARGET_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'

/** UJAT 봉사자 모집 대상 — 일반 프로그램과 같은 다섯 구분 */
export const UJAT_VOLUNTEER_RECRUIT_TARGET_OPTIONS = VOLUNTEER_TARGET_OPTIONS

/** 새로 열 때 기본 선택. 저장된 값이 있으면 이 값으로 덮지 않는다. */
export const UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_VALUES = ['university', 'adult'] as const
export const UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_LABELS = ['대학(원)생', '성인'] as const

/** 모집 대상 표시 문자열(쉼표 구분 라벨·코드) → CmsSelect value[] */
export function recruitmentTargetLabelsToOptionValues(text: string | undefined): string[] {
  if (!text?.trim() || text.trim() === '-') return [...UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_VALUES]
  return normalizeVolunteerTargetList(text.split(/[,，·]/))
}

/** CmsSelect value[] → 저장용 코드[]. 알려진 코드만 남긴다. */
export function recruitmentTargetOptionValuesToStored(values: unknown): string[] {
  return parseVolunteerTargetsSelectValue(values) ?? []
}

/** @deprecated 저장은 코드를 쓴다. 표시는 `formatVolunteerTargetLabel`. */
export function recruitmentTargetOptionValuesToLabels(values: unknown): string[] {
  return recruitmentTargetOptionValuesToStored(values).map(formatVolunteerTargetLabel)
}

/**
 * form `volunteerTargets` → CmsSelect value[].
 * `null`/`undefined`만 기본값(대학(원)생, 성인). 빈 배열·저장된 다른 값은 유지한다.
 */
export function normalizeRecruitmentTargetSelectValues(raw: string[] | null | undefined): string[] {
  if (raw == null) return [...UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_VALUES]
  if (raw.length === 0) return []
  return normalizeVolunteerTargetList(raw)
}
