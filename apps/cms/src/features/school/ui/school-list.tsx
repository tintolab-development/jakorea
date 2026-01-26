/**
 * 학교 목록 컴포넌트
 * Phase 1.4: 테이블 + 필터
 * Phase 2: 리팩토링 패턴 적용 (ListPageFilters, PAGINATION_CONFIG)
 */

import { useState } from 'react'
import { Table, Tag } from 'antd'
import type { School } from '@/types/domain'
import { domainColorsHex } from '@/shared/constants/colors'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'

interface SchoolListProps {
  data: School[]
  loading?: boolean
  /** 필터 UI는 페이지 레벨에서 ListPageFilters로 처리 */
}

export function SchoolList({ data, loading }: SchoolListProps) {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: PAGINATION_CONFIG.defaultPageSize,
  })

  return (
    <Table
      dataSource={data}
      columns={[
        {
          title: '학교명',
          dataIndex: 'name',
          key: 'name',
          render: (text: string) => (
            <Tag color={domainColorsHex.school.primary}>{text}</Tag>
          ),
        },
        {
          title: '지역',
          dataIndex: 'region',
          key: 'region',
        },
        {
          title: '주소',
          dataIndex: 'address',
          key: 'address',
          render: (text?: string) => text || '-',
        },
        {
          title: '담당자',
          dataIndex: 'contactPerson',
          key: 'contactPerson',
        },
        {
          title: '연락처',
          dataIndex: 'contactPhone',
          key: 'contactPhone',
          render: (text?: string) => text || '-',
        },
        {
          title: '이메일',
          dataIndex: 'contactEmail',
          key: 'contactEmail',
          render: (text?: string) => text || '-',
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




