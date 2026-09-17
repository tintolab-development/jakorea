import { useCallback, useMemo } from 'react'
import { Flex, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import { buildContactColumns } from '@/features/sponsor/columns/sponsor-contact-columns'
import type { UseSponsorContactsReturn } from '@/features/sponsor/hooks/use-sponsor-contacts'
import type { UseContactsListReturn } from '@/features/sponsor/hooks/use-contacts-list'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { SponsorContactDeleteModal } from '@/features/sponsor/ui/modal/sponsor-contact-delete-modal'
import { SponsorContactTypeChangeBlockedModal } from '@/features/sponsor/ui/modal/sponsor-contact-type-change-blocked-modal'
import {
  SPONSOR_CONTACT_OFFICE_PHONE_FORMAT_MESSAGE,
  SPONSOR_CONTACT_PHONE_FORMAT_MESSAGE,
  isValidSponsorOfficePhone,
} from '@/features/sponsor/model/sponsor-contact-register-schema'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS, TABLE_CONFIG } from '@/shared/constants/table'

const contactFilterFields: FilterFieldConfig[] = [
  {
    key: 'department',
    type: 'search',
    label: '부서',
    placeholder: '부서명을 입력하세요',
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
    typeChangeBlockedModalOpen,
    setTypeChangeBlockedModalOpen,
    selectedNames,
    isEditing,
    isSavingEdits,
    isDeleting,
    draftRows,
    startEdit,
    saveEdits,
    handleDelete,
  } = contactsProps
  const { showAlert } = useCmsAlert()
  const { pendingFilters, filteredRows, isLoading, handleFilterChange, handleSearch } = contactsList

  const handleRegisterClick = useCallback((): void => {
    if (!canWrite) return
    setRegisterModalOpen(true)
  }, [canWrite, setRegisterModalOpen])

  const handleDeleteClick = useCallback((): void => {
    if (!canWrite || isEditing || isDeleting) return
    if (selectedKeys.length === 0) {
      showAlert({
        title: '항목 선택 안내',
        content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
      })
      return
    }
    setDeleteModalOpen(true)
  }, [
    canWrite,
    isDeleting,
    isEditing,
    selectedKeys.length,
    setDeleteModalOpen,
    showAlert,
  ])

  const handleDeleteCancel = useCallback((): void => {
    if (isDeleting) return
    setDeleteModalOpen(false)
  }, [isDeleting, setDeleteModalOpen])

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    try {
      await handleDelete()
    } catch (error) {
      showAlert({
        title: '안내',
        content: getDataManagementApiErrorMessage(
          error,
          '후원사 담당자 삭제에 실패했습니다.'
        ),
      })
    }
  }, [handleDelete, showAlert])

  const handleToggleEdit = useCallback(async (): Promise<void> => {
    if (!canWrite || isSavingEdits) return
    if (!isEditing) {
      startEdit(filteredRows)
      return
    }
    const result = await saveEdits()
    if (result === 'invalid') {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    if (result === 'invalid-format') {
      const officeInvalid = draftRows.some(row => {
        const officePhone = row.officePhone.trim()
        return officePhone.length > 0 && !isValidSponsorOfficePhone(officePhone)
      })
      showAlert({
        title: '안내',
        content: officeInvalid
          ? SPONSOR_CONTACT_OFFICE_PHONE_FORMAT_MESSAGE
          : SPONSOR_CONTACT_PHONE_FORMAT_MESSAGE,
      })
    }
  }, [canWrite, draftRows, filteredRows, isEditing, isSavingEdits, saveEdits, showAlert, startEdit])

  const tableRows = isEditing ? draftRows : filteredRows
  const excelColumns = useMemo(
    () =>
      buildContactColumns({
        contacts: tableRows,
        canWrite: false,
        isEditing: false,
        openDropdownId: null,
        onTypeChange: () => undefined,
        onDropdownOpenChange: () => undefined,
      }),
    [tableRows]
  )

  return (
    <Flex vertical gap="middle">
      <FilterTableLayout
        bordered={false}
        fields={contactFilterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="담당자 목록"
        description={`${tableRows.length.toLocaleString()}건`}
        toolbarAdminAction="sponsorContactWrite"
        excelExport={{ columns: excelColumns, data: tableRows }}
        actions={
          <>
            <CmsButton
              variant="delete"
              size="medium"
              onClick={handleDeleteClick}
              disabled={!canWrite || isEditing || isDeleting}
              loading={isDeleting}
              adminAction="sponsorContactWrite"
            >
              담당자 삭제
            </CmsButton>
            {canWrite ? (
              <CmsButton
                variant="secondary"
                size="medium"
                onClick={() => void handleToggleEdit()}
                disabled={isSavingEdits}
              >
                {isEditing ? '수정 완료' : '정보 수정'}
              </CmsButton>
            ) : null}
            <CmsButton
              variant="primary"
              size="medium"
              onClick={handleRegisterClick}
              disabled={isEditing}
            >
              담당자 등록
            </CmsButton>
          </>
        }
      >
        <Table<SponsorContactRow>
          rowKey="id"
          className="cms-data-table"
          columns={columns}
          dataSource={tableRows}
          loading={isLoading}
          pagination={false}
          scroll={TABLE_CONFIG.scroll}
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
        onConfirm={handleDeleteConfirm}
        contactNames={selectedNames}
        confirmLoading={isDeleting}
      />
      <SponsorContactTypeChangeBlockedModal
        open={typeChangeBlockedModalOpen}
        onClose={() => setTypeChangeBlockedModalOpen(false)}
      />
    </Flex>
  )
}
