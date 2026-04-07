/**
 * 리스트 ↔ 캘린더 등 보기 모드 전환 — 단일 CTA(현재가 아닌 모드로 이동)
 * 옵션·아이콘·문구는 호출부에서만 구성 (도메인 로직 없음)
 */

import type { ReactNode } from 'react'
import { AppButton } from '../app-button'
import './view-mode-toggle.css'

export type ViewMode = 'list' | 'calendar'

export interface ViewModeToggleOption<V extends string = ViewMode> {
  value: V
  label: string
  icon: ReactNode
}

export interface ViewModeToggleProps<V extends string = ViewMode> {
  value: V
  onChange: (next: V) => void
  /** 현재 `value`와 다른 모드로 전환할 때 표시할 라벨·아이콘(보통 2개) */
  options: readonly ViewModeToggleOption<V>[]
  className?: string
}

export function ViewModeToggle<V extends string = ViewMode>({
  value,
  onChange,
  options,
  className,
}: ViewModeToggleProps<V>) {
  const target = options.find(o => o.value !== value)
  if (target == null) {
    return null
  }

  return (
    <div className={['view-mode-toggle', className].filter(Boolean).join(' ')}>
      <AppButton
        variant="cancel"
        size="filter-wide"
        icon={target.icon}
        onClick={() => onChange(target.value)}
      >
        {target.label}
      </AppButton>
    </div>
  )
}
