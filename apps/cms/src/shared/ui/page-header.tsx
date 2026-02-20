/**
 * 페이지 헤더 공통 컴포넌트
 * 정산 페이지 스타일 참고
 */

import { Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import './page-header.css'

const { Text } = Typography

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <Space className={`page-header ${className || ''}`}>
      <div className="page-header__title-row">
        <h1 className="page-header-title">{title}</h1>
        {description && (
          <Text type="secondary" className="page-header-description">
            {description}
          </Text>
        )}
      </div>
      {actions && <Space className="page-header-actions">{actions}</Space>}
    </Space>
  )
}
