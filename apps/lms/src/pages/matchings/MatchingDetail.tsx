/**
 * 매칭 상세 페이지
 * Phase 3.2: 매칭 정보 조회 및 매칭 이력 표시
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMatchingStore } from '../../store/matchingStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import { formatDate } from '../../utils/date'
import type { Matching, MatchingHistory } from '../../types/domain'
import { MdCard, DetailPageSkeleton } from '../../components/m3'
import { CustomButton, StatusChip } from '../../components/ui'
import './MatchingDetail.css'

export default function MatchingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchMatchingById, deleteMatching, isLoading, error } = useMatchingStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()
  const [matching, setMatching] = useState<Matching | null>(null)

  useEffect(() => {
    if (id) {
      fetchMatchingById(id).then(setMatching)
    }
  }, [id, fetchMatchingById])

  // 프로그램 목록 로드
  useEffect(() => {
    if (matching?.programId && programStore.programs.length === 0) {
      programStore.fetchPrograms({ page: 1, pageSize: 100 })
    }
  }, [matching?.programId, programStore])

  // 강사 목록 로드
  useEffect(() => {
    if (matching?.instructorId && instructorStore.instructors.length === 0) {
      instructorStore.fetchInstructors({ page: 1, pageSize: 100 })
    }
  }, [matching?.instructorId, instructorStore])

  // 프로그램 이름 조회
  const programName = matching?.programId
    ? programStore.programs.find(p => p.id === matching.programId)?.title || matching.programId
    : '-'

  // 강사 이름 조회
  const instructorName = matching?.instructorId
    ? instructorStore.instructors.find(i => i.id === matching.instructorId)?.name || matching.instructorId
    : '-'

  // 회차 정보 조회
  const roundInfo = matching?.roundId && matching?.programId
    ? (() => {
        const program = programStore.programs.find(p => p.id === matching.programId)
        const round = program?.rounds.find(r => r.id === matching.roundId)
        return round ? `${round.roundNumber}회차` : null
      })()
    : null

  // 상태 한글 변환
  const getStatusLabel = (status: Matching['status']) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'pending':
        return '대기중'
      case 'completed':
        return '완료'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }

  // 이력 액션 한글 변환
  const getHistoryActionLabel = (action: MatchingHistory['action']) => {
    switch (action) {
      case 'created':
        return '생성'
      case 'updated':
        return '수정'
      case 'cancelled':
        return '취소'
      default:
        return action
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('정말 삭제하시겠습니까?')) return

    await deleteMatching(id)
    navigate('/matchings')
  }

  if (isLoading) {
    return <DetailPageSkeleton sections={3} fieldsPerSection={4} />
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!matching) {
    return <div className="error-message">매칭을 찾을 수 없습니다.</div>
  }

  return (
    <div className="matching-detail-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/matchings')}>
          ← 목록으로
        </CustomButton>
        <div className="header-actions">
          <CustomButton variant="primary" onClick={() => navigate(`/matchings/${id}/edit`)}>
            수정
          </CustomButton>
          <CustomButton variant="danger" onClick={handleDelete}>
            삭제
          </CustomButton>
        </div>
      </div>

      <div className="detail-header">
        <h1>매칭 상세</h1>
        <div className="status-badge">
          <StatusChip status={matching.status} label={getStatusLabel(matching.status)} />
        </div>
      </div>

      <div className="detail-content">
        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>기본 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>프로그램</label>
                <div className="detail-value">{programName}</div>
              </div>
              {roundInfo && (
                <div className="detail-item">
                  <label>회차</label>
                  <div className="detail-value">{roundInfo}</div>
                </div>
              )}
              <div className="detail-item">
                <label>강사</label>
                <div className="detail-value">{instructorName}</div>
              </div>
              <div className="detail-item">
                <label>상태</label>
                <div className="detail-value">{getStatusLabel(matching.status)}</div>
              </div>
              <div className="detail-item">
                <label>매칭일</label>
                <div className="detail-value">{formatDate(matching.matchedAt)}</div>
              </div>
              {matching.cancelledAt && (
                <div className="detail-item">
                  <label>취소일</label>
                  <div className="detail-value">{formatDate(matching.cancelledAt)}</div>
                </div>
              )}
              {matching.cancellationReason && (
                <div className="detail-item full-width">
                  <label>취소 사유</label>
                  <div className="detail-value">{matching.cancellationReason}</div>
                </div>
              )}
            </div>
          </div>
        </MdCard>

        {/* 매칭 이력 (감사 로그) */}
        {matching.history && matching.history.length > 0 && (
          <MdCard variant="elevated" className="detail-card history-card">
            <div className="card-content">
              <h2>매칭 이력</h2>
              <div className="history-list">
                {matching.history.map(historyItem => (
                  <div key={historyItem.id} className="history-item">
                    <div className="history-header">
                      <span className="history-action">{getHistoryActionLabel(historyItem.action)}</span>
                      <span className="history-date">{formatDate(historyItem.changedAt)}</span>
                    </div>
                    {historyItem.previousValue && historyItem.newValue && (
                      <div className="history-change">
                        <span className="history-label">상태 변경:</span>
                        <span className="history-value previous">
                          {getStatusLabel(historyItem.previousValue as Matching['status'])}
                        </span>
                        <span className="history-arrow">→</span>
                        <span className="history-value new">
                          {getStatusLabel(historyItem.newValue as Matching['status'])}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </MdCard>
        )}

        <MdCard variant="elevated" className="detail-card meta-card">
          <div className="card-content">
            <h2>시스템 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>생성일</label>
                <div className="detail-value">{formatDate(matching.createdAt)}</div>
              </div>
              <div className="detail-item">
                <label>수정일</label>
                <div className="detail-value">{formatDate(matching.updatedAt)}</div>
              </div>
            </div>
          </div>
        </MdCard>
      </div>
    </div>
  )
}

