/**
 * 신청 폼 모달 컴포넌트
 * 프로그램 상세에서 신청하기 버튼 클릭 시 모달로 열리는 신청 폼
 * FSD: features/application으로 이동 (shared는 features 미참조)
 */

import { Modal } from 'antd'
import { ApplicationForm } from '@/features/application/ui/application-form'
import { useApplicationStore } from '@/features/application/model/application-store'
import { useAuth } from '@/shared/lib/auth/auth-context'
import type { ApplicationFormData } from '@/entities/application/model/schema'
import { MESSAGES } from '@/shared/constants'
import { handleError } from '@/shared/utils/error-handler'

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
  const { user } = useAuth()

  const handleSubmit = async (data: ApplicationFormData) => {
    try {
      const applicationData: ApplicationFormData = {
        ...data,
        programId,
      }

      if (user?.role === 'INSTRUCTOR' && user?.instructorId) {
        applicationData.subjectType = 'instructor'
        applicationData.subjectId = user.instructorId
      } else if ((user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL') && user?.id) {
        applicationData.subjectType = user.role === 'SCHOOL' ? 'school' : 'student'
        applicationData.subjectId = user.id
      }

      await createApplication({
        programId: applicationData.programId,
        roundId: applicationData.roundId,
        subjectType: applicationData.subjectType,
        subjectId: applicationData.subjectId,
        status: applicationData.status,
        notes: applicationData.notes,
      })

      onSuccess?.()
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.applicationFailed,
        context: 'ApplicationFormModal -> handleSubmit',
      })
      throw error
    }
  }

  return (
    <Modal
      title={`프로그램 신청 - ${programTitle}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
      zIndex={1001}
    >
      <ApplicationForm
        programId={programId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
      />
    </Modal>
  )
}
