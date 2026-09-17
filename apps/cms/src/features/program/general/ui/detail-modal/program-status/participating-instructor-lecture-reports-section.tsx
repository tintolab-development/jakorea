/**
 * 참여 강사 상세 — 강의보고서 관리 탭 (기관형)
 */

import { useCallback, useMemo, useState } from 'react'
import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { useProgramLectureReports } from '@/features/program/general/hooks/use-program-lecture-reports'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import type { ParticipatingInstructorLectureReportRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'
import {
  downloadGeneralProgramLectureReportFiles,
  downloadGeneralProgramLectureReports,
} from '@/features/program/general/api/admin-program-progress-service'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'

const STATUS_ACCENT_DEFAULT = 'var(--default-BK, #3d3d3d)'
const STATUS_ACCENT_SCHEDULED = 'var(--color-green, #1e8c29)'
const STATUS_ACCENT_UNDONE = 'var(--color-red, #c32f4a)'

function lectureProgressAccent(
  label: ParticipatingInstructorLectureReportRow['lectureProgressLabel']
): string {
  return label === '진행 완료' ? STATUS_ACCENT_DEFAULT : STATUS_ACCENT_SCHEDULED
}

function submissionStatusAccent(
  label: ParticipatingInstructorLectureReportRow['submissionStatusLabel']
): string {
  if (label === '미제출') return STATUS_ACCENT_UNDONE
  if (label === '진행 예정') return STATUS_ACCENT_SCHEDULED
  return STATUS_ACCENT_DEFAULT
}

const lectureReportExportColumns: ColumnsType<ParticipatingInstructorLectureReportRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '기관명', dataIndex: 'schoolName', key: 'schoolName' },
  { title: '교육 학년', dataIndex: 'educationGrade', key: 'educationGrade' },
  { title: '교육 진행 일정', dataIndex: 'educationScheduleLabel', key: 'educationScheduleLabel' },
  {
    title: '강의보고서 제출 기간',
    dataIndex: 'submissionPeriodLabel',
    key: 'submissionPeriodLabel',
  },
  { title: '강의 진행 여부', dataIndex: 'lectureProgressLabel', key: 'lectureProgressLabel' },
  { title: '제출 현황', dataIndex: 'submissionStatusLabel', key: 'submissionStatusLabel' },
]

function resolveInstructorMemberId(instructor: ParticipatingInstructorRow): number | undefined {
  if (instructor.memberId == null || instructor.memberId === '') return undefined
  const n = Number(instructor.memberId)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export interface ParticipatingInstructorLectureReportsSectionProps {
  instructor: ParticipatingInstructorRow
  program?: Program | null
}

export function ParticipatingInstructorLectureReportsSection({
  instructor,
  program,
}: ParticipatingInstructorLectureReportsSectionProps) {
  const { showAlert } = useCmsAlert()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program?.id)
  const instructorMemberId = resolveInstructorMemberId(instructor)
  const lectureReports = useProgramLectureReports(program?.id, { instructorMemberId })
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage: lectureReports.hasNextPage,
    isFetchingNextPage: lectureReports.isFetchingNextPage,
    fetchNextPage: lectureReports.fetchNextPage,
    resetKey: `${program?.id ?? ''}:${instructor.id}:${instructorMemberId ?? ''}`,
  })

  const rows = lectureReports.loading
    ? []
    : lectureReports.isRemoteDataSource && lectureReports.rows != null
      ? lectureReports.rows
      : []

  const [viewDownloadingId, setViewDownloadingId] = useState<string | null>(null)
  const [bulkDownloading, setBulkDownloading] = useState(false)

  const submittedRows = useMemo(
    () => rows.filter(row => row.submissionStatusLabel === '제출 완료' && row.canViewReport),
    [rows]
  )

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: lectureReportExportColumns,
    data: rows,
    filename: '강의보고서 제출 현황',
  })

  const handleViewReport = useCallback(
    async (row: ParticipatingInstructorLectureReportRow) => {
      if (!row.canViewReport) return
      if (!remoteEnabled || !program?.id) {
        notifyProgramApiUnavailable(
          'general-lecture-report-view',
          '일반 프로그램 · 강의보고서 보기'
        )
        return
      }
      if (row.fileObjectIds.length === 0) {
        showAlert({
          title: '안내',
          content: '제출 파일이 없어 강의보고서를 열 수 없습니다.',
        })
        return
      }
      setViewDownloadingId(row.id)
      try {
        await downloadGeneralProgramLectureReportFiles(
          row.fileObjectIds,
          `강의보고서_${row.reportId ?? row.id}`
        )
      } catch (error) {
        showAlert({
          title: '안내',
          content: getGeneralProgramApiErrorMessage(error, '강의보고서 다운로드에 실패했습니다.'),
        })
      } finally {
        setViewDownloadingId(null)
      }
    },
    [program?.id, remoteEnabled, showAlert]
  )

  const handleBulkDownload = useCallback(async () => {
    if (bulkDownloading) return
    if (!remoteEnabled || !program?.id) {
      notifyProgramApiUnavailable(
        'general-lecture-report-bulk-download',
        '일반 프로그램 · 강의보고서 일괄 다운로드'
      )
      return
    }
    if (submittedRows.length === 0) {
      showAlert({
        title: '안내',
        content: '다운로드할 제출 완료 강의보고서가 없습니다.',
      })
      return
    }
    setBulkDownloading(true)
    try {
      await downloadGeneralProgramLectureReports(program.id, { instructorMemberId })
    } catch (error) {
      showAlert({
        title: '안내',
        content: getGeneralProgramApiErrorMessage(
          error,
          '강의보고서 일괄 다운로드에 실패했습니다.'
        ),
      })
    } finally {
      setBulkDownloading(false)
    }
  }, [
    bulkDownloading,
    instructorMemberId,
    program?.id,
    remoteEnabled,
    showAlert,
    submittedRows.length,
  ])

  const columns = useMemo(
    (): ColumnsType<ParticipatingInstructorLectureReportRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 140, align: 'center' },
      {
        title: '교육 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 96,
        align: 'center',
      },
      {
        title: '교육 진행 일정',
        dataIndex: 'educationScheduleLabel',
        key: 'educationScheduleLabel',
        align: 'center',
        width: 320,
        render: (label: string) => renderProgramDetailPipeSeparated(label),
      },
      {
        title: '강의보고서 제출 기간',
        dataIndex: 'submissionPeriodLabel',
        key: 'submissionPeriodLabel',
        align: 'center',
        width: 280,
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgressLabel',
        key: 'lectureProgressLabel',
        align: 'center',
        width: 120,
        render: (label: ParticipatingInstructorLectureReportRow['lectureProgressLabel']) => (
          <StatusBadge
            domain="custom"
            label={label}
            accentColor={lectureProgressAccent(label)}
            variant="text"
          />
        ),
      },
      {
        title: '제출 현황',
        dataIndex: 'submissionStatusLabel',
        key: 'submissionStatusLabel',
        align: 'center',
        width: 120,
        render: (label: ParticipatingInstructorLectureReportRow['submissionStatusLabel']) => (
          <StatusBadge
            domain="custom"
            label={label}
            accentColor={submissionStatusAccent(label)}
            variant="text"
          />
        ),
      },
      {
        title: '강의보고서',
        key: 'report',
        align: 'center',
        width: 180,
        render: (_: unknown, record: ParticipatingInstructorLectureReportRow) => (
          <div className="participating-instructor-lecture-reports-section__report-cell-inner">
            <CmsButton
              variant="default"
              size="medium"
              width={140}
              disabled={!record.canViewReport || viewDownloadingId === record.id}
              loading={viewDownloadingId === record.id}
              onClick={() => {
                void handleViewReport(record)
              }}
            >
              강의보고서 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [handleViewReport, viewDownloadingId]
  )

  if (lectureReports.loading) {
    return (
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="flex min-h-[160px] items-center justify-center py-8" role="status">
          <Spin size="large" />
        </div>
      </div>
    )
  }

  return (
    <div className="school-detail-fullpage-view__instructor-section">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">강의보고서 제출 현황</span>
          <span className="table-description">{rows.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="secondary"
            size="large"
            width={220}
            icon={<DownloadOutlined />}
            disabled={bulkDownloading || submittedRows.length === 0}
            loading={bulkDownloading}
            onClick={() => {
              void handleBulkDownload()
            }}
          >
            강의보고서 일괄 다운로드
          </CmsButton>
          <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
        </div>
      </div>
      <div className="participating-institutions-section__table-wrap">
        <Table<ParticipatingInstructorLectureReportRow>
          className="participating-institutions-section__table cms-data-table"
          rowKey="id"
          size="middle"
          pagination={false}
          scroll={{ x: 1280 }}
          columns={columns}
          dataSource={rows}
        />
      </div>
      <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
    </div>
  )
}
