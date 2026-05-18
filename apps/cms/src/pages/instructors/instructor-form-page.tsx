/**
 * 강사 등록/수정 폼 페이지
 * Phase 1.2: 폼 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { InstructorForm } from '@/features/instructor/ui/instructor-form'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import type { InstructorFormData } from '@/entities/instructor/model/schema'

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
        } else {
        await createInstructor(data)
        }
      navigate('/instructors')
    } catch (error) {
      console.debug('instructorFormPage submit failed', error)
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

