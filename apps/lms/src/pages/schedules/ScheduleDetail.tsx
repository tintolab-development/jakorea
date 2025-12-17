/**
 * 일정 상세 페이지
 * Phase 3.1: 일정 정보 조회 및 영향 분석 표시
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useScheduleStore } from '../../store/scheduleStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import { formatDate } from '../../utils/date'
import type { Schedule } from '../../types/domain'
import { MdCard, DetailPageSkeleton } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './ScheduleDetail.css'

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchScheduleById, deleteSchedule, detectConflicts, isLoading, error } = useScheduleStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [relatedConflicts, setRelatedConflicts] = useState<Array<{ schedule: Schedule; message: string }>>([])

  useEffect(() => {
    if (id) {
      fetchScheduleById(id).then(setSchedule)
    }
  }, [id, fetchScheduleById])

  // 프로그램 목록 로드
  useEffect(() => {
    if (schedule?.programId && programStore.programs.length === 0) {
      programStore.fetchPrograms({ page: 1, pageSize: 100 })
    }
  }, [schedule?.programId, programStore])

  // 강사 목록 로드
  useEffect(() => {
    if (schedule?.instructorId && instructorStore.instructors.length === 0) {
      instructorStore.fetchInstructors({ page: 1, pageSize: 100 })
    }
  }, [schedule?.instructorId, instructorStore])

  // 영향 분석: 이 일정과 겹치는 다른 일정들 찾기
  useEffect(() => {
    if (schedule) {
      const conflicts = detectConflicts(schedule, id)
      // 충돌하는 일정들의 상세 정보를 서비스에서 가져오기
      Promise.all(
        conflicts.map(async conflict => {
          try {
            const conflictingSchedule = await useScheduleStore.getState().fetchScheduleById(conflict.conflictingScheduleId)
            return conflictingSchedule
              ? {
                  schedule: conflictingSchedule,
                  message: conflict.message,
                }
              : null
          } catch {
            return null
          }
        })
      ).then(results => {
        setRelatedConflicts(results.filter((item): item is { schedule: Schedule; message: string } => item !== null))
      })
    }
  }, [schedule, id, detectConflicts])

  // 프로그램 이름 조회
  const programName = useMemo(() => {
    if (!schedule?.programId) return '-'
    const program = programStore.programs.find(p => p.id === schedule.programId)
    return program?.title || schedule.programId
  }, [schedule?.programId, programStore.programs])

  // 강사 이름 조회
  const instructorName = useMemo(() => {
    if (!schedule?.instructorId) return '-'
    const instructor = instructorStore.instructors.find(i => i.id === schedule.instructorId)
    return instructor?.name || schedule.instructorId
  }, [schedule?.instructorId, instructorStore.instructors])

  // 회차 정보 조회
  const roundInfo = useMemo(() => {
    if (!schedule?.roundId || !schedule?.programId) return null
    const program = programStore.programs.find(p => p.id === schedule.programId)
    const round = program?.rounds.find(r => r.id === schedule.roundId)
    return round ? `${round.roundNumber}회차` : null
  }, [schedule?.roundId, schedule?.programId, programStore.programs])

  const handleDelete = async () => {
    if (!id || !confirm('정말 삭제하시겠습니까?')) return

    await deleteSchedule(id)
    navigate('/schedules')
  }

  if (isLoading) {
    return <DetailPageSkeleton sections={2} fieldsPerSection={5} />
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!schedule) {
    return <div className="error-message">일정을 찾을 수 없습니다.</div>
  }

  return (
    <div className="schedule-detail-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/schedules')}>
          ← 목록으로
        </CustomButton>
        <div className="header-actions">
          <CustomButton variant="primary" onClick={() => navigate(`/schedules/${id}/edit`)}>
            수정
          </CustomButton>
          <CustomButton variant="danger" onClick={handleDelete} >
            삭제
          </CustomButton>
        </div>
      </div>

      <div className="detail-header">
        <h1>{schedule.title}</h1>
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
              {schedule.instructorId && (
                <div className="detail-item">
                  <label>강사</label>
                  <div className="detail-value">{instructorName}</div>
                </div>
              )}
              <div className="detail-item">
                <label>날짜</label>
                <div className="detail-value">{formatDate(schedule.date)}</div>
              </div>
              <div className="detail-item">
                <label>시간</label>
                <div className="detail-value">
                  {schedule.startTime} ~ {schedule.endTime}
                </div>
              </div>
              {schedule.location && (
                <div className="detail-item full-width">
                  <label>장소</label>
                  <div className="detail-value">{schedule.location}</div>
                </div>
              )}
              {schedule.onlineLink && (
                <div className="detail-item full-width">
                  <label>온라인 링크</label>
                  <div className="detail-value">
                    <a href={schedule.onlineLink} target="_blank" rel="noopener noreferrer">
                      {schedule.onlineLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </MdCard>

        {/* 영향 분석: 중복 일정 표시 */}
        {relatedConflicts.length > 0 && (
          <MdCard variant="elevated" className="detail-card conflict-card">
            <div className="card-content">
              <h2>⚠️ 충돌하는 일정</h2>
              <div className="conflict-list">
                {relatedConflicts.map((item, index) => (
                  <div key={index} className="conflict-item">
                    <div className="conflict-title">{item.schedule.title}</div>
                    <div className="conflict-info">
                      {formatDate(item.schedule.date)} {item.schedule.startTime} ~ {item.schedule.endTime}
                    </div>
                    <div className="conflict-message">{item.message}</div>
                    <CustomButton
                      variant="tertiary"
                      onClick={() => navigate(`/schedules/${item.schedule.id}`)}
                      className="conflict-link"
                    >
                      상세보기 →
                    </CustomButton>
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
                <div className="detail-value">{formatDate(schedule.createdAt)}</div>
              </div>
              <div className="detail-item">
                <label>수정일</label>
                <div className="detail-value">{formatDate(schedule.updatedAt)}</div>
              </div>
            </div>
          </div>
        </MdCard>
      </div>
    </div>
  )
}

