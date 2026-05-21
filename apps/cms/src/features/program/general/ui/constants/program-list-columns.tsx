import { formatDateRange } from '../../hooks/use-format-date'
import { getCapacity, getApplicationCountByProgram } from '../../lib/program-helpers'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import type { Program, ProgramCategory, TargetLevel } from '@/types/domain'
import {
  programTypes,
  businessAreaOptions,
  targetLevelOptions,
  categoryOptions,
} from './program-list-constants'
import { ProgramLifecycleStatusTableCell } from '@/shared/components/program-lifecycle-status-table-cell'

export const studentRecruitmentTableColumns = [
  {
    title: 'No.',
    key: 'no',
    width: 64,
    align: 'center' as const,
    render: (_: unknown, __: Program, index: number) => index + 1,
  },
  {
    title: '프로그램명',
    dataIndex: 'title',
    key: 'title',
    width: 260,
    ellipsis: true,
    align: 'center' as const,
    render: (text: string) => text ?? '-',
  },
  {
    title: '모집 신청 현황',
    key: 'lifecycleStatus',
    width: 180,
    minWidth: 180,
    align: 'center' as const,
    className: undefined,
    render: (_: unknown, record: Program) => (
      <ProgramLifecycleStatusTableCell status={record.lifecycleStatus} />
    ),
  },
  {
    title: '지원자 수',
    key: 'applicantCount',
    width: 100,
    align: 'center' as const,
    render: (_: unknown, record: Program) => `${getApplicationCountByProgram(record.id)}`,
  },
  {
    title: '수강자 모집 인원',
    key: 'capacity',
    width: 120,
    align: 'center' as const,
    render: (_: unknown, record: Program) => {
      const cap = getCapacity(record)
      return cap !== undefined ? `${cap}` : '-'
    },
  },
  {
    title: '교육 분야',
    dataIndex: 'businessArea',
    key: 'businessArea',
    width: 110,
    align: 'center' as const,
    render: (value: string | undefined) =>
      value ? (businessAreaOptions.find(o => o.value === value)?.label ?? value) : '-',
  },
  {
    title: '수강자 유형',
    dataIndex: 'category',
    key: 'category',
    width: 120,
    align: 'center' as const,
    render: (value: ProgramCategory | undefined) =>
      value ? (categoryOptions.find(o => o.value === value)?.label ?? value) : '-',
  },
  {
    title: '교육 대상',
    dataIndex: 'targetLevel',
    key: 'targetLevel',
    width: 100,
    align: 'center' as const,
    render: (value: TargetLevel | undefined) =>
      value ? (targetLevelOptions.find(o => o.value === value)?.label ?? value) : '-',
  },
  {
    title: '진행 방식',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    align: 'center' as const,
    render: (value: string | undefined) =>
      value ? (programTypes.find(t => t.value === value)?.label ?? value) : '-',
  },
  {
    title: '신청자 모집 기간',
    key: 'applicationPeriod',
    width: 160,
    align: 'center' as const,
    render: (_: unknown, record: Program) =>
      formatDateRange(record.applicationStartDate, record.applicationEndDate),
  },
  {
    title: '프로그램 운영 기간',
    key: 'operationPeriod',
    width: 160,
    align: 'center' as const,
    render: (_: unknown, record: Program) => formatDateRange(record.startDate, record.endDate),
  },
  {
    title: '후원사',
    dataIndex: 'sponsorId',
    key: 'sponsorId',
    width: 120,
    align: 'center' as const,
    render: (id: string | undefined) => (id ? sponsorService.getNameById(id) : '-'),
  },
  {
    title: '담당자',
    key: 'owner',
    width: 100,
    align: 'center' as const,
    render: () => '-',
  },
]

export const instructorRecruitmentTableColumns = [
  {
    title: 'No.',
    key: 'no',
    width: 64,
    align: 'center' as const,
    render: (_: unknown, __: Program, index: number) => index + 1,
  },
  {
    title: '프로그램명',
    dataIndex: 'title',
    key: 'title',
    width: 260,
    ellipsis: true,
    align: 'center' as const,
    render: (text: string) => text ?? '-',
  },
  {
    title: '모집 신청 현황',
    key: 'lifecycleStatus',
    width: 180,
    minWidth: 180,
    align: 'center' as const,
    className: undefined,
    render: (_: unknown, record: Program) => (
      <ProgramLifecycleStatusTableCell status={record.lifecycleStatus} />
    ),
  },
  {
    title: '지원자 수',
    key: 'applicantCount',
    width: 100,
    align: 'center' as const,
    render: (_: unknown, record: Program) => `${getApplicationCountByProgram(record.id)}`,
  },
  {
    title: '강사 모집 인원',
    key: 'instructorCapacity',
    width: 120,
    align: 'center' as const,
    render: (_: unknown, record: Program) => {
      const cap = getCapacity(record)
      const current = record.instructors ?? 0
      if (cap !== undefined && cap !== null) return `${current} / ${cap}`
      return `${current}`
    },
  },
  {
    title: '교육 분야',
    dataIndex: 'businessArea',
    key: 'businessArea',
    width: 110,
    align: 'center' as const,
    render: (value: string | undefined) =>
      value ? (businessAreaOptions.find(o => o.value === value)?.label ?? value) : '-',
  },
  {
    title: '수강자 유형',
    dataIndex: 'category',
    key: 'category',
    width: 120,
    align: 'center' as const,
    render: (value: ProgramCategory | undefined) =>
      value ? (categoryOptions.find(o => o.value === value)?.label ?? value) : '-',
  },
  {
    title: '교육 대상',
    dataIndex: 'targetLevel',
    key: 'targetLevel',
    width: 100,
    align: 'center' as const,
    render: (value: TargetLevel | undefined) =>
      value ? (targetLevelOptions.find(o => o.value === value)?.label ?? value) : '-',
  },
  {
    title: '진행 방식',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    align: 'center' as const,
    render: (value: string | undefined) =>
      value ? (programTypes.find(t => t.value === value)?.label ?? value) : '-',
  },
  {
    title: '신청자 모집 기간',
    key: 'applicationPeriod',
    width: 160,
    align: 'center' as const,
    render: (_: unknown, record: Program) =>
      formatDateRange(record.applicationStartDate, record.applicationEndDate),
  },
  {
    title: '프로그램 운영 기간',
    key: 'operationPeriod',
    width: 160,
    align: 'center' as const,
    render: (_: unknown, record: Program) => formatDateRange(record.startDate, record.endDate),
  },
  {
    title: '후원사',
    dataIndex: 'sponsorId',
    key: 'sponsorId',
    width: 120,
    align: 'center' as const,
    render: (id: string | undefined) => (id ? sponsorService.getNameById(id) : '-'),
  },
  {
    title: '담당자',
    key: 'owner',
    width: 100,
    align: 'center' as const,
    render: () => '-',
  },
]

export const capacityTableColumnsEconomy = {
  title: '참여자 모집 인원',
  key: 'participantCapacity',
  width: 120,
  align: 'center' as const,
  render: (_: unknown, record: Program) => {
    const cap = getCapacity(record)
    const approved = record.approvedStudentCount ?? 0
    if (cap !== undefined) return `${approved} / ${cap}`
    return `${approved}`
  },
}

export const capacityTableColumnsEducation = [
  {
    title: '수강자 모집 인원',
    key: 'capacity',
    width: 120,
    align: 'center' as const,
    render: (_: unknown, record: Program) => {
      const cap = getCapacity(record)
      const approved = record.approvedStudentCount ?? 0
      if (cap !== undefined) return `${approved} / ${cap}`
      return `${approved}`
    },
  },
  {
    title: '강사 모집 인원',
    key: 'instructorCapacity',
    width: 120,
    align: 'center' as const,
    render: (_: unknown, record: Program) => {
      const cap = getCapacity(record)
      const current = record.instructors ?? 0
      if (cap !== undefined && cap !== null) return `${current} / ${cap}`
      return `${current}`
    },
  },
]

export const optionalColumns = [
  {
    title: '교육 분야',
    dataIndex: 'businessArea',
    key: 'businessArea',
    width: 110,
    align: 'center' as const,
    render: (value: string | undefined) =>
      value ? (businessAreaOptions.find(o => o.value === value)?.label ?? value) : '-',
  },
  {
    title: '교육 대상',
    dataIndex: 'targetLevel',
    key: 'targetLevel',
    width: 100,
    align: 'center' as const,
    render: (value: TargetLevel | undefined) =>
      value ? (targetLevelOptions.find(o => o.value === value)?.label ?? value) : '-',
  },
  {
    title: '진행 방식',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    align: 'center' as const,
    render: (value: string | undefined) =>
      value ? (programTypes.find(t => t.value === value)?.label ?? value) : '-',
  },
  {
    title: '프로그램 운영기간',
    key: 'operationPeriod',
    width: 160,
    align: 'center' as const,
    render: (_: unknown, record: Program) => formatDateRange(record.startDate, record.endDate),
  },
  {
    title: '후원사',
    dataIndex: 'sponsorId',
    key: 'sponsorId',
    width: 120,
    align: 'center' as const,
    render: (id: string | undefined) => (id ? sponsorService.getNameById(id) : '-'),
  },
  {
    title: '담당자',
    key: 'owner',
    width: 100,
    align: 'center' as const,
    render: () => '-',
  },
]
