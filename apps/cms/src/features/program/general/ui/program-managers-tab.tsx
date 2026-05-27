/**
 * 프로그램 상세 - 담당자 정보 탭
 * 필터(담당자명, 권한) + 조회 + 담당자 목록 테이블 + 삭제/등록/개인정보 상세보기
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Table } from 'antd'
import { CmsButton } from '@/shared/ui'
import { UnifiedFilterCard, type FilterFieldConfig } from '@/shared/ui/unified-filter-card'
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
import { canAddProgramPm, canSetProgramManagerRole } from '@/entities/program/lib/program-pm-role-policy'
import {
  AddManagerModal,
  buildManagerRowFromForm,
  type AddManagerFormValues,
} from './add-manager-modal'
import { ManagerDeleteGuideModal } from './manager-delete-guide-modal'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import './program-managers-tab.css'

const ROLE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: PROGRAM_ROLE_LABELS.OWNER, value: 'OWNER' },
  { label: PROGRAM_ROLE_LABELS.PARTNER, value: 'PARTNER' },
  { label: PROGRAM_ROLE_LABELS.ASSISTANT, value: 'ASSISTANT' },
]

const TABLE_ROLE_ORDER: ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

interface ProgramManagersTabProps {
  programId: string
}

export function ProgramManagersTab({ programId }: ProgramManagersTabProps) {
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
        width: 240,
      },
      {
        key: 'role',
        type: 'select',
        label: '권한',
        placeholder: '전체',
        options: ROLE_OPTIONS,
        width: 240,
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

  const [managerList, setManagerList] = useState<ProgramManagerRow[]>(() =>
    getMockProgramManagers(programId)
  )
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteGuideModalOpen, setDeleteGuideModalOpen] = useState(false)

  useEffect(() => {
    setManagerList(getMockProgramManagers(programId))
    setSelectedRowKeys([])
    setOpenRoleDropdownId(null)
  }, [programId])

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

  const resolveProgramManagerPersonalInfoAccessItem = useCallback(() => {
    if (selectedRowKeys.length !== 1) return '담당자 목록'
    return managerList.find(row => row.id === String(selectedRowKeys[0]))?.name ?? '담당자 목록'
  }, [managerList, selectedRowKeys])

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handleProgramManagersPrivacyClick,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolveProgramManagerPersonalInfoAccessItem,
    resetDeps: [programId],
    controlMode: 'toggleRemask',
  })

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

  const handleDeleteConfirm = () => {
    const keysToDelete = new Set(selectedRowKeys.map(String))
    setManagerList(prev => prev.filter(row => !keysToDelete.has(row.id)))
    setSelectedRowKeys([])
    setDeleteGuideModalOpen(false)
  }

  const handleDeleteGuideCancel = () => {
    setDeleteGuideModalOpen(false)
  }

  const handleAdd = (values: AddManagerFormValues) => {
    if (values.role === 'OWNER' && !canAddProgramPm(managerList)) {
      return
    }
    const nextNo = managerList.length > 0 ? Math.max(...managerList.map(r => r.no)) + 1 : 1
    const nextId = `manager-new-${Date.now()}`
    const newRow = buildManagerRowFromForm(values, nextNo, nextId)
    setManagerList(prev => [newRow, ...prev])
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
        setOpenRoleDropdownId(null)
        return
      }
      setManagerList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, role: newRole } : row))
      )
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
        render: (phone: string) => {
          const value = phone?.trim()
          if (!value) return '-'
          return personalInfoRevealed ? value : MASKING_POLICY.phone(value)
        },
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 246,
        align: 'center',
        ellipsis: true,
        render: (email: string) => {
          const value = email?.trim()
          if (!value) return '-'
          return personalInfoRevealed ? value : MASKING_POLICY.email(value)
        },
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
      openRoleDropdownId,
      renderRoleBadge,
      roleItemDisabled,
      personalInfoRevealed,
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
            <CmsButton variant="delete" size="large" width={160} onClick={handleDeleteClick}>
              담당자 삭제
            </CmsButton>
            <CmsButton variant="primary" size="large" width={160} onClick={() => setAddModalOpen(true)}>
              담당자 등록
            </CmsButton>
            <PersonalInfoRevealButton
              labelMode="toggle"
              revealed={personalInfoRevealed}
              style={{ minWidth: 180 }}
              onClick={handleProgramManagersPrivacyClick}
            />
          </div>
        </div>
        <Table<ProgramManagerRow>
          className="cms-data-table cms-data-table--fluid program-managers-tab__managers-table"
          rowKey="id"
          pagination={false}
          rowSelection={{
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
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

      <ManagerDeleteGuideModal
        open={deleteGuideModalOpen}
        onCancel={handleDeleteGuideCancel}
        managerNames={managerNamesToDelete}
        onConfirm={handleDeleteConfirm}
      />
      {personalInfoRevealModal}
    </div>
  )
}
