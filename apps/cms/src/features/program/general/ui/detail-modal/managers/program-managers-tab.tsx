/**
 * 프로그램 상세 - 담당자 정보 탭
 * 필터(담당자명, 권한) + 조회 + 담당자 목록 테이블 + 삭제/등록
 *
 * Remote only: GET/POST/PATCH/DELETE …/managers
 * 권한 변경 → PATCH …/managers/{assignmentId} (`ProgramManagerUpdateRequest.role`)
 * 공유 탭 — 일반·UJAT·1사1교·Gemini 상세에서 재사용 (program-type-isolation).
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { ActionResultModal, FilterTableToolbarButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import type { ColumnsType } from 'antd/es/table'
import type { ProgramRole } from '@/types/user'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  useProgramManagersParams,
  type ProgramManagersFilters,
} from '../../../hooks/use-program-managers-params'
import { useProgramManagers } from '../../../hooks/use-program-managers'
import { PROGRAM_ROLE_LABELS, type ProgramManagerRow } from '@/features/program/general/model/program-managers'
import {
  canAddProgramPm,
  canAssignProgramRoleToCmsAdmin,
  canSetProgramManagerRole,
  CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import { AddManagerModal, type AddManagerFormValues } from '../../add-manager-modal'
import { ManagerDeleteGuideModal } from '../../manager-delete-guide-modal'
import {
  EditableStatusBadge,
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components'
import { getProgramRoleBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import {
  PROGRAM_MANAGER_ADD_COMPLETE_BODY,
  PROGRAM_MANAGER_ADD_COMPLETE_TITLE,
  PROGRAM_MANAGER_DELETE_COMPLETE_BODY,
  PROGRAM_MANAGER_DELETE_COMPLETE_TITLE,
  PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_BODY,
  PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_TITLE,
} from '@/features/program/general/lib/program-manager-action-result-messages'
import './program-managers-tab.css'

type ProgramManagerActionResult = {
  title: string
  body: string
}

/** 삭제 안내(zIndex 2500)보다 위에 시안 완료 팝업만 노출 */
const PROGRAM_MANAGER_ACTION_RESULT_Z_INDEX = 2600

const ROLE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: PROGRAM_ROLE_LABELS.OWNER, value: 'OWNER' },
  { label: PROGRAM_ROLE_LABELS.PARTNER, value: 'PARTNER' },
  { label: PROGRAM_ROLE_LABELS.ASSISTANT, value: 'ASSISTANT' },
]

const TABLE_ROLE_ORDER: ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

interface ProgramManagersTabProps {
  programId: string
  maskSensitive?: boolean
}

export function ProgramManagersTab({ programId, maskSensitive: _maskSensitive = false }: ProgramManagersTabProps) {
  const { showAlert } = useCmsAlert()
  const { filters, setFilters } = useProgramManagersParams()
  const [pendingFilters, setPendingFilters] = useState<ProgramManagersFilters>(() => ({
    ...filters,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [appliedFilters, setAppliedFilters] = useState<ProgramManagersFilters>(filters)
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteGuideModalOpen, setDeleteGuideModalOpen] = useState(false)
  const [actionResult, setActionResult] = useState<ProgramManagerActionResult | null>(null)

  const managersListFilters = useMemo(
    () => ({
      managerName: appliedFilters.managerName,
      role: appliedFilters.role,
    }),
    [appliedFilters.managerName, appliedFilters.role]
  )

  const {
    managers: managerList,
    loading,
    isMutating,
    isUpdatingRole,
    getAssignableCandidates,
    candidatesLoading,
    addManager,
    updateManagerRole,
    deleteManagers,
    managersListAllowed,
    managersListPending,
  } = useProgramManagers(programId, managersListFilters)

  useEffect(() => {
    setPendingFilters({ ...filters })
  }, [filters])

  useEffect(() => {
    setSelectedRowKeys([])
    setOpenRoleDropdownId(null)
  }, [programId])

  const managerFilterFields = useMemo((): FilterFieldConfig[] => {
    return [
      {
        key: 'managerName',
        type: 'search',
        label: '담당자명',
        placeholder: '담당자명을 입력하세요',
      },
      {
        key: 'role',
        type: 'select',
        label: '권한',
        placeholder: '전체',
        options: ROLE_OPTIONS,
      },
    ]
  }, [])

  const filterValues = useMemo(
    () => ({
      managerName: pendingFilters.managerName,
      role: pendingFilters.role === 'all' ? undefined : pendingFilters.role,
    }),
    [pendingFilters]
  )

  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'managerName') {
      setPendingFilters(prev => ({ ...prev, managerName: String(value ?? '') }))
      return
    }
    const v = value == null || value === '' ? 'all' : String(value)
    setPendingFilters(prev => ({ ...prev, role: v }))
  }

  const handleFilterSearch = () => {
    setFilters({
      managerName: pendingFilters.managerName,
      role: pendingFilters.role,
    })
    setAppliedFilters({
      managerName: pendingFilters.managerName,
      role: pendingFilters.role,
    })
  }

  const filteredManagers = useMemo(() => {
    const list = managerList.filter(row => {
      const keyword = (appliedFilters.managerName || '').trim().toLowerCase()
      if (keyword && !row.name.toLowerCase().includes(keyword)) return false
      if (
        appliedFilters.role &&
        appliedFilters.role !== 'all' &&
        row.role !== appliedFilters.role
      ) {
        return false
      }
      return true
    })
    return [...list].sort((a, b) => b.no - a.no)
  }, [managerList, appliedFilters])

  const excludeManagerNames = useMemo(
    () => managerList.map(row => row.name),
    [managerList]
  )

  const assignableCandidates = useMemo(
    () => getAssignableCandidates(excludeManagerNames),
    [excludeManagerNames, getAssignableCandidates]
  )

  const handleDeleteClick = () => {
    if (selectedRowKeys.length === 0) {
      return
    }
    setDeleteGuideModalOpen(true)
  }

  const managerNamesToDelete = useMemo(() => {
    const keysSet = new Set(selectedRowKeys.map(String))
    return managerList.filter(row => keysSet.has(row.id)).map(row => row.name)
  }, [selectedRowKeys, managerList])

  const handleDeleteConfirm = async () => {
    const keysToDelete = selectedRowKeys.map(String)
    setDeleteGuideModalOpen(false)
    const result = await deleteManagers(keysToDelete)
    if (!result.ok) {
      void showAlert({ title: '삭제 실패', content: result.message })
      return
    }
    setSelectedRowKeys([])
    setActionResult({
      title: PROGRAM_MANAGER_DELETE_COMPLETE_TITLE,
      body: PROGRAM_MANAGER_DELETE_COMPLETE_BODY,
    })
  }

  const handleDeleteGuideCancel = () => {
    setDeleteGuideModalOpen(false)
  }

  const handleAdd = async (values: AddManagerFormValues): Promise<boolean> => {
    if (values.role === 'OWNER' && !canAddProgramPm(managerList)) {
      return false
    }
    if (!canAssignProgramRoleToCmsAdmin(values.cmsRoleCode, values.role)) {
      void showAlert({ title: '등록 실패', content: CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE })
      return false
    }
    const result = await addManager(values)
    if (!result.ok) {
      void showAlert({ title: '등록 실패', content: result.message })
      return false
    }
    setAddModalOpen(false)
    setActionResult({
      title: PROGRAM_MANAGER_ADD_COMPLETE_TITLE,
      body: PROGRAM_MANAGER_ADD_COMPLETE_BODY,
    })
    return true
  }

  const handleTableRoleChange = useCallback(
    async (recordId: string, newRole: ProgramRole) => {
      const manager = managerList.find(m => m.id === recordId)
      if (!manager) return
      if (manager.role === newRole) {
        setOpenRoleDropdownId(null)
        return
      }
      if (!canAssignProgramRoleToCmsAdmin(manager.cmsRoleCode, newRole)) {
        setOpenRoleDropdownId(null)
        void showAlert({
          title: '권한 변경 실패',
          content: CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE,
        })
        return
      }
      if (!canSetProgramManagerRole(managerList, recordId, newRole)) {
        setOpenRoleDropdownId(null)
        return
      }
      const result = await updateManagerRole(recordId, newRole)
      if (!result.ok) {
        void showAlert({ title: '권한 변경 실패', content: result.message })
      } else {
        setActionResult({
          title: PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_TITLE,
          body: PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_BODY,
        })
      }
      setOpenRoleDropdownId(null)
    },
    [managerList, showAlert, updateManagerRole]
  )

  const roleItemDisabled = useCallback(
    (record: ProgramManagerRow, optionRole: ProgramRole) => {
      if (record.role === optionRole) return true
      if (!canAssignProgramRoleToCmsAdmin(record.cmsRoleCode, optionRole)) return true
      if (optionRole !== 'OWNER') return false
      return !canSetProgramManagerRole(managerList, record.id, 'OWNER')
    },
    [managerList]
  )

  const renderRoleBadge = useCallback((r: ProgramRole) => {
    return (
      <EditableStatusBadge
        label={PROGRAM_ROLE_LABELS[r]}
        tone={getProgramRoleBadgeTone(r)}
        className="program-managers-tab__role-badge"
      />
    )
  }, [])

  const columns: ColumnsType<ProgramManagerRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '담당자명',
        dataIndex: 'name',
        key: 'name',
        align: 'center',
      },
      {
        title: '권한',
        dataIndex: 'role',
        key: 'role',
        width: 208,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (role: ProgramRole, record: ProgramManagerRow) => (
          <StatusDropdownCell<ProgramRole>
            status={role}
            statusOptions={TABLE_ROLE_ORDER}
            renderBadge={renderRoleBadge}
            isItemDisabled={(_cur, opt) => roleItemDisabled(record, opt)}
            onChange={key => {
              void handleTableRoleChange(record.id, key)
            }}
            isUpdating={isUpdatingRole}
            isOpen={openRoleDropdownId === record.id}
            onOpenChange={open => setOpenRoleDropdownId(open ? record.id : null)}
            emptyPlaceholder="-"
            style={{ width: 176, minWidth: 176, maxWidth: 176 }}
          />
        ),
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: 246,
        align: 'center',
        render: (phone: string) => displayServerPiiAsIs(phone),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 246,
        align: 'center',
        ellipsis: true,
        render: (email: string) => displayServerPiiAsIs(email),
      },
      {
        title: '등록일시',
        dataIndex: 'registeredAt',
        key: 'registeredAt',
        width: 246,
        align: 'center',
      },
    ],
    [
      handleTableRoleChange,
      isUpdatingRole,
      openRoleDropdownId,
      renderRoleBadge,
      roleItemDisabled,
    ]
  )

  const excelColumns: ColumnsType<ProgramManagerRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '담당자명', dataIndex: 'name', key: 'name' },
      {
        title: '권한',
        dataIndex: 'role',
        key: 'role',
        render: (role: ProgramRole) => PROGRAM_ROLE_LABELS[role] ?? '-',
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        render: (phone: string) => displayServerPiiAsIs(phone),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        render: (email: string) => displayServerPiiAsIs(email),
      },
      { title: '등록일시', dataIndex: 'registeredAt', key: 'registeredAt' },
    ],
    []
  )

  if (managersListPending || (loading && managerList.length === 0)) {
    return (
      <div className="program-managers-tab program-managers-tab--loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (!managersListAllowed) {
    return <div className="program-managers-tab">담당자 명단을 조회할 권한이 없습니다.</div>
  }

  return (
    <div className="program-managers-tab">
      <FilterTableLayout
        className="program-managers-tab__filter-layout"
        bordered={false}
        fields={managerFilterFields}
        filters={filterValues}
        onFilterChange={handleFilterChange}
        onSearch={handleFilterSearch}
        title="담당자 목록"
        description={`${filteredManagers.length}건`}
        excelExport={{
          columns: excelColumns,
          data: filteredManagers,
          selectedRowKeys,
        }}
        actions={
          <>
            <FilterTableToolbarButton
              variant="delete"
              loading={isMutating && deleteGuideModalOpen}
              onClick={handleDeleteClick}
            >
              담당자 삭제
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              variant="primary"
              disabled={isMutating}
              onClick={() => setAddModalOpen(true)}
            >
              담당자 등록
            </FilterTableToolbarButton>
          </>
        }
      >
        <CmsDataTable<ProgramManagerRow>
          className="cms-data-table cms-data-table--fluid program-managers-tab__managers-table"
          rowKey="id"
          pagination={false}
          loading={loading}
          rowSelection={{
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys as string[]),
            getCheckboxProps: record => ({
              disabled: record.removableYn === false,
            }),
          }}
          columns={columns}
          dataSource={filteredManagers}
        />
      </FilterTableLayout>

      {actionResult == null ? (
        <AddManagerModal
          open={addModalOpen}
          onCancel={() => setAddModalOpen(false)}
          currentOwnerCount={managerList.filter(m => m.role === 'OWNER').length}
          excludeManagerNames={excludeManagerNames}
          candidates={assignableCandidates}
          candidatesLoading={candidatesLoading}
          confirmLoading={isMutating}
          onAdd={handleAdd}
        />
      ) : null}

      {actionResult == null ? (
        <ManagerDeleteGuideModal
          open={deleteGuideModalOpen}
          onCancel={handleDeleteGuideCancel}
          managerNames={managerNamesToDelete}
          confirmLoading={isMutating}
          onConfirm={() => {
            void handleDeleteConfirm()
          }}
        />
      ) : null}

      <ActionResultModal
        open={actionResult != null}
        onClose={() => setActionResult(null)}
        title={actionResult?.title ?? ''}
        body={actionResult?.body ?? ''}
        zIndex={PROGRAM_MANAGER_ACTION_RESULT_Z_INDEX}
      />
    </div>
  )
}
