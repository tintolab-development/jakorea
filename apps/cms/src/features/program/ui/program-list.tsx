/**
 * 프로그램 목록 컴포넌트
 * Phase 2.1: 테이블 + 필터 (기획자 요청: 다양한 컴포넌트 활용)
 */

import { Table, Input, Select, Button, Space, Tag, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useProgramTable } from '../model/use-program-table'
import type { Program } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import {
  getCommonStatusLabel,
  getCommonStatusColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'

const { Option } = Select

interface ProgramListProps {
  data: Program[]
  loading?: boolean
  onView: (program: Program) => void
  onEdit: (program: Program) => void
  onDelete: (program: Program) => void
}

const programTypes = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '하이브리드' },
]

const programFormats = [
  { value: 'workshop', label: '워크샵' },
  { value: 'seminar', label: '세미나' },
  { value: 'course', label: '과정' },
  { value: 'lecture', label: '강의' },
  { value: 'other', label: '기타' },
]

const statusOptions = [
  { value: 'active', label: '활성' },
  { value: 'pending', label: '대기' },
  { value: 'inactive', label: '비활성' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
]

export function ProgramList({ data, loading, onView, onEdit, onDelete }: ProgramListProps) {
  const { table, resetFilters } = useProgramTable(data)

  const sponsors = sponsorService.getAllSync()

  const getMenuItems = (program: Program): MenuProps['items'] => [
    {
      key: 'view',
      label: '상세 보기',
      icon: <EyeOutlined />,
      onClick: () => onView(program),
    },
    {
      key: 'edit',
      label: '수정',
      icon: <EditOutlined />,
      onClick: () => onEdit(program),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '삭제',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(program),
    },
  ]


  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Input
          placeholder="프로그램명 검색"
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={e => table.getColumn('title')?.setFilterValue(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="스폰서 선택"
          value={(table.getColumn('sponsorId')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('sponsorId')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 150 }}
          showSearch
          filterOption={(input, option) => {
            const label = option?.label as string | undefined
            return label ? label.toLowerCase().includes(input.toLowerCase()) : false
          }}
        >
          {sponsors.map(sponsor => (
            <Option key={sponsor.id} value={sponsor.id}>
              {sponsor.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="유형 선택"
          value={(table.getColumn('type')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('type')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 120 }}
        >
          {programTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="상태 선택"
          value={(table.getColumn('status')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('status')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 120 }}
        >
          {statusOptions.map(status => (
            <Option key={status.value} value={status.value}>
              {status.label}
            </Option>
          ))}
        </Select>
        <Button onClick={() => resetFilters()}>필터 초기화</Button>
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={[
          {
            title: '프로그램명',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => (
              <Tag color={domainColorsHex.program.primary} style={{ fontSize: 14, padding: '4px 12px' }}>
                {text}
              </Tag>
            ),
          },
          {
            title: '스폰서',
            dataIndex: 'sponsorId',
            key: 'sponsorId',
            render: (sponsorId: string) => {
              return sponsorService.getNameById(sponsorId)
            },
          },
          {
            title: '유형',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
              const typeLabel = programTypes.find(t => t.value === type)?.label || type
              return <Tag>{typeLabel}</Tag>
            },
          },
          {
            title: '형태',
            dataIndex: 'format',
            key: 'format',
            render: (format: string) => {
              const formatLabel = programFormats.find(f => f.value === format)?.label || format
              return formatLabel
            },
          },
          {
            title: '회차',
            dataIndex: 'rounds',
            key: 'rounds',
            render: (rounds: Program['rounds']) => `${rounds?.length || 0}회차`,
          },
          {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
              <Tag color={getCommonStatusColor(status)}>{getCommonStatusLabel(status)}</Tag>
            ),
          },
          {
            title: '작업',
            key: 'action',
            fixed: 'right',
            width: 80,
            render: (_: unknown, record: Program) => (
              <div onClick={(e) => e.stopPropagation()}>
                <Dropdown menu={{ items: getMenuItems(record) }} trigger={['click']}>
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
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

