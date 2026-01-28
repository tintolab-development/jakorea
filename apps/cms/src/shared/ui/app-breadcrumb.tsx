/**
 * 공통 브레드크럼 컴포넌트
 * 메뉴 뎁스(1·2·3) 기반 브레드크럼 표시. items는 useBreadcrumb 훅으로 생성.
 */

import { Breadcrumb } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { BreadcrumbItem } from '@/shared/config/menu-config'
import './app-breadcrumb.css'

export interface AppBreadcrumbProps {
  /** 브레드크럼 아이템 (useBreadcrumb 훅 사용 권장) */
  items: BreadcrumbItem[]
  /** 구분자 (기본: " > ") */
  separator?: React.ReactNode
  /** 추가 className */
  className?: string
}

export function AppBreadcrumb({ items, separator = ' > ', className }: AppBreadcrumbProps) {
  const navigate = useNavigate()

  const breadcrumbItems = items.map((item, idx) => {
    const isLast = idx === items.length - 1

    return {
      key: idx,
      title: isLast ? (
        <span className="app-breadcrumb__last">{item.label}</span>
      ) : item.path ? (
        <button type="button" className="app-breadcrumb__link" onClick={() => navigate(item.path!)}>
          {item.label}
        </button>
      ) : (
        <span className="app-breadcrumb__current">{item.label}</span>
      ),
    }
  })

  // 1뎁스 이하일 경우 브레드크럼 표시 안함
  if (items.length <= 1) {
    return null
  }

  return (
    <Breadcrumb
      className={`app-breadcrumb ${className ?? ''}`}
      separator={separator}
      items={breadcrumbItems}
    />
  )
}
