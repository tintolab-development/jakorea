/**
 * 콘텐츠 상단 헤더 — 카테고리 타이틀만 (auth/알림은 이후 Phase)
 */

import { Layout } from 'antd'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import './main-header.css'

const { Header: AntHeader } = Layout

export function MainHeader() {
  const location = useLocation()

  const categoryName = useMemo(
    () => getCategoryNameByPath(location.pathname),
    [location.pathname]
  )

  return (
    <AntHeader className="main-header">
      <div className="main-header-content">
        <div className="main-header-left">
          <div className="main-header-title-wrap">
            <h1 className="main-header-title">{categoryName}</h1>
          </div>
        </div>
      </div>
    </AntHeader>
  )
}
