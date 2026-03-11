/**
 * 신청 목록 컴포넌트
 * Phase 2.2: 테이블 + 필터 (Ant Design 컴포넌트 다양하게 활용)
 */

import { useState } from 'react'
import { Table, Button, Space, Tag, Dropdown, Tooltip, message } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { useApplicationTable } from '../model/use-application-table'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { EditableCell } from '@/shared/ui/editable-cell'
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
import { useApplicationStore } from '../model/application-store'

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
  const updateApplication = useApplicationStore(state => state.updateApplication)

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

  const { table } = useApplicationTable(filteredData, isAdmin)
  const { getAllSync, getByIdSync } = useProgramService()
  const canWrite = currentUser
    ? canPerformWriteAction(currentUser as Omit<User, 'password'>)
    : false

  const handleSaveNotes = async (applicationId: string, notes: string) => {
    try {
      await updateApplication(applicationId, { notes })
      message.success('비고가 수정되었습니다')
    } catch (error) {
      message.error('비고 수정에 실패했습니다')
      throw error
    }
  }

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
            title: '알림 발송',
            dataIndex: 'notificationSent',
            key: 'notificationSent',
            width: 100,
            render: (notificationSent: boolean | undefined, record: Application) => {
              // 승인/반려 상태일 때만 표시
              if (record.status !== 'approved' && record.status !== 'rejected') {
                return <Tag>-</Tag>
              }
              return (
                <Tag color={notificationSent ? 'green' : 'default'}>
                  {notificationSent ? '발송 완료' : '미발송'}
                </Tag>
              )
            },
          },
        ]
      : []),
    ...(isAdmin && canWrite
      ? [
          {
            title: '비고',
            dataIndex: 'notes',
            key: 'notes',
            width: 200,
            render: (notes: string | undefined, record: Application) => (
              <EditableCell
                value={notes}
                type="textarea"
                placeholder="비고를 입력하세요"
                onSave={async value => {
                  await handleSaveNotes(record.id, value as string)
                }}
              />
            ),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: '작업',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: (_: unknown, record: Application) => {
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
    notificationSent:
      (table.getColumn('notificationSent')?.getFilterValue() as string) || undefined,
  })

  // 조회 버튼 클릭 시 필터 적용
  const handleSearch = () => {
    table.getColumn('programId')?.setFilterValue(pendingFilters.programId || null)
    table.getColumn('subjectType')?.setFilterValue(pendingFilters.subjectType || null)
    table.getColumn('status')?.setFilterValue(pendingFilters.status || null)
    if (isAdmin) {
      table.getColumn('notificationSent')?.setFilterValue(pendingFilters.notificationSent || null)
    }
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
          ...(isAdmin
            ? [
                {
                  key: 'notificationSent',
                  type: 'select' as const,
                  label: '알림 발송',
                  placeholder: '전체',
                  options: [
                    { label: '전체', value: 'all' },
                    { label: '발송 완료', value: 'true' },
                    { label: '미발송', value: 'false' },
                  ],
                },
              ]
            : []),
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }))
        }}
        onSearch={handleSearch}
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
