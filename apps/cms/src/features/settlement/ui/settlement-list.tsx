/**
 * 정산 목록 컴포넌트
 * Phase 4: 테이블 + 필터
 */

import { Table, Select, Button, Space, Tag, Dropdown, Badge, message } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { useSettlementTable } from '../model/use-settlement-table'
import type { Settlement } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { generatePaymentStatement } from '@/shared/utils/settlement-document'
import {
  getSettlementStatusLabel,
  getSettlementStatusColor,
} from '@/shared/constants/status'
import { canTransitionSettlementStatus } from '@/shared/lib/status-transition'
import { domainColorsHex } from '@/shared/constants/colors'

const { Option } = Select

interface SettlementListProps {
  data: Settlement[]
  loading?: boolean
  onView: (settlement: Settlement) => void
  onEdit: (settlement: Settlement) => void
  onDelete: (settlement: Settlement) => void
  onStatusChange: (settlement: Settlement, status: Settlement['status']) => void
}

export function SettlementList({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: SettlementListProps) {
  const { table } = useSettlementTable(data)

  const programs = programService.getAllSync()
  const statuses: Settlement['status'][] = ['pending', 'calculated', 'approved', 'paid', 'cancelled']
  const periods = Array.from(new Set(data.map(s => s.period))).sort().reverse()

  const handleDownloadPaymentStatement = async (settlement: Settlement) => {
    const program = programService.getByIdSync(settlement.programId)
    const instructor = instructorService.getByIdSync(settlement.instructorId)

    if (!program || !instructor) {
      message.error('프로그램 또는 강사 정보를 찾을 수 없습니다')
      return
    }

    try {
      await generatePaymentStatement(settlement, instructor, program.title)
      message.success('지급조서가 다운로드되었습니다')
    } catch (error) {
      console.error('Failed to generate payment statement:', error)
      message.error('지급조서 생성 중 오류가 발생했습니다')
    }
  }

  const getMenuItems = (settlement: Settlement): MenuProps['items'] => {
    const canDownload = settlement.status === 'approved' || settlement.status === 'paid'

    return [
      {
        key: 'view',
        label: '상세 보기',
        icon: <EyeOutlined />,
        onClick: () => onView(settlement),
      },
      {
        key: 'edit',
        label: '수정',
        icon: <EditOutlined />,
        onClick: () => onEdit(settlement),
      },
      ...(canDownload
        ? [
            {
              type: 'divider' as const,
            },
            {
              key: 'download',
              label: '지급조서 다운로드',
              icon: <DownloadOutlined />,
              onClick: () => handleDownloadPaymentStatement(settlement),
            },
          ]
        : []),
      {
        type: 'divider' as const,
      },
      {
        key: 'status-pending',
        label: '대기로 변경',
        disabled: !canTransitionSettlementStatus(settlement.status, 'pending'),
        onClick: () => onStatusChange(settlement, 'pending'),
      },
      {
        key: 'status-calculated',
        label: '산출 완료로 변경',
        disabled: !canTransitionSettlementStatus(settlement.status, 'calculated'),
        onClick: () => onStatusChange(settlement, 'calculated'),
      },
      {
        key: 'status-approved',
        label: '승인으로 변경',
        disabled: !canTransitionSettlementStatus(settlement.status, 'approved'),
        onClick: () => onStatusChange(settlement, 'approved'),
      },
      {
        key: 'status-paid',
        label: '지급 완료로 변경',
        disabled: !canTransitionSettlementStatus(settlement.status, 'paid'),
        onClick: () => onStatusChange(settlement, 'paid'),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'delete',
        label: '삭제',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDelete(settlement),
      },
    ]
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Select
          placeholder="상태 선택"
          value={(table.getColumn('status')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('status')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 150 }}
        >
          {statuses.map(status => (
            <Option key={status} value={status}>
              {getSettlementStatusLabel(status)}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="프로그램 선택"
          value={(table.getColumn('programId')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('programId')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 200 }}
          showSearch
          filterOption={(input, option) => {
            const children = option?.children as string | string[] | undefined
            if (typeof children === 'string') {
              return children.toLowerCase().includes(input.toLowerCase())
            }
            if (Array.isArray(children)) {
              return children.some((child: unknown) => 
                typeof child === 'string' && child.toLowerCase().includes(input.toLowerCase())
              )
            }
            return false
          }}
        >
          {programs.map(program => (
            <Option key={program.id} value={program.id}>
              {program.title}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="기간 선택"
          value={(table.getColumn('period')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('period')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 150 }}
        >
          {periods.map(period => (
            <Option key={period} value={period}>
              {period}
            </Option>
          ))}
        </Select>
        <Button onClick={() => table.resetColumnFilters()}>필터 초기화</Button>
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={[
          {
            title: '기간',
            dataIndex: 'period',
            key: 'period',
            render: (text: string) => <Tag color={domainColorsHex.settlement.primary}>{text}</Tag>,
          },
          {
            title: '프로그램',
            dataIndex: 'programId',
            key: 'programId',
            render: (programId: string) => {
              const program = programService.getByIdSync(programId)
              return program ? <Tag color={domainColorsHex.program.primary}>{program.title}</Tag> : '-'
            },
          },
          {
            title: '강사',
            dataIndex: 'instructorId',
            key: 'instructorId',
            render: (instructorId: string) => {
              return instructorService.getNameById(instructorId)
            },
          },
          {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            render: (status: Settlement['status']) => (
              <Badge status={getSettlementStatusColor(status) as any} text={getSettlementStatusLabel(status)} />
            ),
          },
          {
            title: '총액',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
            sorter: (a: Settlement, b: Settlement) => a.totalAmount - b.totalAmount,
          },
          {
            title: '작업',
            key: 'action',
            width: 100,
            render: (_: unknown, record: Settlement) => (
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
        onRow={(record) => ({
          onClick: () => onView(record),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}

