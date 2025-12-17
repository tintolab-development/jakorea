/**
 * 스폰서 상세 페이지
 * Phase 1.3: Outlined Card variant 사용, 더 간결한 레이아웃
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSponsorStore } from '../../store/sponsorStore'
import { formatDate } from '../../utils/date'
import type { Sponsor } from '../../types/domain'
import { MdCard, MdChip, DetailPageSkeleton } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './SponsorDetail.css'

export default function SponsorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchSponsorById, deleteSponsor, isLoading, error } = useSponsorStore()
  const [sponsor, setSponsor] = useState<Sponsor | null>(null)

  useEffect(() => {
    if (id) {
      fetchSponsorById(id).then(setSponsor)
    }
  }, [id, fetchSponsorById])

  const handleDelete = async () => {
    if (!id || !confirm('정말 삭제하시겠습니까?')) return

    await deleteSponsor(id)
    navigate('/sponsors')
  }

  if (isLoading) {
    return <DetailPageSkeleton sections={2} fieldsPerSection={4} />
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!sponsor) {
    return <div className="error-message">스폰서를 찾을 수 없습니다.</div>
  }

  return (
    <div className="sponsor-detail-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/sponsors')}>
          ← 목록으로
        </CustomButton>
        <div className="header-actions">
          <CustomButton variant="secondary" onClick={() => navigate(`/sponsors/${id}/edit`)}>
            수정
          </CustomButton>
          <CustomButton variant="danger" onClick={handleDelete} >
            삭제
          </CustomButton>
        </div>
      </div>

      <div className="detail-header">
        <div>
          <h1>{sponsor.name}</h1>
          {sponsor.securityMemo && (
            <div className="security-badge">
              <MdChip label="보안 메모 있음" selected={false} disabled />
            </div>
          )}
        </div>
      </div>

      <div className="detail-content">
        <MdCard variant="outlined" className="detail-card">
          <div className="card-content">
            <h2>스폰서 정보</h2>
            {sponsor.description && (
              <div className="detail-section">
                <div className="detail-label">설명</div>
                <div className="detail-value">{sponsor.description}</div>
              </div>
            )}
            {sponsor.contactInfo && (
              <div className="detail-section">
                <div className="detail-label">연락처</div>
                <div className="detail-value contact-info">{sponsor.contactInfo}</div>
              </div>
            )}
          </div>
        </MdCard>

        {sponsor.securityMemo && (
          <MdCard variant="outlined" className="detail-card security-card">
            <div className="card-content">
              <h2>보안 메모</h2>
              <div className="detail-section">
                <div className="detail-value security-memo">{sponsor.securityMemo}</div>
              </div>
            </div>
          </MdCard>
        )}

        <MdCard variant="outlined" className="detail-card meta-card">
          <div className="card-content">
            <h2>시스템 정보</h2>
            <div className="meta-grid">
              <div className="detail-section">
                <div className="detail-label">생성일</div>
                <div className="detail-value">{formatDate(sponsor.createdAt)}</div>
              </div>
              <div className="detail-section">
                <div className="detail-label">수정일</div>
                <div className="detail-value">{formatDate(sponsor.updatedAt)}</div>
              </div>
            </div>
          </div>
        </MdCard>
      </div>
    </div>
  )
}
