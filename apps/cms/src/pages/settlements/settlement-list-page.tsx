/**
 * 정산 목록 페이지
 * Phase 4: 목록 페이지
 * - 관리자 화면에서 리스트/캘린더 두 가지 형태로 보기 제공
 */

import { useState, useEffect, useMemo } from 'react'
import { Button, Space, Modal, Radio, Card, Select } from 'antd'
import { PlusOutlined, CalendarOutlined, SettingOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SettlementList } from '@/features/settlement/ui/settlement-list'
import { SettlementDetailDrawer } from '@/features/settlement/ui/settlement-detail-drawer'
import { SettlementForm } from '@/features/settlement/ui/settlement-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import type { Settlement } from '@/types/domain'
import type { SettlementFormData } from '@/entities/settlement/model/schema'
import { SettlementCalendar } from '@/features/settlement/ui/settlement-calendar'
import dayjs from 'dayjs'

export function SettlementListPage() {
  const navigate = useNavigate()
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
  const [formLoading, setFormLoading] = useState(false)

  type ViewMode = 'list' | 'calendar'
  const viewMode = (searchParams.get('view') as ViewMode) || 'list'
  const selectedPeriod = searchParams.get('period') || dayjs().format('YYYY-MM')

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>()
    settlements.forEach(s => {
      const period = s.period || dayjs(s.createdAt).format('YYYY-MM')
      periods.add(period)
    })
    // 최근 순 정렬
    return Array.from(periods).sort((a, b) => (a > b ? -1 : 1))
  }, [settlements])

  const monthlySettlements = useMemo(() => {
    return settlements.filter(s => {
      const period = s.period || dayjs(s.createdAt).format('YYYY-MM')
      return period === selectedPeriod
    })
  }, [settlements, selectedPeriod])

  const handleView = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setDrawerOpen(true)
  }

  const handleEdit = (settlement: Settlement) => {
    setEditingSettlement(settlement)
    setDrawerOpen(false)
    setFormModalOpen(true)
  }

  const handleDeleteClick = (settlement: Settlement) => {
    setSettlementToDelete(settlement)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!settlementToDelete) return

    try {
      await deleteSettlement(settlementToDelete.id)
      showSuccessMessage('정산이 삭제되었습니다')
      setDeleteModalOpen(false)
      setSettlementToDelete(null)
      if (selectedSettlement?.id === settlementToDelete.id) {
        setDrawerOpen(false)
        setSelectedSettlement(null)
      }
    } catch (error) {
      handleError(error, {
        defaultMessage: '삭제 중 오류가 발생했습니다',
        context: 'SettlementDelete',
      })
    }
  }

  const handleStatusChange = async (settlement: Settlement, status: Settlement['status']) => {
    try {
      await updateStatus(settlement.id, status)
      showSuccessMessage(`상태가 "${status}"로 변경되었습니다`)
      // updateStatus가 Zustand 스토어의 settlements와 selectedSettlement를 함께 갱신하므로
      // 여기서는 별도의 selectedSettlement 수동 업데이트가 필요 없음
    } catch (error) {
      handleError(error, {
        defaultMessage: '상태 변경 중 오류가 발생했습니다',
        context: 'SettlementStatusChange',
      })
    }
  }

  const handleStatusChangeInDrawer = async (status: Settlement['status']) => {
    if (!selectedSettlement) return
    await handleStatusChange(selectedSettlement, status)
  }

  const handleFormSubmit = async (data: SettlementFormData) => {
    setFormLoading(true)
    try {
      if (editingSettlement) {
        await updateSettlement(editingSettlement.id, data)
        showSuccessMessage('정산이 수정되었습니다')
      } else {
        await createSettlement(data)
        showSuccessMessage('정산이 등록되었습니다')
      }
      setFormModalOpen(false)
      setEditingSettlement(null)
      fetchSettlements()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingSettlement ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다',
        context: 'SettlementFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setFormModalOpen(false)
    setEditingSettlement(null)
  }

  const handleNewClick = () => {
    setEditingSettlement(null)
    setFormModalOpen(true)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    const next = new URLSearchParams(searchParams)
    next.set('view', mode)
    setSearchParams(next, { replace: true })
  }

  const handlePeriodChange = (period: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('period', period)
    setSearchParams(next, { replace: true })
  }

  const handleCalendarSelect = (_date: dayjs.Dayjs, settlement?: Settlement) => {
    if (settlement) {
      handleView(settlement)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>정산 관리</h1>
        <Space>
          <Radio.Group value={viewMode} onChange={e => handleViewModeChange(e.target.value)} buttonStyle="solid">
            <Radio.Button value="list">
              <UnorderedListOutlined /> 리스트
            </Radio.Button>
            <Radio.Button value="calendar">
              <CalendarOutlined /> 캘린더
            </Radio.Button>
          </Radio.Group>
          <Button icon={<CalendarOutlined />} onClick={() => navigate('/settlements/monthly')}>
            월별 정산 관리
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => navigate('/settlements/calculation-settings')}>
            산출 로직 설정
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
            정산 등록
          </Button>
        </Space>
      </Space>

      {viewMode === 'list' && (
        <SettlementList
          data={settlements}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
        />
      )}

      {viewMode === 'calendar' && (
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Space>
              <span>기간 선택:</span>
              <Select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                style={{ width: 160 }}
                options={availablePeriods.map(p => ({
                  label: dayjs(p).format('YYYY년 MM월'),
                  value: p,
                }))}
              />
            </Space>
            <SettlementCalendar
              settlements={monthlySettlements}
              onDateSelect={handleCalendarSelect}
              selectedPeriod={selectedPeriod}
            />
          </Space>
        </Card>
      )}

      <SettlementDetailDrawer
        open={drawerOpen}
        settlement={selectedSettlement}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedSettlement(null)
        }}
        onEdit={() => {
          if (selectedSettlement) {
            handleEdit(selectedSettlement)
          }
        }}
        onDelete={() => {
          if (selectedSettlement) {
            setDrawerOpen(false)
            handleDeleteClick(selectedSettlement)
          }
        }}
        onStatusChange={handleStatusChangeInDrawer}
        loading={loading}
      />

      <Modal
        open={formModalOpen}
        title={editingSettlement ? '정산 수정' : '정산 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <SettlementForm
          settlement={editingSettlement || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="정산 삭제"
        content="정말 이 정산을 삭제하시겠습니까?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false)
          setSettlementToDelete(null)
        }}
        confirmText="삭제"
        danger
      />
    </div>
  )
}

