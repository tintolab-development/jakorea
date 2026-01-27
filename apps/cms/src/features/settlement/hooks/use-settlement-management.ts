/**
 * 정산 관리 훅 (관리자 UI용)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { MESSAGES } from '@/shared/constants'
import type { Settlement } from '@/types/domain'
import type { SettlementFormData } from '@/entities/settlement/model/schema'

export type SettlementTabKey = 'all' | 'pending' | 'review' | 'paid' | 'overview'
export type SettlementViewMode = 'list' | 'calendar'

interface UseSettlementManagementResult {
  settlements: Settlement[]
  loading: boolean
  viewMode: SettlementViewMode
  activeTab: SettlementTabKey
  selectedPeriod: string
  availablePeriods: string[]
  filteredSettlements: Settlement[]
  monthlySettlements: Settlement[]
  tabCounts: Record<SettlementTabKey, number>
  drawerOpen: boolean
  formModalOpen: boolean
  deleteModalOpen: boolean
  editingSettlement: Settlement | null
  settlementToDelete: Settlement | null
  selectedSettlement: Settlement | null
  setViewMode: (mode: SettlementViewMode) => void
  setTab: (key: SettlementTabKey) => void
  setPeriod: (period: string) => void
  openDrawer: (settlement: Settlement) => void
  closeDrawer: () => void
  openForm: (settlement?: Settlement) => void
  closeForm: () => void
  submitForm: (data: SettlementFormData) => Promise<void>
  openDeleteConfirm: (settlement: Settlement) => void
  closeDeleteConfirm: () => void
  confirmDelete: () => Promise<void>
  changeStatus: (settlement: Settlement, status: Settlement['status']) => Promise<void>
  handleCalendarSelect: (_date: dayjs.Dayjs, settlement?: Settlement) => void
}

interface SettlementQueryParams extends Record<string, string | undefined> {
  tab?: SettlementTabKey
  view?: SettlementViewMode
  period?: string
}

export function useSettlementManagement(): UseSettlementManagementResult {
  const location = useLocation()
  const { params, setParam } = useQueryParams<SettlementQueryParams>()

  const {
    settlements,
    loading,
    fetchSettlements,
    createSettlement,
    updateSettlement,
    deleteSettlement,
    updateStatus,
    selectedSettlement,
    setSelectedSettlement,
  } = useSettlementStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [settlementToDelete, setSettlementToDelete] = useState<Settlement | null>(null)

  useEffect(() => {
    const path = location.pathname
    if (path === '/settlements/pending' && !params.tab) {
      setParam('tab', 'pending')
    } else if (path === '/settlements/review' && !params.tab) {
      setParam('tab', 'review')
    } else if (path === '/settlements/paid' && !params.tab) {
      setParam('tab', 'paid')
    } else if (path === '/settlements/overview' && !params.tab) {
      setParam('tab', 'overview')
    }
  }, [location.pathname, params.tab, setParam])

  const viewMode = (params.view as SettlementViewMode) || 'list'
  const selectedPeriod = params.period || dayjs().format('YYYY-MM')
  const activeTab = (params.tab as SettlementTabKey) || 'all'

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>()
    settlements.forEach(s => {
      const period = s.period || dayjs(s.createdAt).format('YYYY-MM')
      periods.add(period)
    })
    return Array.from(periods).sort((a, b) => (a > b ? -1 : 1))
  }, [settlements])

  const filteredSettlements = useMemo(() => {
    let filtered = settlements
    if (activeTab === 'pending') {
      filtered = filtered.filter(s => s.status === 'pending')
    } else if (activeTab === 'review') {
      filtered = filtered.filter(s => s.status === 'review')
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(s => s.status === 'paid')
    }
    return filtered
  }, [settlements, activeTab])

  const monthlySettlements = useMemo(() => {
    return filteredSettlements.filter(s => {
      const period = s.period || dayjs(s.createdAt).format('YYYY-MM')
      return period === selectedPeriod
    })
  }, [filteredSettlements, selectedPeriod])

  const tabCounts = useMemo(() => {
    return {
      all: settlements.length,
      pending: settlements.filter(s => s.status === 'pending').length,
      review: settlements.filter(s => s.status === 'review').length,
      paid: settlements.filter(s => s.status === 'paid').length,
      overview: settlements.length,
    }
  }, [settlements])

  const setViewMode = useCallback(
    (mode: SettlementViewMode) => {
      setParam('view', mode)
    },
    [setParam]
  )

  const setTab = useCallback(
    (key: SettlementTabKey) => {
      setParam('tab', key)
    },
    [setParam]
  )

  const setPeriod = useCallback(
    (period: string) => {
      setParam('period', period)
    },
    [setParam]
  )

  const openDrawer = useCallback(
    (settlement: Settlement) => {
      setSelectedSettlement(settlement)
      setDrawerOpen(true)
    },
    [setSelectedSettlement]
  )

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedSettlement(null)
  }, [setSelectedSettlement])

  const openForm = useCallback((settlement?: Settlement) => {
    setEditingSettlement(settlement || null)
    setFormModalOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setFormModalOpen(false)
    setEditingSettlement(null)
  }, [])

  const submitForm = useCallback(
    async (data: SettlementFormData) => {
      try {
        if (editingSettlement) {
          await updateSettlement(editingSettlement.id, data)
          showSuccessMessage(MESSAGES.success.updated)
        } else {
          await createSettlement(data)
          showSuccessMessage(MESSAGES.success.created)
        }
        closeForm()
        fetchSettlements()
      } catch (error) {
        handleError(error, {
          defaultMessage: editingSettlement ? MESSAGES.error.update : MESSAGES.error.create,
          context: 'SettlementFormSubmit',
        })
      }
    },
    [closeForm, createSettlement, editingSettlement, fetchSettlements, updateSettlement]
  )

  const openDeleteConfirm = useCallback((settlement: Settlement) => {
    setSettlementToDelete(settlement)
    setDeleteModalOpen(true)
  }, [])

  const closeDeleteConfirm = useCallback(() => {
    setDeleteModalOpen(false)
    setSettlementToDelete(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!settlementToDelete) return

    try {
      await deleteSettlement(settlementToDelete.id)
      showSuccessMessage(MESSAGES.success.deleted)
      closeDeleteConfirm()
      if (selectedSettlement?.id === settlementToDelete.id) {
        closeDrawer()
      }
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'SettlementDelete',
      })
    }
  }, [
    closeDeleteConfirm,
    closeDrawer,
    deleteSettlement,
    selectedSettlement?.id,
    settlementToDelete,
  ])

  const changeStatus = useCallback(
    async (settlement: Settlement, status: Settlement['status']) => {
      try {
        await updateStatus(settlement.id, status)
        showSuccessMessage(MESSAGES.success.statusChanged(status))
      } catch (error) {
        handleError(error, {
          defaultMessage: MESSAGES.error.statusChangeFailed,
          context: 'SettlementStatusChange',
        })
      }
    },
    [updateStatus]
  )

  const handleCalendarSelect = useCallback(
    (_date: dayjs.Dayjs, settlement?: Settlement) => {
      if (settlement) {
        openDrawer(settlement)
      }
    },
    [openDrawer]
  )

  return {
    settlements,
    loading,
    viewMode,
    activeTab,
    selectedPeriod,
    availablePeriods,
    filteredSettlements,
    monthlySettlements,
    tabCounts,
    drawerOpen,
    formModalOpen,
    deleteModalOpen,
    editingSettlement,
    settlementToDelete,
    selectedSettlement,
    setViewMode,
    setTab,
    setPeriod,
    openDrawer,
    closeDrawer,
    openForm,
    closeForm,
    submitForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    changeStatus,
    handleCalendarSelect,
  }
}
