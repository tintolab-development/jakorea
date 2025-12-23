/**
 * 신청 경로 목록 컴포넌트
 * V3 Phase 7: 신청 경로 관리
 */

import { Table, Tag, Dropdown, Button } from 'antd'
import type { MenuProps, TableColumnsType } from 'antd'
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ApplicationPath, ApplicationPathType } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { domainColorsHex } from '@/shared/constants/colors'

interface ApplicationPathListProps {
  data: ApplicationPath[]
  loading?: boolean
  onView: (path: ApplicationPath) => void
  onEdit: (path: ApplicationPath) => void
  onDelete: (path: ApplicationPath) => void
}

const pathTypeLabels: Record<ApplicationPathType, string> = {
  google_form: '구글폼',
  internal: '자동화 프로그램',
}

export function ApplicationPathList({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
}: ApplicationPathListProps) {
  const programs = programService.getAllSync()

  const columns: TableColumnsType<ApplicationPath> = [
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? <Tag color={domainColorsHex.program.primary}>{program.title}</Tag> : programId
      },
      filters: programs.map(program => ({
        text: program.title,
        value: program.id,
      })),
      onFilter: (value, record) => record.programId === value,
    },
    {
      title: '신청 경로',
      dataIndex: 'pathType',
      key: 'pathType',
      render: (pathType: ApplicationPathType) => {
        return (
          <Tag color={pathType === 'google_form' ? 'orange' : 'blue'}>
            {pathTypeLabels[pathType]}
          </Tag>
        )
      },
      filters: [
        { text: '구글폼', value: 'google_form' },
        { text: '자동화 프로그램', value: 'internal' },
      ],
      onFilter: (value, record) => record.pathType === value,
    },
    {
      title: '구글폼 링크',
      dataIndex: 'googleFormUrl',
      key: 'googleFormUrl',
      render: (url: string | undefined) => {
        if (!url) return <span style={{ color: '#8c8c8c' }}>-</span>
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
            링크 열기
          </a>
        )
      },
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => {
        return (
          <Tag color={isActive ? 'green' : 'default'}>
            {isActive ? '활성' : '비활성'}
          </Tag>
        )
      },
      filters: [
        { text: '활성', value: true },
        { text: '비활성', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, path: ApplicationPath) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: '상세 보기',
            icon: <EyeOutlined />,
            onClick: () => onView(path),
          },
          {
            key: 'edit',
            label: '수정',
            icon: <EditOutlined />,
            onClick: () => onEdit(path),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: '삭제',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete(path),
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
    <div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`,
        }}
      />
    </div>
  )
}

