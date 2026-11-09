import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tooltip } from 'antd'
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
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { downloadAllMemberLectureReportsRemote } from '@/features/user/api/members-api-client'
import {
  LECTURE_REPORT_NO_ATTACHMENT_CTA,
  hasFileDownloadPermission,
  saveLectureReportBulkDownloadJob,
} from '@/shared/lib/lecture-report-bulk-download'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './lecture-report-submission-history-modal.css'
import { StatusBadge } from '@/shared/components'
import {
  getLectureReportProgressAccent,
  getLectureReportSubmissionAccent,
} from '@/features/program/shared/lib/lecture-report-status-presentation'
import { showAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'

interface LectureReportSubmissionHistoryModalProps {
  open: boolean
  application: Application | null
  memberId?: number
  onCancel: () => void
}

function renderReportCell(
  record: MemberLectureReportTableRow,
  options: {
    reportDownloadingId: string | null
    onViewReport: (record: MemberLectureReportTableRow) => void
  }
) {
  if (record.lectureProgressLabel === '진행 예정' || !record.canViewReport) {
    return '-'
  }

  return (
    <AssignmentSubmissionCellActionButton
      loading={options.reportDownloadingId === record.id}
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
  onCancel,
}: LectureReportSubmissionHistoryModalProps) {
  const { showAlert } = useCmsAlert()
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [reportDownloadingId, setReportDownloadingId] = useState<string | null>(null)
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

  const hasZipTargets = rows.some(row => (row.reportFileIds?.length ?? 0) > 0)
  const canBulkDownloadFiles = hasFileDownloadPermission()

  const handleBulkDownload = useCallback(async () => {
    if (memberId == null) return
    // 권한 설정 V1.2: 버튼은 노출하고 다운로드 권한이 없으면 접근 불가 안내
    if (!canBulkDownloadFiles) {
      showAdminAccessDeniedAlert()
      return
    }
    if (!hasZipTargets) {
      showAlert({ title: '안내', content: LECTURE_REPORT_NO_ATTACHMENT_CTA })
      return
    }
    setBulkDownloading(true)
    try {
      const job = await downloadAllMemberLectureReportsRemote(memberId)
      await saveLectureReportBulkDownloadJob(job, '강의보고서_일괄')
    } catch (error) {
      showAlert({
        title: '안내',
        content: getMemberApiErrorMessage(error, '강의보고서 일괄 다운로드에 실패했습니다.'),
      })
    } finally {
      setBulkDownloading(false)
    }
  }, [memberId, canBulkDownloadFiles, hasZipTargets, showAlert])

  const handleViewReport = useCallback(
    async (record: MemberLectureReportTableRow) => {
      const fileObjectIds = record.reportFileIds ?? []
      if (!record.canViewReport || fileObjectIds.length === 0) return
      setReportDownloadingId(record.id)
      try {
        // 서버 reportFileIds = file_object id → 파일 객체 다운로드 API(`/api/admin/files/{id}/download`)
        const prefix = `강의보고서_${record.reportId ?? record.id}`
        for (const [index, fileObjectId] of fileObjectIds.entries()) {
          await downloadAdminFile({
            fileObjectId,
            fileName: fileObjectIds.length > 1 ? `${prefix}_${index + 1}` : prefix,
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
            onViewReport: record => void handleViewReport(record),
          }),
      },
    ],
    [handleViewReport, reportDownloadingId]
  )

  return (
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
          <Tooltip title={!hasZipTargets ? LECTURE_REPORT_NO_ATTACHMENT_CTA : undefined}>
              <span>
                <CmsButton
                  variant="primary"
                  size="medium"
                  icon={<ButtonDownloadIcon />}
                  loading={bulkDownloading}
                  disabled={memberId == null || !hasZipTargets}
                  onClick={() => void handleBulkDownload()}
                >
                  강의보고서 일괄 다운로드
                </CmsButton>
              </span>
            </Tooltip>
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
  )
}
