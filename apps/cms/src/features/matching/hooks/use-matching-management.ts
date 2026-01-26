/**
 * 매칭 관리 훅 (관리자 UI용)
 */

import { useCallback, useEffect, useState } from 'react'
import { Modal, message } from 'antd'
import { useMatchingStore } from '@/features/matching/model/matching-store'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { MESSAGES } from '@/shared/constants'
import type { Matching } from '@/types/domain'
import type { MatchingFormData } from '@/entities/matching/model/schema'

interface MatchingQueryParams extends Record<string, string | undefined> {
  programId?: string
}

interface UseMatchingManagementResult {
  matchings: Matching[]
  loading: boolean
  selectedMatching: Matching | null
  selectedProgramId?: string
  drawerOpen: boolean
  formModalOpen: boolean
  deleteModalOpen: boolean
  editingMatching: Matching | null
  matchingToDelete: Matching | null
  setProgramFilter: (programId?: string) => void
  openDrawer: (matching: Matching) => void
  closeDrawer: () => void
  openForm: (matching?: Matching) => void
  closeForm: () => void
  submitForm: (data: MatchingFormData) => Promise<void>
  openDeleteConfirm: (matching: Matching) => void
  closeDeleteConfirm: () => void
  confirmDelete: () => Promise<void>
  confirmMatching: (matching: Matching) => Promise<void>
  requestCancel: (matching: Matching) => void
}

export function useMatchingManagement(): UseMatchingManagementResult {
  const {
    matchings,
    loading,
    fetchMatchings,
    createMatching,
    updateMatching,
    deleteMatching,
    confirmMatching,
    cancelMatching,
    setSelectedMatching,
  } = useMatchingStore()

  const { params, setParams } = useQueryParams<MatchingQueryParams>()

  const [selectedMatching, setSelectedMatchingLocal] = useState<Matching | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [matchingToDelete, setMatchingToDelete] = useState<Matching | null>(null)
  const [editingMatching, setEditingMatching] = useState<Matching | null>(null)

  useEffect(() => {
    fetchMatchings()
  }, [fetchMatchings])

  const setProgramFilter = useCallback((programId?: string) => {
    setParams({ programId: programId || undefined })
  }, [setParams])

  const openDrawer = useCallback((matching: Matching) => {
    setSelectedMatchingLocal(matching)
    setSelectedMatching(matching)
    setDrawerOpen(true)
  }, [setSelectedMatching])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedMatchingLocal(null)
  }, [])

  const openForm = useCallback((matching?: Matching) => {
    setEditingMatching(matching || null)
    setFormModalOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setFormModalOpen(false)
    setEditingMatching(null)
  }, [])

  const submitForm = useCallback(async (data: MatchingFormData) => {
    try {
      if (editingMatching) {
        await updateMatching(editingMatching.id, data)
        message.success(MESSAGES.success.matchingUpdated)
      } else {
        await createMatching(data)
        message.success(MESSAGES.success.matchingCreated)
      }
      closeForm()
      fetchMatchings()
    } catch {
      message.error(editingMatching ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
    }
  }, [closeForm, createMatching, editingMatching, fetchMatchings, updateMatching])

  const openDeleteConfirm = useCallback((matching: Matching) => {
    setMatchingToDelete(matching)
    setDeleteModalOpen(true)
  }, [])

  const closeDeleteConfirm = useCallback(() => {
    setDeleteModalOpen(false)
    setMatchingToDelete(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!matchingToDelete) return

    try {
      await deleteMatching(matchingToDelete.id)
      message.success(MESSAGES.success.matchingDeleted)
      closeDeleteConfirm()
      if (selectedMatching?.id === matchingToDelete.id) {
        closeDrawer()
      }
      fetchMatchings()
    } catch {
      message.error(MESSAGES.error.matchingDeleteFailed)
    }
  }, [closeDeleteConfirm, closeDrawer, deleteMatching, fetchMatchings, matchingToDelete, selectedMatching?.id])

  const confirmMatchingStatus = useCallback(async (matching: Matching) => {
    try {
      await confirmMatching(matching.id)
      message.success(MESSAGES.success.matchingConfirmed)
      fetchMatchings()
    } catch {
      message.error(MESSAGES.error.matchingConfirmFailed)
    }
  }, [confirmMatching, fetchMatchings])

  const requestCancel = useCallback((matching: Matching) => {
    Modal.confirm({
      title: '매칭 취소',
      content: '정말 이 매칭을 취소하시겠습니까?',
      onOk: async () => {
        try {
          await cancelMatching(matching.id, '사용자 요청')
          message.success(MESSAGES.success.matchingCancelled)
          fetchMatchings()
        } catch {
          message.error(MESSAGES.error.matchingCancelFailed)
        }
      },
    })
  }, [cancelMatching, fetchMatchings])

  return {
    matchings,
    loading,
    selectedMatching,
    selectedProgramId: params.programId,
    drawerOpen,
    formModalOpen,
    deleteModalOpen,
    editingMatching,
    matchingToDelete,
    setProgramFilter,
    openDrawer,
    closeDrawer,
    openForm,
    closeForm,
    submitForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    confirmMatching: confirmMatchingStatus,
    requestCancel,
  }
}
