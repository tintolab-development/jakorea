/**
 * 봉사자 목록 컴포넌트
 * Phase: 봉사단 관리 하위 뎁스 구현
 */

import { Table, Tag, Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { User } from '@/types/user'
import { InterviewStatusBadge } from '@/shared/components'
import { formatDate } from '@/shared/utils'

interface VolunteerListProps {
  data: Omit<User, 'password'>[]
  loading?: boolean
  onView?: (user: Omit<User, 'password'>) => void
}

export function VolunteerList({ data, loading = false, onView }: VolunteerListProps) {
  const columns: ColumnsType<Omit<User, 'password'>> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '면접 상태',
      dataIndex: 'interviewStatus',
      key: 'interviewStatus',
      width: 140,
      render: (status) => {
        return status ? <InterviewStatusBadge status={status} /> : <Tag>-</Tag>
      },
    },
    {
      title: '참여이력',
      dataIndex: 'participationHistory',
      key: 'participationHistory',
      width: 100,
      align: 'center',
      render: (history) => history ?? 0,
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '마지막 로그인',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
      render: (date: string | undefined) => (date ? formatDate(new Date(date)) : '-'),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDate(new Date(date)),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: '상세 보기',
            icon: <EyeOutlined />,
            onClick: () => onView?.(record),
          },
        ]
        return (
          <div onClick={e => e.stopPropagation()}>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
            </Dropdown>
          </div>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1200 }}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `총 ${total}명`,
      }}
    />
  )
}
