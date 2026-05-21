/**
 * 신청 경로 관리 관련 로직 커스텀 훅
 */

import { useState } from 'react'
import type { ApplicationPath } from '@/types/domain'
import type { ApplicationPathFormData } from '@/entities/application-path/model/schema'
import { useApplicationPathStore } from '@/features/application-path/model/application-path-store'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { handleError } from '@/shared/utils/error-handler'

interface UseApplicationPathManagementProps {
  programId: string
  isAdmin: boolean
}

export function useApplicationPathManagement({
  programId,
  isAdmin,
}: UseApplicationPathManagementProps) {
  const [applicationPathModalOpen, setApplicationPathModalOpen] = useState(false)
  const [editingApplicationPath, setEditingApplicationPath] = useState<ApplicationPath | null>(
    null
  )
  const [formLoading, setFormLoading] = useState(false)
  const { createPath, updatePath } = useApplicationPathStore()
  const { updateProgram } = useProgramStore()

  const handleCreate = () => {
    if (!isAdmin) return
    setEditingApplicationPath(null)
    setApplicationPathModalOpen(true)
  }

  const handleEdit = (applicationPath: ApplicationPath) => {
    if (!isAdmin) return
    setEditingApplicationPath(applicationPath)
    setApplicationPathModalOpen(true)
  }

  const handleSubmit = async (formData: ApplicationPathFormData) => {
    if (!isAdmin) return
    setFormLoading(true)
    try {
      if (editingApplicationPath) {
        // 기존 신청 경로 수정
        const updated = await updatePath(editingApplicationPath.id, formData)
        // 프로그램의 applicationPathId 업데이트
        await updateProgram(programId, { applicationPathId: updated.id })
        } else {
        // 새 신청 경로 생성
        const newPath = await createPath({
          ...formData,
          programId, // 현재 프로그램 ID로 고정
        })
        // 프로그램의 applicationPathId 업데이트
        await updateProgram(programId, { applicationPathId: newPath.id })
        }
      setApplicationPathModalOpen(false)
      setEditingApplicationPath(null)
    } catch (error) {
      handleError(error, { context: 'useApplicationPathManagement -> handleSubmit' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleCancel = () => {
    setApplicationPathModalOpen(false)
    setEditingApplicationPath(null)
  }

  return {
    applicationPathModalOpen,
    editingApplicationPath,
    formLoading,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleCancel,
  }
}
