/**
 * 신청 경로 관리 관련 로직 커스텀 훅
 */

import { useState } from 'react'
import type { ApplicationPath } from '@/types/domain'
import type { ApplicationPathFormData } from '@/entities/application-path/model/schema'
import { useApplicationPathStore } from '@/features/application-path/model/application-path-store'
import { useProgramStore } from '@/features/program/general/model/program-store'
import {
  fetchGeneralProgramRemoteById,
  updateGeneralProgram,
} from '@/features/program/general/api/admin-general-programs-service'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
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

  const linkApplicationPathToProgram = async (applicationPathId: string) => {
    if (shouldUseGeneralProgramsRemoteApi()) {
      const current = await fetchGeneralProgramRemoteById(programId)
      await updateGeneralProgram(
        programId,
        { ...current, applicationPathId },
        { applicationPathId }
      )
      return
    }
    await updateProgram(programId, { applicationPathId })
  }

  const handleSubmit = async (formData: ApplicationPathFormData) => {
    if (!isAdmin) return
    setFormLoading(true)
    try {
      if (editingApplicationPath) {
        const updated = await updatePath(editingApplicationPath.id, formData)
        await linkApplicationPathToProgram(updated.id)
      } else {
        const newPath = await createPath({
          ...formData,
          programId,
        })
        await linkApplicationPathToProgram(newPath.id)
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
