/**
 * 프로그램 등록/수정 폼 페이지
 * Phase 2.1: 폼 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProgramForm } from '@/features/program/general/ui/program-form'
import { useProgramStore } from '@/features/program/general/model/program-store'
import type { ProgramFormData } from '@/entities/program/model/schema'
import type { Program } from '@/types/domain'

export function ProgramFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedProgram, loading, fetchProgramById, createProgram, updateProgram } = useProgramStore()

  const isEdit = !!id

  useEffect(() => {
    if (id) {
      fetchProgramById(id)
    }
  }, [id, fetchProgramById])

  const handleSubmit = async (data: ProgramFormData) => {
    try {
      // GENERAL 레거시 rounds는 일정 교체 입력 — 폼 내부는 두고 remote create/update에는 보내지 않는다.

      const { rounds: _legacyRounds, ...programData } = data
      void _legacyRounds

      if (isEdit && id) {
        await updateProgram(id, programData)
        } else {
        await createProgram(programData as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>)
        }
      navigate('/programs')
    } catch (error) {
      console.debug('programFormPage submit failed', error)
    }
  }

  const handleCancel = () => {
    navigate('/programs')
  }

  return (
    <div>
      <ProgramForm
        program={isEdit ? selectedProgram || undefined : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  )
}
