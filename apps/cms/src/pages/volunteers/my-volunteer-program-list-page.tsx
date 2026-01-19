/**
 * 본인 봉사 프로그램 목록 페이지 (봉사자용)
 * Phase: 봉사단 권한 마이그레이션
 */

import { useLocation } from 'react-router-dom'
import { Space } from 'antd'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { MyEnrolledProgramList } from '@/features/program/ui/my-enrolled-program-list'

export function MyVolunteerProgramListPage() {
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 3) || '수강 프로그램'

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
      </Space>
      <MyEnrolledProgramList />
    </div>
  )
}
