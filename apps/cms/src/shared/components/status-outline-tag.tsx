/**
 * 상태 표시 유형 Tag — 캘린더 일별 리스트·카드 등 읽기 전용 상태 Tag (Figma Status / Tag).
 * 값 태그 `StatusTag`(드롭다운 셀, 32×100)와 구분한다. 정본: `status-outline-tag.css`.
 */

import type { CSSProperties, ReactNode } from 'react'
import './status-outline-tag.css'

export interface StatusOutlineTagProps {
  label: ReactNode
  /** 글자·테두리 공통 상태색 */
  accentColor: string
}

export function StatusOutlineTag({ label, accentColor }: StatusOutlineTagProps) {
  const style = { ['--status-outline-tag-accent' as string]: accentColor } as CSSProperties
  return (
    <span className="status-outline-tag" style={style}>
      {label}
    </span>
  )
}
