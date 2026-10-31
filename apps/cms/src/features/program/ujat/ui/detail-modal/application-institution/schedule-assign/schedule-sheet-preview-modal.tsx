import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Spin } from 'antd'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  buildScheduleIdByIsoDateMap,
  fetchProgramSchedulesLoose,
  fetchUjatOrganizationScheduleAssignments,
} from '@/features/program/ujat/api/temporary-schedule-api'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { ExcelButton, useCmsAlert } from '@/shared/ui'
import { CrossTable } from '@/shared/ui/cross-table'
import type { CrossTableColumnHeader, CrossTableRow } from '@/shared/ui/cross-table'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import { collectPreferredEducationIsoDates } from '../education-schedule'
import {
  buildScheduleSheetPreview,
  buildScheduleSheetPreviewFromAssignments,
  groupScheduleSheetPreviewColumnsByDate,
  hasDraftScheduleSheetAssignments,
  mergeScheduleSheetPreviewRegions,
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
  const dateGroups = groupScheduleSheetPreviewColumnsByDate(region.columns)
  const columnHeaders: CrossTableColumnHeader[] = dateGroups.map(group => ({
    content: group.dateTitle,
    colSpan: group.columns.length,
  }))

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

  const applicationsQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.organizationApplications(programId ?? '', {}),
    queryFn: ({ pageParam }) =>
      listUjatInstitutionApplicationsPage(String(programId), pageParam, {}),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled && open,
    staleTime: 30_000,
    retry: false,
  })

  const fetchNextPage = applicationsQuery.fetchNextPage
  const hasNextPage = applicationsQuery.hasNextPage
  const isFetchingNextPage = applicationsQuery.isFetchingNextPage

  useEffect(() => {
    if (!remoteEnabled || !open || !hasNextPage || isFetchingNextPage) return
    void fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, open, remoteEnabled])

  const assignmentsQuery = useQuery({
    queryKey: [...ujatQueryKeys.organizationScheduleAssignments(programId ?? ''), refreshKey],
    queryFn: () => fetchUjatOrganizationScheduleAssignments(String(programId)),
    enabled: remoteEnabled && open && Boolean(programId),
    staleTime: 15_000,
    retry: false,
  })

  const schedulesQuery = useQuery({
    queryKey: [...ujatQueryKeys.programSchedules(programId ?? ''), 'sheet-preview', refreshKey],
    queryFn: () => fetchProgramSchedulesLoose(String(programId)),
    enabled: remoteEnabled && open && Boolean(programId),
    staleTime: 60_000,
    retry: false,
  })

  const applicationRows = useMemo(
    () => applicationsQuery.data?.pages.flatMap(page => page.rows) ?? [],
    [applicationsQuery.data]
  )

  const preferredScheduleIdByIso = useMemo(() => {
    const ids: Record<string, number> = {}
    for (const row of applicationRows) {
      Object.assign(ids, row.preferredScheduleIdByIso)
    }
    return ids
  }, [applicationRows])

  const scheduleIdByIsoDate = useMemo(
    () =>
      buildScheduleIdByIsoDateMap(
        schedulesQuery.data ?? [],
        collectPreferredEducationIsoDates(applicationRows),
        preferredScheduleIdByIso
      ),
    [applicationRows, preferredScheduleIdByIso, schedulesQuery.data]
  )

  const regions = useMemo(() => {
    void refreshKey
    const fromLocal = buildScheduleSheetPreview(applicationRows)
    if (!remoteEnabled) return fromLocal
    const fromApi = buildScheduleSheetPreviewFromAssignments({
      slots: assignmentsQuery.data?.content ?? [],
      applicationRows,
      scheduleIdByIsoDate,
    })
    // hydrate가 로컬 saved에 넣은 지역·API 누락 지역을 보완
    return mergeScheduleSheetPreviewRegions(fromApi, fromLocal)
  }, [
    applicationRows,
    assignmentsQuery.data,
    refreshKey,
    remoteEnabled,
    scheduleIdByIsoDate,
  ])

  const [exporting, setExporting] = useState(false)

  const remoteLoading =
    remoteEnabled &&
    open &&
    (assignmentsQuery.isLoading ||
      schedulesQuery.isLoading ||
      applicationsQuery.isPending ||
      Boolean(hasNextPage) ||
      isFetchingNextPage)

  const remoteError = remoteEnabled
    ? assignmentsQuery.error ?? schedulesQuery.error ?? applicationsQuery.error
    : null

  const emptyMessage = hasDraftScheduleSheetAssignments()
    ? '화면에 작성 중인 임시 배정이 있습니다. 임시 배정 저장 후 다시 확인해 주세요.'
    : '배정된 지역이 없습니다. 임시 배정을 저장한 뒤 다시 확인해 주세요.'

  useEffect(() => {
    if (!open || !remoteError) return
    showAlert({
      title: '안내',
      content: readApiErrorAlertMessage(
        remoteError,
        '임시 교육 일정표를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
      ),
    })
  }, [open, remoteError, showAlert])

  const handleExcelDownload = useCallback(async () => {
    if (exporting || remoteLoading) return
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
  }, [exporting, regions, remoteLoading, showAlert])

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
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            닫기
          </CmsButton>
          <ExcelButton
            size="large"
            disabled={exporting || remoteLoading}
            loading={exporting}
            className="cms-button--footer-auto cms-button--no-label-ellipsis ujat-schedule-sheet-preview-modal__excel-btn"
            onClick={() => void handleExcelDownload()}
          />
        </>
      }
    >
      <div className="ujat-schedule-sheet-preview-modal__body">
        {remoteLoading ? (
          <div className="ujat-schedule-sheet-preview-modal__loading" role="status">
            <Spin size="large" />
          </div>
        ) : regions.length === 0 ? (
          <p className="ujat-schedule-sheet-preview-modal__empty">{emptyMessage}</p>
        ) : (
          regions.map(region => (
            <section key={region.regionKey} className="ujat-schedule-sheet-preview-modal__region">
              <span className="info-section-title">{region.regionLabel}</span>
              <RegionScheduleSheetTable region={region} />
            </section>
          ))
        )}
      </div>
    </ContentModal>
  )
}
