import { useCallback, useMemo, useState } from 'react'
import { Flex } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import { buildContactColumns } from '@/features/sponsor/columns/sponsor-contact-columns'
import type { UseSponsorContactsReturn } from '@/features/sponsor/hooks/use-sponsor-contacts'
import type { UseContactsListReturn } from '@/features/sponsor/hooks/use-contacts-list'
import {
  isSponsorContactInUseDeleteError,
  SPONSOR_CONTACT_DELETE_IN_USE_MESSAGE,
} from '@/features/sponsor/lib/sponsor-contact-delete-copy'
import { resolveDeleteBlockedGuideCopy } from '@/shared/lib/delete-blocked-guide-copy'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { SponsorContactDeleteModal } from '@/features/sponsor/ui/modal/sponsor-contact-delete-modal'
import { SponsorContactTypeChangeBlockedModal } from '@/features/sponsor/ui/modal/sponsor-contact-type-change-blocked-modal'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  SPONSOR_CONTACT_PHONE_FORMAT_MESSAGE,
} from '@/features/sponsor/model/sponsor-contact-register-schema'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { useCmsAlert,
  FilterTableToolbarButton
} from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'

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
    cancelEdit,
    saveEdits,
    handleDelete,
  } = contactsProps
  const { showAlert } = useCmsAlert()
  const { pendingFilters, filteredRows, isLoading, handleFilterChange, handleSearch } = contactsList
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteBlockedSelectedCount, setDeleteBlockedSelectedCount] = useState(1)

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    {
      includeSelection: canWrite,
      selectionWidth: TABLE_COLUMN_WIDTHS.checkbox,
    }
  )

  const deleteBlockedCopy = useMemo(
    () =>
      resolveDeleteBlockedGuideCopy({
        entityLabel: '후원 담당자',
        reasonLine: SPONSOR_CONTACT_DELETE_IN_USE_MESSAGE,
        selectedCount: deleteBlockedSelectedCount,
      }),
    [deleteBlockedSelectedCount]
  )

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
      if (isSponsorContactInUseDeleteError(error)) {
        setDeleteModalOpen(false)
        setDeleteBlockedSelectedCount(selectedKeys.length)
        setDeleteBlockedOpen(true)
        return
      }
      showAlert({
        title: '안내',
        content: '후원사 담당자 삭제에 실패했습니다.',
      })
    }
  }, [handleDelete, selectedKeys.length, setDeleteModalOpen, showAlert])

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
      showAlert({
        title: '안내',
        content: SPONSOR_CONTACT_PHONE_FORMAT_MESSAGE,
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
        excelExport={{
          columns: excelColumns,
          data: tableRows,
          selectedRowKeys: selectedKeys,
        }}
        actions={
          <>
            {isEditing ? (
              <>
                <FilterTableToolbarButton
                  variant="secondary"
                  onClick={cancelEdit}
                  disabled={isSavingEdits}
                  adminAction="sponsorContactWrite" >
                  취소
                </FilterTableToolbarButton>
                <FilterTableToolbarButton
                  variant="primary"
                  onClick={() => void handleToggleEdit()}
                  loading={isSavingEdits}
                  disabled={isSavingEdits}
                  adminAction="sponsorContactWrite" >
                  저장
                </FilterTableToolbarButton>
              </>
            ) : (
              <>
                <FilterTableToolbarButton
                  variant="delete"
                  onClick={handleDeleteClick}
                  disabled={!canWrite || isDeleting}
                  loading={isDeleting}
                  adminAction="sponsorContactWrite" >
                  담당자 삭제
                </FilterTableToolbarButton>
                {canWrite ? (
                  <FilterTableToolbarButton
                    variant="secondary"
                    onClick={() => void handleToggleEdit()} >
                    정보 수정
                  </FilterTableToolbarButton>
                ) : null}
                <FilterTableToolbarButton
                  variant="primary"
                  onClick={handleRegisterClick} >
                  담당자 등록
                </FilterTableToolbarButton>
              </>
            )}
          </>
        }
      >
        <div ref={tableWrapRef} className="cms-data-table-fit-scroll-wrap">
          <CmsDataTable<SponsorContactRow>
            rowKey="id"
            className="cms-data-table cms-data-table--fluid"
            columns={columns}
            dataSource={tableRows}
            loading={isLoading}
            pagination={false}
            scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
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
        </div>
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
      <DeleteBlockedGuideModal
        open={deleteBlockedOpen}
        onClose={() => setDeleteBlockedOpen(false)}
        title={deleteBlockedCopy.title}
        description={deleteBlockedCopy.description}
      />
    </Flex>
  )
}
