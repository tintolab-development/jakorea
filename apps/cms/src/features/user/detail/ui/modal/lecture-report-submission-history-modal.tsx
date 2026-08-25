import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  bulkDownloadMemberLectureReportsRemote,
  fetchMemberLectureReportsRemote,
} from '@/features/user/api/member-program-history-api-client'
import { mapMemberLectureReportsToTableRows } from '@/features/user/api/map-member-lecture-reports'
import type { MemberLectureReportTableRow } from '@/features/user/api/map-member-lecture-reports'
import { resolveMemberApplicationIdFromApplication } from '@/features/user/api/member-program-history-ids'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import './lecture-report-submission-history-modal.css'

interface LectureReportSubmissionHistoryModalProps {
  open: boolean
  application: Application | null
  memberId?: number
  onCancel: () => void
}

function lectureProgressClass(label: MemberLectureReportTableRow['lectureProgressLabel']): string {
  if (label === '진행 완료') return 'lecture-report-submission-history-modal__status-text'
  return 'lecture-report-submission-history-modal__status-text lecture-report-submission-history-modal__status-text--scheduled'
}

function submissionStatusClass(label: MemberLectureReportTableRow['submissionStatusLabel']): string {
  if (label === '미제출') {
    return 'lecture-report-submission-history-modal__status-text lecture-report-submission-history-modal__status-text--undone'
  }
  if (label === '진행 예정') {
    return 'lecture-report-submission-history-modal__status-text lecture-report-submission-history-modal__status-text--scheduled'
  }
  return 'lecture-report-submission-history-modal__status-text'
}

export function LectureReportSubmissionHistoryModal({
  open,
  application,
  memberId,
  onCancel,
}: LectureReportSubmissionHistoryModalProps) {
  const { showAlert } = useCmsAlert()
  const [bulkDownloading, setBulkDownloading] = useState(false)
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

  const handleBulkDownload = useCallback(async () => {
    if (memberId == null || applicationId == null) return
    setBulkDownloading(true)
    try {
      const reportIds = rows
        .map(row => row.reportId)
        .filter((id): id is number => id != null)
      const response = await bulkDownloadMemberLectureReportsRemote(memberId, applicationId, {
        reportIds: reportIds.length > 0 ? reportIds : undefined,
      })
      if (response.downloadEndpoint) {
        await downloadFromBulkEndpoint(response.downloadEndpoint, '강의보고서_일괄')
      }
    } catch (error) {
      showAlert({
        title: '안내',
        content: getMemberApiErrorMessage(error, '강의보고서 일괄 다운로드에 실패했습니다.'),
      })
    } finally {
      setBulkDownloading(false)
    }
  }, [memberId, applicationId, rows, showAlert])

  const columns = useMemo(
    (): ColumnsType<MemberLectureReportTableRow> => [
      {
        title: '교육 진행 일자 및 교육 차시',
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
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgressLabel',
        key: 'lectureProgressLabel',
        align: 'center',
        width: 120,
        render: (label: MemberLectureReportTableRow['lectureProgressLabel']) => (
          <span className={lectureProgressClass(label)}>{label}</span>
        ),
      },
      {
        title: '제출 현황',
        dataIndex: 'submissionStatusLabel',
        key: 'submissionStatusLabel',
        align: 'center',
        width: 120,
        render: (label: MemberLectureReportTableRow['submissionStatusLabel']) => (
          <span className={submissionStatusClass(label)}>{label}</span>
        ),
      },
      {
        title: '강의보고서',
        key: 'report',
        align: 'center',
        width: 140,
        render: (_: unknown, record: MemberLectureReportTableRow) => (
          <CmsButton variant="default" size="large" disabled={!record.canViewReport}>
            강의보고서 보기
          </CmsButton>
        ),
      },
    ],
    []
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
          <CmsButton variant="secondary" size="large" width={160} onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            style={{ minWidth: 180 }}
            icon={<DownloadOutlined />}
            loading={bulkDownloading}
            disabled={memberId == null || applicationId == null}
            onClick={() => void handleBulkDownload()}
          >
            강의보고서 일괄 다운로드
          </CmsButton>
        </>
      }
    >
      <div className="lecture-report-submission-history-modal__body">
        {reportsQuery.isLoading ? (
          <div className="lecture-report-submission-history-modal__loading">로딩 중...</div>
        ) : (
          <>
            <div className="lecture-report-submission-history-modal__list-head">
              <span className="lecture-report-submission-history-modal__list-title">
                강의보고서 제출 목록
              </span>
              <span className="lecture-report-submission-history-modal__list-count">
                {rows.length}건
              </span>
            </div>
            <Table<MemberLectureReportTableRow>
              className="cms-data-table cms-data-table--fluid"
              rowKey="id"
              dataSource={rows}
              columns={columns}
              pagination={false}
            />
          </>
        )}
      </div>
    </ContentModal>
  )
}
