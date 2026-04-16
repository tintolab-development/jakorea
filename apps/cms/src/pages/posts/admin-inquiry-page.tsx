/**
 * 게시글 관리 - 문의사항 관리 페이지 (관리자용)
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Space } from 'antd'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'

const categoryOptions = [
  { label: '전체 카테고리', value: 'all' },
  { label: '활동', value: '활동' },
  { label: '봉사시간', value: '봉사시간' },
  { label: '시스템', value: '시스템' },
  { label: '정산', value: '정산' },
  { label: '안내', value: '안내' },
  { label: '기타', value: '기타' },
]

const statusOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '답변대기', value: 'PENDING' },
  { label: '답변완료', value: 'ANSWERED' },
]

export function AdminInquiryPage() {
  const [searchParams] = useSearchParams()

  const initialStatus =
    searchParams.get('status') === 'PENDING' || searchParams.get('status') === 'ANSWERED'
      ? searchParams.get('status')!
      : 'all'

  const [pendingFilters, setPendingFilters] = useState({
    search: '',
    category: 'all',
    status: initialStatus,
  })

  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'PENDING' || status === 'ANSWERED') {
      setPendingFilters(prev => ({ ...prev, status }))
    }
  }, [searchParams])

  const handleSearch = () => {}

  return (
    <div style={{ padding: LAYOUT_CONSTANTS.margins.xl }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <UnifiedFilterCard
          fields={[
            {
              key: 'search',
              type: 'search',
              label: '제목/내용/작성자',
              placeholder: '제목, 내용, 작성자를 입력하세요',
            },
            {
              key: 'category',
              type: 'select',
              label: '카테고리',
              placeholder: '전체 카테고리',
              options: categoryOptions,
            },
            {
              key: 'status',
              type: 'select',
              label: '상태',
              placeholder: '전체 상태',
              options: statusOptions,
            },
          ]}
          filters={pendingFilters}
          onFilterChange={(key, value) => {
            setPendingFilters(prev => ({ ...prev, [key]: value }))
          }}
          onSearch={handleSearch}
        />

        <ComingSoonPage
          title="문의 사항 관리"
          description="문의 목록 및 답변 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
        />
      </Space>
    </div>
  )
}
