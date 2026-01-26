/**
 * 학교 등록/수정 폼 페이지
 * Phase 1.4: 폼 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SchoolForm } from '@/features/school/ui/school-form'
import { useSchoolStore } from '@/features/school/model/school-store'
import type { SchoolFormData } from '@/entities/school/model/schema'
import { message } from 'antd'
import { MESSAGES } from '@/shared/constants'

export function SchoolFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedSchool, loading, fetchSchoolById, createSchool, updateSchool } = useSchoolStore()

  const isEdit = !!id

  useEffect(() => {
    if (id) {
      fetchSchoolById(id)
    }
  }, [id, fetchSchoolById])

  const handleSubmit = async (data: SchoolFormData) => {
    try {
      if (isEdit && id) {
        await updateSchool(id, data)
        message.success(MESSAGES.success.schoolUpdated)
      } else {
        await createSchool(data)
        message.success(MESSAGES.success.schoolCreated)
      }
      navigate('/schools')
    } catch {
      message.error(isEdit ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
    }
  }

  const handleCancel = () => {
    navigate('/schools')
  }

  return (
    <div>
      <SchoolForm
        school={isEdit ? selectedSchool || undefined : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  )
}

