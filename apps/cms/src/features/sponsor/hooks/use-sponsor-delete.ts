import { useCallback, useState } from 'react'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'

export interface UseSponsorDeleteReturn {
  deleteModalOpen: boolean
  deleteBlockedModalOpen: boolean
  openDeleteModal: () => void
  cancelDelete: () => void
  closeBlockedModal: () => void
  handleConfirm: () => void
}

/**
 * 후원사 삭제 확인·프로그램 보유 시 차단 모달 상태와 확인 흐름을 관리합니다.
 */
export function useSponsorDelete(
  sponsor: SponsorManagementRow,
  canWrite: boolean,
  onDeleteSponsor: ((sponsorId: string) => void) | undefined,
  onClose: () => void
): UseSponsorDeleteReturn {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteBlockedModalOpen, setDeleteBlockedModalOpen] = useState(false)

  const openDeleteModal = useCallback((): void => {
    if (!canWrite) return
    setDeleteModalOpen(true)
  }, [canWrite])

  const cancelDelete = useCallback((): void => {
    setDeleteModalOpen(false)
  }, [])

  const closeBlockedModal = useCallback((): void => {
    setDeleteBlockedModalOpen(false)
  }, [])

  const handleConfirm = useCallback((): void => {
    if ((sponsor.programCount ?? 0) > 0) {
      setDeleteModalOpen(false)
      setDeleteBlockedModalOpen(true)
      return
    }
    onDeleteSponsor?.(sponsor.id)
    setDeleteModalOpen(false)
    onClose()
  }, [onClose, onDeleteSponsor, sponsor.id, sponsor.programCount])

  return {
    deleteModalOpen,
    deleteBlockedModalOpen,
    openDeleteModal,
    cancelDelete,
    closeBlockedModal,
    handleConfirm,
  }
}
