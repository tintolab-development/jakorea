/**
 * 학교 목록 컴포넌트
 * Phase 1.4: 테이블 + 필터
 * Phase 2: 리팩토링 패턴 적용 (ListPageFilters, PAGINATION_CONFIG)
 */

import { useState } from 'react'
import { Table, Tag, Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { School } from '@/types/domain'
import { domainColorsHex } from '@/shared/constants/colors'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'

interface SchoolListProps {
  data: School[]
  loading?: boolean
  onEdit?: (school: School) => void
  onDelete?: (school: School) => void
  /** 필터 UI는 페이지 레벨에서 ListPageFilters로 처리 */
}

export function SchoolList({ data, loading, onEdit, onDelete }: SchoolListProps) {
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
          render: (text: string) => <Tag color={domainColorsHex.school.primary}>{text}</Tag>,
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
        ...(onEdit || onDelete
          ? [
              {
                title: '작업',
                key: 'actions',
                width: 80,
                fixed: 'right' as const,
                render: (_: unknown, record: School) => {
                  const menuItems: MenuProps['items'] = [
                    ...(onEdit
                      ? [
                          {
                            key: 'edit',
                            label: '수정',
                            icon: <EditOutlined />,
                            onClick: () => onEdit(record),
                          },
                        ]
                      : []),
                    ...(onDelete
                      ? [
                          {
                            key: 'delete',
                            label: '삭제',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => onDelete(record),
                          },
                        ]
                      : []),
                  ]
                  return (
                    <div onClick={e => e.stopPropagation()}>
                      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          onClick={e => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  )
                },
              },
            ]
          : []),
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
