/**
 * 정산 목록 페이지
 * Phase 4: 목록 페이지
 */

import { useState, useEffect } from 'react'
import { Button, Space, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SettlementList } from '@/features/settlement/ui/settlement-list'
import { SettlementDetailDrawer } from '@/features/settlement/ui/settlement-detail-drawer'
import { SettlementForm } from '@/features/settlement/ui/settlement-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import type { Settlement } from '@/types/domain'
import type { SettlementFormData } from '@/entities/settlement/model/schema'

export function SettlementListPage() {
  const { settlements, loading, fetchSettlements, createSettlement, updateSettlement, deleteSettlement, updateStatus } = useSettlementStore()
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [settlementToDelete, setSettlementToDelete] = useState<Settlement | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

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
      message.success('정산이 삭제되었습니다')
      setDeleteModalOpen(false)
      setSettlementToDelete(null)
      if (selectedSettlement?.id === settlementToDelete.id) {
        setDrawerOpen(false)
        setSelectedSettlement(null)
      }
    } catch {
      message.error('삭제 중 오류가 발생했습니다')
    }
  }

  const handleStatusChange = async (settlement: Settlement, status: Settlement['status']) => {
    try {
      await updateStatus(settlement.id, status)
      message.success(`상태가 "${status}"로 변경되었습니다`)
      if (selectedSettlement?.id === settlement.id) {
        const updated = settlements.find(s => s.id === settlement.id)
        if (updated) setSelectedSettlement(updated)
      }
    } catch {
      message.error('상태 변경 중 오류가 발생했습니다')
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
        message.success('정산이 수정되었습니다')
      } else {
        await createSettlement(data)
        message.success('정산이 등록되었습니다')
      }
      setFormModalOpen(false)
      setEditingSettlement(null)
      fetchSettlements()
    } catch {
      message.error(editingSettlement ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
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

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>정산 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
          정산 등록
        </Button>
      </Space>

      <SettlementList
        data={settlements}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onStatusChange={handleStatusChange}
      />

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
        destroyOnClose
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

