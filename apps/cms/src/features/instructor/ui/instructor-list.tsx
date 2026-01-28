/**
 * 강사 목록 컴포넌트
 * Phase 1.2: 테이블 + 필터
 * Phase 2: 리팩토링 패턴 적용 (ListPageFilters, PAGINATION_CONFIG)
 */

import { useState } from 'react'
import { Table } from 'antd'
import type { Instructor } from '@/types/domain'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'

interface InstructorListProps {
  data: Instructor[]
  loading?: boolean
  onView?: (instructor: Instructor) => void
  /** 필터 UI는 페이지 레벨에서 ListPageFilters로 처리 */
}

export function InstructorList({ data, loading, onView }: InstructorListProps) {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: PAGINATION_CONFIG.defaultPageSize,
  })

  return (
    <Table
      dataSource={data}
      onRow={
        onView
          ? record => ({
              onClick: () => onView(record),
              style: { cursor: 'pointer' },
            })
          : undefined
      }
      columns={[
        {
          title: '이름',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: '연락처',
          dataIndex: 'contactPhone',
          key: 'contactPhone',
        },
        {
          title: '이메일',
          dataIndex: 'contactEmail',
          key: 'contactEmail',
        },
        {
          title: '지역',
          dataIndex: 'region',
          key: 'region',
        },
        {
          title: '전문분야',
          dataIndex: 'specialty',
          key: 'specialty',
          render: (specialties: string[]) => specialties?.join(', ') || '-',
        },
        {
          title: '평점',
          dataIndex: 'rating',
          key: 'rating',
          render: (rating?: number) => (rating ? `${rating.toFixed(1)}/5.0` : '-'),
        },
      ]}
      rowKey="id"
      loading={loading}
      pagination={{
        ...PAGINATION_CONFIG,
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: data.length,
        onChange: (page, pageSize) => {
          setPagination({ current: page, pageSize: pageSize || PAGINATION_CONFIG.defaultPageSize })
        },
      }}
    />
  )
}
