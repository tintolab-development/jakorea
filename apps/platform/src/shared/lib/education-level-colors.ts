/**
 * 교재·교육 콘텐츠 리스트 — 교육 대상/상태 색상
 * CSS SSOT: shared/styles/color.css `--color-education-level-*`
 */

export type EducationLevelKey =
  | 'notice'
  | 'preschool'
  | 'elementary'
  | 'middle'
  | 'high'
  | 'adult'

export const EDUCATION_LEVEL_KEYS = [
  'notice',
  'preschool',
  'elementary',
  'middle',
  'high',
  'adult',
] as const satisfies readonly EducationLevelKey[]

export const EDUCATION_LEVEL_LABELS: Record<EducationLevelKey, string> = {
  notice: '안내사항',
  preschool: '유아',
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  adult: '성인',
}

/** CSS custom property name for each level */
export const EDUCATION_LEVEL_CSS_VARS: Record<EducationLevelKey, string> = {
  notice: '--color-education-level-notice',
  preschool: '--color-education-level-preschool',
  elementary: '--color-education-level-elementary',
  middle: '--color-education-level-middle',
  high: '--color-education-level-high',
  adult: '--color-education-level-adult',
}

/** Hex values mirrored from color.css for design-system catalog / non-CSS contexts */
export const EDUCATION_LEVEL_HEX: Record<EducationLevelKey, string> = {
  notice: '#9E9E9E',
  preschool: '#D3BA00',
  elementary: '#A1BC2C',
  middle: '#46B17B',
  high: '#0CBDCC',
  adult: '#4E6AD9',
}

export const EDUCATION_LEVEL_BORDER_FALLBACK_HEX = '#BEBEBE'

/** `var(--color-education-level-*)` for inline style / CSS Modules */
export function getEducationLevelColor(key: EducationLevelKey): string {
  return `var(${EDUCATION_LEVEL_CSS_VARS[key]})`
}

export function getEducationLevelLabel(key: EducationLevelKey): string {
  return EDUCATION_LEVEL_LABELS[key]
}

export function isEducationLevelKey(value: string): value is EducationLevelKey {
  return (EDUCATION_LEVEL_KEYS as readonly string[]).includes(value)
}
