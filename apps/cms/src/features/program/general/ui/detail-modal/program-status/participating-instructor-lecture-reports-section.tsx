/**
 * 참여 강사 상세 — 강의보고서 관리 탭 (기관형)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Spin, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { useProgramLectureReports } from '@/features/program/general/hooks/use-program-lecture-reports'
import { useLectureReportPreview } from '@/features/program/general/hooks/use-lecture-report-preview'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import type { ParticipatingInstructorLectureReportRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { downloadGeneralProgramLectureReportFiles } from '@/features/program/general/api/admin-program-progress-service'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { LECTURE_REPORT_NO_SUBMITTED_PDF_CTA } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import {
  buildLectureReportPreviewContext,
  type LectureReportPreviewContext,
} from '@/features/program/general/lib/build-lecture-report-issuance-preview'
import { LectureReportIssuancePreviewModal } from '@/features/program/general/ui/detail-modal/program-status/lecture-report-issuance-preview-modal'
import { useLectureReportBulkPdfExport } from '@/features/program/general/ui/detail-modal/program-status/lecture-report-bulk-pdf-export'
import { useIsInstitutionProgramSurface } from '@/features/program/general/hooks/use-institution-program-surface'
import {
  getLectureReportProgressAccent,
  getLectureReportSubmissionAccent,
} from '@/features/program/shared/lib/lecture-report-status-presentation'

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
  /** 일반 기관형 — Figma 06-2/08·09 (행 버튼 h32, 미리보기 상단 문구) */
  const isInstitutionSurface = useIsInstitutionProgramSurface(program)
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program?.id)
  const instructorMemberId = resolveInstructorMemberId(instructor)
  const lectureReports = useProgramLectureReports(program?.id, {
    instructorMemberId,
    instructor,
  })
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
  const [previewRow, setPreviewRow] = useState<ParticipatingInstructorLectureReportRow | null>(null)
  const previewQuery = useLectureReportPreview(program?.id, previewRow)
  const {
    bulkDownloading,
    hasPdfTargets,
    handleBulkDownload,
    exportHost,
  } = useLectureReportBulkPdfExport({
    programId: program?.id,
    program,
    instructor,
    rows,
    remoteEnabled,
    hasNextPage: lectureReports.hasNextPage,
    instructorMemberId,
    unavailableContext: 'general-lecture-report-bulk-download',
  })
  const previewContext = useMemo<LectureReportPreviewContext | null>(() => {
    if (previewRow == null || previewQuery.data == null) return null
    return buildLectureReportPreviewContext(
      instructor,
      program,
      {
        id: previewRow.id,
        no: previewRow.no,
        reportId: previewRow.reportId,
        scheduleId: previewRow.scheduleId,
        schoolName: previewRow.schoolName,
        educationGrade: previewRow.educationGrade,
        educationScheduleLabel: previewRow.educationScheduleLabel,
        lectureDate: previewRow.lectureDate,
        sessionNo: previewRow.sessionNo,
        curriculumSessionCount: previewRow.curriculumSessionCount,
        scheduleRole: previewRow.scheduleRole,
        educationSlotKey: previewRow.educationSlotKey,
        timeLabel: previewRow.timeLabel,
      },
      previewQuery.data
    )
  }, [instructor, previewQuery.data, previewRow, program])

  useEffect(() => {
    if (previewQuery.error == null) return
    showAlert({
      title: '안내',
      content: getGeneralProgramApiErrorMessage(
        previewQuery.error,
        '강의보고서 응답 상세를 불러오지 못했습니다.'
      ),
    })
    setPreviewRow(null)
  }, [previewQuery.error, showAlert])

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    accessLog: { downloadKind: 'PROGRAM_LECTURE_REPORT_EXPORT', containedPiiTypes: [] },
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
      if (row.reportId != null) {
        setPreviewRow(row)
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
        render: (label: string) =>
          renderProgramDetailPipeSeparated(label ? formatCmsScheduleDisplayLabel(label) : label),
      },
      {
        title: '강의보고서 제출 기간',
        dataIndex: 'submissionPeriodLabel',
        key: 'submissionPeriodLabel',
        align: 'center',
        width: 280,
        render: (value: string | undefined) =>
          value?.trim() ? formatCmsScheduleDisplayLabel(value) : '-',
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
            accentColor={getLectureReportProgressAccent(label)}
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
            accentColor={getLectureReportSubmissionAccent(label)}
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
              size={isInstitutionSurface ? 'h32' : 'h40'}
              disabled={
                !record.canViewReport ||
                viewDownloadingId === record.id ||
                (previewRow?.id === record.id && previewQuery.isFetching)
              }
              loading={
                viewDownloadingId === record.id ||
                (previewRow?.id === record.id && previewQuery.isFetching)
              }
              onClick={() => {
                void handleViewReport(record)
              }} >
              강의보고서 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [
      handleViewReport,
      isInstitutionSurface,
      previewQuery.isFetching,
      previewRow?.id,
      viewDownloadingId,
    ]
  )

  if (lectureReports.loading) {
    return (
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="detail-fullpage-modal__loading" role="status">
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
          <Tooltip title={!hasPdfTargets ? LECTURE_REPORT_NO_SUBMITTED_PDF_CTA : undefined}>
              <span>
                <CmsButton
                  variant="secondary"
                  size="h40"
                  icon={<ButtonDownloadIcon />}
                  disabled={bulkDownloading || !hasPdfTargets}
                  loading={bulkDownloading}
                  onClick={() => {
                    void handleBulkDownload()
                  }}
                >
                  강의보고서 일괄 다운로드
                </CmsButton>
              </span>
            </Tooltip>
          <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
        </div>
      </div>
      <div className="participating-institutions-section__table-wrap">
        <CmsDataTable<ParticipatingInstructorLectureReportRow>
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
      <LectureReportIssuancePreviewModal
        open={previewContext != null}
        context={previewContext}
        onClose={() => setPreviewRow(null)}
        headerVariant={isInstitutionSurface ? 'institution' : 'default'}
      />
      {exportHost}
    </div>
  )
}
