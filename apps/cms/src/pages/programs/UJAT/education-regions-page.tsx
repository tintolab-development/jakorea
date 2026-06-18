/**
 * UJAT 프로그램 — 교육 지역 관리
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout, CmsButton, CmsInput, CmsRadio, CmsRadioGroup } from '@/shared/ui'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import {
  UJAT_EDUCATION_REGIONS_CHANGED_EVENT,
  createUjatEducationRegion,
  deleteUjatEducationRegion,
  readUjatEducationRegions,
  reorderUjatEducationRegions,
  updateUjatEducationRegion,
} from '@/features/program/ujat/lib/education-region-store'
import {
  filterUjatEducationRegions,
  formatUjatEducationRegionDateTime,
} from '@/features/program/ujat/lib/education-region-filter'
import type {
  UjatEducationRegion,
  UjatEducationRegionDraft,
  UjatEducationRegionFilters,
} from '@/features/program/ujat/model/education-region.types'
import {
  UjatEducationRegionDeleteBlockedModal,
  UjatEducationRegionDeleteModal,
} from '@/features/program/ujat/ui/education-regions/delete-modal'
import { UjatEducationRegionRegisterModal } from '@/features/program/ujat/ui/education-regions/register-modal'
import {
  UjatEducationRegionDragHandle,
  UjatEducationRegionsSortableTable,
} from '@/features/program/ujat/ui/education-regions/sortable-table'

import '@/pages/programs/program-list-page.css'
import './education-regions-page.css'

const INITIAL_FILTERS: UjatEducationRegionFilters = {
  usageStatus: 'active',
  name: '',
}

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

export default function UjatEducationRegionsPage() {
  const [rows, setRows] = useState<UjatEducationRegion[]>(() => readUjatEducationRegions())
  const [pendingFilters, setPendingFilters] = useState<UjatEducationRegionFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<UjatEducationRegionFilters>(INITIAL_FILTERS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<UjatEducationRegionDraft | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UjatEducationRegion | null>(null)
  const [deleteBlockedTarget, setDeleteBlockedTarget] = useState<UjatEducationRegion | null>(null)

  const reload = useCallback(() => {
    setRows(readUjatEducationRegions())
  }, [])

  useEffect(() => {
    const handler = () => reload()
    window.addEventListener(UJAT_EDUCATION_REGIONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(UJAT_EDUCATION_REGIONS_CHANGED_EVENT, handler)
  }, [reload])

  const filteredRows = useMemo(
    () => filterUjatEducationRegions(rows, appliedFilters),
    [appliedFilters, rows]
  )

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: 'usageStatus',
        type: 'radio',
        label: '사용 여부',
        options: [
          { label: '사용', value: 'active' },
          { label: '미사용', value: 'inactive' },
        ],
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'name',
        type: 'search',
        label: '교육 지역명',
        placeholder: '교육 지역명을 입력하세요',
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
    ],
    []
  )

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({
      ...prev,
      [key]:
        key === 'usageStatus'
          ? value === 'inactive'
            ? 'inactive'
            : 'active'
          : String(value ?? ''),
    }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
    setEditingId(null)
    setEditDraft(null)
  }, [pendingFilters])

  const startEdit = useCallback((row: UjatEducationRegion) => {
    setEditingId(row.id)
    setEditDraft({ active: row.active, name: row.name })
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditDraft(null)
  }, [])

  const saveEdit = useCallback(
    (id: string) => {
      if (!editDraft?.name.trim()) return
      updateUjatEducationRegion(id, {
        active: editDraft.active,
        name: editDraft.name.trim(),
      })
      reload()
      cancelEdit()
    },
    [cancelEdit, editDraft, reload]
  )

  const handleReorder = useCallback(
    (reorderedVisible: UjatEducationRegion[]) => {
      if (editingId) return
      const visibleIds = reorderedVisible.map(row => row.id)
      setRows(prev => {
        const hiddenIds = prev.filter(row => !visibleIds.includes(row.id)).map(row => row.id)
        return reorderUjatEducationRegions([...visibleIds, ...hiddenIds])
      })
    },
    [editingId]
  )

  const handleRegister = useCallback(
    (values: { active: boolean; name: string }) => {
      createUjatEducationRegion(values)
      reload()
      setRegisterOpen(false)
    },
    [reload]
  )

  const handleDeleteRequest = useCallback((row: UjatEducationRegion) => {
    if (row.hasUsageHistory) {
      setDeleteBlockedTarget(row)
      return
    }
    setDeleteTarget(row)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    const result = deleteUjatEducationRegion(deleteTarget.id)
    if (!result.ok && result.reason === 'has_usage') {
      setDeleteTarget(null)
      setDeleteBlockedTarget(deleteTarget)
      return
    }
    reload()
    setDeleteTarget(null)
  }, [deleteTarget, reload])

  const columns = useMemo<ColumnsType<UjatEducationRegion>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: 72,
        align: 'center',
        render: () => <UjatEducationRegionDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'active',
        width: 168,
        align: 'center',
        render: (_value, record) => {
          const isEditing = editingId === record.id && editDraft
          if (!isEditing) return record.active ? '사용' : '미사용'
          return (
            <CmsRadioGroup
              className="ujat-education-regions-page__active-radios"
              value={editDraft.active}
              onChange={e =>
                setEditDraft(prev =>
                  prev ? { ...prev, active: coerceRadioBoolean(e.target.value) } : prev
                )
              }
            >
              <CmsRadio value={true}>사용</CmsRadio>
              <CmsRadio value={false}>미사용</CmsRadio>
            </CmsRadioGroup>
          )
        },
      },
      {
        title: '교육 지역명',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        align: 'center',
        render: (_value, record) => {
          const isEditing = editingId === record.id && editDraft
          if (!isEditing) return record.name
          return (
            <CmsInput
              inputSize="medium"
              width="100%"
              value={editDraft.name}
              onChange={e =>
                setEditDraft(prev => (prev ? { ...prev, name: e.target.value } : prev))
              }
              placeholder="교육 지역명"
              maxLength={100}
            />
          )
        },
      },
      {
        title: '등록자명',
        dataIndex: 'createdByName',
        key: 'createdByName',
        width: TABLE_COLUMN_WIDTHS.name,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '등록일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        align: 'center',
        render: (value: string) => formatUjatEducationRegionDateTime(value),
      },
      {
        title: '관리',
        key: 'actions',
        width: 260,
        align: 'center',
        render: (_value, record) => {
          const isEditing = editingId === record.id && editDraft
          return (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <CmsButton
                variant="default"
                size="medium"
                width={100}
                onClick={e => {
                  e.stopPropagation()
                  handleDeleteRequest(record)
                }}
              >
                삭제
              </CmsButton>
              <CmsButton
                variant="secondary"
                size="medium"
                width={100}
                disabled={isEditing ? !editDraft.name.trim() : false}
                onClick={e => {
                  e.stopPropagation()
                  if (isEditing) {
                    saveEdit(record.id)
                    return
                  }
                  startEdit(record)
                }}
              >
                {isEditing ? '저장' : '수정'}
              </CmsButton>
            </div>
          )
        },
      },
    ],
    [editDraft, editingId, handleDeleteRequest, saveEdit, startEdit]
  )

  const toolbarActions = (
    <>
      <CmsButton variant="secondary" width={160} onClick={() => setRegisterOpen(true)}>
        교육 지역 등록
      </CmsButton>
    </>
  )

  return (
    <div className="program-list-page">
      <FilterTableLayout
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        bordered={false}
        title="교육 지역"
        description={`총 ${filteredRows.length.toLocaleString()}건`}
        actions={toolbarActions}
        excelExport={{
          columns,
          data: filteredRows,
        }}
      >
        <UjatEducationRegionsSortableTable
          rows={filteredRows}
          columns={columns}
          onRowsReorder={handleReorder}
        />
      </FilterTableLayout>

      <UjatEducationRegionRegisterModal
        open={registerOpen}
        onCancel={() => setRegisterOpen(false)}
        onSubmit={handleRegister}
      />

      <UjatEducationRegionDeleteModal
        open={Boolean(deleteTarget)}
        regionName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <UjatEducationRegionDeleteBlockedModal
        open={Boolean(deleteBlockedTarget)}
        onClose={() => setDeleteBlockedTarget(null)}
      />
    </div>
  )
}
