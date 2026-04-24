import { useCallback } from 'react'
import { Flex } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import type { UseSponsorContactsReturn } from '@/features/sponsor/hooks/use-sponsor-contacts'
import {
  type BasicInfoEditState,
  SponsorBasicInfoSection,
  SponsorContactsSection,
} from '@/features/sponsor/ui/sponsor-detail-basic-info'

export interface SponsorDetailPanelProps {
  basicInfo: BasicInfoEditState
  isEditing: boolean
  onChange: (updater: (prev: BasicInfoEditState) => BasicInfoEditState) => void
  contacts: SponsorContactRow[]
  canWrite: boolean
  contactsProps: UseSponsorContactsReturn
  columns: ColumnsType<SponsorContactRow>
}

/**
 * 후원사 상세 LNB의 “후원사 상세 정보” 탭 본문(기본 정보 + 담당자)입니다.
 */
export function SponsorDetailPanel({
  basicInfo,
  isEditing,
  onChange,
  contacts,
  canWrite,
  contactsProps,
  columns,
}: SponsorDetailPanelProps) {
  const {
    selectedKeys,
    setSelectedKeys,
    setRegisterModalOpen,
    setDeleteModalOpen,
    deleteModalOpen,
    selectedNames,
    handleDelete,
  } = contactsProps

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
    <Flex vertical gap="large">
      <SponsorBasicInfoSection
        value={basicInfo}
        isEditing={isEditing}
        onChange={onChange}
        canWrite={canWrite}
      />
      <SponsorContactsSection
        contacts={contacts}
        canWrite={canWrite}
        selectedContactKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        columns={columns}
        onDeleteClick={handleDeleteClick}
        onRegisterClick={handleRegisterClick}
        deleteModalOpen={deleteModalOpen}
        deleteTargetNames={selectedNames}
        onDeleteCancel={handleDeleteCancel}
        onDeleteConfirm={handleDelete}
      />
    </Flex>
  )
}
