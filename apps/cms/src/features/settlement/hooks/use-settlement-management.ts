/**
 * 정산 관리 훅 (관리자 UI용)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
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

export function useSettlementManagement(): UseSettlementManagementResult {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

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
    if (path === '/settlements/pending' && !searchParams.get('tab')) {
      setSearchParams({ tab: 'pending' }, { replace: true })
    } else if (path === '/settlements/review' && !searchParams.get('tab')) {
      setSearchParams({ tab: 'review' }, { replace: true })
    } else if (path === '/settlements/paid' && !searchParams.get('tab')) {
      setSearchParams({ tab: 'paid' }, { replace: true })
    } else if (path === '/settlements/overview' && !searchParams.get('tab')) {
      setSearchParams({ tab: 'overview' }, { replace: true })
    }
  }, [location.pathname, searchParams, setSearchParams])

  const viewMode = (searchParams.get('view') as SettlementViewMode) || 'list'
  const selectedPeriod = searchParams.get('period') || dayjs().format('YYYY-MM')
  const activeTab = (searchParams.get('tab') as SettlementTabKey) || 'all'

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

  const setViewMode = useCallback((mode: SettlementViewMode) => {
    const next = new URLSearchParams(searchParams)
    next.set('view', mode)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const setTab = useCallback((key: SettlementTabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', key)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const setPeriod = useCallback((period: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('period', period)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const openDrawer = useCallback((settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setDrawerOpen(true)
  }, [setSelectedSettlement])

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

  const submitForm = useCallback(async (data: SettlementFormData) => {
    try {
      if (editingSettlement) {
        await updateSettlement(editingSettlement.id, data)
        showSuccessMessage('정산이 수정되었습니다')
      } else {
        await createSettlement(data)
        showSuccessMessage('정산이 등록되었습니다')
      }
      closeForm()
      fetchSettlements()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingSettlement ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다',
        context: 'SettlementFormSubmit',
      })
    }
  }, [closeForm, createSettlement, editingSettlement, fetchSettlements, updateSettlement])

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
      showSuccessMessage('정산이 삭제되었습니다')
      closeDeleteConfirm()
      if (selectedSettlement?.id === settlementToDelete.id) {
        closeDrawer()
      }
    } catch (error) {
      handleError(error, {
        defaultMessage: '삭제 중 오류가 발생했습니다',
        context: 'SettlementDelete',
      })
    }
  }, [closeDeleteConfirm, closeDrawer, deleteSettlement, selectedSettlement?.id, settlementToDelete])

  const changeStatus = useCallback(async (settlement: Settlement, status: Settlement['status']) => {
    try {
      await updateStatus(settlement.id, status)
      showSuccessMessage(`상태가 "${status}"로 변경되었습니다`)
    } catch (error) {
      handleError(error, {
        defaultMessage: '상태 변경 중 오류가 발생했습니다',
        context: 'SettlementStatusChange',
      })
    }
  }, [updateStatus])

  const handleCalendarSelect = useCallback((_date: dayjs.Dayjs, settlement?: Settlement) => {
    if (settlement) {
      openDrawer(settlement)
    }
  }, [openDrawer])

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
