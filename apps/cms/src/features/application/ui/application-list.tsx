/**
 * 신청 목록 컴포넌트
 * Phase 2.2: 테이블 + 필터 (Ant Design 컴포넌트 다양하게 활용)
 */

import { Table, Select, Button, Space, Tag, Dropdown, Badge, Tooltip, Popconfirm } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { useApplicationTable } from '../model/use-application-table'
import type { Application } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { getApplicationSubjectName, createApplicationMenuItems } from '../lib/application-helpers'
import {
  applicationStatusConfig,
  applicationSubjectTypeConfig,
  getApplicationStatusLabel,
  getApplicationStatusColor,
  getApplicationStatusIcon,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import {
  getNextApplicationStatus,
  isApplicationFinalStatus,
} from '@/shared/lib/status-transition'

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
                  description={`이 신청을 "${getApplicationStatusLabel(getNextApplicationStatus(record.status) || 'approved')}" 상태로 변경하시겠습니까?`}
                  onConfirm={() => {
                    const nextStatus = getNextApplicationStatus(record.status)
                    if (nextStatus) {
                      onStatusChange(record, nextStatus)
                    }
                  }}
                  okText="확인"
                  cancelText="취소"
                  disabled={isApplicationFinalStatus(record.status)}
                >
                  <Button
                    type="link"
                    size="small"
                    disabled={isApplicationFinalStatus(record.status)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    다음 단계
                  </Button>
                </Popconfirm>
                <div onClick={(e) => e.stopPropagation()}>
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

