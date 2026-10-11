import { useState } from 'react'
import { MESSAGES } from '@/shared/constants'
import { showDeleteCompletedAlert } from '@/shared/ui'
import { handleError } from '@/shared/utils/error-handler'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { useProgramStatusManager } from '@/features/program/general/hooks/use-program-status-manager'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramFormData } from '@/entities/program/model/schema'
import { applicationService } from '@/entities/application/api/application-service'

export function useProgramListActions() {
  const {
    fetchPrograms,
    deleteProgram,
    updateProgram,
    createProgram,
  } = useProgramStore()
  const { changeStatus: changeProgramStatus } = useProgramStatusManager()

  const [formLoading, setFormLoading] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleFormSubmit = async (
    data: ProgramFormData,
    editingProgram: Program | null,
    closeFormModal: () => void
  ) => {
    setFormLoading(true)
    try {
      const programData = {
        ...data,
        rounds: data.rounds.map((round, index) => ({
          ...round,
          id: editingProgram
            ? editingProgram.rounds[index]?.id || `round-${index + 1}`
            : `round-${index + 1}`,
          programId: editingProgram?.id || '',
        })),
      }

      if (editingProgram) {
        await updateProgram(editingProgram.id, programData)
        } else {
        await createProgram(programData as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>)
        }
      closeFormModal()
      fetchPrograms()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingProgram ? MESSAGES.error.update : MESSAGES.error.create,
        context: 'ProgramFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const checkProgramRelatedData = (programId: string) => {
    const relatedApplications = applicationService
      .getAllSync()
      .filter(app => app.programId === programId)

    return {
      hasApplications: relatedApplications.length > 0,
      hasMatchings: false,
      hasSchedules: false,
      applicationCount: relatedApplications.length,
      matchingCount: 0,
      scheduleCount: 0,
    }
  }

  const handleConfirmDelete = async (
    program: Program | null,
    onSuccess: () => void
  ) => {
    if (!program) return

    try {
      void checkProgramRelatedData(program.id)

      await deleteProgram(program.id)
      await fetchPrograms()
      onSuccess()
      showDeleteCompletedAlert()
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'ProgramDelete',
      })
    }
  }

  const handleBulkDelete = async (programs: Program[], onSuccess: () => void) => {
    if (programs.length === 0) return
    try {
      for (const program of programs) {
        // Re-use logic for related data if needed, or assume backend handles it
        await deleteProgram(program.id)
      }
      await fetchPrograms()
      onSuccess()
      showDeleteCompletedAlert()
    } catch (error) {
      handleError(error, {
        defaultMessage: MESSAGES.error.delete,
        context: 'ProgramBulkDelete',
      })
    }
  }

  const handleStatusChange = async (program: Program, status: ProgramLifecycleStatus) => {
    await changeProgramStatus(program.id, status)
  }

  return {
    formLoading,
    handleFormSubmit,
    handleConfirmDelete,
    handleBulkDelete,
    handleStatusChange,
    programToDelete,
    setProgramToDelete,
    deleteModalOpen,
    setDeleteModalOpen,
  }
}
