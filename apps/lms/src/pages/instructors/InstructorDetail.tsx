/**
 * 강사 상세 페이지
 * M3 Card 컴포넌트 사용, UI/UX 개선
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInstructorStore } from '../../store/instructorStore'
import { formatDate } from '../../utils/date'
import type { Instructor } from '../../types/domain'
import { MdCard, MdChip, DetailPageSkeleton } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './InstructorDetail.css'

export default function InstructorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchInstructorById, deleteInstructor, isLoading, error } = useInstructorStore()
  const [instructor, setInstructor] = useState<Instructor | null>(null)

  useEffect(() => {
    if (id) {
      fetchInstructorById(id).then(setInstructor)
    }
  }, [id, fetchInstructorById])

  const handleDelete = async () => {
    if (!id || !confirm('정말 삭제하시겠습니까?')) return

    await deleteInstructor(id)
    navigate('/instructors')
  }

  if (isLoading) {
    return <DetailPageSkeleton sections={2} fieldsPerSection={6} />
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!instructor) {
    return <div className="error-message">강사를 찾을 수 없습니다.</div>
  }

  return (
    <div className="instructor-detail-page">
      <div className="page-header">
        <CustomButton variant="secondary" onClick={() => navigate('/instructors')}>
          ← 목록
        </CustomButton>
        <div className="header-actions">
          <CustomButton variant="primary" onClick={() => navigate(`/instructors/${id}/edit`)}>
            수정
          </CustomButton>
          <CustomButton variant="danger" onClick={handleDelete}>
            삭제
          </CustomButton>
        </div>
      </div>

      <h1>강사 상세</h1>

      <div className="detail-cards">
        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>기본 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>이름</label>
                <div className="detail-value">{instructor.name}</div>
              </div>
              <div className="detail-item">
                <label>지역</label>
                <div className="detail-value">{instructor.region}</div>
              </div>
              <div className="detail-item full-width">
                <label>전문분야</label>
                <div className="detail-value">
                  {instructor.specialty.length > 0 ? (
                    <div className="specialty-chips">
                      {instructor.specialty.map((s) => (
                        <MdChip key={s} label={s} selected={false} disabled />
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>연락처</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>전화번호</label>
                <div className="detail-value">{instructor.contactPhone ?? '-'}</div>
              </div>
              <div className="detail-item">
                <label>이메일</label>
                <div className="detail-value">{instructor.contactEmail ?? '-'}</div>
              </div>
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>추가 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>가능 시간</label>
                <div className="detail-value">{instructor.availableTime ?? '-'}</div>
              </div>
              <div className="detail-item">
                <label>평가</label>
                <div className="detail-value">
                  {instructor.rating ? `${instructor.rating.toFixed(1)} / 5.0` : '-'}
                </div>
              </div>
              <div className="detail-item full-width">
                <label>경력</label>
                <div className="detail-value">{instructor.experience ?? '-'}</div>
              </div>
              <div className="detail-item full-width">
                <label>계좌번호</label>
                <div className="detail-value">{instructor.bankAccount ?? '-'}</div>
              </div>
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>시스템 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>생성일</label>
                <div className="detail-value">{formatDate(instructor.createdAt)}</div>
              </div>
              <div className="detail-item">
                <label>수정일</label>
                <div className="detail-value">{formatDate(instructor.updatedAt)}</div>
              </div>
            </div>
          </div>
        </MdCard>
      </div>
    </div>
  )
}
