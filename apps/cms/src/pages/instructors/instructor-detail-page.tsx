/**
 * 강사 상세 페이지
 * Phase 1.2: 상세 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { InstructorDetail } from '@/features/instructor/ui/instructor-detail'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import { message } from 'antd'

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

    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteInstructor(id)
        message.success('강사가 삭제되었습니다')
        navigate('/instructors')
      } catch {
        message.error('삭제 중 오류가 발생했습니다')
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

