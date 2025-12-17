/**
 * 학교 상세 페이지
 * Phase 1.4: 학교 정보 상세 표시
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSchoolStore } from '../../store/schoolStore'
import type { School } from '../../types'
import { MdCard, MdChip, DetailPageSkeleton } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './SchoolDetail.css'

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchSchoolById, deleteSchool, isLoading, error } = useSchoolStore()
  const [school, setSchool] = useState<School | null>(null)

  useEffect(() => {
    if (id) {
      fetchSchoolById(id).then(setSchool)
    }
  }, [id, fetchSchoolById])

  const handleDelete = async () => {
    if (!id || !confirm('정말 삭제하시겠습니까?')) return

    await deleteSchool(id)
    navigate('/schools')
  }

  if (isLoading) {
    return <DetailPageSkeleton sections={2} fieldsPerSection={5} />
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!school) {
    return <div className="error-message">학교를 찾을 수 없습니다.</div>
  }

  return (
    <div className="school-detail-page">
      <div className="page-header">
        <CustomButton variant="secondary" onClick={() => navigate('/schools')}>
          ← 목록으로
        </CustomButton>
        <div className="header-actions">
          <CustomButton variant="secondary" onClick={() => navigate(`/schools/${id}/edit`)}>
            수정
          </CustomButton>
          <CustomButton variant="danger" onClick={handleDelete} >
            삭제
          </CustomButton>
        </div>
      </div>

      <div className="detail-header">
        <div>
          <h1>{school.name}</h1>
          <MdChip label={school.region} selected={false} disabled />
        </div>
      </div>

      <div className="detail-content">
        <MdCard variant="outlined" className="detail-card">
          <div className="card-content">
            <h2>학교 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>지역</label>
                <div className="detail-value">{school.region}</div>
              </div>
              {school.address && (
                <div className="detail-item full-width">
                  <label>주소</label>
                  <div className="detail-value">{school.address}</div>
                </div>
              )}
            </div>
          </div>
        </MdCard>

        <MdCard variant="outlined" className="detail-card">
          <div className="card-content">
            <h2>담당자 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>담당자</label>
                <div className="detail-value">{school.contactPerson}</div>
              </div>
              {school.contactPhone && (
                <div className="detail-item">
                  <label>전화번호</label>
                  <div className="detail-value">{school.contactPhone}</div>
                </div>
              )}
              {school.contactEmail && (
                <div className="detail-item full-width">
                  <label>이메일</label>
                  <div className="detail-value">{school.contactEmail}</div>
                </div>
              )}
            </div>
          </div>
        </MdCard>

        <MdCard variant="outlined" className="detail-card meta-card">
          <div className="card-content">
            <h2>시스템 정보</h2>
            <div className="meta-grid">
              <div className="meta-item">
                <label>등록일</label>
                <div className="meta-value">
                  {new Date(school.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div className="meta-item">
                <label>수정일</label>
                <div className="meta-value">
                  {new Date(school.updatedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </MdCard>
      </div>
    </div>
  )
}

