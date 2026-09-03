/**
 * 수강 신청 현황 테이블 (프로그램 단위)
 * 컬럼: No., 프로그램명, 지원자 수, 수강자 모집 인원, 교육 분야, 수강자/유형, 교육 대상, 진행 방식,
 *       신청자 모집 기간, 프로그램 운영 기간, 후원사, 담당자
 */

import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { getEducationPrograms } from '@/data/mock/education-programs'
import { getApplicationCountByProgram, getCapacity } from '../lib/program-helpers'
import { SponsorNameById } from '@/features/sponsor/ui/sponsor-name-by-id'
import {
  programTypes,
  businessAreaOptions,
  targetLevelOptions,
  categoryOptions,
} from './constants/program-list-constants'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'

import { formatDateRangeDot } from '@/shared/utils'

function formatDateRange(start?: string | Date, end?: string | Date): string {
  return formatDateRangeDot(start, end)
}

export interface EnrollmentStatusTableProps {
  data?: Program[]
  loading?: boolean
}

export function EnrollmentStatusTable({ data, loading }: EnrollmentStatusTableProps) {
  const programs = data ?? getEducationPrograms()

  const columns: ColumnsType<Program> = [
    {
      title: 'No.',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => title || '-',
    },
    {
      title: '지원자 수',
      key: 'applicantCount',
      width: 100,
      align: 'center',
      render: (_: unknown, record: Program) => {
        const count = getApplicationCountByProgram(record.id)
        return `${count}건`
      },
    },
    {
      title: '수강자 모집 인원',
      key: 'capacity',
      width: 120,
      align: 'center',
      render: (_: unknown, record: Program) => {
        const cap = getCapacity(record)
        return cap !== undefined ? `${cap}건` : '-'
      },
    },
    {
      title: '교육 분야',
      dataIndex: 'businessArea',
      key: 'businessArea',
      width: 110,
      align: 'center',
      render: (value: string | undefined) =>
        value ? businessAreaOptions.find(o => o.value === value)?.label ?? value : '-',
    },
    {
      title: '수강자/유형',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      align: 'center',
      render: (value: string | undefined) =>
        value ? categoryOptions.find(o => o.value === value)?.label ?? value : '-',
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      width: 100,
      align: 'center',
      render: (value: string | undefined) =>
        value ? targetLevelOptions.find(o => o.value === value)?.label ?? value : '-',
    },
    {
      title: '진행 방식',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center',
      render: (value: string | undefined) =>
        value ? programTypes.find(t => t.value === value)?.label ?? value : '-',
    },
    {
      title: '신청자 모집 기간',
      key: 'applicationPeriod',
      width: 180,
      align: 'center',
      render: (_: unknown, record: Program) =>
        formatDateRange(record.applicationStartDate, record.applicationEndDate),
    },
    {
      title: '프로그램 운영 기간',
      key: 'operationPeriod',
      width: 180,
      align: 'center',
      render: (_: unknown, record: Program) =>
        formatDateRange(record.startDate, record.endDate),
    },
    {
      title: '후원사',
      dataIndex: 'sponsorId',
      key: 'sponsorId',
      width: 140,
      ellipsis: true,
      render: (sponsorId: string | undefined) =>
        sponsorId ? <SponsorNameById sponsorId={sponsorId} /> : '-',
    },
    {
      title: '담당자',
      dataIndex: 'managerName',
      key: 'managerName',
      width: 120,
      ellipsis: true,
      render: (name: string | undefined) => name || '-',
    },
  ]

  return (
    <Table<Program>
      className="cms-data-table"
      rowKey="id"
      dataSource={programs}
      columns={columns}
      loading={loading}
      pagination={{
        ...PAGINATION_CONFIG,
        showSizeChanger: true,
        showTotal: (total) => `총 ${total}건`,
      }}
      size="middle"
      scroll={{ x: 1400 }}
    />
  )
}
