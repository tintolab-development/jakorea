import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CMS_DATA_TABLE_CELL_H40_ACTION_CLASS } from '@/shared/constants/table'
import { CmsButton, EmptyState, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { downloadFile } from '@/shared/lib/file-download'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  formatTrainedTeachersEducationJournalScheduleLabel,
  formatTrainedTeachersEducationJournalSubmittedDate,
  type TrainedTeachersEducationJournalEntry,
} from '@/features/program/trained-teachers/model/institution-detail'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  useCreateTrainedTeacherEducationJournalZipJob,
  useDownloadTrainedTeacherEducationJournal,
  useTrainedTeacherEducationJournalZipJob,
  useTrainedTeacherEducationJournals,
} from '@/features/program/trained-teachers/api/education-journals-hooks'
import {
  educationJournalZipJobStatusLabel,
  isEducationJournalZipJobCompleted,
  isEducationJournalZipJobFailed,
} from '@/features/program/trained-teachers/api/education-journals-job'
import { downloadTrainedTeacherEducationJournalZipJob } from '@/features/program/trained-teachers/api/education-journals-service'
import { TrainedTeachersEducationJournalViewModal } from './education-journal-view-modal'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './education-journal-section.css'

const VIEW_CELL_CLASSNAME = `${CMS_DATA_TABLE_CELL_H40_ACTION_CLASS} trained-teachers-education-journal-section__view-cell`
const PROGRESS_NO_COLUMN_WIDTH = 88
const PROGRESS_SUBMITTED_DATE_COLUMN_WIDTH = 240

type JournalTableRow = TrainedTeachersEducationJournalEntry & { no: number }

export type TrainedTeachersEducationJournalSectionVariant = 'default' | 'progress'

function renderJournalViewButton(enabled: boolean, onView: () => void) {
  return (
    <div className="trained-teachers-education-journal-section__view-cell-inner">
      <CmsButton
        type="button"
        variant="default"
        size="h40"
        disabled={!enabled}
        onClick={enabled ? onView : undefined} >
        보기
      </CmsButton>
    </div>
  )
}

function renderJournalFileLink(
  entry: TrainedTeachersEducationJournalEntry,
  onDownload: (entry: TrainedTeachersEducationJournalEntry) => void
) {
  return (
    <button
      type="button"
      className="trained-teachers-education-journal-section__file-link"
      onClick={() => onDownload(entry)}
    >
      {entry.fileName}
    </button>
  )
}

export function TrainedTeachersEducationJournalSection({
  institutionId,
  institutionName,
  programId,
  variant = 'default',
}: {
  institutionId: string
  institutionName?: string
  /** remote list/download용 — 없으면 mock만 */
  programId?: string
  variant?: TrainedTeachersEducationJournalSectionVariant
}) {
  const isProgressVariant = variant === 'progress'
  const { showAlert } = useCmsAlert()
  const [viewerEntry, setViewerEntry] = useState<TrainedTeachersEducationJournalEntry | null>(null)
  const [bulkJobId, setBulkJobId] = useState<number | null>(null)
  const downloadedJobIdRef = useRef<number | null>(null)
  const handledFailureJobIdRef = useRef<number | null>(null)

  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi() && Boolean(programId)
  const journalsQuery = useTrainedTeacherEducationJournals(
    programId,
    institutionId,
    remoteEnabled
  )

  const downloadMutation = useDownloadTrainedTeacherEducationJournal(programId)
  const createZipJobMutation = useCreateTrainedTeacherEducationJournalZipJob(
    programId,
    institutionId
  )
  const zipJobQuery = useTrainedTeacherEducationJournalZipJob(programId, institutionId, bulkJobId)

  useEffect(() => {
    const job = zipJobQuery.data
    if (!job || bulkJobId == null) return
    if (isEducationJournalZipJobFailed(job)) {
      if (handledFailureJobIdRef.current === bulkJobId) return
      handledFailureJobIdRef.current = bulkJobId
      showAlert({
        title: '일괄 다운로드 실패',
        content: job.failureReason || '교육일지 ZIP 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
      setBulkJobId(null)
      return
    }
    if (!isEducationJournalZipJobCompleted(job) || downloadedJobIdRef.current === bulkJobId) return
    downloadedJobIdRef.current = bulkJobId
    void downloadTrainedTeacherEducationJournalZipJob(job, institutionId)
      .catch(() => {
        showAlert({
          title: '다운로드 실패',
          content: '교육일지 ZIP 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      })
      .finally(() => setBulkJobId(null))
  }, [bulkJobId, institutionId, showAlert, zipJobQuery.data])

  const entries = useMemo(() => journalsQuery.data ?? [], [journalsQuery.data])
  const isLoading = journalsQuery.isFetching

  const tableData = useMemo(
    () => entries.map((entry, index) => ({ ...entry, no: index + 1 })),
    [entries]
  )

  const handleDownloadEntry = useCallback(
    (entry: TrainedTeachersEducationJournalEntry) => {
      if (remoteEnabled && programId) {
        void downloadMutation.mutateAsync(entry).catch(() => {
          showAlert({
            title: '다운로드 실패',
            content: '교육일지 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          })
        })
        return
      }
      void downloadFile(entry.fileName, entry.fileUrl)
    },
    [downloadMutation, programId, remoteEnabled, showAlert]
  )

  const handleBulkDownload = useCallback(async () => {
    if (entries.length === 0) {
      showAlert({ title: '다운로드 안내', content: '다운로드할 교육일지가 없습니다.' })
      return
    }

    if (remoteEnabled && programId) {
      if (createZipJobMutation.isPending || bulkJobId != null) return
      try {
        const job = await createZipJobMutation.mutateAsync(entries)
        if (job.jobId == null || job.jobId <= 0) {
          throw new Error('교육일지 ZIP 작업 ID를 받지 못했습니다.')
        }
        downloadedJobIdRef.current = null
        handledFailureJobIdRef.current = null
        setBulkJobId(job.jobId)
      } catch {
        showAlert({
          title: '일괄 다운로드 실패',
          content: '교육일지 일괄 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
      return
    }

    showAlert({
      title: '교육일지 일괄 다운로드',
      content: `제출된 교육일지 ${entries.length}건을 다운로드합니다. (mock)\n\n${entries.map(e => e.fileName).join('\n')}`,
    })
  }, [
    bulkJobId,
    createZipJobMutation,
    entries,
    programId,
    remoteEnabled,
    showAlert,
  ])

  const defaultExcelColumns: ColumnsType<JournalTableRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      {
        title: '교육 진행 일정',
        key: 'schedule',
        render: (_: unknown, record) => formatTrainedTeachersEducationJournalScheduleLabel(record),
      },
      { title: '파일명', dataIndex: 'fileName', key: 'fileName' },
      { title: '제출 일시', dataIndex: 'submittedAt', key: 'submittedAt' },
    ],
    []
  )

  const progressExcelColumns: ColumnsType<JournalTableRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '교육일지', dataIndex: 'fileName', key: 'fileName' },
      {
        title: '제출일자',
        key: 'submittedDate',
        render: (_: unknown, record) =>
          formatTrainedTeachersEducationJournalSubmittedDate(record.submittedAt),
      },
    ],
    []
  )

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: isProgressVariant ? progressExcelColumns : defaultExcelColumns,
    data: tableData,
    filename: `${institutionName ?? '참여기관'}_교육일지`,
  })

  const defaultColumns: ColumnsType<JournalTableRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
      },
      {
        title: '교육 진행 일정',
        key: 'schedule',
        render: (_: unknown, record) =>
          renderProgramDetailPipeSeparated(
            formatTrainedTeachersEducationJournalScheduleLabel(record)
          ),
      },
      {
        title: '교육일지',
        key: 'view',
        width: 168,
        align: 'center',
        onHeaderCell: () => ({ className: VIEW_CELL_CLASSNAME }),
        onCell: () => ({ className: VIEW_CELL_CLASSNAME }),
        render: (_: unknown, record) =>
          renderJournalViewButton(true, () => setViewerEntry(record)),
      },
    ],
    []
  )

  const progressColumns: ColumnsType<JournalTableRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: PROGRESS_NO_COLUMN_WIDTH,
        align: 'center',
      },
      {
        title: '교육일지',
        key: 'fileName',
        ellipsis: true,
        render: (_: unknown, record) => renderJournalFileLink(record, handleDownloadEntry),
      },
      {
        title: '제출일자',
        key: 'submittedDate',
        width: PROGRESS_SUBMITTED_DATE_COLUMN_WIDTH,
        align: 'center',
        render: (_: unknown, record) =>
          formatTrainedTeachersEducationJournalSubmittedDate(record.submittedAt),
      },
    ],
    [handleDownloadEntry]
  )

  const columns = isProgressVariant ? progressColumns : defaultColumns
  const sectionTitle = isProgressVariant ? '교육일지 제출 현황' : '교육 일지'

  return (
    <section
      className={[
        'trained-teachers-education-journal-section',
        isProgressVariant && 'trained-teachers-education-journal-section--progress',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">{sectionTitle}</span>
          <span className="table-description">{entries.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="secondary"
            size="h40"
            icon={<ButtonDownloadIcon />} className="trained-teachers-education-journal-section__bulk-download-button"
            loading={createZipJobMutation.isPending || bulkJobId != null}
            disabled={createZipJobMutation.isPending || bulkJobId != null}
            onClick={() => void handleBulkDownload()} >
            {bulkJobId != null && zipJobQuery.data
              ? `ZIP ${educationJournalZipJobStatusLabel(zipJobQuery.data)}`
              : '교육일지 일괄 다운로드'}
          </CmsButton>
          <ExcelButton loading={isExporting} onClick={exportExcel} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
          <Spin />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState description="제출된 교육일지가 없습니다." />
      ) : (
        <CmsDataTable
          rowKey="id"
          className="cms-data-table trained-teachers-education-journal-section__table"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          tableLayout="fixed"
        />
      )}

      {!isProgressVariant ? (
        <TrainedTeachersEducationJournalViewModal
          open={viewerEntry != null}
          entry={viewerEntry}
          programId={programId}
          isDownloading={downloadMutation.isPending}
          onDownload={handleDownloadEntry}
          onClose={() => setViewerEntry(null)}
        />
      ) : null}
    </section>
  )
}
