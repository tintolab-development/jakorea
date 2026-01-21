/**
 * 신청 폼 모달 컴포넌트
 * 프로그램 상세에서 신청하기 버튼 클릭 시 모달로 열리는 신청 폼
 */

import { Modal } from 'antd'
import { ApplicationForm } from '@/features/application/ui/application-form'
import { useApplicationStore } from '@/features/application/model/application-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { ApplicationFormData } from '@/entities/application/model/schema'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'

interface ApplicationFormModalProps {
  programId: string
  programTitle: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ApplicationFormModal({
  programId,
  programTitle,
  open,
  onClose,
  onSuccess,
}: ApplicationFormModalProps) {
  const { createApplication, loading } = useApplicationStore()
  const { user } = useAuthStore()

  const handleSubmit = async (data: ApplicationFormData) => {
    try {
      // 프로그램 ID 고정
      const applicationData: ApplicationFormData = {
        ...data,
        programId, // 항상 현재 프로그램 ID로 고정
      }

      // 로그인한 권한 기준으로 subjectType/subjectId를 강제 (사용자 입력 오염 방지)
      if (user?.role === 'INSTRUCTOR' && user?.instructorId) {
        applicationData.subjectType = 'instructor'
        applicationData.subjectId = user.instructorId
      } else if (user?.role === 'STUDENT' && user?.id) {
        applicationData.subjectType = 'student'
        applicationData.subjectId = user.id
      }

      // createApplication은 submittedAt을 자동 생성하므로 제외하고 전달
      // ApplicationFormData에는 applicationPathId가 없으므로 제외
      await createApplication({
        programId: applicationData.programId,
        roundId: applicationData.roundId,
        subjectType: applicationData.subjectType,
        subjectId: applicationData.subjectId,
        status: applicationData.status,
        notes: applicationData.notes,
      })

      showSuccessMessage('신청이 완료되었습니다.')
      onSuccess?.()
    } catch (error) {
      handleError(error, {
        defaultMessage: '신청 등록 중 오류가 발생했습니다',
        context: 'ApplicationFormModal -> handleSubmit',
      })
      throw error // ApplicationForm에서 에러 처리
    }
  }

  return (
    <Modal
      title={`프로그램 신청 - ${programTitle}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <ApplicationForm
        programId={programId} // 프로그램 ID 전달
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
      />
    </Modal>
  )
}
