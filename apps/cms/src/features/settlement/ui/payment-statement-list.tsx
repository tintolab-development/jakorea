/**
 * 지급조서 목록 컴포넌트
 */

import { Table, Select, Button, Space, Tag } from 'antd'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import type { PaymentStatement } from '@/types/domain'
import type { User } from '@/types/user'
import { useInstructorService } from '@/features/instructor/hooks/use-instructor-service'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { canDownloadPaymentStatement } from '@/features/permission-request/lib/download-permission'
import { StatusBadge } from '@/shared/ui/status-badge'
import { domainColorsHex } from '@/shared/constants/colors'
import { PermissionRequestButton } from '@/features/permission-request/ui/permission-request-button'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'
import './payment-statement-list.css'

const { Option } = Select

// 지급조서 상태 설정 (StatusBadge용)
const paymentStatementStatusConfig = {
  ready: { label: '준비됨', color: 'processing' },
  downloaded: { label: '다운로드 완료', color: 'success' },
  cancelled: { label: '취소', color: 'error' },
} as Record<PaymentStatement['status'], { label: string; color: string }>

interface PaymentStatementListProps {
  data: PaymentStatement[]
  loading?: boolean
  availablePeriods: string[]
  statusOptions: Array<{ label: string; value: PaymentStatement['status'] }>
  filters: {
    period?: string
    status?: PaymentStatement['status']
    programId?: string
    keyword?: string
  }
  onChangeFilters: (next: PaymentStatementListProps['filters']) => void
  onResetFilters: () => void
  onDownload: (statement: PaymentStatement) => void
  /** Phase 0.5.2: 권한 없을 때 '권한 요청' 버튼 노출 */
  currentUser?: Omit<User, 'password'> | null
}

export function PaymentStatementList({
  data,
  loading,
  availablePeriods,
  statusOptions,
  filters,
  onChangeFilters,
  onResetFilters,
  onDownload,
  currentUser,
}: PaymentStatementListProps) {
  const { getAllSync, getByIdSync } = useProgramService()
  const { getNameById: getInstructorNameById } = useInstructorService()
  const programs = getAllSync()

  return (
    <div>
      <Space className="payment-statement-list__filters" size="middle" wrap>
        <Select
          placeholder="기간 선택"
          value={filters.period}
          onChange={value => onChangeFilters({ ...filters, period: value || undefined })}
          allowClear
          className="payment-statement-list__filter--period"
        >
          {availablePeriods.map(period => (
            <Option key={period} value={period}>
              {period}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="상태 선택"
          value={filters.status}
          onChange={value => onChangeFilters({ ...filters, status: value || undefined })}
          allowClear
          className="payment-statement-list__filter--status"
        >
          {statusOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="프로그램 선택"
          value={filters.programId}
          onChange={value => onChangeFilters({ ...filters, programId: value || undefined })}
          allowClear
          className="payment-statement-list__filter--program"
          showSearch
          filterOption={(input, option) => {
            const children = option?.children as string | string[] | undefined
            if (typeof children === 'string') {
              return children.toLowerCase().includes(input.toLowerCase())
            }
            if (Array.isArray(children)) {
              return children.some(
                (child: unknown) =>
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
        <LabeledSearchInput
          label="강사/프로그램"
          placeholder="강사 또는 프로그램을 입력하세요"
          value={filters.keyword || ''}
          onChange={value => onChangeFilters({ ...filters, keyword: value || undefined })}
          width={300}
        />
        <Button onClick={onResetFilters}>필터 초기화</Button>
      </Space>

      <Table
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...PAGINATION_CONFIG,
          showTotal: total => `총 ${total}개`,
        }}
        columns={[
          {
            title: '기간',
            dataIndex: 'period',
            key: 'period',
            render: (period: string) => <Tag color="geekblue">{period}</Tag>,
          },
          {
            title: '프로그램',
            dataIndex: 'programId',
            key: 'programId',
            render: (programId: string) => {
              const program = getByIdSync(programId)
              return program ? (
                <Tag color={domainColorsHex.program.primary}>{program.title}</Tag>
              ) : (
                <Tag color="error">프로그램 정보 오류</Tag>
              )
            },
          },
          {
            title: '강사',
            dataIndex: 'instructorId',
            key: 'instructorId',
            render: (instructorId: string) => getInstructorNameById(instructorId),
          },
          {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            render: (status: PaymentStatement['status']) => (
              <StatusBadge
                status={status}
                statusConfig={paymentStatementStatusConfig}
                variant="badge"
                showIcon={false}
              />
            ),
          },
          {
            title: '총액',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
          },
          {
            title: '생성일',
            dataIndex: 'generatedAt',
            key: 'generatedAt',
            render: (generatedAt: PaymentStatement['generatedAt']) =>
              new Date(generatedAt).toLocaleDateString('ko-KR'),
          },
          {
            title: '다운로드',
            key: 'action',
            render: (_: unknown, record: PaymentStatement) => {
              const canDownload =
                currentUser && canDownloadPaymentStatement(currentUser, record.programId)
              const program = getByIdSync(record.programId)
              const programName = program?.title ?? '프로그램'

              if (canDownload) {
                return (
                  <Button type="link" onClick={() => onDownload(record)}>
                    지급조서 다운로드
                  </Button>
                )
              }
              if (currentUser?.role === 'ADMIN') {
                return (
                  <PermissionRequestButton
                    programId={record.programId}
                    programName={programName}
                    action="DOWNLOAD"
                  />
                )
              }
              return null
            },
          },
        ]}
      />
    </div>
  )
}
