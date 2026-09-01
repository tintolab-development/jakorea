import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { isDataManagementListLoading } from '@/features/data-management/lib/is-list-query-loading'
import { useDetailedProgramListQuery } from '@/features/detailed-program/hooks/use-detailed-program-list-query'
import { useDetailedProgramMutations } from '@/features/detailed-program/hooks/use-detailed-program-mutations'
import { detailedProgramManagementFilterFields } from '@/features/detailed-program/model/detailed-program-management-filter-fields'
import { detailedProgramManagementTablePageConfig } from '@/features/detailed-program/model/detailed-program-management-table.config'
import type {
  DetailedProgramDraft,
  DetailedProgramManagementRow,
} from '@/features/detailed-program/model/detailed-program-management.types'
import { DetailedProgramAddItemModal } from '@/features/detailed-program/ui/detailed-program-add-item-modal'
import type { DetailedProgramAddItemValues } from '@/features/detailed-program/ui/detailed-program-add-item-modal'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  buildDomainEntityDeleteMessageLines,
  CmsButton,
  CmsInput,
  CmsSelect,
  ContentModal,
  DeleteGuideModal,
} from '@/shared/ui'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const USAGE_SELECT_OPTIONS = [
  { label: '사용', value: 'true' },
  { label: '미사용', value: 'false' },
] as const

/** Ant Radio `value`가 DOM/이벤트에서 문자열로 올 수 있어 저장·표시 전에 정규화 */
function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
}

export default function DetailedProgramPage() {
  const canWrite = canPerformWriteAction(useAuthStore(s => s.user))
  const [searchParams, setSearchParams] = useSearchParams()

  const dpUseParam = searchParams.get('dp_use')
  useEffect(() => {
    if (dpUseParam === 'active' || dpUseParam === 'inactive') return
    setSearchParams(
      prev => {
        if (prev.get('dp_use') === 'active' || prev.get('dp_use') === 'inactive') return prev
        const next = new URLSearchParams(prev)
        next.set('dp_use', 'active')
        return next
      },
      { replace: true }
    )
  }, [dpUseParam, setSearchParams])

  const listQuery = useDetailedProgramListQuery(searchParams, true)
  const isInitialListLoading = isDataManagementListLoading(listQuery)
  const isListFetching = listQuery.isFetching
  const { createMutation, updateMutation, deleteMutation } = useDetailedProgramMutations()
  const rows = listQuery.data ?? []
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  /** 저장 전까지 목록에서만 숨김(편집 모드 삭제 스테이징) */
  const [stagedDeleteIds, setStagedDeleteIds] = useState<string[]>([])
  /** 키 입력마다 setState 하지 않고 ref만 갱신해 테이블 전체 리렌더를 피한다 */
  const draftByIdRef = useRef<Record<string, DetailedProgramDraft>>({})
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [addItemModalKey, setAddItemModalKey] = useState(0)
  const [viewDeleteModalOpen, setViewDeleteModalOpen] = useState(false)
  const [viewDeleteModalLines, setViewDeleteModalLines] = useState<string[]>([])
  const viewDeletePendingIdsRef = useRef<string[]>([])
  const [deleteBlockedModalOpen, setDeleteBlockedModalOpen] = useState(false)
  const [deleteBlockedSelectedCount, setDeleteBlockedSelectedCount] = useState(1)

  const { pendingFilters, applySearch, handleFilterChange, displayedCount, tableData } =
    useTablePage(detailedProgramManagementTablePageConfig, {
      data: rows,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    })

  const handleSearch = useCallback(() => {
    if (isEditMode) {
      return
    }
    applySearch()
  }, [applySearch, isEditMode])

  const enterEditMode = useCallback(() => {
    setStagedDeleteIds([])
    const next: Record<string, DetailedProgramDraft> = {}
    for (const row of tableData) {
      next[row.id] = { name: row.name, active: row.active }
    }
    draftByIdRef.current = next
    setIsEditMode(true)
  }, [tableData])

  const exitEditMode = useCallback(() => {
    draftByIdRef.current = {}
    setIsEditMode(false)
    setStagedDeleteIds([])
  }, [])

  const handleSave = useCallback(async () => {
    const drafts = draftByIdRef.current
    const staged = new Set(stagedDeleteIds)
    const emptyNameId = Object.entries(drafts).find(([id, d]) => !staged.has(id) && !d.name.trim())
    if (emptyNameId) {
      return
    }

    try {
      if (staged.size > 0) {
        await deleteMutation.mutateAsync(Array.from(staged))
      }
      const updates = rows
        .filter(row => !staged.has(row.id))
        .map(row => {
          const d = drafts[row.id]
          if (!d) return null
          const nextName = d.name.trim()
          const nextActive = coerceRadioBoolean(d.active)
          if (row.name === nextName && row.active === nextActive) return null
          return { id: row.id, input: { name: nextName, active: nextActive } }
        })
        .filter((u): u is { id: string; input: { name: string; active: boolean } } => u != null)

      if (updates.length > 0) {
        await Promise.all(updates.map(u => updateMutation.mutateAsync(u)))
      }
      exitEditMode()
      setSelectedRowKeys([])
    } catch (error) {
      const axiosErr = error as { response?: { status?: number } }
      if (axiosErr.response?.status === 409) {
        setDeleteBlockedSelectedCount(staged.size || 1)
        setDeleteBlockedModalOpen(true)
        return
      }
      console.debug(
        'detailedProgramPage save failed',
        getDataManagementApiErrorMessage(error, '저장에 실패했습니다.')
      )
    }
  }, [deleteMutation, exitEditMode, rows, stagedDeleteIds, updateMutation])

  const handleBulkDelete = useCallback(() => {
    if (!canWrite || selectedRowKeys.length === 0) return

    const selectedIds = selectedRowKeys.map(String)
    const selectedRows = rows.filter(r => selectedIds.includes(r.id))

    if (isEditMode) {
      const idsToStage = selectedRows.map(r => r.id)
      setStagedDeleteIds(prev => [...new Set([...prev, ...idsToStage])])
      for (const id of idsToStage) {
        delete draftByIdRef.current[id]
      }
      setSelectedRowKeys([])
      return
    }

    const baseLines = buildDomainEntityDeleteMessageLines(
      selectedRows.map(r => r.name),
      '세부 프로그램'
    )

    viewDeletePendingIdsRef.current = selectedRows.map(r => r.id)
    setViewDeleteModalLines(baseLines)
    setViewDeleteModalOpen(true)
  }, [canWrite, isEditMode, rows, selectedRowKeys])

  const handleAddClick = useCallback(() => {
    if (!canWrite) return
    setAddItemModalKey(k => k + 1)
    setAddItemModalOpen(true)
  }, [canWrite])

  const handleAddItemSubmit = useCallback(
    async (values: DetailedProgramAddItemValues) => {
      if (!canWrite) return
      try {
        await createMutation.mutateAsync({ name: values.name, active: values.active })
        setAddItemModalOpen(false)
      } catch (error) {
        console.debug(
          'detailedProgramPage create failed',
          getDataManagementApiErrorMessage(error, '등록에 실패했습니다.')
        )
      }
    },
    [canWrite, createMutation]
  )

  const updateDraft = useCallback((id: string, patch: Partial<DetailedProgramDraft>) => {
    const cur = draftByIdRef.current[id]
    if (!cur) return
    const nextPatch = { ...patch }
    if ('active' in nextPatch && nextPatch.active !== undefined) {
      nextPatch.active = coerceRadioBoolean(nextPatch.active)
    }
    draftByIdRef.current = { ...draftByIdRef.current, [id]: { ...cur, ...nextPatch } }
  }, [])

  const stagedDeleteSet = useMemo(() => new Set(stagedDeleteIds), [stagedDeleteIds])

  /** 편집 중: 스테이징 삭제 제외. 뷰 모드: 서버 필터 결과. draft는 ref만 갱신 */
  const tableDisplayData = useMemo((): DetailedProgramManagementRow[] => {
    if (!isEditMode) return tableData
    return tableData.filter(row => !stagedDeleteSet.has(row.id))
  }, [isEditMode, stagedDeleteSet, tableData])

  const columns: ColumnsType<DetailedProgramManagementRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_: unknown, __: DetailedProgramManagementRow, index: number) =>
          tableDisplayData.length - index,
      },
      {
        title: '사용 여부',
        key: 'active',
        width: 200,
        align: 'center',
        render: (_: unknown, row: DetailedProgramManagementRow) => {
          if (!isEditMode) {
            return row.active ? '사용' : '미사용'
          }
          return (
            <CmsSelect
              key={`active-${row.id}`}
              inputSize="medium"
              width="100%"
              defaultValue={row.active ? 'true' : 'false'}
              onChange={v => updateDraft(row.id, { active: v === 'true' })}
              options={[...USAGE_SELECT_OPTIONS]}
            />
          )
        },
      },
      {
        title: '세부 프로그램명',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        render: (_: unknown, row: DetailedProgramManagementRow) => {
          if (!isEditMode) {
            return row.name
          }
          return (
            <CmsInput
              key={`name-${row.id}`}
              inputSize="medium"
              width="100%"
              defaultValue={row.name}
              onChange={e => updateDraft(row.id, { name: e.target.value })}
              placeholder="세부 프로그램명"
              maxLength={200}
            />
          )
        },
      },
      {
        title: '등록자',
        dataIndex: 'createdBy',
        key: 'createdBy',
        width: TABLE_COLUMN_WIDTHS.name,
        ellipsis: true,
      },
      {
        title: '등록일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (v: string | undefined) =>
          v ? (
            dayjs(v).format('YYYY.MM.DD HH:mm')
          ) : (
            <span style={{ color: 'var(--color-text-tertiary, #8c8c8c)' }}>-</span>
          ),
      },
    ],
    [isEditMode, tableDisplayData.length, updateDraft]
  )

  return (
    <div className="detailed-program-page">
      <FilterTableLayout
        bordered={false}
        fields={detailedProgramManagementFilterFields}
        filters={{
          programName: pendingFilters.programName,
          usageStatus: pendingFilters.usageStatus,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="세부 프로그램 목록"
        description={`총 ${(isEditMode ? tableDisplayData.length : displayedCount).toLocaleString()}건`}
        contentLoading={isInitialListLoading}
        actions={
          <>
            <CmsButton
              variant="delete"
              onClick={handleBulkDelete}
              disabled={selectedRowKeys.length === 0}
            >
              항목 삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              onClick={isEditMode ? handleSave : enterEditMode}
            >
              {isEditMode ? '수정 완료' : '정보 수정'}
            </CmsButton>
            <CmsButton
              variant="primary"
              onClick={handleAddClick}
              disabled={isEditMode}
            >
              신규 등록
            </CmsButton>
          </>
        }
        excelExport={{
          columns,
          data: tableDisplayData,
        }}
      >
        <Table<DetailedProgramManagementRow>
          rowKey="id"
          className="cms-data-table"
          columns={columns}
          dataSource={tableDisplayData}
          loading={isListFetching && !isInitialListLoading}
          pagination={false}
          rowSelection={
            canWrite
              ? {
                  columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                  preserveSelectedRowKeys: false,
                }
              : undefined
          }
        />
      </FilterTableLayout>

      <DetailedProgramAddItemModal
        key={addItemModalKey}
        open={addItemModalOpen}
        onCancel={() => setAddItemModalOpen(false)}
        onSubmit={handleAddItemSubmit}
      />

      <ContentModal
        open={deleteBlockedModalOpen}
        onCancel={() => setDeleteBlockedModalOpen(false)}
        title="세부 프로그램 삭제 불가 안내"
        width={600}
        description={
          deleteBlockedSelectedCount <= 1
            ? '해당 세부 프로그램은 실적 관리에서 사용 중입니다.\n사용 중인 세부 프로그램은 삭제할 수 없습니다.'
            : `선택한 **${deleteBlockedSelectedCount}**개의 세부 프로그램 중 실적 관리에서 사용 중인 항목이 있습니다.\n사용 중인 세부 프로그램은 삭제할 수 없습니다.`
        }
        footer={
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={() => setDeleteBlockedModalOpen(false)}
          >
            확인
          </CmsButton>
        }
      >
        {null}
      </ContentModal>

      <DeleteGuideModal
        open={viewDeleteModalOpen}
        title="세부 프로그램 삭제"
        lines={viewDeleteModalLines}
        confirmText="삭제"
        confirmVariant="delete"
        requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
        confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
        onCancel={() => setViewDeleteModalOpen(false)}
        onConfirm={async () => {
          const ids = [...viewDeletePendingIdsRef.current]
          try {
            await deleteMutation.mutateAsync(ids)
            setSelectedRowKeys([])
            setViewDeleteModalOpen(false)
            setViewDeleteModalLines([])
            viewDeletePendingIdsRef.current = []
          } catch (error) {
            const axiosErr = error as { response?: { status?: number } }
            if (axiosErr.response?.status === 409) {
              setViewDeleteModalOpen(false)
              setDeleteBlockedSelectedCount(ids.length)
              setDeleteBlockedModalOpen(true)
              return
            }
            console.debug(
              'detailedProgramPage delete failed',
              getDataManagementApiErrorMessage(error, '삭제에 실패했습니다.')
            )
          }
        }}
      />
    </div>
  )
}
