/**
 * 프로그램 상세 - 담당자 정보 탭
 * 필터(담당자명, 권한) + 조회 + 담당자 목록 테이블 + 삭제/등록/개인정보 상세보기·권한 수정
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Table, message } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import { UnifiedFilterCard, type FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import type { ColumnsType } from 'antd/es/table'
import type { ProgramRole } from '@/types/user'
import {
  useProgramManagersParams,
  type ProgramManagersFilters,
} from '../hooks/use-program-managers-params'
import {
  MOCK_PROGRAM_MANAGERS,
  PROGRAM_ROLE_LABELS,
  type ProgramManagerRow,
} from '@/data/mock/program-managers'
import {
  canAddProgramPm,
  canSetProgramManagerRole,
  PROGRAM_PM_ROLE_LIMIT_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import {
  AddManagerModal,
  buildManagerRowFromForm,
  type AddManagerFormValues,
} from './add-manager-modal'
import { EditManagerRoleModal } from './edit-manager-role-modal'
import { ManagerDeleteGuideModal } from './manager-delete-guide-modal'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import './program-managers-tab.css'

const ROLE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: PROGRAM_ROLE_LABELS.OWNER, value: 'OWNER' },
  { label: PROGRAM_ROLE_LABELS.PARTNER, value: 'PARTNER' },
  { label: PROGRAM_ROLE_LABELS.ASSISTANT, value: 'ASSISTANT' },
]

const TABLE_ROLE_ORDER: ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

function maskPhoneDisplay(phone: string): string {
  const parts = phone.split('-')
  if (parts.length === 3 && parts[0].length >= 2 && parts[2].length >= 2) {
    return `${parts[0]}-****-${parts[2]}`
  }
  return phone
}

function maskEmailDisplay(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email
  const local = email.slice(0, at)
  const domain = email.slice(at)
  const head = local.slice(0, Math.min(5, local.length))
  return `${head}***${domain}`
}

interface ProgramManagersTabProps {
  programId: string
}

export function ProgramManagersTab({ programId: _programId }: ProgramManagersTabProps) {
  const { filters, setFilters } = useProgramManagersParams()
  const [pendingFilters, setPendingFilters] = useState<ProgramManagersFilters>(() => ({
    ...filters,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [appliedFilters, setAppliedFilters] = useState<ProgramManagersFilters>(filters)
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)

  useEffect(() => {
    setPendingFilters({ ...filters })
  }, [filters])

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

  const unifiedFilterCardValues = useMemo(
    () => ({
      managerName: pendingFilters.managerName,
      role: pendingFilters.role === 'all' ? undefined : pendingFilters.role,
    }),
    [pendingFilters]
  )

  const handleUnifiedFilterChange = (key: string, value: unknown) => {
    if (key === 'managerName') {
      setPendingFilters(prev => ({ ...prev, managerName: String(value ?? '') }))
      return
    }
    const v = value == null || value === '' ? 'all' : String(value)
    setPendingFilters(prev => ({ ...prev, role: v }))
  }

  const handleUnifiedFilterSearch = () => {
    setFilters({
      managerName: pendingFilters.managerName,
      role: pendingFilters.role,
    })
    setAppliedFilters({
      managerName: pendingFilters.managerName,
      role: pendingFilters.role,
    })
  }
  const [managerList, setManagerList] = useState<ProgramManagerRow[]>(() => [
    ...MOCK_PROGRAM_MANAGERS,
  ])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false)
  const [managerForEditRole, setManagerForEditRole] = useState<ProgramManagerRow | null>(null)
  const [deleteGuideModalOpen, setDeleteGuideModalOpen] = useState(false)
  const [deleteFromEditManager, setDeleteFromEditManager] = useState<ProgramManagerRow | null>(null)

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

  const handleDeleteClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('삭제할 담당자를 선택해 주세요.')
      return
    }
    setDeleteGuideModalOpen(true)
  }

  const handleViewDetailClick = () => {
    window.alert('준비 중입니다.')
  }

  const managerNamesToDeleteFromTable = useMemo(() => {
    const keysSet = new Set(selectedRowKeys.map(String))
    return managerList.filter(row => keysSet.has(row.id)).map(row => row.name)
  }, [selectedRowKeys, managerList])

  const managerNamesToDelete = deleteFromEditManager
    ? [deleteFromEditManager.name]
    : managerNamesToDeleteFromTable

  const handleDeleteConfirm = () => {
    if (deleteFromEditManager) {
      setManagerList(prev => prev.filter(row => row.id !== deleteFromEditManager.id))
      setDeleteFromEditManager(null)
      setManagerForEditRole(null)
      setEditRoleModalOpen(false)
      setDeleteGuideModalOpen(false)
      message.success('담당자가 삭제되었습니다.')
      return
    }
    const keysToDelete = new Set(selectedRowKeys.map(String))
    const count = keysToDelete.size
    setManagerList(prev => prev.filter(row => !keysToDelete.has(row.id)))
    setSelectedRowKeys([])
    setDeleteGuideModalOpen(false)
    message.success(`${count}명의 담당자가 삭제되었습니다.`)
  }

  const handleDeleteGuideCancel = () => {
    setDeleteGuideModalOpen(false)
    setDeleteFromEditManager(null)
  }

  const handleAdd = (values: AddManagerFormValues) => {
    if (values.role === 'OWNER' && !canAddProgramPm(managerList)) {
      message.error(PROGRAM_PM_ROLE_LIMIT_MESSAGE)
      return
    }
    const nextNo = managerList.length > 0 ? Math.max(...managerList.map(r => r.no)) + 1 : 1
    const nextId = `manager-new-${Date.now()}`
    const newRow = buildManagerRowFromForm(values, nextNo, nextId)
    setManagerList(prev => [newRow, ...prev])
    message.success('담당자가 등록되었습니다.')
  }

  const openEditRoleModal = useCallback((record: ProgramManagerRow) => {
    setManagerForEditRole(record)
    setEditRoleModalOpen(true)
  }, [])

  const handleSaveRole = (role: ProgramRole) => {
    if (!managerForEditRole) return
    setManagerList(prev =>
      prev.map(row => (row.id === managerForEditRole.id ? { ...row, role } : row))
    )
    message.success('권한이 수정되었습니다.')
    setManagerForEditRole(null)
    setEditRoleModalOpen(false)
  }

  const handleTableRoleChange = useCallback(
    (recordId: string, newRole: ProgramRole) => {
      const manager = managerList.find(m => m.id === recordId)
      if (!manager) return
      if (manager.role === newRole) {
        setOpenRoleDropdownId(null)
        return
      }
      if (!canSetProgramManagerRole(managerList, recordId, newRole)) {
        message.error(PROGRAM_PM_ROLE_LIMIT_MESSAGE)
        setOpenRoleDropdownId(null)
        return
      }
      setManagerList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, role: newRole } : row))
      )
      message.success('권한이 변경되었습니다.')
      setOpenRoleDropdownId(null)
    },
    [managerList]
  )

  const roleItemDisabled = useCallback(
    (record: ProgramManagerRow, optionRole: ProgramRole) => {
      if (record.role === optionRole) return true
      if (optionRole !== 'OWNER') return false
      return !canSetProgramManagerRole(managerList, record.id, 'OWNER')
    },
    [managerList]
  )

  const renderRoleBadge = useCallback((r: ProgramRole) => {
    const label = PROGRAM_ROLE_LABELS[r]
    const mod =
      r === 'OWNER'
        ? 'program-managers-tab__role-badge--owner'
        : r === 'PARTNER'
          ? 'program-managers-tab__role-badge--partner'
          : 'program-managers-tab__role-badge--assistant'
    return <span className={`program-managers-tab__role-badge ${mod}`}>{label}</span>
  }, [])

  const columns: ColumnsType<ProgramManagerRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '담당자명',
        dataIndex: 'name',
        key: 'name',
        width: 246,
        align: 'center',
      },
      {
        title: '권한',
        dataIndex: 'role',
        key: 'role',
        width: 160,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME }),
        onCell: () => ({
          className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME}`,
        }),
        render: (role: ProgramRole, record: ProgramManagerRow) => (
          <StatusDropdownCell<ProgramRole>
            status={role}
            statusOptions={TABLE_ROLE_ORDER}
            renderBadge={renderRoleBadge}
            isItemDisabled={(_cur, opt) => roleItemDisabled(record, opt)}
            onChange={key => handleTableRoleChange(record.id, key)}
            isOpen={openRoleDropdownId === record.id}
            onOpenChange={open => setOpenRoleDropdownId(open ? record.id : null)}
            emptyPlaceholder="-"
            tagLayout="tag160"
          />
        ),
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: 246,
        align: 'center',
        render: (phone: string) => maskPhoneDisplay(phone),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 246,
        align: 'center',
        ellipsis: true,
        render: (email: string) => maskEmailDisplay(email),
      },
      {
        title: '등록일시',
        dataIndex: 'registeredAt',
        key: 'registeredAt',
        width: 246,
        align: 'center',
      },
      {
        title: '관리',
        key: 'action',
        width: 246,
        align: 'center',
        render: (_: unknown, record: ProgramManagerRow) => (
          <AppButton
            variant="viewDetails"
            size="tableAction"
            onClick={e => {
              e.stopPropagation()
              openEditRoleModal(record)
            }}
          >
            권한 수정
          </AppButton>
        ),
      },
    ],
    [
      handleTableRoleChange,
      openRoleDropdownId,
      openEditRoleModal,
      renderRoleBadge,
      roleItemDisabled,
    ]
  )

  return (
    <div className="program-managers-tab">
      <div className="program-managers-tab__top">
        <UnifiedFilterCard
          bordered={false}
          cardStyle={{ marginBottom: 0 }}
          fields={managerFilterFields}
          filters={unifiedFilterCardValues}
          onFilterChange={handleUnifiedFilterChange}
          onSearch={handleUnifiedFilterSearch}
        />
      </div>

      <div className="program-managers-tab__divider" />
      <div className="program-managers-tab__below-divider">
        <div className="program-managers-tab__table-header">
          <div className="program-managers-tab__table-heading">
            <span className="program-managers-tab__table-title">담당자 목록</span>
            <span className="program-managers-tab__table-description">
              {filteredManagers.length}건
            </span>
          </div>
          <div className="program-managers-tab__table-actions">
            <AppButton variant="danger" size="filter" dangerFillOnHover onClick={handleDeleteClick}>
              담당자 삭제
            </AppButton>
            <AppButton variant="primary" size="filter" onClick={() => setAddModalOpen(true)}>
              담당자 등록
            </AppButton>
            <AppButton variant="primary" size="filter-wide" onClick={handleViewDetailClick}>
              개인정보 상세보기
            </AppButton>
          </div>
        </div>
        <Table<ProgramManagerRow>
          className="cms-data-table cms-data-table--fluid program-managers-tab__managers-table"
          rowKey="id"
          pagination={false}
          rowSelection={{
            columnWidth: 60,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys as string[]),
          }}
          columns={columns}
          dataSource={filteredManagers}
        />
      </div>

      <AddManagerModal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        currentOwnerCount={managerList.filter(m => m.role === 'OWNER').length}
        onAdd={handleAdd}
      />

      <EditManagerRoleModal
        open={editRoleModalOpen}
        onCancel={() => {
          setEditRoleModalOpen(false)
          setManagerForEditRole(null)
        }}
        manager={managerForEditRole}
        managerList={managerList}
        onSave={handleSaveRole}
        onDeleteRequest={manager => {
          setDeleteFromEditManager(manager)
          setDeleteGuideModalOpen(true)
        }}
      />

      <ManagerDeleteGuideModal
        open={deleteGuideModalOpen}
        onCancel={handleDeleteGuideCancel}
        managerNames={managerNamesToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
