/**
 * 신청 목록 컴포넌트
 * Phase 2.2: 테이블 + 필터 (Ant Design 컴포넌트 다양하게 활용)
 */

import { Table, Select, Button, Space, Tag, Dropdown, Badge, Tooltip } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { useApplicationTable } from '../model/use-application-table'
import type { Application } from '@/types/domain'
import type { User } from '@/types/user'
import { programService } from '@/entities/program/api/program-service'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import { getApplicationSubjectName, createApplicationMenuItems } from '../lib/application-helpers'
import {
  applicationStatusConfig,
  applicationSubjectTypeConfig,
  getApplicationStatusLabel,
  getApplicationStatusColor,
  getApplicationStatusIcon,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'

const { Option } = Select

interface ApplicationListProps {
  data: Application[]
  loading?: boolean
  onView: (application: Application) => void
  onEdit: (application: Application) => void
  onDelete: (application: Application) => void
  onStatusChange: (application: Application, status: Application['status'], rejectionReason?: string) => void
  isAdmin?: boolean
  currentUser?: Pick<User, 'id' | 'role' | 'instructorId'> | null
}

export function ApplicationList({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isAdmin = false,
  currentUser,
}: ApplicationListProps) {
  let filteredData = data

  if (!isAdmin && currentUser) {
    switch (currentUser.role) {
      case 'INSTRUCTOR':
      case 'VOLUNTEER': {
        const instructorId = currentUser.instructorId
        filteredData = instructorId
          ? data.filter(app => app.subjectType === 'instructor' && app.subjectId === instructorId)
          : []
        break
      }
      case 'STUDENT': {
        // 학생은 아직 별도 ID 매핑이 없어, 일단 학생 타입 신청만 표시
        filteredData = data.filter(app => app.subjectType === 'student')
        break
      }
      default:
        filteredData = data
    }
  }

  const { table, resetFilters } = useApplicationTable(filteredData)

  const programs = programService.getAllSync()

  const pathTypeLabels: Record<string, string> = {
    google_form: '구글폼',
    internal: '자동화 프로그램',
  }

  const columns = [
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? (
          <Tooltip title={program.description || ''}>
            <Tag color={domainColorsHex.program.primary}>{program.title}</Tag>
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
          <span>{getApplicationSubjectName(record)}</span>
        </Space>
      ),
    },
    {
      title: '신청 경로',
      key: 'applicationPath',
      render: (_: unknown, record: Application) => {
        const applicationPath = record.applicationPathId
          ? applicationPathService.getByIdSync(record.applicationPathId)
          : applicationPathService.getByProgramIdSync(record.programId)

        if (!applicationPath) {
          return '-'
        }

        const label = pathTypeLabels[applicationPath.pathType] || applicationPath.pathType
        return (
          <Tag color={applicationPath.pathType === 'google_form' ? 'orange' : 'blue'}>
            {label}
          </Tag>
        )
      },
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
    ...(isAdmin
      ? [
          {
            title: '작업',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: (_: unknown, record: Application) => (
              <div onClick={e => e.stopPropagation()}>
                <Dropdown
                  menu={{
                    items: createApplicationMenuItems(record, {
                      onView,
                      onEdit,
                      onDelete,
                      onStatusChange,
                    }),
                  }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    onClick={e => e.stopPropagation()}
                  />
                </Dropdown>
              </div>
            ),
          },
        ]
      : []),
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
        <Button onClick={() => resetFilters()}>필터 초기화</Button>
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={columns}
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

