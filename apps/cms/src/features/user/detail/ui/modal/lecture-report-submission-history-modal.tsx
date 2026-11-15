import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import type { Application } from '@/types/domain'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { AssignmentSubmissionCellActionButton } from '@/features/program/general/ui/assignment-submission-history-table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { fetchMemberLectureReportsRemote } from '@/features/user/api/member-program-history-api-client'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { mapMemberLectureReportsToTableRows } from '@/features/user/api/map-member-lecture-reports'
import type { MemberLectureReportTableRow } from '@/features/user/api/map-member-lecture-reports'
import { resolveMemberApplicationIdFromApplication } from '@/features/user/api/member-program-history-ids'
import { resolveMemberLectureReportFiles } from '@/features/user/api/resolve-member-lecture-report-files'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import {
  LECTURE_REPORT_NO_ATTACHMENT_CTA,
  hasFileDownloadPermission,
} from '@/shared/lib/lecture-report-bulk-download'
import {
  downloadLectureReportPdfFiles,
  LECTURE_REPORT_NO_SUBMITTED_PDF_CTA,
  type LectureReportPdfFile,
} from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import {
  buildMemberLectureReportPreviewContext,
  filterMemberLectureReportBulkPdfRows,
  MemberLectureReportBulkPdfExportRunner,
} from './member-lecture-report-bulk-pdf-export'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './lecture-report-submission-history-modal.css'
import { StatusBadge } from '@/shared/components'
import {
  getLectureReportProgressAccent,
  getLectureReportSubmissionAccent,
} from '@/features/program/shared/lib/lecture-report-status-presentation'
import { showAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'
import { fetchLectureReportPreviewContentByReportId } from '@/features/program/general/api/admin-program-progress-service'
import { LectureReportIssuancePreviewModal } from '@/features/program/general/ui/detail-modal/program-status/lecture-report-issuance-preview-modal'
import type { LectureReportPreviewContext } from '@/features/program/general/lib/build-lecture-report-issuance-preview'

interface LectureReportSubmissionHistoryModalProps {
  open: boolean
  application: Application | null
  memberId?: number
  /** 미리보기 「강사 정보 > 이름」에 쓴다. */
  instructorName?: string
  onCancel: () => void
}

function renderReportCell(
  record: MemberLectureReportTableRow,
  options: {
    reportDownloadingId: string | null
    previewLoadingId: string | null
    onViewReport: (record: MemberLectureReportTableRow) => void
  }
) {
  if (record.lectureProgressLabel === '진행 예정' || !record.canViewReport) {
    return '-'
  }

  return (
    <AssignmentSubmissionCellActionButton
      loading={options.reportDownloadingId === record.id || options.previewLoadingId === record.id}
      onClick={() => options.onViewReport(record)}
    >
      강의보고서 보기
    </AssignmentSubmissionCellActionButton>
  )
}

export function LectureReportSubmissionHistoryModal({
  open,
  application,
  memberId,
  instructorName,
  onCancel,
}: LectureReportSubmissionHistoryModalProps) {
  const { showAlert } = useCmsAlert()
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [reportDownloadingId, setReportDownloadingId] = useState<string | null>(null)
  const [previewRow, setPreviewRow] = useState<MemberLectureReportTableRow | null>(null)
  const applicationId =
    application != null ? resolveMemberApplicationIdFromApplication(application) : undefined

  const reportsQuery = useQuery({
    queryKey: ['member-lecture-reports', memberId, applicationId],
    enabled: open && memberId != null && applicationId != null,
    queryFn: () => fetchMemberLectureReportsRemote(memberId!, applicationId!),
  })

  const rows = useMemo(
    () => mapMemberLectureReportsToTableRows(reportsQuery.data ?? []),
    [reportsQuery.data]
  )

  const programTitle = useMemo(() => {
    if (!application) return '프로그램'
    const fromApi = application.customFields?.programName
    if (typeof fromApi === 'string' && fromApi.trim()) return fromApi.trim()
    return '프로그램'
  }, [application])

  // 프로그램 상세와 같은 「강의보고서 미리보기」 — 보고서 id만 있으면 본문을 읽을 수 있다
  const previewQuery = useQuery({
    queryKey: ['member-lecture-report-preview', previewRow?.reportId],
    enabled: open && previewRow?.reportId != null && previewRow.reportId > 0,
    queryFn: () => fetchLectureReportPreviewContentByReportId(previewRow!.reportId!),
    staleTime: 60_000,
    retry: false,
  })

  useEffect(() => {
    if (previewQuery.error == null) return
    showAlert({
      title: '안내',
      content: getMemberApiErrorMessage(
        previewQuery.error,
        '강의보고서 내용을 불러오지 못했습니다.'
      ),
    })
    setPreviewRow(null)
  }, [previewQuery.error, showAlert])

  const previewContext = useMemo<LectureReportPreviewContext | null>(() => {
    if (previewRow == null || previewQuery.data == null) return null
    return buildMemberLectureReportPreviewContext({
      row: previewRow,
      rows,
      content: previewQuery.data,
      instructorName,
      programTitle,
    })
  }, [instructorName, previewQuery.data, previewRow, programTitle, rows])

  // CMS-FUNC-0412: 이 팝업(한 프로그램)의 제출 완료 보고서 본문 PDF만 일괄로 받는다.
  // 프로그램 화면 일괄 다운로드(CMS-FUNC-0244)와 같은 본문 PDF이며 첨부파일은 행별 다운로드로 받는다.
  const bulkPdfTargets = useMemo(() => filterMemberLectureReportBulkPdfRows(rows), [rows])
  const [bulkExportTargets, setBulkExportTargets] = useState<MemberLectureReportTableRow[] | null>(
    null
  )
  const canBulkDownloadFiles = hasFileDownloadPermission()

  const handleBulkDownload = useCallback(() => {
    if (bulkDownloading) return
    // 권한 설정 V1.2: 버튼은 노출하고 다운로드 권한이 없으면 접근 불가 안내
    if (!canBulkDownloadFiles) {
      showAdminAccessDeniedAlert()
      return
    }
    if (bulkPdfTargets.length === 0) {
      showAlert({ title: '안내', content: LECTURE_REPORT_NO_SUBMITTED_PDF_CTA })
      return
    }
    setBulkDownloading(true)
    setBulkExportTargets(bulkPdfTargets)
  }, [bulkDownloading, bulkPdfTargets, canBulkDownloadFiles, showAlert])

  const handleBulkExportComplete = useCallback(
    async (files: LectureReportPdfFile[], failedCount: number) => {
      setBulkExportTargets(null)
      try {
        // 일부 건이 빠진 ZIP을 저장하지 않는다(프로그램 화면 일괄 다운로드와 같은 기준).
        if (failedCount > 0) {
          showAlert({ title: '안내', content: '강의보고서 일괄 다운로드에 실패했습니다.' })
          return
        }
        if (files.length === 0) {
          showAlert({ title: '안내', content: '강의보고서 PDF를 만들지 못했습니다.' })
          return
        }
        await downloadLectureReportPdfFiles(files)
      } catch (error) {
        showAlert({
          title: '안내',
          content: getMemberApiErrorMessage(error, '강의보고서 일괄 다운로드에 실패했습니다.'),
        })
      } finally {
        setBulkDownloading(false)
      }
    },
    [showAlert]
  )

  const handleViewReport = useCallback(
    async (record: MemberLectureReportTableRow) => {
      if (!record.canViewReport) return
      if (record.reportId != null && record.reportId > 0) {
        setPreviewRow(record)
        return
      }
      setReportDownloadingId(record.id)
      try {
        const files = await resolveMemberLectureReportFiles(record)
        if (files.length === 0) {
          showAlert({ title: '안내', content: LECTURE_REPORT_NO_ATTACHMENT_CTA })
          return
        }
        const prefix = `강의보고서_${record.reportId ?? record.id}`
        for (const [index, file] of files.entries()) {
          // 업로드한 원본 파일명을 그대로 쓴다. 없을 때만 보고서 id 규칙으로 되돌아간다.
          await downloadAdminFile({
            fileObjectId: file.fileObjectId,
            fileName:
              file.originalFileName ??
              (files.length > 1 ? `${prefix}_${index + 1}` : prefix),
          })
        }
      } catch (error) {
        showAlert({
          title: '안내',
          content: getMemberApiErrorMessage(error, '강의보고서 다운로드에 실패했습니다.'),
        })
      } finally {
        setReportDownloadingId(null)
      }
    },
    [showAlert]
  )

  const columns = useMemo(
    (): ColumnsType<MemberLectureReportTableRow> => [
      {
        title: '교육 진행 일정',
        dataIndex: 'educationDateLabel',
        key: 'educationDateLabel',
        align: 'center',
        width: 300,
        render: (label: string) => renderProgramDetailPipeSeparated(label),
      },
      {
        title: '강의보고서 제출 기간',
        dataIndex: 'submissionPeriodLabel',
        key: 'submissionPeriodLabel',
        align: 'center',
        width: 300,
        render: (value: string) => value?.trim() || '-',
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgressLabel',
        key: 'lectureProgressLabel',
        align: 'center',
        width: 120,
        render: (label: MemberLectureReportTableRow['lectureProgressLabel']) => (
          <StatusBadge
            domain="custom"
            variant="text"
            label={label}
            accentColor={getLectureReportProgressAccent(label)}
          />
        ),
      },
      {
        title: '제출 현황',
        dataIndex: 'submissionStatusLabel',
        key: 'submissionStatusLabel',
        align: 'center',
        width: 120,
        render: (label: MemberLectureReportTableRow['submissionStatusLabel']) => (
          <StatusBadge
            domain="custom"
            variant="text"
            label={label}
            accentColor={getLectureReportSubmissionAccent(label)}
          />
        ),
      },
      {
        title: '강의보고서',
        key: 'report',
        align: 'center',
        width: 300,
        render: (_: unknown, record) =>
          renderReportCell(record, {
            reportDownloadingId,
            previewLoadingId: previewQuery.isFetching ? (previewRow?.id ?? null) : null,
            onViewReport: record => void handleViewReport(record),
          }),
      },
    ],
    [handleViewReport, previewQuery.isFetching, previewRow?.id, reportDownloadingId]
  )

  return (
    <>
    {bulkExportTargets != null ? (
      <MemberLectureReportBulkPdfExportRunner
        targets={bulkExportTargets}
        rows={rows}
        instructorName={instructorName}
        programTitle={programTitle}
        onComplete={(files, failedCount) => {
          void handleBulkExportComplete(files, failedCount)
        }}
      />
    ) : null}
    <LectureReportIssuancePreviewModal
      open={previewContext != null}
      context={previewContext}
      headerVariant="institution"
      onClose={() => setPreviewRow(null)}
    />
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강의보고서 제출 내역"
      size="large"
      className="lecture-report-submission-history-modal"
      description={`**[${programTitle}]** 프로그램의 강의보고서 제출 내역입니다.`}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            icon={<ButtonDownloadIcon />}
            loading={bulkDownloading}
            disabled={bulkPdfTargets.length === 0}
            onClick={handleBulkDownload}
          >
            강의보고서 일괄 다운로드
          </CmsButton>
        </>
      }
    >
      <div className="lecture-report-submission-history-modal__body">
        <FilterTableLayout
          className="lecture-report-submission-history-modal__table-layout"
          showFilter={false}
          bordered={false}
          fields={[]}
          filters={{}}
          onFilterChange={() => {}}
          onSearch={() => {}}
          title="강의보고서 제출 목록"
          description={reportsQuery.isLoading ? undefined : `총 ${rows.length}건`}
          hideExcelDownload
          contentLoading={reportsQuery.isLoading}
        >
          <div className="lecture-report-submission-history-modal__table-outer">
            <CmsDataTable<MemberLectureReportTableRow>
              className="cms-data-table"
              rowKey="id"
              dataSource={rows}
              columns={columns}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: 1140 }}
              rowClassName={record =>
                record.lectureProgressLabel === '진행 예정'
                  ? 'lecture-report-submission-history-modal__row--scheduled'
                  : ''
              }
            />
          </div>
        </FilterTableLayout>
      </div>
    </ContentModal>
    </>
  )
}
