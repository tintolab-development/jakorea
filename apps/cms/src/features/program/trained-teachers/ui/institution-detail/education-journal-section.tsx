import { useMemo, useState } from 'react'
import { Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import {
  formatTrainedTeachersEducationJournalScheduleLabel,
  getTrainedTeachersEducationJournals,
  type TrainedTeachersEducationJournalEntry,
} from '@/data/mock/trained-teachers-institution-detail'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { TrainedTeachersEducationJournalViewModal } from './education-journal-view-modal'
import './education-journal-section.css'

const VIEW_CELL_CLASSNAME = 'trained-teachers-education-journal-section__view-cell'

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

export function TrainedTeachersEducationJournalSection({
  institutionId,
  institutionName,
}: {
  institutionId: string
  institutionName?: string
}) {
  const { showAlert } = useCmsAlert()
  const [viewerEntry, setViewerEntry] = useState<TrainedTeachersEducationJournalEntry | null>(null)

  const entries = useMemo(
    () => getTrainedTeachersEducationJournals(institutionId),
    [institutionId]
  )

  const tableData = useMemo(
    () => entries.map((entry, index) => ({ ...entry, no: entries.length - index })),
    [entries]
  )

  const excelColumns: ColumnsType<(typeof tableData)[number]> = useMemo(
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

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: excelColumns,
    data: tableData,
    filename: `${institutionName ?? '참여기관'}_교육일지`,
  })

  const handleBulkDownload = () => {
    if (entries.length === 0) {
      showAlert({ title: '다운로드 안내', content: '다운로드할 교육일지가 없습니다.' })
      return
    }
    showAlert({
      title: '교육일지 일괄 다운로드',
      content: `제출된 교육일지 ${entries.length}건을 다운로드합니다. (mock)\n\n${entries.map(e => e.fileName).join('\n')}`,
    })
  }

  const columns: ColumnsType<(typeof tableData)[number]> = useMemo(
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

  return (
    <section className="trained-teachers-education-journal-section">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">교육 일지</span>
          <span className="table-description">{entries.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton variant="secondary" size="large" width={200} onClick={handleBulkDownload}>
            교육일지 일괄 다운로드
          </CmsButton>
          <ExcelButton loading={isExporting} onClick={exportExcel} />
        </div>
      </div>

      {entries.length === 0 ? (
        <Empty description="제출된 교육일지가 없습니다." />
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

      <TrainedTeachersEducationJournalViewModal
        open={viewerEntry != null}
        entry={viewerEntry}
        onClose={() => setViewerEntry(null)}
      />
    </section>
  )
}
