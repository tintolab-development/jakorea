import { useCallback } from 'react'
import { Flex, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import type { UseSponsorContactsReturn } from '@/features/sponsor/hooks/use-sponsor-contacts'
import type { UseContactsListReturn } from '@/features/sponsor/hooks/use-contacts-list'
import { SponsorContactDeleteModal } from '@/features/sponsor/ui/modal/sponsor-contact-delete-modal'
import {
  FilterTableLayout,
  type FilterFieldConfig,
} from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { CmsButton } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'

const contactFilterFields: FilterFieldConfig[] = [
  {
    key: 'department',
    type: 'search',
    label: '부서',
    placeholder: '부서를 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'position',
    type: 'search',
    label: '직함',
    placeholder: '직함을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'name',
    type: 'search',
    label: '담당자명',
    placeholder: '담당자명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
]

export interface SponsorContactsPanelProps {
  canWrite: boolean
  contactsProps: UseSponsorContactsReturn
  columns: ColumnsType<SponsorContactRow>
  contactsList: UseContactsListReturn
}

/**
 * 후원사 상세 LNB — 후원사 담당자 정보
 */
export function SponsorContactsPanel({
  canWrite,
  contactsProps,
  columns,
  contactsList,
}: SponsorContactsPanelProps) {
  const {
    selectedKeys,
    setSelectedKeys,
    setRegisterModalOpen,
    setDeleteModalOpen,
    deleteModalOpen,
    selectedNames,
    handleDelete,
  } = contactsProps
  const {
    pendingFilters,
    filteredRows,
    isLoading,
    handleFilterChange,
    handleSearch,
  } = contactsList

  const handleRegisterClick = useCallback((): void => {
    if (!canWrite) return
    setRegisterModalOpen(true)
  }, [canWrite, setRegisterModalOpen])

  const handleDeleteClick = useCallback((): void => {
    if (!canWrite || selectedKeys.length === 0) return
    setDeleteModalOpen(true)
  }, [canWrite, selectedKeys.length, setDeleteModalOpen])

  const handleDeleteCancel = useCallback((): void => {
    setDeleteModalOpen(false)
  }, [setDeleteModalOpen])

  return (
    <Flex vertical gap="middle">
      <FilterTableLayout
        bordered={false}
        fields={contactFilterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="담당자 목록"
        description={`${filteredRows.length.toLocaleString()}건`}
        actions={
          <>
            <CmsButton
              variant="delete"
              size="medium"
              onClick={handleDeleteClick}
              disabled={selectedKeys.length === 0}
            >
              담당자 삭제
            </CmsButton>
            <CmsButton variant="primary" size="medium" onClick={handleRegisterClick}>
              담당자 등록
            </CmsButton>
          </>
        }
      >
        <Table<SponsorContactRow>
          rowKey="id"
          className="cms-data-table"
          columns={columns}
          dataSource={filteredRows}
          loading={isLoading}
          pagination={false}
          rowSelection={
            canWrite
              ? {
                  columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                  selectedRowKeys: selectedKeys,
                  onChange: setSelectedKeys,
                  preserveSelectedRowKeys: false,
                }
              : undefined
          }
        />
      </FilterTableLayout>
      <SponsorContactDeleteModal
        open={deleteModalOpen}
        onCancel={handleDeleteCancel}
        onConfirm={handleDelete}
        contactNames={selectedNames}
      />
    </Flex>
  )
}
