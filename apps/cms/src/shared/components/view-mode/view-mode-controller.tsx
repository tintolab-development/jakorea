/**
 * 보기 모드 헤더 + 본문 조합 — 전환은 ViewModeToggle, 나머지는 render props
 */

import type { ReactNode } from 'react'
import { ViewModeToggle, type ViewModeToggleOption } from './view-mode-toggle'
import './view-mode-controller.css'

export interface ViewModeControllerProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: readonly ViewModeToggleOption<T>[]
  renderHeader: (viewMode: T) => ReactNode
  renderContent: (viewMode: T) => ReactNode
  className?: string
}

export function ViewModeController<T extends string>({
  value,
  onChange,
  options,
  renderHeader,
  renderContent,
  className,
}: ViewModeControllerProps<T>) {
  const rootClass = ['view-mode-controller', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <div className="view-mode-controller__header">
        <div className="view-mode-controller__header-start">{renderHeader(value)}</div>
        <div className="view-mode-controller__header-end">
          <ViewModeToggle<T> value={value} onChange={onChange} options={options} />
        </div>
      </div>
      <div className="view-mode-controller__content">{renderContent(value)}</div>
    </div>
  )
}
