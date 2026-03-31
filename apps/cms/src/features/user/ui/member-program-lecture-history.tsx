/**
 * 회원 상세 — 프로그램 강의 이력 (강사·개인 회원 공통)
 * FilterListLayout + user-list-table 스타일, 프로그램 진행 현황은 경제 교육 목록 톤(ProgramEnrollmentStatusBadge economyList)
 */

import { useCallback, useMemo, useState, type Key, type MouseEvent, type ReactNode } from 'react'
import { Card, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import {
  getEffectiveEnrollmentDisplayStatus,
  programEnrollmentEconomyListLabels,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'
import { ProgramEnrollmentStatusBadge } from '@/shared/components/program-enrollment-status-badge'
import { FilterListLayout } from '@/shared/ui/filter-list-layout'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { AppButton } from '@/shared/ui/app-button'
import { Divider } from '@/shared/components/divider'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import '@/features/program/ui/program-list.css'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import './member-program-lecture-history.css'

const ALL = ''

const ENROLLMENT_STATUS_ORDER: ProgramEnrollmentDisplayStatus[] = [
  'WAITING_RESULT',
  'REJECTED',
  'EDUCATION_SCHEDULED',
  'EDUCATION_IN_PROGRESS',
  'PROGRAM_ENDED',
]

type PendingFilters = {
  title: string
  year: string
  enrollmentStatus: string
  managerName: string
}

function programYear(programId: string): number | null {
  const p = programService.getByIdSync(programId)
  if (!p) return null
  return new Date(p.startDate).getFullYear()
}

function programTitle(programId: string): string {
  const p = programService.getByIdSync(programId)
  return p?.title ?? programId
}

export interface MemberProgramLectureHistoryProps {
  applications: Application[]
  loading?: boolean
  /** 기본: 프로그램 강의 이력 */
  summaryTitle?: string
  /** 기본: 활동보고서 안내 문구 */
  footnote?: ReactNode
  onRowClick?: (application: Application) => void
  onViewLectureReport?: (application: Application) => void
  onDownloadActivityReport?: (application: Application) => void
  onBulkDelete?: (applicationIds: string[]) => void
}

const DEFAULT_FOOTNOTE =
  '* 활동보고서는 개인정보 보관 만료 전(회원가입일로부터 5년)까지 자유롭게 발급이 가능합니다.'

export function MemberProgramLectureHistory({
  applications,
  loading = false,
  summaryTitle = '프로그램 강의 이력',
  footnote = DEFAULT_FOOTNOTE,
  onRowClick,
  onViewLectureReport,
  onDownloadActivityReport,
  onBulkDelete,
}: MemberProgramLectureHistoryProps) {
  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    applications.forEach(app => {
      const y = programYear(app.programId)
      if (y != null) years.add(y)
    })
    const sorted = [...years].sort((a, b) => b - a)
    return [
      { label: '전체', value: ALL },
      ...sorted.map(y => ({ label: `${y}년`, value: String(y) })),
    ]
  }, [applications])

  const enrollmentStatusOptions = useMemo(
    () => [
      { label: '전체', value: ALL },
      ...ENROLLMENT_STATUS_ORDER.map(value => ({
        label: programEnrollmentEconomyListLabels[value],
        value,
      })),
    ],
    []
  )

  const filterFields = useMemo((): FilterFieldConfig[] => {
    return [
      {
        key: 'title',
        type: 'search',
        label: '프로그램명',
        placeholder: '프로그램명을 입력하세요',
        width: '25%',
      },
      {
        key: 'year',
        type: 'select',
        label: '진행년도',
        placeholder: '전체',
        options: yearOptions,
        width: '25%',
      },
      {
        key: 'enrollmentStatus',
        type: 'select',
        label: '프로그램 진행 현황',
        placeholder: '전체',
        options: enrollmentStatusOptions,
        width: '25%',
      },
      {
        key: 'managerName',
        type: 'search',
        label: '담당자명',
        placeholder: '담당자명을 입력하세요',
        width: '25%',
      },
    ]
  }, [yearOptions, enrollmentStatusOptions])

  const [pendingFilters, setPendingFilters] = useState<PendingFilters>({
    title: '',
    year: ALL,
    enrollmentStatus: ALL,
    managerName: '',
  })

  const [activeFilters, setActiveFilters] = useState<PendingFilters>(pendingFilters)

  const handleSearch = useCallback(() => {
    setActiveFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const title = programTitle(app.programId)
      if (activeFilters.title.trim() && !title.includes(activeFilters.title.trim())) {
        return false
      }
      const y = programYear(app.programId)
      if (activeFilters.year && (y == null || String(y) !== activeFilters.year)) {
        return false
      }
      const program = programService.getByIdSync(app.programId)
      const displayStatus = getEffectiveEnrollmentDisplayStatus(
        app.status,
        app.progressStatus,
        program?.lifecycleStatus
      )
      if (activeFilters.enrollmentStatus && displayStatus !== activeFilters.enrollmentStatus) {
        return false
      }
      const mgr = (app.managerName ?? '').trim()
      if (activeFilters.managerName.trim() && !mgr.includes(activeFilters.managerName.trim())) {
        return false
      }
      return true
    })
  }, [applications, activeFilters])

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const columns: ColumnsType<Application> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        align: 'center',
        render: (_: unknown, __: Application, index: number) => index + 1,
      },
      {
        title: '프로그램명',
        key: 'programTitle',
        ellipsis: true,
        align: 'left',
        render: (_: unknown, record: Application) => programTitle(record.programId),
      },
      {
        title: '진행년도',
        key: 'year',
        align: 'center',
        render: (_: unknown, record: Application) => {
          const y = programYear(record.programId)
          return y != null ? `${y}년` : '-'
        },
      },
      {
        title: '프로그램 진행 현황',
        key: 'enrollmentDisplay',
        align: 'center',
        render: (_: unknown, record: Application) => {
          const program = programService.getByIdSync(record.programId)
          const displayStatus = getEffectiveEnrollmentDisplayStatus(
            record.status,
            record.progressStatus,
            program?.lifecycleStatus
          )
          return <ProgramEnrollmentStatusBadge status={displayStatus} variant="economyList" />
        },
      },
      {
        title: '강의보고서 제출 내역',
        key: 'lectureReport',
        align: 'center',
        render: (_: unknown, record: Application) => {
          const program = programService.getByIdSync(record.programId)
          const displayStatus = getEffectiveEnrollmentDisplayStatus(
            record.status,
            record.progressStatus,
            program?.lifecycleStatus
          )
          const ended = displayStatus === 'PROGRAM_ENDED'
          const canView = ended && (record.hasLectureReportSubmission ?? true)
          return (
            <span
              className="member-program-lecture-history__action-cell"
              onClick={e => e.stopPropagation()}
            >
              <AppButton
                variant="viewDetails"
                size="large"
                disabled={!canView}
                onClick={() => {
                  if (onViewLectureReport) onViewLectureReport(record)
                  else message.info('강의보고서 내역은 추후 연결됩니다.')
                }}
              >
                내역 보기
              </AppButton>
            </span>
          )
        },
      },
      {
        title: '활동보고서 발급',
        key: 'activityReport',
        align: 'center',
        render: (_: unknown, record: Application) => {
          const program = programService.getByIdSync(record.programId)
          const displayStatus = getEffectiveEnrollmentDisplayStatus(
            record.status,
            record.progressStatus,
            program?.lifecycleStatus
          )
          const canDownload = displayStatus === 'PROGRAM_ENDED'
          return (
            <span
              className="member-program-lecture-history__action-cell"
              onClick={e => e.stopPropagation()}
            >
              <AppButton
                variant="primary"
                size="large"
                disabled={!canDownload}
                icon={<DownloadOutlined />}
                onClick={() => {
                  if (onDownloadActivityReport) onDownloadActivityReport(record)
                  else message.info('활동보고서 다운로드는 추후 연결됩니다.')
                }}
              >
                다운로드
              </AppButton>
            </span>
          )
        },
      },
      {
        title: '담당자',
        dataIndex: 'managerName',
        key: 'managerName',
        ellipsis: true,
        align: 'center',
        render: (v: string | undefined) => v?.trim() || '-',
      },
    ],
    [onViewLectureReport, onDownloadActivityReport]
  )

  const listHeader = (
    <>
      <div className="program-list-page__divider-wrapper">
        <Divider />
      </div>
      <div className="program-list-page__filter-info">
        <div className="member-program-lecture-history__summary">
          <div className="program-list-page__filter-info-texts">
            <div className="program-list-page__filter-info-title">{summaryTitle}</div>
            <div className="program-list-page__filter-info-count">
              총 {filteredApplications.length}건
              {footnote ? (
                <p className="member-program-lecture-history__footnote"> | {footnote}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="program-list-page__widget-header-actions">
          <AppButton
            variant="danger"
            size="filter"
            dangerFillOnHover
            className="program-list-page__bulk-delete-button"
            disabled={selectedRowKeys.length === 0}
            onClick={() => {
              if (onBulkDelete) {
                onBulkDelete(selectedRowKeys.map(String))
              } else {
                message.info('이력 삭제는 추후 연결됩니다.')
              }
            }}
          >
            이력 삭제
          </AppButton>
        </div>
      </div>
    </>
  )

  return (
    <div className="member-program-lecture-history admin-managed-program-history">
      <div className="user-list-page__filter-wrap">
        <FilterListLayout
          className="program-list-content-wrapper admin-managed-program-history__layout"
          bordered={false}
          fields={filterFields}
          filters={{
            title: pendingFilters.title,
            year: pendingFilters.year || undefined,
            enrollmentStatus: pendingFilters.enrollmentStatus || undefined,
            managerName: pendingFilters.managerName,
          }}
          onFilterChange={(key, value) => {
            setPendingFilters(prev => ({ ...prev, [key]: value ?? ALL }))
          }}
          onSearch={handleSearch}
          listHeader={listHeader}
        >
          <div className="program-list-content-wrapper__table">
            <Card
              className="program-list-card program-list-card--in-wrapper program-list-card--no-border"
              style={{ border: 'none', boxShadow: 'none' }}
            >
              <div className="program-list-table-wrapper program-list-table-wrapper--scroll-x member-program-lecture-history__table-wrap">
                <Table<Application>
                  className="cms-data-table cms-data-table--fluid user-list-table"
                  loading={loading}
                  rowSelection={{
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys,
                    onChange: keys => setSelectedRowKeys(keys),
                  }}
                  dataSource={filteredApplications}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  scroll={{ y: 'calc(100vh - 480px)' }}
                  locale={{
                    emptyText: loading ? undefined : '프로그램 강의 이력이 없습니다.',
                  }}
                  onRow={
                    onRowClick
                      ? record => ({
                          onClick: (e: MouseEvent<HTMLElement>) => {
                            if (
                              (e.target as HTMLElement).closest('.ant-table-selection-column') ||
                              (e.target as HTMLElement).closest(
                                '.member-program-lecture-history__action-cell'
                              )
                            ) {
                              return
                            }
                            onRowClick(record)
                          },
                          style: { cursor: 'pointer' },
                        })
                      : undefined
                  }
                />
              </div>
            </Card>
          </div>
        </FilterListLayout>
      </div>
    </div>
  )
}
