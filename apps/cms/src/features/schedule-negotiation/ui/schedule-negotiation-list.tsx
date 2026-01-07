/**
 * 일정 협의 목록 테이블
 */
import { Table, Tag, Dropdown, Button, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ScheduleNegotiation } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'

interface Props {
  data: ScheduleNegotiation[]
  loading?: boolean
  onView: (item: ScheduleNegotiation) => void
  onEdit: (item: ScheduleNegotiation) => void
  onDelete: (item: ScheduleNegotiation) => void
}

const statusColor: Record<ScheduleNegotiation['status'], string> = {
  proposed: 'blue',
  accepted: 'green',
  rejected: 'red',
  revised: 'orange',
}

export function ScheduleNegotiationList({ data, loading, onView, onEdit, onDelete }: Props) {
  const columns = [
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const p = programService.getByIdSync(programId)
        return p ? <Tooltip title={p.description || ''}>{p.title}</Tooltip> : '-'
      },
    },
    {
      title: '학교',
      dataIndex: 'schoolId',
      key: 'schoolId',
      render: (schoolId: string) => {
        const s = schoolService.getByIdSync(schoolId)
        return s ? s.name : '-'
      },
    },
    {
      title: '제안 수',
      key: 'proposals',
      render: (_: unknown, record: ScheduleNegotiation) => record.proposals.length,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (st: ScheduleNegotiation['status']) => <Tag color={statusColor[st]}>{st}</Tag>,
    },
    {
      title: '작업',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ScheduleNegotiation) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: '상세 보기',
            icon: <EyeOutlined />,
            onClick: () => onView(record),
          },
          {
            key: 'edit',
            label: '수정',
            icon: <EditOutlined />,
            onClick: () => onEdit(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: '삭제',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete(record),
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
      dataSource={data}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, showTotal: total => `총 ${total}개` }}
    />
  )
}


