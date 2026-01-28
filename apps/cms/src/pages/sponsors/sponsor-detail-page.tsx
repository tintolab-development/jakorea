/**
 * 스폰서 상세 페이지
 * Phase 1.3: 상세 페이지
 * P1: 후원사 삭제 시 연관 프로그램 확인 및 경고 메시지 표시
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SponsorDetail } from '@/features/sponsor/ui/sponsor-detail'
import { useSponsorStore } from '@/features/sponsor/model/sponsor-store'
import { MESSAGES } from '@/shared/constants'
import { message } from 'antd'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { programService } from '@/entities/program/api/program-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'

export function SponsorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { selectedSponsor, loading, fetchSponsorById, deleteSponsor } = useSponsorStore()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [relatedProgramsCount, setRelatedProgramsCount] = useState(0)

  useEffect(() => {
    if (id) {
      fetchSponsorById(id)
    }
  }, [id, fetchSponsorById])

  const handleEdit = () => {
    if (id) {
      navigate(`/sponsors/${id}/edit`)
    }
  }

  const handleDeleteClick = async () => {
    if (!id || !selectedSponsor || !canWrite) {
      message.warning('삭제 권한이 없습니다.')
      return
    }

    // 연관 프로그램 확인
    try {
      const programs = await programService.getBySponsorId(id)
      setRelatedProgramsCount(programs.length)

      if (programs.length > 0) {
        // 연관 프로그램이 있으면 경고 메시지와 함께 모달 표시
        setDeleteModalOpen(true)
      } else {
        // 연관 프로그램이 없으면 바로 삭제 확인
        setDeleteModalOpen(true)
      }
    } catch (error) {
      console.error('프로그램 확인 실패:', error)
      // 에러 발생 시에도 삭제 확인 모달 표시
      setDeleteModalOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!id) return

    try {
      await deleteSponsor(id)
      message.success(MESSAGES.success.sponsorDeleted)
      setDeleteModalOpen(false)
      navigate('/sponsors')
    } catch {
      message.error(MESSAGES.error.delete)
      setDeleteModalOpen(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!selectedSponsor) {
    return <div>스폰서를 찾을 수 없습니다</div>
  }

  const deleteWarningMessage =
    relatedProgramsCount > 0
      ? `이 후원사와 연관된 프로그램이 ${relatedProgramsCount}개 있습니다. 삭제 후에는 프로그램에서 후원사 정보를 확인할 수 없습니다.`
      : undefined

  return (
    <>
      <SponsorDetail
        sponsor={selectedSponsor}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        loading={loading}
      />
      <ConfirmModal
        open={deleteModalOpen}
        title="후원사 삭제"
        content={`정말 "${selectedSponsor.name}" 후원사를 삭제하시겠습니까?`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="삭제"
        cancelText="취소"
        danger={true}
        warningMessage={deleteWarningMessage}
      />
    </>
  )
}
