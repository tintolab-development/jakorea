/**
 * 스폰서 목록 페이지
 * Phase 1.3: 목록 페이지
 * 스폰서 등록을 모달로 변경
 */

import { useEffect, useState } from 'react'
import { Button, Space, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SponsorList } from '@/features/sponsor/ui/sponsor-list'
import { SponsorForm } from '@/features/sponsor/ui/sponsor-form'
import { useSponsorStore } from '@/features/sponsor/model/sponsor-store'
import type { SponsorFormData } from '@/entities/sponsor/model/schema'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'

export function SponsorListPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const { sponsors, loading, fetchSponsors, createSponsor, updateSponsor } = useSponsorStore()
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<{
    id: string
    data: SponsorFormData
  } | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchSponsors()
  }, [fetchSponsors])

  const handleNewClick = () => {
    setEditingSponsor(null)
    setFormModalOpen(true)
  }

  const handleFormSubmit = async (data: SponsorFormData) => {
    setFormLoading(true)
    try {
      if (editingSponsor) {
        await updateSponsor(editingSponsor.id, data)
        showSuccessMessage(MESSAGES.success.sponsorInfoUpdated)
      } else {
        await createSponsor(data)
        showSuccessMessage(MESSAGES.success.sponsorRegistered)
      }
      setFormModalOpen(false)
      setEditingSponsor(null)
      fetchSponsors()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingSponsor
          ? '수정 중 오류가 발생했습니다'
          : '등록 중 오류가 발생했습니다',
        context: 'SponsorFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setFormModalOpen(false)
    setEditingSponsor(null)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'flex-end' }}>
        {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
            스폰서 등록
          </Button>
        )}
      </Space>
      <SponsorList data={sponsors} loading={loading} />

      <Modal
        open={formModalOpen}
        title={editingSponsor ? '스폰서 수정' : '스폰서 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <SponsorForm
          key={editingSponsor?.id || 'new'}
          sponsor={editingSponsor ? sponsors.find(s => s.id === editingSponsor.id) : undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}
