/**
 * 프로그램 상세 - 담당자 정보 탭
 * 필터(담당자명, 권한) + 조회 + 담당자 목록 테이블 + 삭제/등록/권한 수정
 */

import { useMemo, useState } from 'react'
import { Card, Table, Row, Col, Select, message } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
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
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import {
  AddManagerModal,
  buildManagerRowFromForm,
  type AddManagerFormValues,
} from './add-manager-modal'
import { EditManagerRoleModal } from './edit-manager-role-modal'
import { ManagerDeleteGuideModal } from './manager-delete-guide-modal'
import './program-managers-tab.css'

const ROLE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: PROGRAM_ROLE_LABELS.OWNER, value: 'OWNER' },
  { label: PROGRAM_ROLE_LABELS.PARTNER, value: 'PARTNER' },
  { label: PROGRAM_ROLE_LABELS.ASSISTANT, value: 'ASSISTANT' },
]

interface ProgramManagersTabProps {
  programId: string
}

export function ProgramManagersTab({ programId: _programId }: ProgramManagersTabProps) {
  const { filters, setFilter } = useProgramManagersParams()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [appliedFilters, setAppliedFilters] = useState<ProgramManagersFilters>(filters)
  const [managerList, setManagerList] = useState<ProgramManagerRow[]>(() => [
    ...MOCK_PROGRAM_MANAGERS,
  ])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false)
  const [managerForEditRole, setManagerForEditRole] = useState<ProgramManagerRow | null>(null)
  const [deleteGuideModalOpen, setDeleteGuideModalOpen] = useState(false)
  /** 권한 수정 모달 내 "담당자 삭제"로 열린 경우 해당 담당자 (삭제 안내 모달 연동) */
  const [deleteFromEditManager, setDeleteFromEditManager] = useState<ProgramManagerRow | null>(null)

  const filteredManagers = useMemo(() => {
    return managerList.filter(row => {
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
  }, [managerList, appliedFilters])

  const handleSearch = () => {
    setAppliedFilters(filters)
  }

  const handleDeleteClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('삭제할 담당자를 선택해 주세요.')
      return
    }
    setDeleteGuideModalOpen(true)
  }

  const managerNamesToDeleteFromTable = useMemo(() => {
    const keysSet = new Set(selectedRowKeys.map(String))
    return managerList.filter(row => keysSet.has(row.id)).map(row => row.name)
  }, [selectedRowKeys, managerList])

  /** 삭제 안내 모달에 표시할 이름 목록: 권한 수정 모달에서 연 경우 1명, 테이블 삭제 버튼이면 선택된 N명 */
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
    const nextNo = managerList.length > 0 ? Math.max(...managerList.map(r => r.no)) + 1 : 1
    const nextId = `manager-new-${Date.now()}`
    const newRow = buildManagerRowFromForm(values, nextNo, nextId)
    setManagerList(prev => [newRow, ...prev])
    message.success('담당자가 등록되었습니다.')
  }

  const openEditRoleModal = (record: ProgramManagerRow) => {
    setManagerForEditRole(record)
    setEditRoleModalOpen(true)
  }

  const handleSaveRole = (role: ProgramRole) => {
    if (!managerForEditRole) return
    setManagerList(prev =>
      prev.map(row => (row.id === managerForEditRole.id ? { ...row, role } : row))
    )
    message.success('권한이 수정되었습니다.')
    setManagerForEditRole(null)
    setEditRoleModalOpen(false)
  }

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
        width: 100,
        align: 'center',
        render: (role: ProgramRole) => {
          const label = PROGRAM_ROLE_LABELS[role]
          return role === 'OWNER' ? (
            <span className="program-managers-tab__role-pm">{label}</span>
          ) : (
            label
          )
        },
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: 140,
        align: 'center',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 180,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '등록일시',
        dataIndex: 'registeredAt',
        key: 'registeredAt',
        width: 140,
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
    []
  )

  return (
    <div className="program-managers-tab">
      <Card className="program-managers-tab__card" bordered={false}>
        <div className="program-managers-tab__top">
          <div className="program-managers-tab__filters">
            <Row
              gutter={[12, 12]}
              align="middle"
              wrap={false}
              className="program-managers-tab__filter-row"
            >
              <Col
                flex="0 1 auto"
                className="program-managers-tab__filter-col program-managers-tab__filter-col--search"
              >
                <LabeledSearchInput
                  label="담당자명"
                  placeholder="전체"
                  value={filters.managerName ?? ''}
                  onChange={v => setFilter('managerName', v)}
                  width="100%"
                  showPrefixIcon={false}
                />
              </Col>
              <Col flex="0 1 auto" className="program-managers-tab__filter-col">
                <div className="program-managers-tab__filter-field">
                  <span className="program-managers-tab__filter-label">권한</span>
                  <Select
                    placeholder="전체"
                    value={filters.role || undefined}
                    onChange={v => setFilter('role', v ?? 'all')}
                    allowClear
                    options={ROLE_OPTIONS}
                    getPopupContainer={() => document.body}
                  />
                </div>
              </Col>
              <Col flex="none" className="program-managers-tab__filter-col--btn">
                <AppButton variant="primary" size="filter" onClick={handleSearch}>
                  조회
                </AppButton>
              </Col>
            </Row>
          </div>
        </div>

        <div className="program-managers-tab__divider" />
        <div className="program-managers-tab__below-divider">
          <div className="program-managers-tab__table-header">
            <div className="program-managers-tab__table-heading">
              <span className="program-managers-tab__table-title">담당자 목록</span>
              <span className="program-managers-tab__table-description">
                총 {filteredManagers.length}건
              </span>
            </div>
            <div className="program-managers-tab__table-actions">
              <AppButton
                variant="danger"
                size="large"
                dangerFillOnHover
                onClick={handleDeleteClick}
              >
                삭제
              </AppButton>
              <AppButton variant="primary" size="large" onClick={() => setAddModalOpen(true)}>
                등록
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
      </Card>

      <AddManagerModal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onAdd={handleAdd}
      />

      <EditManagerRoleModal
        open={editRoleModalOpen}
        onCancel={() => {
          setEditRoleModalOpen(false)
          setManagerForEditRole(null)
        }}
        manager={managerForEditRole}
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
