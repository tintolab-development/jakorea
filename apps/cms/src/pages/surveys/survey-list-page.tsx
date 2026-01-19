/**
 * 설문 관리 - 목록 페이지 (관리자용)
 */

import { Space } from 'antd'
import { useLocation } from 'react-router-dom'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import './survey-list-page.css'

export function SurveyListPage() {
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 1) || '설문 관리'

  return (
    <div>
      <Space className="survey-page-header">
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
      </Space>
      <ComingSoonPage
        title="설문 관리"
        description="설문 관리 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
      />
    </div>
  )
}

export default SurveyListPage
