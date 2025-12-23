/**
 * 매칭 목록 페이지
 * Phase 3.2: 강사 매칭 관리
 */

import { useState, useEffect } from 'react'
import { Modal, message, Button, Space } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { MatchingList } from '@/features/matching/ui/matching-list'
import { MatchingDetailDrawer } from '@/features/matching/ui/matching-detail-drawer'
import { MatchingForm } from '@/features/matching/ui/matching-form'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useMatchingStore } from '@/features/matching/model/matching-store'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import type { Matching } from '@/types/domain'
import type { MatchingFormData } from '@/entities/matching/model/schema'

interface MatchingQueryParams extends Record<string, string | undefined> {
  programId?: string
}

export function MatchingListPage() {
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
  
  // 쿼리 파라미터에서 필터 상태 읽기
  const selectedProgramId = params.programId

  useEffect(() => {
    fetchMatchings()
  }, [fetchMatchings])

  // 필터 변경 핸들러 (쿼리 파라미터 동기화)
  const handleProgramChange = (programId: string | undefined) => {
    setParams({ programId: programId || undefined })
  }

  const handleView = (matching: Matching) => {
    setSelectedMatchingLocal(matching)
    setSelectedMatching(matching)
    setDrawerOpen(true)
  }

  const handleFormSubmit = async (data: MatchingFormData) => {
    try {
      if (editingMatching) {
        await updateMatching(editingMatching.id, data)
        message.success('매칭이 수정되었습니다')
      } else {
        await createMatching(data)
        message.success('매칭이 등록되었습니다')
      }
      setFormModalOpen(false)
      setEditingMatching(null)
      fetchMatchings()
    } catch {
      message.error(editingMatching ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
    }
  }

  const handleEdit = () => {
    if (selectedMatching) {
      setEditingMatching(selectedMatching)
      setDrawerOpen(false)
      setFormModalOpen(true)
    }
  }

  const handleDeleteClick = () => {
    if (selectedMatching) {
      setMatchingToDelete(selectedMatching)
      setDeleteModalOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!matchingToDelete) return

    try {
      await deleteMatching(matchingToDelete.id)
      message.success('매칭이 삭제되었습니다')
      setDeleteModalOpen(false)
      setMatchingToDelete(null)
      if (selectedMatching?.id === matchingToDelete.id) {
        setDrawerOpen(false)
        setSelectedMatchingLocal(null)
      }
      fetchMatchings()
    } catch {
      message.error('삭제 중 오류가 발생했습니다')
    }
  }

  const handleConfirm = async () => {
    if (!selectedMatching) return

    try {
      await confirmMatching(selectedMatching.id)
      message.success('매칭이 확정되었습니다')
      setDrawerOpen(false)
      setSelectedMatchingLocal(null)
      fetchMatchings()
    } catch {
      message.error('확정 중 오류가 발생했습니다')
    }
  }

  const handleCancel = async () => {
    if (!selectedMatching) return

    Modal.confirm({
      title: '매칭 취소',
      content: '정말 이 매칭을 취소하시겠습니까?',
      onOk: async () => {
        try {
          await cancelMatching(selectedMatching.id, '사용자 요청')
          message.success('매칭이 취소되었습니다')
          setDrawerOpen(false)
          setSelectedMatchingLocal(null)
          fetchMatchings()
        } catch {
          message.error('취소 중 오류가 발생했습니다')
        }
      },
    })
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>매칭 관리</h1>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => {
          setEditingMatching(null)
          setFormModalOpen(true)
        }}>
          매칭 등록
        </Button>
      </Space>

      <MatchingList
        matchings={matchings}
        loading={loading}
        selectedProgramId={selectedProgramId}
        onProgramChange={handleProgramChange}
        onView={handleView}
        onEdit={matching => {
          setEditingMatching(matching)
          setFormModalOpen(true)
        }}
        onDelete={matching => {
          setMatchingToDelete(matching)
          setDeleteModalOpen(true)
        }}
        onConfirm={async matching => {
          try {
            await confirmMatching(matching.id)
            message.success('매칭이 확정되었습니다')
            fetchMatchings()
          } catch {
            message.error('확정 중 오류가 발생했습니다')
          }
        }}
        onCancel={async matching => {
          Modal.confirm({
            title: '매칭 취소',
            content: '정말 이 매칭을 취소하시겠습니까?',
            onOk: async () => {
              try {
                await cancelMatching(matching.id, '사용자 요청')
                message.success('매칭이 취소되었습니다')
                fetchMatchings()
              } catch {
                message.error('취소 중 오류가 발생했습니다')
              }
            },
          })
        }}
      />

      <MatchingDetailDrawer
        open={drawerOpen}
        matching={selectedMatching}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedMatchingLocal(null)
        }}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={loading}
      />

      <Modal
        title={editingMatching ? '매칭 수정' : '매칭 등록'}
        open={formModalOpen}
        onCancel={() => {
          setFormModalOpen(false)
          setEditingMatching(null)
        }}
        footer={null}
        width={800}
      >
        <MatchingForm
          matching={editingMatching || undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormModalOpen(false)
            setEditingMatching(null)
          }}
          loading={loading}
        />
      </Modal>

      <ConfirmModal
        open={deleteModalOpen}
        title="매칭 삭제"
        content="정말 이 매칭을 삭제하시겠습니까?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false)
          setMatchingToDelete(null)
        }}
        confirmText="삭제"
        danger
      />
    </div>
  )
}

