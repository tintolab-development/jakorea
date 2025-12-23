/**
 * 프로그램 등록/수정 폼 페이지
 * Phase 2.1: 폼 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProgramForm } from '@/features/program/ui/program-form'
import { useProgramStore } from '@/features/program/model/program-store'
import type { ProgramFormData } from '@/entities/program/model/schema'
import type { Program } from '@/types/domain'
import { message } from 'antd'

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
      // ProgramFormData를 Program 타입으로 변환 (rounds에 id, programId 추가)
      const programData = {
        ...data,
        rounds: data.rounds.map((round, index) => ({
          ...round,
          id: isEdit && selectedProgram
            ? selectedProgram.rounds[index]?.id || `round-${index + 1}`
            : `round-${index + 1}`,
          programId: isEdit && id ? id : '', // create 시에는 서비스에서 처리
        })),
      }

      if (isEdit && id) {
        await updateProgram(id, programData)
        message.success('프로그램 정보가 수정되었습니다')
      } else {
        await createProgram(programData as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>)
        message.success('프로그램이 등록되었습니다')
      }
      navigate('/programs')
    } catch {
      message.error(isEdit ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
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

