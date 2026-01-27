/**
 * 신청 목록 컴포넌트
 * Phase 2.2: 테이블 + 필터 (Ant Design 컴포넌트 다양하게 활용)
 */

import { useState } from 'react'
import { Table, Select, Button, Space, Tag, Dropdown, Tooltip } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { useApplicationTable } from '../model/use-application-table'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import type { Application } from '@/types/domain'
import type { User } from '@/types/user'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import { getApplicationSubjectName, createApplicationMenuItems } from '../lib/application-helpers'
import {
  applicationStatusStatusConfig,
  applicationStatusConfig,
  applicationSubjectTypeConfig,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { domainColorsHex } from '@/shared/constants/colors'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'
import { canPerformWriteAction } from '@/shared/utils/permissions'

const { Option } = Select

interface ApplicationListProps {
  data: Application[]
  loading?: boolean
  onView: (application: Application) => void
  onEdit: (application: Application) => void
  onDelete: (application: Application) => void
  onStatusChange: (
    application: Application,
    status: Application['status'],
    rejectionReason?: string
  ) => void
  onReject?: (application: Application) => void
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
  onReject,
  isAdmin = false,
  currentUser,
}: ApplicationListProps) {
  let filteredData = data

  if (!isAdmin && currentUser) {
    switch (currentUser.role) {
      case 'INSTRUCTOR': {
        const instructorId = currentUser.instructorId
        filteredData = instructorId
          ? data.filter(app => app.subjectType === 'instructor' && app.subjectId === instructorId)
          : []
        break
      }
      case 'INDIVIDUAL': {
        filteredData = currentUser.id
          ? data.filter(
              app =>
                (app.subjectType === 'student' || app.subjectType === 'volunteer') &&
                app.subjectId === currentUser.id
            )
          : []
        break
      }
      case 'SCHOOL': {
        filteredData = currentUser.id
          ? data.filter(app => app.subjectType === 'school' && app.subjectId === currentUser.id)
          : []
        break
      }
      default:
        filteredData = data
    }
  }

  const { table, resetFilters } = useApplicationTable(filteredData)
  const { getAllSync, getByIdSync } = useProgramService()

  const programs = getAllSync()

  const pathTypeLabels: Record<string, string> = {
    google_form: '구글폼',
    internal: '자동화 프로그램',
  }

  // StatusBadge용 statusConfig 생성
  const applicationSubjectTypeStatusConfig = {
    school: {
      label: applicationSubjectTypeConfig.labels.school,
      color: applicationSubjectTypeConfig.colors.school,
    },
    student: {
      label: applicationSubjectTypeConfig.labels.student,
      color: applicationSubjectTypeConfig.colors.student,
    },
    instructor: {
      label: applicationSubjectTypeConfig.labels.instructor,
      color: applicationSubjectTypeConfig.colors.instructor,
    },
    volunteer: {
      label: applicationSubjectTypeConfig.labels.volunteer,
      color: applicationSubjectTypeConfig.colors.volunteer,
    },
  } as const

  const applicationPathTypeStatusConfig = {
    google_form: { label: pathTypeLabels.google_form, color: 'orange' },
    internal: { label: pathTypeLabels.internal, color: 'blue' },
  } as const

  const columns = [
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = getByIdSync(programId)
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
          <StatusBadge
            status={record.subjectType}
            statusConfig={applicationSubjectTypeStatusConfig}
            showIcon={false}
          />
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

        return (
          <StatusBadge
            status={applicationPath.pathType}
            statusConfig={applicationPathTypeStatusConfig}
            showIcon={false}
          />
        )
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: Application['status']) => (
        <StatusBadge status={status} statusConfig={applicationStatusStatusConfig} />
      ),
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
            render: (_: unknown, record: Application) => {
              const canWrite = currentUser
                ? canPerformWriteAction(currentUser as Omit<User, 'password'>)
                : false
              return (
                <div onClick={e => e.stopPropagation()}>
                  <Dropdown
                    menu={{
                      items: createApplicationMenuItems(
                        record,
                        {
                          onView,
                          onEdit,
                          onDelete,
                          onStatusChange,
                          onReject,
                        },
                        canWrite
                      ),
                      onClick: e => {
                        e.domEvent.stopPropagation()
                      },
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
              )
            },
          },
        ]
      : []),
  ]

  // Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState({
    programId: (table.getColumn('programId')?.getFilterValue() as string) || undefined,
    subjectType: (table.getColumn('subjectType')?.getFilterValue() as string) || undefined,
    status: (table.getColumn('status')?.getFilterValue() as string) || undefined,
  })

  // 조회 버튼 클릭 시 필터 적용
  const handleSearch = () => {
    table.getColumn('programId')?.setFilterValue(pendingFilters.programId || null)
    table.getColumn('subjectType')?.setFilterValue(pendingFilters.subjectType || null)
    table.getColumn('status')?.setFilterValue(pendingFilters.status || null)
  }

  // 필터 초기화
  const handleFilterReset = () => {
    setPendingFilters({
      programId: undefined,
      subjectType: undefined,
      status: undefined,
    })
    resetFilters()
  }

  return (
    <div>
      <UnifiedFilterCard
        fields={[
          {
            key: 'programId',
            type: 'select',
            label: '프로그램',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'all' },
              ...programs.map(program => ({
                label: program.title,
                value: program.id,
              })),
            ],
          },
          {
            key: 'subjectType',
            type: 'select',
            label: '신청 주체',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'all' },
              { label: '학교', value: 'school' },
              { label: '학생', value: 'student' },
              { label: '강사', value: 'instructor' },
              { label: '봉사자', value: 'volunteer' },
            ],
          },
          {
            key: 'status',
            type: 'select',
            label: '상태',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'all' },
              ...Object.entries(applicationStatusConfig.labels).map(([value, label]) => ({
                label,
                value,
              })),
            ],
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }))
        }}
        onSearch={handleSearch}
        onReset={handleFilterReset}
      />

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
          ...PAGINATION_CONFIG,
          current: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          total: table.getFilteredRowModel().rows.length,
          onChange: (page, pageSize) => {
            table.setPageIndex(page - 1)
            table.setPageSize(pageSize)
          },
        }}
      />
    </div>
  )
}
