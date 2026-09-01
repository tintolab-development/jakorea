/**
 * UJAT 프로그램 — 교육 지역 관리
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout, CmsButton, CmsInput, CmsRadio, CmsRadioGroup } from '@/shared/ui'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { shouldUseUjatEducationRegionsRemoteApi } from '@/features/program/ujat/api/education-regions/capabilities'
import {
  useCreateUjatEducationRegion,
  useDeleteUjatEducationRegion,
  useReorderUjatEducationRegions,
  useUpdateUjatEducationRegion,
  useUjatEducationRegionsList,
} from '@/features/program/ujat/api/education-regions/hooks'
import { UJAT_EDUCATION_REGIONS_CHANGED_EVENT } from '@/features/program/ujat/lib/education-region-store'
import {
  isUjatEducationRegionDuplicateNameError,
  UJAT_EDUCATION_REGION_DUPLICATE_NAME_MESSAGE,
} from '@/features/program/ujat/lib/education-region-name'
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
  const { showAlert } = useCmsAlert()
  const remoteEnabled = shouldUseUjatEducationRegionsRemoteApi()
  const listQuery = useUjatEducationRegionsList()
  const createMutation = useCreateUjatEducationRegion()
  const updateMutation = useUpdateUjatEducationRegion()
  const deleteMutation = useDeleteUjatEducationRegion()
  const reorderMutation = useReorderUjatEducationRegions()

  const [rows, setRows] = useState<UjatEducationRegion[]>([])
  const [pendingFilters, setPendingFilters] = useState<UjatEducationRegionFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<UjatEducationRegionFilters>(INITIAL_FILTERS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<UjatEducationRegionDraft | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UjatEducationRegion | null>(null)
  const [deleteBlockedTarget, setDeleteBlockedTarget] = useState<UjatEducationRegion | null>(null)

  useEffect(() => {
    if (listQuery.data) setRows(listQuery.data)
  }, [listQuery.data])

  useEffect(() => {
    if (!listQuery.isError || listQuery.isFetching) return
    showAlert({
      title: '목록 조회 실패',
      content: '교육 지역 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }, [listQuery.isError, listQuery.isFetching, showAlert])

  useEffect(() => {
    if (remoteEnabled) return
    const handler = () => {
      void listQuery.refetch()
    }
    window.addEventListener(UJAT_EDUCATION_REGIONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(UJAT_EDUCATION_REGIONS_CHANGED_EVENT, handler)
  }, [listQuery, remoteEnabled])

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
    async (id: string) => {
      if (!editDraft?.name.trim()) return
      try {
        await updateMutation.mutateAsync({
          id,
          patch: {
            active: editDraft.active,
            name: editDraft.name.trim(),
          },
        })
        cancelEdit()
      } catch (error) {
        if (isUjatEducationRegionDuplicateNameError(error)) {
          showAlert({
            title: '등록 불가',
            content: UJAT_EDUCATION_REGION_DUPLICATE_NAME_MESSAGE,
          })
          return
        }
        showAlert({
          title: '저장 실패',
          content: '교육 지역 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [cancelEdit, editDraft, showAlert, updateMutation]
  )

  const handleReorder = useCallback(
    (reorderedVisible: UjatEducationRegion[]) => {
      if (editingId) return
      const visibleIds = reorderedVisible.map(row => row.id)
      const hiddenIds = rows.filter(row => !visibleIds.includes(row.id)).map(row => row.id)
      const orderedIds = [...visibleIds, ...hiddenIds]
      setRows(prev => {
        const byId = new Map(prev.map(row => [row.id, row]))
        return orderedIds
          .map(id => byId.get(id))
          .filter((row): row is UjatEducationRegion => Boolean(row))
          .map((row, index) => ({ ...row, sortOrder: index + 1 }))
      })
      void reorderMutation.mutateAsync(orderedIds).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '교육 지역 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void listQuery.refetch()
      })
    },
    [editingId, listQuery, reorderMutation, rows, showAlert]
  )

  const handleRegister = useCallback(
    async (values: { active: boolean; name: string }) => {
      try {
        await createMutation.mutateAsync(values)
        setRegisterOpen(false)
      } catch (error) {
        if (isUjatEducationRegionDuplicateNameError(error)) {
          showAlert({
            title: '등록 불가',
            content: UJAT_EDUCATION_REGION_DUPLICATE_NAME_MESSAGE,
          })
          return
        }
        showAlert({
          title: '등록 실패',
          content:
            '교육 지역 등록에 실패했습니다. 백엔드 POST 지원 여부를 확인한 뒤 다시 시도해 주세요.',
        })
      }
    },
    [createMutation, showAlert]
  )

  const handleDeleteRequest = useCallback((row: UjatEducationRegion) => {
    if (row.hasUsageHistory) {
      setDeleteBlockedTarget(row)
      return
    }
    setDeleteTarget(row)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    const result = await deleteMutation.mutateAsync(deleteTarget.id)
    if (!result.ok && result.reason === 'has_usage') {
      setDeleteTarget(null)
      setDeleteBlockedTarget(deleteTarget)
      return
    }
    if (!result.ok) {
      showAlert({
        title: '삭제 실패',
        content:
          result.reason === 'not_found'
            ? '교육 지역을 찾을 수 없습니다.'
            : '교육 지역 삭제에 실패했습니다. 백엔드 DELETE 지원 여부를 확인한 뒤 다시 시도해 주세요.',
      })
      setDeleteTarget(null)
      return
    }
    setDeleteTarget(null)
  }, [deleteMutation, deleteTarget, showAlert])

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
        render: (value: string) => value?.trim() || '-',
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
                loading={
                  deleteMutation.isPending && deleteTarget?.id === record.id
                }
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
                loading={isEditing ? updateMutation.isPending : false}
                disabled={isEditing ? !editDraft.name.trim() : false}
                onClick={e => {
                  e.stopPropagation()
                  if (isEditing) {
                    void saveEdit(record.id)
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
    [
      deleteMutation.isPending,
      deleteTarget?.id,
      editDraft,
      editingId,
      handleDeleteRequest,
      saveEdit,
      startEdit,
      updateMutation.isPending,
    ]
  )

  const toolbarActions = (
    <CmsButton
      variant="secondary"
      width={160}
      loading={createMutation.isPending}
      onClick={() => setRegisterOpen(true)}
    >
      교육 지역 등록
    </CmsButton>
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
          loading={listQuery.isFetching}
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
