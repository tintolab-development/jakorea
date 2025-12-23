/**
 * 강사 등록/수정 폼 페이지
 * Phase 1.2: 폼 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { InstructorForm } from '@/features/instructor/ui/instructor-form'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import type { InstructorFormData } from '@/entities/instructor/model/schema'
import { message } from 'antd'

export function InstructorFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedInstructor, loading, fetchInstructorById, createInstructor, updateInstructor } =
    useInstructorStore()

  const isEdit = !!id

  useEffect(() => {
    if (id) {
      fetchInstructorById(id)
    }
  }, [id, fetchInstructorById])

  const handleSubmit = async (data: InstructorFormData) => {
    try {
      if (isEdit && id) {
        await updateInstructor(id, data)
        message.success('강사 정보가 수정되었습니다')
      } else {
        await createInstructor(data)
        message.success('강사가 등록되었습니다')
      }
      navigate('/instructors')
    } catch {
      message.error(isEdit ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
    }
  }

  const handleCancel = () => {
    navigate('/instructors')
  }

  return (
    <div>
      <InstructorForm
        instructor={isEdit ? selectedInstructor || undefined : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  )
}

