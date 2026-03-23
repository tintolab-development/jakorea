/**
 * 프로그램 상세 - 담당자 정보 탭
 * 필터(담당자명, 권한) + 조회 + 담당자 목록 테이블 + 삭제/등록/정보상세·권한 수정
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Table, Select, message } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import type { ColumnsType } from 'antd/es/table'
import type { ProgramRole } from '@/types/user'
import {
  useProgramManagersParams,
  type ProgramManagersFilters,
} from '../hooks/use-program-managers-params'
import {
  getMockProgramManagers,
  PROGRAM_ROLE_LABELS,
  type ProgramManagerRow,
} from '@/data/mock/program-managers'
import {
  canAddProgramPm,
  canSetProgramManagerRole,
  PROGRAM_PM_ROLE_LIMIT_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
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

export function ProgramManagersTab({ programId }: ProgramManagersTabProps) {
  const { filters, setFilter } = useProgramManagersParams()
  const [localManagerName, setLocalManagerName] = useState(() => filters.managerName ?? '')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [appliedFilters, setAppliedFilters] = useState<ProgramManagersFilters>(filters)
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)

  useEffect(() => {
    setLocalManagerName(filters.managerName ?? '')
  }, [filters.managerName])
  const [managerList, setManagerList] = useState<ProgramManagerRow[]>(() =>
    getMockProgramManagers(programId)
  )
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false)
  const [managerForEditRole, setManagerForEditRole] = useState<ProgramManagerRow | null>(null)
  const [deleteGuideModalOpen, setDeleteGuideModalOpen] = useState(false)
  const [deleteFromEditManager, setDeleteFromEditManager] = useState<ProgramManagerRow | null>(
    null
  )

  useEffect(() => {
    setManagerList(getMockProgramManagers(programId))
    setSelectedRowKeys([])
    setManagerForEditRole(null)
    setEditRoleModalOpen(false)
    setDeleteGuideModalOpen(false)
    setDeleteFromEditManager(null)
  }, [programId])

  const existingManagerNames = useMemo(() => managerList.map(m => m.name), [managerList])

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

  const handleSearch = () => {
    setFilter('managerName', localManagerName)
    setAppliedFilters({
      managerName: localManagerName,
      role: filters.role,
    })
  }

  const handleDeleteClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('삭제할 담당자를 선택해 주세요.')
      return
    }
    setDeleteGuideModalOpen(true)
  }

  const handleViewDetailClick = () => {
    if (selectedRowKeys.length !== 1) {
      message.warning('정보 상세를 보려면 담당자를 한 명 선택해 주세요.')
      return
    }
    const id = String(selectedRowKeys[0])
    const row = managerList.find(r => r.id === id)
    if (row) {
      setManagerForEditRole(row)
      setEditRoleModalOpen(true)
    }
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
    return (
      <span className={`program-managers-tab__role-badge ${mod}`}>{label}</span>
    )
  }, [])

  const columns: ColumnsType<ProgramManagerRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
      {
        title: '담당자명',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
      },
      {
        title: '권한',
        dataIndex: 'role',
        key: 'role',
        width: 152,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
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
          />
        ),
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: 140,
        align: 'center',
        render: (phone: string) => maskPhoneDisplay(phone),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 180,
        align: 'center',
        ellipsis: true,
        render: (email: string) => maskEmailDisplay(email),
      },
      {
        title: '등록일시',
        dataIndex: 'registeredAt',
        key: 'registeredAt',
        width: 160,
        align: 'center',
      },
      {
        title: '관리',
        key: 'action',
        width: 120,
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
        <div className="program-managers-tab__filters">
          <div className="program-managers-tab__filter-row">
            <div className="program-managers-tab__filter-grow program-managers-tab__filter-col">
              <LabeledSearchInput
                label="담당자명"
                placeholder="담당자명을 입력하세요"
                value={localManagerName}
                onChange={setLocalManagerName}
                onBlur={() => setFilter('managerName', localManagerName)}
                width="100%"
                showPrefixIcon={false}
              />
            </div>
            <div className="program-managers-tab__filter-grow program-managers-tab__filter-col">
              <div className="program-managers-tab__filter-field">
                <span className="program-managers-tab__filter-label">권한</span>
                <Select
                  placeholder="전체"
                  value={filters.role}
                  onChange={v => setFilter('role', (v as string) ?? 'all')}
                  options={ROLE_OPTIONS}
                  getPopupContainer={() => document.body}
                  className="program-managers-tab__role-filter-select"
                />
              </div>
            </div>
            <div className="program-managers-tab__filter-actions">
              <AppButton variant="primary" size="filter" onClick={handleSearch}>
                조회
              </AppButton>
            </div>
          </div>
        </div>
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
            <AppButton
              variant="danger"
              size="large"
              dangerFillOnHover
              onClick={handleDeleteClick}
            >
              담당자 삭제
            </AppButton>
            <AppButton variant="primary" size="large" onClick={() => setAddModalOpen(true)}>
              담당자 등록
            </AppButton>
            <AppButton variant="primary" size="large" onClick={handleViewDetailClick}>
              정보상세 보기
            </AppButton>
          </div>
        </div>
        <Table<ProgramManagerRow>
          className="program-managers-tab__table"
          rowKey="id"
          size="middle"
          pagination={false}
          rowSelection={{
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
        excludeManagerNames={existingManagerNames}
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
