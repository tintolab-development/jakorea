/**
 * 학교 상세 페이지
 * Phase 1.4: 상세 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SchoolDetail } from '@/features/school/ui/school-detail'
import { useSchoolStore } from '@/features/school/model/school-store'
import { message } from 'antd'

export function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedSchool, loading, fetchSchoolById, deleteSchool } = useSchoolStore()

  useEffect(() => {
    if (id) {
      fetchSchoolById(id)
    }
  }, [id, fetchSchoolById])

  const handleEdit = () => {
    if (id) {
      navigate(`/schools/${id}/edit`)
    }
  }

  const handleDelete = async () => {
    if (!id || !selectedSchool) return

    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteSchool(id)
        message.success('학교가 삭제되었습니다')
        navigate('/schools')
      } catch {
        message.error('삭제 중 오류가 발생했습니다')
      }
    }
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!selectedSchool) {
    return <div>학교를 찾을 수 없습니다</div>
  }

  return <SchoolDetail school={selectedSchool} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />
}

