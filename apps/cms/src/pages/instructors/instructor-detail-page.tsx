/**
 * 강사 상세 페이지
 * Phase 1.2: 상세 페이지
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { InstructorDetail } from '@/features/instructor/ui/instructor-detail'
import { useInstructorStore } from '@/features/instructor/model/instructor-store'
import { MESSAGES } from '@/shared/constants'

export function InstructorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedInstructor, loading, fetchInstructorById, deleteInstructor } =
    useInstructorStore()
  const [resolvedId, setResolvedId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setResolvedId(null)
      return
    }
    let cancelled = false
    setResolvedId(null)
    void fetchInstructorById(id).finally(() => {
      if (!cancelled) setResolvedId(id)
    })
    return () => {
      cancelled = true
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
      } catch (err) {
        console.debug('instructorDetailPage delete failed', err)
      }
    }
  }

  const showLoading = Boolean(id) && (loading || resolvedId !== id)

  if (showLoading) {
    return (
      <div
        className="page-content-loading page-content-loading--viewport"
        role="status"
        aria-label="강사 불러오는 중"
      >
        <Spin size="large" />
      </div>
    )
  }

  if (!selectedInstructor) {
    return <div>강사를 찾을 수 없습니다</div>
  }

  return (
    <InstructorDetail
      instructor={selectedInstructor}
      onEdit={handleEdit}
      onDelete={handleDelete}
      loading={loading}
    />
  )
}
