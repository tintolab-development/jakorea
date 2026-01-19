/**
 * 로그 관리 - 로그 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { Space } from 'antd'
import { useLocation } from 'react-router-dom'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { getCategoryNameByPath } from '@/shared/config/menu-config'

export function LogListPage() {
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 1) || '로그 관리'

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
      </Space>
      <ComingSoonPage 
        title="로그 관리" 
        description="로그 관리 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
      />
    </div>
  )
}
