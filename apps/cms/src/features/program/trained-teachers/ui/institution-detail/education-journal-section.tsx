import { useCallback, useMemo, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton, EmptyState, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { downloadFile } from '@/shared/lib/file-download'
import {
  formatTrainedTeachersEducationJournalScheduleLabel,
  formatTrainedTeachersEducationJournalSubmittedDate,
  type TrainedTeachersEducationJournalEntry,
} from '@/data/mock/trained-teachers-institution-detail'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  useBulkDownloadTrainedTeacherEducationJournals,
  useDownloadTrainedTeacherEducationJournal,
  useTrainedTeacherEducationJournals,
} from '@/features/program/trained-teachers/api/education-journals-hooks'
import { listTrainedTeacherEducationJournals } from '@/features/program/trained-teachers/api/education-journals-service'
import { TrainedTeachersEducationJournalViewModal } from './education-journal-view-modal'
import './education-journal-section.css'
import { useQuery } from '@tanstack/react-query'

const VIEW_CELL_CLASSNAME = 'trained-teachers-education-journal-section__view-cell'
const BULK_DOWNLOAD_GAP_MS = 400

type JournalTableRow = TrainedTeachersEducationJournalEntry & { no: number }

export type TrainedTeachersEducationJournalSectionVariant = 'default' | 'progress'

function wait(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

function renderJournalViewButton(enabled: boolean, onView: () => void) {
  return (
    <div className="trained-teachers-education-journal-section__view-cell-inner">
      <CmsButton
        type="button"
        variant="default"
        size="medium"
        width={140}
        disabled={!enabled}
        onClick={enabled ? onView : undefined}
      >
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
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)

  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi() && Boolean(programId)
  const journalsQuery = useTrainedTeacherEducationJournals(
    programId,
    institutionId,
    remoteEnabled
  )
  const localJournalsQuery = useQuery({
    queryKey: ['cms', 'programs', 'trained-teachers', 'education-journals-local', institutionId],
    queryFn: () => listTrainedTeacherEducationJournals(programId ?? '', institutionId),
    enabled: !remoteEnabled,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const downloadMutation = useDownloadTrainedTeacherEducationJournal(programId)
  const bulkDownloadMutation = useBulkDownloadTrainedTeacherEducationJournals(
    programId,
    institutionId
  )

  const entries = useMemo(
    () => (remoteEnabled ? journalsQuery.data : localJournalsQuery.data) ?? [],
    [journalsQuery.data, localJournalsQuery.data, remoteEnabled]
  )
  const isLoading = remoteEnabled ? journalsQuery.isFetching : localJournalsQuery.isFetching

  const tableData = useMemo(
    () => entries.map((entry, index) => ({ ...entry, no: entries.length - index })),
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
      downloadFile(entry.fileName, entry.fileUrl)
    },
    [downloadMutation, programId, remoteEnabled, showAlert]
  )

  const handleBulkDownload = useCallback(async () => {
    if (entries.length === 0) {
      showAlert({ title: '다운로드 안내', content: '다운로드할 교육일지가 없습니다.' })
      return
    }

    if (remoteEnabled && programId) {
      setIsBulkDownloading(true)
      try {
        await bulkDownloadMutation.mutateAsync(entries)
      } catch {
        showAlert({
          title: '일괄 다운로드 실패',
          content: '교육일지 일괄 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setIsBulkDownloading(false)
      }
      return
    }

    if (!isProgressVariant) {
      showAlert({
        title: '교육일지 일괄 다운로드',
        content: `제출된 교육일지 ${entries.length}건을 다운로드합니다. (mock)\n\n${entries.map(e => e.fileName).join('\n')}`,
      })
      return
    }

    setIsBulkDownloading(true)
    try {
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index]
        downloadFile(entry.fileName, entry.fileUrl)
        if (index < entries.length - 1) {
          await wait(BULK_DOWNLOAD_GAP_MS)
        }
      }
    } finally {
      setIsBulkDownloading(false)
    }
  }, [
    bulkDownloadMutation,
    entries,
    isProgressVariant,
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
        width: 80,
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
        width: 160,
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
            size="large"
            width={200}
            icon={<DownloadOutlined />}
            loading={isBulkDownloading || bulkDownloadMutation.isPending}
            disabled={isBulkDownloading || bulkDownloadMutation.isPending}
            onClick={() => void handleBulkDownload()}
          >
            교육일지 일괄 다운로드
          </CmsButton>
          <ExcelButton loading={isExporting} onClick={exportExcel} />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState description="제출된 교육일지가 없습니다." />
      ) : (
        <Table
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
          onClose={() => setViewerEntry(null)}
        />
      ) : null}
    </section>
  )
}
