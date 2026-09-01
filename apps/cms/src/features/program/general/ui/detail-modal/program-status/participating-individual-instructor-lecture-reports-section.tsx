/**
 * 참여 강사 상세 — 강의보고서 관리 탭 (일반 프로그램 · 개인)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { handleError } from '@/shared/utils/error-handler'
import {
  buildLectureReportPreviewContext,
  type LectureReportPreviewContext,
} from '@/features/program/general/lib/build-lecture-report-issuance-preview'
import { downloadLectureReportPdfFiles } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import {
  lectureProgressAccent,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SUBMISSION_STATUS_LABELS,
  submissionStatusAccent,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import { PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_REPORT_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-export'
import { getParticipatingIndividualInstructorLectureReportRows } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-mock'
import type { ParticipatingIndividualInstructorLectureReportRow } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { LectureReportBulkPdfExportHost } from './lecture-report-bulk-pdf-export-host'
import { LectureReportIssuancePreviewModal } from './lecture-report-issuance-preview-modal'

export interface ParticipatingIndividualInstructorLectureReportsSectionProps {
  instructor: ParticipatingInstructorRow
  program: Program
}

export function ParticipatingIndividualInstructorLectureReportsSection({
  instructor,
  program,
}: ParticipatingIndividualInstructorLectureReportsSectionProps) {
  const { showAlert } = useCmsAlert()
  const rows = useMemo(
    () => getParticipatingIndividualInstructorLectureReportRows(instructor, program),
    [instructor, program]
  )

  const tableData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        no: rows.length - index,
      })),
    [rows]
  )

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContext, setPreviewContext] = useState<LectureReportPreviewContext | null>(null)
  const [bulkExportQueue, setBulkExportQueue] = useState<LectureReportPreviewContext[]>([])
  const [bulkExportActive, setBulkExportActive] = useState(false)
  const bulkExportResultsRef = useRef<Array<{ fileName: string; blob: Blob }>>([])
  const bulkExportStartedRef = useRef(false)

  const submittedRows = useMemo(() => rows.filter(row => row.canViewReport), [rows])

  const programTitle = program.mainTitle?.trim() || program.title?.trim() || '개인 프로그램'

  const buildRowPreviewContext = useCallback(
    (row: ParticipatingIndividualInstructorLectureReportRow, no: number): LectureReportPreviewContext =>
      buildLectureReportPreviewContext(instructor, program, {
        id: row.id,
        no,
        schoolName: programTitle,
        educationGrade: '-',
        educationScheduleLabel: row.scheduleLabel,
      }),
    [instructor, program, programTitle]
  )

  const handleOpenPreview = useCallback(
    (row: ParticipatingIndividualInstructorLectureReportRow & { no: number }) => {
      setPreviewContext(buildRowPreviewContext(row, row.no))
      setPreviewOpen(true)
    },
    [buildRowPreviewContext]
  )

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false)
    setPreviewContext(null)
  }, [])

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_REPORT_EXCEL_COLUMNS,
    data: tableData,
    filename: `강의보고서_제출현황_${instructor.instructorName}`,
  })

  const handleBulkExportItemComplete = useCallback(
    (result: { fileName: string; blob: Blob } | null) => {
      if (result != null) {
        bulkExportResultsRef.current.push(result)
      }
      setBulkExportQueue(prev => prev.slice(1))
    },
    []
  )

  const handleBulkDownload = useCallback(() => {
    if (bulkExportActive) return
    if (submittedRows.length === 0) {
      showAlert({
        title: '안내',
        content: '다운로드할 제출 완료 강의보고서가 없습니다.',
      })
      return
    }

    bulkExportResultsRef.current = []
    bulkExportStartedRef.current = true
    setBulkExportQueue(
      submittedRows.map((row, index) =>
        buildRowPreviewContext(row, submittedRows.length - index)
      )
    )
    setBulkExportActive(true)
  }, [bulkExportActive, buildRowPreviewContext, showAlert, submittedRows])

  useEffect(() => {
    if (!bulkExportActive || !bulkExportStartedRef.current || bulkExportQueue.length > 0) {
      return
    }

    bulkExportStartedRef.current = false
    const files = bulkExportResultsRef.current

    void (async () => {
      try {
        if (files.length === 0) {
          showAlert({
            title: '안내',
            content: 'PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          })
          return
        }
        await downloadLectureReportPdfFiles(files)
      } catch (error) {
        handleError(error, {
          context: 'participatingIndividualInstructorLectureReportsSection.bulkDownload',
        })
        showAlert({
          title: '안내',
          content: '강의보고서 일괄 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        bulkExportResultsRef.current = []
        setBulkExportActive(false)
      }
    })()
  }, [bulkExportActive, bulkExportQueue.length, showAlert])

  const currentBulkExportContext = bulkExportQueue[0] ?? null

  const columns = useMemo(
    (): ColumnsType<ParticipatingIndividualInstructorLectureReportRow & { no: number }> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      {
        title: '교육 진행 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        align: 'center',
        width: 400,
        render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
      },
      {
        title: '강의보고서 제출 기간',
        dataIndex: 'submissionPeriodLabel',
        key: 'submissionPeriodLabel',
        align: 'center',
        width: 220,
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgress',
        key: 'lectureProgress',
        align: 'center',
        width: 120,
        render: (_value, record) => (
          <StatusBadge
            domain="custom"
            label={PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[record.lectureProgress]}
            accentColor={lectureProgressAccent(record.lectureProgress)}
            variant="text"
          />
        ),
      },
      {
        title: '제출 현황',
        dataIndex: 'submissionStatus',
        key: 'submissionStatus',
        align: 'center',
        width: 120,
        render: (_value, record) => (
          <StatusBadge
            domain="custom"
            label={
              PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SUBMISSION_STATUS_LABELS[record.submissionStatus]
            }
            accentColor={submissionStatusAccent(record.submissionStatus)}
            variant="text"
          />
        ),
      },
      {
        title: '강의보고서',
        key: 'report',
        align: 'center',
        width: 180,
        render: (_value, record) => (
          <div className="participating-instructor-lecture-reports-section__report-cell-inner">
            <CmsButton
              variant="default"
              size="medium"
              width={140}
              disabled={!record.canViewReport}
              onClick={() => handleOpenPreview(record)}
            >
              강의보고서 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [handleOpenPreview]
  )

  return (
    <div className="school-detail-fullpage-view__instructor-section">
      <FormCertificatePdfExportOverlay visible={bulkExportActive} />
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
            disabled={bulkExportActive || submittedRows.length === 0}
            onClick={() => void handleBulkDownload()}
          >
            강의보고서 일괄 다운로드
          </CmsButton>
          <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
        </div>
      </div>
      <div className="participating-institutions-section__table-wrap">
        <Table<ParticipatingIndividualInstructorLectureReportRow & { no: number }>
          className="participating-institutions-section__table cms-data-table"
          rowKey="id"
          size="middle"
          pagination={false}
          scroll={{ x: 1100 }}
          columns={columns}
          dataSource={tableData}
        />
      </div>
      <LectureReportIssuancePreviewModal
        open={previewOpen}
        onClose={handleClosePreview}
        context={previewContext}
      />
      {currentBulkExportContext != null ? (
        <LectureReportBulkPdfExportHost
          key={currentBulkExportContext.row.id}
          context={currentBulkExportContext}
          onComplete={handleBulkExportItemComplete}
        />
      ) : null}
    </div>
  )
}
