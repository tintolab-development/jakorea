/**
 * 신청 상세 페이지
 * Phase 2.2: 신청 정보 조회 및 상태 변경
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApplicationStore } from '../../store/applicationStore'
import { useProgramStore } from '../../store/programStore'
import { useSchoolStore } from '../../store/schoolStore'
import { useInstructorStore } from '../../store/instructorStore'
import { formatDate } from '../../utils/date'
import type { Application } from '../../types/domain'
import { MdCard, MdChip, MdSelect, MdSelectOption, DetailPageSkeleton } from '../../components/m3'
import { CustomButton, StatusChip } from '../../components/ui'
import './ApplicationDetail.css'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchApplicationById, updateApplicationStatus, isLoading, error } = useApplicationStore()
  const programStore = useProgramStore()
  const schoolStore = useSchoolStore()
  const instructorStore = useInstructorStore()
  const [application, setApplication] = useState<Application | null>(null)
  const [newStatus, setNewStatus] = useState<Application['status'] | ''>('')

  useEffect(() => {
    if (id) {
      fetchApplicationById(id).then(setApplication)
    }
  }, [id, fetchApplicationById])

  // 프로그램 목록 로드
  useEffect(() => {
    if (application?.programId && programStore.programs.length === 0) {
      programStore.fetchPrograms({ page: 1, pageSize: 100 })
    }
  }, [application?.programId, programStore])

  // 주체 정보 로드 (학교/강사)
  useEffect(() => {
    if (application) {
      if (application.subjectType === 'school' && schoolStore.schools.length === 0) {
        schoolStore.fetchSchools({ page: 1, pageSize: 100 })
      }
      if (application.subjectType === 'instructor' && instructorStore.instructors.length === 0) {
        instructorStore.fetchInstructors({ page: 1, pageSize: 100 })
      }
    }
  }, [application, schoolStore, instructorStore])

  // 프로그램 이름 조회
  const programName = useMemo(() => {
    if (!application?.programId) return '-'
    const program = programStore.programs.find(p => p.id === application.programId)
    return program?.title || application.programId
  }, [application?.programId, programStore.programs])

  // 주체 이름 조회
  const subjectName = useMemo(() => {
    if (!application) return '-'
    if (application.subjectType === 'school') {
      const school = schoolStore.schools.find(s => s.id === application.subjectId)
      return school?.name || application.subjectId
    }
    if (application.subjectType === 'instructor') {
      const instructor = instructorStore.instructors.find(i => i.id === application.subjectId)
      return instructor?.name || application.subjectId
    }
    // student는 임시로 ID 표시
    return application.subjectId
  }, [application, schoolStore.schools, instructorStore.instructors])

  const handleStatusChange = async () => {
    if (!id || !newStatus) return

    await updateApplicationStatus(id, newStatus as Application['status'])
    // 데이터 재조회
    fetchApplicationById(id).then(setApplication)
    setNewStatus('')
  }

  const getStatusLabel = (status: Application['status']) => {
    switch (status) {
      case 'submitted':
        return '접수'
      case 'reviewing':
        return '검토중'
      case 'approved':
        return '확정'
      case 'rejected':
        return '거절'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }

  const getSubjectTypeLabel = (subjectType: Application['subjectType']) => {
    switch (subjectType) {
      case 'school':
        return '학교'
      case 'student':
        return '학생'
      case 'instructor':
        return '강사'
      default:
        return subjectType
    }
  }

  // 상태 전이 가능한 옵션 (현재 상태에 따라)
  const getAvailableStatusOptions = (
    currentStatus: Application['status']
  ): Application['status'][] => {
    switch (currentStatus) {
      case 'submitted':
        return ['reviewing', 'approved', 'rejected', 'cancelled']
      case 'reviewing':
        return ['approved', 'rejected', 'cancelled']
      case 'approved':
        return ['cancelled']
      case 'rejected':
        return ['submitted', 'cancelled']
      case 'cancelled':
        return ['submitted']
      default:
        return []
    }
  }

  if (isLoading) {
    return <DetailPageSkeleton sections={3} fieldsPerSection={4} />
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!application) {
    return <div className="error-message">신청을 찾을 수 없습니다.</div>
  }

  const availableStatuses = getAvailableStatusOptions(application.status)

  return (
    <div className="application-detail-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/applications')}>
          ← 목록으로
        </CustomButton>
      </div>

      <div className="detail-header">
        <h1>신청 상세</h1>
        <div className="header-badges">
          <StatusChip status={application.status} label={getStatusLabel(application.status)} />
          <MdChip label={getSubjectTypeLabel(application.subjectType)} selected={false} disabled />
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
              <div className="detail-item">
                <label>주체 유형</label>
                <div className="detail-value">{getSubjectTypeLabel(application.subjectType)}</div>
              </div>
              <div className="detail-item">
                <label>주체</label>
                <div className="detail-value">{subjectName}</div>
              </div>
              <div className="detail-item">
                <label>상태</label>
                <div className="detail-value">
                  <StatusChip status={application.status} label={getStatusLabel(application.status)} />
                </div>
              </div>
              {application.notes && (
                <div className="detail-item full-width">
                  <label>메모</label>
                  <div className="detail-value">{application.notes}</div>
                </div>
              )}
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="detail-card">
          <div className="card-content">
            <h2>날짜 정보</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>접수일</label>
                <div className="detail-value">{formatDate(application.submittedAt)}</div>
              </div>
              <div className="detail-item">
                <label>검토일</label>
                <div className="detail-value">
                  {application.reviewedAt ? formatDate(application.reviewedAt) : '-'}
                </div>
              </div>
              <div className="detail-item">
                <label>생성일</label>
                <div className="detail-value">{formatDate(application.createdAt)}</div>
              </div>
              <div className="detail-item">
                <label>수정일</label>
                <div className="detail-value">{formatDate(application.updatedAt)}</div>
              </div>
            </div>
          </div>
        </MdCard>

        {/* 상태 변경 섹션 */}
        {availableStatuses.length > 0 && (
          <MdCard variant="elevated" className="detail-card">
            <div className="card-content">
              <h2>상태 변경</h2>
              <div className="status-change-section">
                <MdSelect
                  label="변경할 상태 선택"
                  value={newStatus}
                  onChange={value => setNewStatus((value || '') as Application['status'] | '')}
                >
                  <MdSelectOption value="">
                    <div slot="headline">선택해주세요</div>
                  </MdSelectOption>
                  {availableStatuses.map(status => (
                    <MdSelectOption key={status} value={status}>
                      <div slot="headline">{getStatusLabel(status)}</div>
                    </MdSelectOption>
                  ))}
                </MdSelect>
                <CustomButton
                  variant="primary"
                  onClick={handleStatusChange}
                  disabled={!newStatus || isLoading}
                  loading={isLoading}
                >
                  상태 변경
                </CustomButton>
              </div>
            </div>
          </MdCard>
        )}
      </div>
    </div>
  )
}
