import { useCallback, useMemo, useRef, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { mockDetailedProgramManagementListRows } from '@/data/mock/detailed-program-management-list'
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
import '@/features/program/ui/program-list.css'

function nextDetailedProgramId(rows: DetailedProgramManagementRow[]): string {
  let max = 0
  for (const r of rows) {
    const m = /^dp-(\d+)$/.exec(r.id)
    if (m) {
      const n = Number(m[1])
      if (!Number.isNaN(n) && n > max) max = n
    }
  }
  return `dp-${max + 1}`
}

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
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [searchParams, setSearchParams] = useSearchParams()

  const [rows, setRows] = useState<DetailedProgramManagementRow[]>(() =>
    mockDetailedProgramManagementListRows.map(r => ({ ...r }))
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [draftById, setDraftById] = useState<Record<string, DetailedProgramDraft>>({})
  /** 저장 전까지 목록에서만 숨김(편집 모드 삭제 스테이징) */
  const [stagedDeleteIds, setStagedDeleteIds] = useState<string[]>([])
  /** 저장 클릭 시점에 클로저의 `draftById`보다 최신 입력을 쓰기 위해 동기 갱신 */
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
    setDraftById(next)
    setIsEditMode(true)
  }, [tableData])

  const exitEditMode = useCallback(() => {
    draftByIdRef.current = {}
    setIsEditMode(false)
    setDraftById({})
    setStagedDeleteIds([])
  }, [])

  const handleSave = useCallback(() => {
    const drafts = draftByIdRef.current
    const staged = new Set(stagedDeleteIds)
    const emptyNameId = Object.entries(drafts).find(([id, d]) => !staged.has(id) && !d.name.trim())
    if (emptyNameId) {
      return
    }

    setRows(prev => {
      const surviving = prev.filter(row => !staged.has(row.id))
      return surviving.map(row => {
        const d = drafts[row.id]
        if (!d) return row
        return {
          ...row,
          name: d.name.trim(),
          active: coerceRadioBoolean(d.active),
        }
      })
    })
    exitEditMode()
    setSelectedRowKeys([])
  }, [exitEditMode, stagedDeleteIds])

  const handleBulkDelete = useCallback(() => {
    if (!canWrite || selectedRowKeys.length === 0) return

    const selectedIds = selectedRowKeys.map(String)
    const selectedRows = rows.filter(r => selectedIds.includes(r.id))

    if (isEditMode) {
      const blockedEdit = selectedRows.filter(r => r.inUse)
      if (blockedEdit.length > 0) {
        setDeleteBlockedSelectedCount(selectedRows.length)
        setDeleteBlockedModalOpen(true)
        return
      }

      const idsToStage = selectedRows.map(r => r.id)
      setStagedDeleteIds(prev => [...new Set([...prev, ...idsToStage])])
      setDraftById(prev => {
        const next = { ...prev }
        for (const id of idsToStage) {
          delete next[id]
        }
        draftByIdRef.current = next
        return next
      })
      setSelectedRowKeys([])
      return
    }

    const blocked = selectedRows.filter(r => r.inUse)
    if (blocked.length > 0) {
      setDeleteBlockedSelectedCount(selectedRows.length)
      setDeleteBlockedModalOpen(true)
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
    (values: DetailedProgramAddItemValues) => {
      if (!canWrite) return
      const registrant = user?.name?.trim() || '시스템'
      const now = new Date().toISOString()
      const row: DetailedProgramManagementRow = {
        id: nextDetailedProgramId(rows),
        name: values.name,
        active: values.active,
        createdBy: registrant,
        createdAt: now,
        inUse: false,
      }
      setRows(prev => [row, ...prev])
      setAddItemModalOpen(false)
    },
    [canWrite, rows, user?.name]
  )

  const updateDraft = useCallback((id: string, patch: Partial<DetailedProgramDraft>) => {
    setDraftById(prev => {
      const cur = prev[id]
      if (!cur) return prev
      const nextPatch = { ...patch }
      if ('active' in nextPatch && nextPatch.active !== undefined) {
        nextPatch.active = coerceRadioBoolean(nextPatch.active)
      }
      const next = { ...prev, [id]: { ...cur, ...nextPatch } }
      draftByIdRef.current = next
      return next
    })
  }, [])

  const stagedDeleteSet = useMemo(() => new Set(stagedDeleteIds), [stagedDeleteIds])

  /** 편집 중: 스테이징 삭제 제외 + draft 병합. 뷰 모드: 필터 결과 그대로 */
  const tableDisplayData = useMemo((): DetailedProgramManagementRow[] => {
    const base = isEditMode ? tableData.filter(row => !stagedDeleteSet.has(row.id)) : tableData
    if (!isEditMode) return base
    return base.map(row => {
      const d = draftById[row.id]
      if (!d) return row
      return { ...row, name: d.name, active: coerceRadioBoolean(d.active) }
    })
  }, [draftById, isEditMode, stagedDeleteSet, tableData])

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
              inputSize="medium"
              width="100%"
              value={row.name}
              onChange={e => updateDraft(row.id, { name: e.target.value })}
              placeholder="세부 프로그램명"
              maxLength={200}
            />
          )
        },
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
              inputSize="small"
              width="100%"
              value={row.active ? 'true' : 'false'}
              onChange={v => updateDraft(row.id, { active: v === 'true' })}
              options={[...USAGE_SELECT_OPTIONS]}
            />
          )
        },
      },
      {
        title: '록자',
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
            dayjs(v).format('YYYY.MM.DD HH:mm:ss')
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
        actions={
          <>
            <CmsButton
              variant="delete"
              onClick={handleBulkDelete}
              disabled={!canWrite || selectedRowKeys.length === 0}
            >
              항목 삭제
            </CmsButton>
            {isEditMode ? (
              <CmsButton variant="primary" onClick={handleSave} disabled={!canWrite}>
                저장
              </CmsButton>
            ) : (
              <CmsButton variant="secondary" onClick={enterEditMode} disabled={!canWrite}>
                정보 수정
              </CmsButton>
            )}
            <CmsButton
              variant="primary"
              onClick={handleAddClick}
              disabled={!canWrite || isEditMode}
            >
              항목 추가
            </CmsButton>
          </>
        }
      >
        <Table<DetailedProgramManagementRow>
          rowKey="id"
          className="cms-data-table"
          columns={columns}
          dataSource={tableDisplayData}
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
        width={480}
        description={
          deleteBlockedSelectedCount <= 1 ? (
            <span className="fs-16">
              해당 세부 프로그램은 실적 관리에서 사용 중입니다.
              <br />
              사용 중인 세부 프로그램은 삭제할 수 없습니다.
            </span>
          ) : (
            <span className="fs-16">
              선택한 {deleteBlockedSelectedCount}개의 세부 프로그램 중 실적 관리에서 사용 중인
              항목이 있습니다.
              <br />
              사용 중인 세부 프로그램은 삭제할 수 없습니다.
            </span>
          )
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
        confirmText="세부 프로그램 삭제"
        requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
        confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
        onCancel={() => setViewDeleteModalOpen(false)}
        onConfirm={() => {
          const removeIds = new Set(viewDeletePendingIdsRef.current)
          setRows(prev => prev.filter(r => !removeIds.has(r.id)))
          setSelectedRowKeys([])
          setViewDeleteModalOpen(false)
          setViewDeleteModalLines([])
          viewDeletePendingIdsRef.current = []
        }}
      />
    </div>
  )
}
