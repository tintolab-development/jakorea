/**
 * 정산 상세 페이지
 * Phase 4: 정산 정보 조회, 정산 항목 표시, Excel 문서 다운로드
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSettlementStore } from '../../store/settlementStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import { formatDate } from '../../utils/date'
import type { Settlement } from '../../types/domain'
import { MdCard, DetailPageSkeleton } from '../../components/m3'
import { CustomButton, StatusChip } from '../../components/ui'
import './SettlementDetail.css'

export default function SettlementDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchSettlementById, deleteSettlement, generateSettlementExcel, isLoading, error } =
    useSettlementStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()
  const [settlement, setSettlement] = useState<Settlement | null>(null)

  useEffect(() => {
    if (id) {
      fetchSettlementById(id).then(setSettlement)
    }
  }, [id, fetchSettlementById])

  // 프로그램 목록 로드
  useEffect(() => {
    if (settlement?.programId && programStore.programs.length === 0) {
      programStore.fetchPrograms({ page: 1, pageSize: 100 })
    }
  }, [settlement?.programId, programStore])

  // 강사 목록 로드
  useEffect(() => {
    if (settlement?.instructorId && instructorStore.instructors.length === 0) {
      instructorStore.fetchInstructors({ page: 1, pageSize: 100 })
    }
  }, [settlement?.instructorId, instructorStore])

  // 프로그램 이름 조회
  const programName = settlement?.programId
    ? programStore.programs.find(p => p.id === settlement.programId)?.title || settlement.programId
    : '-'

  // 강사 이름 조회
  const instructorName = settlement?.instructorId
    ? instructorStore.instructors.find(i => i.id === settlement.instructorId)?.name || settlement.instructorId
    : '-'

  // 상태 한글 변환
  const getStatusLabel = (status: Settlement['status']) => {
    switch (status) {
      case 'pending':
        return '대기중'
      case 'calculated':
        return '산출완료'
      case 'approved':
        return '승인됨'
      case 'paid':
        return '지급완료'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }

  // 정산 항목 타입 한글 변환
  const getItemTypeLabel = (type: Settlement['items'][0]['type']) => {
    switch (type) {
      case 'instructor_fee':
        return '강사비'
      case 'transportation':
        return '교통비'
      case 'accommodation':
        return '숙박비'
      case 'other':
        return '기타'
      default:
        return type
    }
  }

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  // Excel 다운로드 핸들러
  const handleDownloadExcel = async () => {
    if (!id) return

    try {
      const blob = await generateSettlementExcel(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `정산서_${settlement?.id || id}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('정산 문서 다운로드에 실패했습니다.')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('정말 삭제하시겠습니까?')) return

    await deleteSettlement(id)
    navigate('/settlements')
  }

  if (isLoading) {
    return <DetailPageSkeleton sections={2} fieldsPerSection={6} />
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!settlement) {
    return <div className="error-message">정산을 찾을 수 없습니다.</div>
  }

  return (
    <div className="settlement-detail-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/settlements')}>
          ← 목록으로
        </CustomButton>
        <div className="header-actions">
          <CustomButton variant="primary" onClick={handleDownloadExcel} disabled={isLoading}>
            Excel 다운로드
          </CustomButton>
          <CustomButton variant="danger" onClick={handleDelete} >
            삭제
          </CustomButton>
        </div>
      </div>

      <div className="detail-header">
        <h1>정산 상세</h1>
        <div className="status-badge">
          <StatusChip status={settlement.status} label={getStatusLabel(settlement.status)} />
        </div>
      </div>

      <div className="detail-content">
        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>기본 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>정산 ID</label>
                <div className="detail-value">{settlement.id}</div>
              </div>
              <div className="detail-item">
                <label>프로그램</label>
                <div className="detail-value">{programName}</div>
              </div>
              <div className="detail-item">
                <label>강사</label>
                <div className="detail-value">{instructorName}</div>
              </div>
              <div className="detail-item">
                <label>정산 기간</label>
                <div className="detail-value">{settlement.period}</div>
              </div>
              <div className="detail-item">
                <label>상태</label>
                <div className="detail-value">{getStatusLabel(settlement.status)}</div>
              </div>
              {settlement.documentGeneratedAt && (
                <div className="detail-item">
                  <label>문서 생성일</label>
                  <div className="detail-value">{formatDate(settlement.documentGeneratedAt)}</div>
                </div>
              )}
              {settlement.notes && (
                <div className="detail-item full-width">
                  <label>메모</label>
                  <div className="detail-value">{settlement.notes}</div>
                </div>
              )}
            </div>
          </div>
        </MdCard>

        {/* 정산 항목 */}
        <MdCard variant="elevated" className="detail-card items-card">
          <div className="card-content">
            <h2>정산 항목</h2>
            <div className="items-table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>항목 유형</th>
                    <th>설명</th>
                    <th className="amount-header">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {settlement.items.map((item, index) => (
                    <tr key={index}>
                      <td>{getItemTypeLabel(item.type)}</td>
                      <td>{item.description}</td>
                      <td className="amount-cell">{formatAmount(item.amount)}원</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="total-label">
                      합계
                    </td>
                    <td className="total-amount">{formatAmount(settlement.totalAmount)}원</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="detail-card meta-card">
          <div className="card-content">
            <h2>시스템 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>생성일</label>
                <div className="detail-value">{formatDate(settlement.createdAt)}</div>
              </div>
              <div className="detail-item">
                <label>수정일</label>
                <div className="detail-value">{formatDate(settlement.updatedAt)}</div>
              </div>
            </div>
          </div>
        </MdCard>
      </div>
    </div>
  )
}
