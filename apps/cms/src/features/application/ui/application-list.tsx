/**
 * 신청 목록 컴포넌트
 * Phase 2.2: 테이블 + 필터 (Ant Design 컴포넌트 다양하게 활용)
 */

import { Table, Select, Button, Space, Tag, Dropdown, Badge, Tooltip, Popconfirm } from 'antd'
import type { MenuProps } from 'antd'
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useApplicationTable } from '../model/use-application-table'
import type { Application } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import {
  applicationStatusConfig,
  applicationSubjectTypeConfig,
  getApplicationStatusLabel,
  getApplicationStatusColor,
  getApplicationStatusIcon,
} from '@/shared/constants/status'

const { Option } = Select

interface ApplicationListProps {
  data: Application[]
  loading?: boolean
  onView: (application: Application) => void
  onEdit: (application: Application) => void
  onDelete: (application: Application) => void
  onStatusChange: (application: Application, status: Application['status']) => void
}

export function ApplicationList({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationListProps) {
  const { table } = useApplicationTable(data)

  const programs = programService.getAllSync()

  const getSubjectName = (application: Application) => {
    if (application.subjectType === 'school') {
      return schoolService.getNameById(application.subjectId)
    } else if (application.subjectType === 'instructor') {
      return instructorService.getNameById(application.subjectId)
    }
    return '-'
  }

  const getMenuItems = (application: Application): MenuProps['items'] => [
    {
      key: 'view',
      label: '상세 보기',
      icon: <EyeOutlined />,
      onClick: () => onView(application),
    },
    {
      key: 'edit',
      label: '수정',
      icon: <EditOutlined />,
      onClick: () => onEdit(application),
    },
    {
      type: 'divider',
    },
    {
      key: 'status-submitted',
      label: '접수로 변경',
      disabled: application.status === 'submitted',
      onClick: () => onStatusChange(application, 'submitted'),
    },
    {
      key: 'status-reviewing',
      label: '검토로 변경',
      disabled: application.status === 'reviewing',
      onClick: () => onStatusChange(application, 'reviewing'),
    },
    {
      key: 'status-approved',
      label: '확정으로 변경',
      disabled: application.status === 'approved',
      onClick: () => onStatusChange(application, 'approved'),
    },
    {
      key: 'status-rejected',
      label: '거절로 변경',
      disabled: application.status === 'rejected',
      onClick: () => onStatusChange(application, 'rejected'),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '삭제',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(application),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Select
          placeholder="프로그램 선택"
          value={(table.getColumn('programId')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('programId')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 200 }}
          showSearch
          filterOption={(input, option) => {
            const label = option?.label as string | undefined
            return label ? label.toLowerCase().includes(input.toLowerCase()) : false
          }}
        >
          {programs.map(program => (
            <Option key={program.id} value={program.id}>
              {program.title}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="신청 주체 선택"
          value={(table.getColumn('subjectType')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('subjectType')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 150 }}
        >
          <Option value="school">학교</Option>
          <Option value="student">학생</Option>
          <Option value="instructor">강사</Option>
        </Select>
        <Select
          placeholder="상태 선택"
          value={(table.getColumn('status')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('status')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 150 }}
        >
          {Object.entries(applicationStatusConfig.labels).map(([value, label]) => (
            <Option key={value} value={value}>
              {label}
            </Option>
          ))}
        </Select>
        <Button onClick={() => table.resetColumnFilters()}>필터 초기화</Button>
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={[
          {
            title: '프로그램',
            dataIndex: 'programId',
            key: 'programId',
            render: (programId: string) => {
              const program = programService.getByIdSync(programId)
              return program ? (
                <Tooltip title={program.description || ''}>
                  <Tag color="blue">{program.title}</Tag>
                </Tooltip>
              ) : (
                '-'
              )
            },
          },
          {
            title: '신청 주체',
            key: 'subject',
            render: (_: unknown, record: Application) => (
              <Space>
                <Tag color={applicationSubjectTypeConfig.colors[record.subjectType]}>
                  {applicationSubjectTypeConfig.labels[record.subjectType]}
                </Tag>
                <span>{getSubjectName(record)}</span>
              </Space>
            ),
          },
          {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            render: (status: Application['status']) => {
              const IconComponent = getApplicationStatusIcon(status)
              return (
                <Badge
                  status={getApplicationStatusColor(status) as any}
                  text={
                    <Space>
                      <IconComponent />
                      {getApplicationStatusLabel(status)}
                    </Space>
                  }
                />
              )
            },
          },
          {
            title: '접수일',
            dataIndex: 'submittedAt',
            key: 'submittedAt',
            render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
          },
          {
            title: '검토일',
            dataIndex: 'reviewedAt',
            key: 'reviewedAt',
            render: (date?: string) => (date ? new Date(date).toLocaleDateString('ko-KR') : '-'),
          },
          {
            title: '작업',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_: unknown, record: Application) => (
              <div onClick={(e) => e.stopPropagation()}>
                <Space>
                <Popconfirm
                  title="상태 변경"
                  description={`이 신청을 "${getApplicationStatusLabel(record.status === 'submitted' ? 'reviewing' : 'approved')}" 상태로 변경하시겠습니까?`}
                  onConfirm={() => {
                    if (record.status === 'submitted') {
                      onStatusChange(record, 'reviewing')
                    } else if (record.status === 'reviewing') {
                      onStatusChange(record, 'approved')
                    }
                  }}
                  okText="확인"
                  cancelText="취소"
                  disabled={record.status === 'approved' || record.status === 'rejected' || record.status === 'cancelled'}
                >
                  <Button
                    type="link"
                    size="small"
                    disabled={record.status === 'approved' || record.status === 'rejected' || record.status === 'cancelled'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    다음 단계
                  </Button>
                </Popconfirm>
                <div onClick={(e) => e.stopPropagation()}>
                  <Dropdown menu={{ items: getMenuItems(record) }} trigger={['click']}>
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              </Space>
              </div>
            ),
          },
        ]}
        rowKey="id"
        loading={loading}
        onRow={record => ({
          onClick: () => onView(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          total: table.getFilteredRowModel().rows.length,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
          onChange: (page, pageSize) => {
            table.setPageIndex(page - 1)
            table.setPageSize(pageSize)
          },
        }}
      />
    </div>
  )
}

