/**
 * 강사 상세 페이지
 * Phase 1.2: 상세 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { InstructorDetail } from '@/features/instructor/ui/instructor-detail'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import { MESSAGES } from '@/shared/constants'

export function InstructorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedInstructor, loading, fetchInstructorById, deleteInstructor } = useInstructorStore()

  useEffect(() => {
    if (id) {
      fetchInstructorById(id)
    }
  }, [id, fetchInstructorById])

  const handleEdit = () => {
    if (id) {
      navigate(`/instructors/${id}/edit`)
    }
  }

  const handleDelete = async () => {
    if (!id || !selectedInstructor) return

    if (window.confirm(MESSAGES.confirm.delete)) {
      try {
        await deleteInstructor(id)
        navigate('/instructors')
      } catch (error) {
        console.debug('instructorDetailPage delete failed', error)
      }
    }
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!selectedInstructor) {
    return <div>강사를 찾을 수 없습니다</div>
  }

  return <InstructorDetail instructor={selectedInstructor} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />
}

