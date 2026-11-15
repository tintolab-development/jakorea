/**
 * 공통 상태 태그 — 값별 색은 `tone` 또는 `accentColor` prop으로만 지정한다.
 * className·style을 받지 않는다(화면별 크기·색 덮어쓰기 금지). 정본: `status-tag.css`.
 */

import type { CSSProperties, ReactNode } from 'react'
import { StatusOutlineTag } from './status-outline-tag'
import './status-tag.css'

export type StatusTagTone =
  | 'blue'
  | 'gray'
  | 'green'
  | 'greenOverlay'
  | 'red'
  | 'orange'
  | 'purple'
  | 'pink'

/** StatusDropdownCell `getTag` 반환값 · StatusTag props 공통 */
export interface StatusTagSpec {
  label: ReactNode
  /** 색 프리셋. `accentColor`가 있으면 무시 */
  tone?: StatusTagTone
  /** 프리셋에 없는 상태색(예: 정산 현황 8종) — 글자색, 배경·테두리는 자동 6%·10% */
  accentColor?: string
  /** 라벨만 opacity 0.4 (배경·테두리 유지) */
  mutedLabel?: boolean
  /**
   * `outline`: Figma Status / Tag(64×24·흰 배경·상태색 테두리) — 정산 현황 전용 예외(사용자 확정 2026-11-09).
   * `accentColor` 필수. 그 외 값 태그는 공통 크기(32·최소 100)를 쓴다.
   */
  shape?: 'value' | 'outline'
  /**
   * 폭 변형 — 화면별 CSS 대신 정본에서만 고른다(사용자 확정 2026-11-15).
   * - `auto`(기본): 최소 100, 텍스트 길이에 따름
   * - `compact`: 최소 80 (시안 재직 현황 태그 80×32 — 학교 상세 소속 교사 표·교사 상세)
   * - `fixed140`: 140 고정 (시안 관리자 목록 권한 유형 태그 140×32)
   */
  width?: 'auto' | 'compact' | 'fixed140'
}

const WIDTH_CLASS: Record<NonNullable<StatusTagSpec['width']>, string> = {
  auto: '',
  compact: ' status-tag--compact',
  fixed140: ' status-tag--fixed-140',
}

const TONE_CLASS: Record<StatusTagTone, string> = {
  blue: 'status-tag--blue',
  gray: 'status-tag--gray',
  green: 'status-tag--green',
  greenOverlay: 'status-tag--green-overlay',
  red: 'status-tag--red',
  orange: 'status-tag--orange',
  purple: 'status-tag--purple',
  pink: 'status-tag--pink',
}

export function StatusTag({
  label,
  tone = 'gray',
  accentColor,
  mutedLabel = false,
  shape = 'value',
  width = 'auto',
}: StatusTagSpec) {
  if (shape === 'outline' && accentColor) {
    return <StatusOutlineTag label={label} accentColor={accentColor} />
  }
  const toneClass = accentColor ? 'status-tag--accent' : TONE_CLASS[tone]
  const style = accentColor
    ? ({ ['--status-tag-accent' as string]: accentColor } as CSSProperties)
    : undefined
  return (
    <span className={`status-tag ${toneClass}${WIDTH_CLASS[width]}`} style={style}>
      {mutedLabel ? <span className="status-tag__label--muted">{label}</span> : label}
    </span>
  )
}
