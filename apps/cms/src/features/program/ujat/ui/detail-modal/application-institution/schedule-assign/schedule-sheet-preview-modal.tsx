import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { ExcelButton, useCmsAlert } from '@/shared/ui'
import { CrossTable } from '@/shared/ui/cross-table'
import type { CrossTableRow } from '@/shared/ui/cross-table'
import {
  buildScheduleSheetPreview,
  type ScheduleSheetPreviewColumn,
  type ScheduleSheetPreviewRegion,
} from './build-schedule-sheet-preview'
import './schedule-sheet-preview-modal.css'

const ROW_LABELS = ['기관명', '배정 학급', '총 학급 수'] as const

function renderGradeClassCell(column: ScheduleSheetPreviewColumn) {
  if (column.gradeClassLines.length === 0) {
    return '-'
  }
  return (
    <ul className="ujat-schedule-sheet-preview-modal__grade-list">
      {column.gradeClassLines.map(line => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}

function regionToCrossTableRows(columns: ScheduleSheetPreviewColumn[]): CrossTableRow[] {
  return [
    {
      id: 'institution',
      rowHeader: ROW_LABELS[0],
      cells: columns.map(column => column.institutionName),
    },
    {
      id: 'grades',
      rowHeader: ROW_LABELS[1],
      cells: columns.map(column => renderGradeClassCell(column)),
    },
    {
      id: 'total',
      rowHeader: ROW_LABELS[2],
      cells: columns.map(column => (column.totalClassCount > 0 ? column.totalClassCount : '-')),
    },
  ]
}

function RegionScheduleSheetTable({ region }: { region: ScheduleSheetPreviewRegion }) {
  const columnHeaders = region.columns.map((column, index) => (
    <span key={`${column.isoDate}-${column.institutionName}-${index}`}>{column.dateTitle}</span>
  ))

  return (
    <div className="ujat-schedule-sheet-preview-modal__table-wrap">
      <CrossTable
        className="ujat-schedule-sheet-preview-modal__cross-table"
        aria-label={`${region.regionLabel} 임시 교육 일정표`}
        corner="배정 기관 / 날짜"
        columnHeaders={columnHeaders}
        rows={regionToCrossTableRows(region.columns)}
        style={{ '--cross-table-label-w': '140px' } as CSSProperties}
      />
    </div>
  )
}

export function UjatInstitutionScheduleSheetPreviewModal({
  open,
  onCancel,
  refreshKey,
  programId,
}: {
  open: boolean
  onCancel: () => void
  refreshKey: number
  programId?: string | null
}) {
  const { showAlert } = useCmsAlert()
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const remoteQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.organizationApplications(programId ?? '', {}),
    queryFn: ({ pageParam }) =>
      listUjatInstitutionApplicationsPage(String(programId), pageParam, {}),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled && open,
    staleTime: 30_000,
    retry: false,
  })

  const regions = useMemo(() => {
    void refreshKey
    const rows = remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
    return buildScheduleSheetPreview(rows)
  }, [refreshKey, remoteQuery.data])

  const [exporting, setExporting] = useState(false)

  const handleExcelDownload = useCallback(async () => {
    if (exporting) return
    try {
      setExporting(true)
      const { exportScheduleSheetExcel } = await import('./export-schedule-sheet-excel')
      await exportScheduleSheetExcel(regions)
    } catch {
      showAlert({
        title: '엑셀 다운로드',
        content: '엑셀 파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setExporting(false)
    }
  }, [exporting, regions, showAlert])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="임시 교육 일정표 확인 미리보기"
      width={1400}
      size="large"
      className="ujat-schedule-sheet-preview-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="medium" onClick={onCancel}>
            닫기
          </CmsButton>
          <ExcelButton
            disabled={exporting}
            onClick={() => void handleExcelDownload()} />
        </>
      }
    >
      <div className="ujat-schedule-sheet-preview-modal__body">
        {regions.map(region => (
          <section key={region.regionKey} className="ujat-schedule-sheet-preview-modal__region">
            <span className="info-section-title">{region.regionLabel}</span>
            <RegionScheduleSheetTable region={region} />
          </section>
        ))}
      </div>
    </ContentModal>
  )
}
