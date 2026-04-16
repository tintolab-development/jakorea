/**
 * 게시글 관리 - FAQ 관리 페이지 (관리자용)
 */

import { useState } from 'react'
import { Space } from 'antd'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'

export function AdminFAQPage() {
  const [pendingFilters, setPendingFilters] = useState({
    search: '',
    category: 'all',
  })

  const handleSearch = () => {}

  return (
    <div style={{ padding: LAYOUT_CONSTANTS.margins.xl }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <UnifiedFilterCard
          fields={[
            {
              key: 'search',
              type: 'search',
              label: '질문/답변',
              placeholder: '질문, 답변을 입력하세요',
            },
            {
              key: 'category',
              type: 'select',
              label: '카테고리',
              placeholder: '전체 카테고리',
              options: [
                { label: '전체 카테고리', value: 'all' },
                { label: '활동', value: '활동' },
                { label: '봉사시간', value: '봉사시간' },
                { label: '시스템', value: '시스템' },
                { label: '정산', value: '정산' },
                { label: '안내', value: '안내' },
              ],
            },
          ]}
          filters={pendingFilters}
          onFilterChange={(key, value) => {
            setPendingFilters(prev => ({ ...prev, [key]: value }))
          }}
          onSearch={handleSearch}
        />

        <ComingSoonPage
          title="FAQ 관리"
          description="FAQ 목록 및 관리 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
        />
      </Space>
    </div>
  )
}
