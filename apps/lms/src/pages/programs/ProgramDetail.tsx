/**
 * 프로그램 상세 페이지
 * Phase 2.1: M3 Card 컴포넌트 사용, 일관된 레이아웃
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { useSponsorStore } from '../../store/sponsorStore'
import { formatDate } from '../../utils/date'
import type { Program } from '../../types/domain'
import { MdCard, MdChip, DetailPageSkeleton } from '../../components/m3'
import { CustomButton, StatusChip } from '../../components/ui'
import './ProgramDetail.css'

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchProgramById, deleteProgram, isLoading, error } = useProgramStore()
  const sponsorStore = useSponsorStore()
  const [program, setProgram] = useState<Program | null>(null)

  useEffect(() => {
    if (id) {
      fetchProgramById(id).then(setProgram)
    }
  }, [id, fetchProgramById])

  // 스폰서 목록 로드 (스폰서 이름 표시용)
  useEffect(() => {
    if (sponsorStore.sponsors.length === 0) {
      sponsorStore.fetchSponsors({ page: 1, pageSize: 100 })
    }
  }, [sponsorStore])

  const handleDelete = async () => {
    if (!id || !confirm('정말 삭제하시겠습니까?')) return

    await deleteProgram(id)
    navigate('/programs')
  }

  // 상태 한글 변환
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중'
      case 'pending':
        return '대기중'
      case 'inactive':
        return '비활성'
      default:
        return status
    }
  }

  // 유형 한글 변환
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'online':
        return '온라인'
      case 'offline':
        return '오프라인'
      case 'hybrid':
        return '혼합형'
      default:
        return type
    }
  }

  // 형태 한글 변환
  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'workshop':
        return '워크샵'
      case 'seminar':
        return '세미나'
      case 'course':
        return '코스'
      case 'lecture':
        return '강의'
      case 'other':
        return '기타'
      default:
        return format
    }
  }

  // 스폰서 이름 조회
  const sponsorName = program?.sponsorId
    ? (sponsorStore.sponsors.find(s => s.id === program.sponsorId)?.name ?? '-')
    : '-'

  if (isLoading) {
    return <DetailPageSkeleton sections={3} fieldsPerSection={4} />
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!program) {
    return <div className="error-message">프로그램을 찾을 수 없습니다.</div>
  }

  return (
    <div className="program-detail-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/programs')}>
          ← 목록으로
        </CustomButton>
        <div className="header-actions">
          <CustomButton variant="primary" onClick={() => navigate(`/programs/${id}/edit`)}>
            수정
          </CustomButton>
          <CustomButton variant="danger" onClick={handleDelete}>
            삭제
          </CustomButton>
        </div>
      </div>

      <div className="detail-header">
        <h1>{program.title}</h1>
        <div className="header-badges">
          <StatusChip status={program.status} label={getStatusLabel(program.status)} />
          <MdChip label={getTypeLabel(program.type)} selected={false} disabled />
          <MdChip label={getFormatLabel(program.format)} selected={false} disabled />
        </div>
      </div>

      <div className="detail-content">
        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>기본 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>제목</label>
                <div className="detail-value">{program.title}</div>
              </div>
              <div className="detail-item">
                <label>스폰서</label>
                <div className="detail-value">{sponsorName}</div>
              </div>
              <div className="detail-item">
                <label>유형</label>
                <div className="detail-value">{getTypeLabel(program.type)}</div>
              </div>
              <div className="detail-item">
                <label>형태</label>
                <div className="detail-value">{getFormatLabel(program.format)}</div>
              </div>
              <div className="detail-item">
                <label>상태</label>
                <div className="detail-value">{getStatusLabel(program.status)}</div>
              </div>
              <div className="detail-item full-width">
                <label>기간</label>
                <div className="detail-value">
                  {formatDate(program.startDate)} ~ {formatDate(program.endDate)}
                </div>
              </div>
              {program.description && (
                <div className="detail-item full-width">
                  <label>설명</label>
                  <div className="detail-value">{program.description}</div>
                </div>
              )}
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>회차 정보 ({program.rounds.length}개)</h2>
            <div className="rounds-list">
              {program.rounds.length === 0 ? (
                <div className="empty-rounds">등록된 회차가 없습니다.</div>
              ) : (
                program.rounds
                  .sort((a, b) => a.roundNumber - b.roundNumber)
                  .map(round => (
                    <div key={round.id} className="round-item">
                      <div className="round-header">
                        <span className="round-number">{round.roundNumber}회차</span>
                        <StatusChip status={round.status} label={getStatusLabel(round.status)} />
                      </div>
                      <div className="round-details">
                        <div className="round-detail-item">
                          <label>기간</label>
                          <span>
                            {formatDate(round.startDate)} ~ {formatDate(round.endDate)}
                          </span>
                        </div>
                        {round.capacity && (
                          <div className="round-detail-item">
                            <label>정원</label>
                            <span>{round.capacity}명</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="detail-card meta-card">
          <div className="card-content">
            <h2>시스템 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>생성일</label>
                <div className="detail-value">{formatDate(program.createdAt)}</div>
              </div>
              <div className="detail-item">
                <label>수정일</label>
                <div className="detail-value">{formatDate(program.updatedAt)}</div>
              </div>
            </div>
          </div>
        </MdCard>
      </div>
    </div>
  )
}
