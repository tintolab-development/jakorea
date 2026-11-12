import React, { type ComponentType } from 'react'
import { DetailFullpageModalLnbBrand } from '@/shared/ui/detail-fullpage-modal-lnb-brand'
import { DetailFullpageModalLnbArrowDown } from '@/shared/ui/detail-fullpage-modal-lnb-arrow'

export interface DetailModalSidebarNavChild {
  key: string
  label: string
}

export interface DetailModalSidebarNavItem {
  key: string
  label: string
  icon: React.ReactNode
  children?: DetailModalSidebarNavChild[]
}

export interface DetailModalSidebarProps {
  navAriaLabel: string
  items: DetailModalSidebarNavItem[]
  activeKey: string
  /** 그룹 메뉴일 때 선택된 하위 키 */
  activeChildKey?: string | ''
  /** 펼쳐진 그룹 키 목록 (제어형) */
  expandedGroupKeys: readonly string[]
  onSelectTop: (key: string) => void
  onSelectChild: (groupKey: string, childKey: string) => void
  /** 메뉴 목록 아래 LNB 하단 고정 영역 */
  footer?: React.ReactNode
  /** nav에 덧붙일 클래스(화면별 시안 스타일 범위). 생략 시 공용 스타일 */
  className?: string
  /** 그룹 펼침 화살표 아이콘. 생략 시 공용 화살표 */
  ArrowIcon?: ComponentType<{ className?: string }>
}

export function DetailModalSidebar({
  navAriaLabel,
  items,
  activeKey,
  activeChildKey = '',
  expandedGroupKeys,
  onSelectTop,
  onSelectChild,
  footer,
  className,
  ArrowIcon = DetailFullpageModalLnbArrowDown,
}: DetailModalSidebarProps) {
  return (
    <nav
      className={className ? `detail-fullpage-modal__lnb ${className}` : 'detail-fullpage-modal__lnb'}
      aria-label={navAriaLabel}
    >
      <DetailFullpageModalLnbBrand />
      <div className="detail-fullpage-modal__lnb-body">
        <ul className="detail-fullpage-modal__lnb-list">
        {items.map(item => {
          const children = item.children ?? []
          const hasChildren = children.length > 0
          const expanded = expandedGroupKeys.includes(item.key)
          const isActiveTop = activeKey === item.key

          if (!hasChildren) {
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`detail-fullpage-modal__lnb-item ${isActiveTop ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
                  onClick={() => onSelectTop(item.key)}
                >
                  <span className="detail-fullpage-modal__lnb-item-icon">{item.icon}</span>
                  <span className="detail-fullpage-modal__lnb-item-label">{item.label}</span>
                </button>
              </li>
            )
          }

          return (
            <li key={item.key}>
              <button
                type="button"
                className={`detail-fullpage-modal__lnb-item ${isActiveTop ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
                onClick={() => onSelectTop(item.key)}
              >
                <span className="detail-fullpage-modal__lnb-item-icon">{item.icon}</span>
                <span className="detail-fullpage-modal__lnb-item-label">{item.label}</span>
                <ArrowIcon
                  className={`detail-fullpage-modal__lnb-item-arrow ${expanded ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
                />
              </button>
              <div
                className={`detail-fullpage-modal__lnb-children-wrap ${expanded ? 'detail-fullpage-modal__lnb-children-wrap--open' : ''}`}
                aria-hidden={!expanded}
              >
                <ul className="detail-fullpage-modal__lnb-children">
                  {children.map(child => (
                    <li key={child.key}>
                      <button
                        type="button"
                        className={`detail-fullpage-modal__lnb-child ${activeChildKey === child.key ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                        onClick={() => onSelectChild(item.key, child.key)}
                      >
                        <span className="detail-fullpage-modal__lnb-child-dot" />
                        <span className="detail-fullpage-modal__lnb-child-label" data-text={child.label}>
                          {child.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )
        })}
        </ul>
      </div>
      {footer}
    </nav>
  )
}
