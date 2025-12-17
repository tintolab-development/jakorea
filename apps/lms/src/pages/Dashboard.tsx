/**
 * 관리자 대시보드
 * Phase 5: 전체 현황 집계, 최근 활동, 차트 표시
 */

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgramStore } from '../store/programStore'
import { useApplicationStore } from '../store/applicationStore'
import { useMatchingStore } from '../store/matchingStore'
import { useScheduleStore } from '../store/scheduleStore'
import { useSettlementStore } from '../store/settlementStore'
import { formatDate } from '../utils/date'
import { MdCard } from '../components/m3'
import { CustomButton } from '../components/ui'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const programStore = useProgramStore()
  const applicationStore = useApplicationStore()
  const matchingStore = useMatchingStore()
  const scheduleStore = useScheduleStore()
  const settlementStore = useSettlementStore()

  // 데이터 로드
  useEffect(() => {
    programStore.fetchPrograms({ page: 1, pageSize: 100 })
    applicationStore.fetchApplications({ page: 1, pageSize: 100 })
    matchingStore.fetchMatchings({ page: 1, pageSize: 100 })
    scheduleStore.fetchSchedules({ page: 1, pageSize: 100 })
    settlementStore.fetchSettlements({ page: 1, pageSize: 100 })
  }, [])

  // 집계 지표 계산
  const stats = useMemo(() => {
    const programs = programStore.programs
    const applications = applicationStore.applications
    const matchings = matchingStore.matchings
    const schedules = scheduleStore.schedules
    const settlements = settlementStore.settlements

    // 프로그램 상태별 집계
    const activePrograms = programs.filter(p => p.status === 'active').length
    const pendingPrograms = programs.filter(p => p.status === 'pending').length

    // 신청 상태별 집계
    const pendingApplications = applications.filter(
      a => a.status === 'submitted' || a.status === 'reviewing'
    ).length
    const approvedApplications = applications.filter(a => a.status === 'approved').length

    // 매칭 상태별 집계
    const activeMatchings = matchings.filter(m => m.status === 'active').length
    const pendingMatchings = matchings.filter(m => m.status === 'pending').length

    // 정산 상태별 집계
    const pendingSettlements = settlements.filter(
      s => s.status === 'pending' || s.status === 'calculated'
    ).length
    const paidSettlements = settlements.filter(s => s.status === 'paid').length
    const totalSettlementAmount = settlements
      .filter(s => s.status === 'paid' || s.status === 'approved')
      .reduce((sum, s) => sum + s.totalAmount, 0)

    return {
      totalPrograms: programs.length,
      activePrograms,
      pendingPrograms,
      totalApplications: applications.length,
      pendingApplications,
      approvedApplications,
      totalMatchings: matchings.length,
      activeMatchings,
      pendingMatchings,
      totalSchedules: schedules.length,
      totalSettlements: settlements.length,
      pendingSettlements,
      paidSettlements,
      totalSettlementAmount,
    }
  }, [
    programStore.programs,
    applicationStore.applications,
    matchingStore.matchings,
    scheduleStore.schedules,
    settlementStore.settlements,
  ])

  // 최근 활동 목록 (최근 5개)
  const recentActivities = useMemo(() => {
    const activities: Array<{
      id: string
      type: 'program' | 'application' | 'matching' | 'schedule' | 'settlement'
      title: string
      date: string
      status?: string
      link: string
    }> = []

    // 최근 프로그램
    programStore.programs
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .forEach(p => {
        activities.push({
          id: p.id,
          type: 'program',
          title: p.title,
          date: typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString(),
          status: p.status,
          link: `/programs/${p.id}`,
        })
      })

    // 최근 신청
    applicationStore.applications
      .slice()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 2)
      .forEach(a => {
        activities.push({
          id: a.id,
          type: 'application',
          title: `신청: ${a.id}`,
          date: typeof a.submittedAt === 'string' ? a.submittedAt : a.submittedAt.toISOString(),
          status: a.status,
          link: `/applications/${a.id}`,
        })
      })

    // 최근 매칭
    matchingStore.matchings
      .slice()
      .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime())
      .slice(0, 1)
      .forEach(m => {
        activities.push({
          id: m.id,
          type: 'matching',
          title: `매칭: ${m.id}`,
          date: typeof m.matchedAt === 'string' ? m.matchedAt : m.matchedAt.toISOString(),
          status: m.status,
          link: `/matchings/${m.id}`,
        })
      })

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [programStore.programs, applicationStore.applications, matchingStore.matchings])

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  // 활동 타입 한글 변환
  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'program':
        return '프로그램'
      case 'application':
        return '신청'
      case 'matching':
        return '매칭'
      case 'schedule':
        return '일정'
      case 'settlement':
        return '정산'
      default:
        return type
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>대시보드</h1>
      </div>

      {/* 집계 지표 카드 */}
      <div className="stats-grid">
        <MdCard variant="elevated" className="stat-card">
          <div className="stat-content">
            <div className="stat-label">전체 프로그램</div>
            <div className="stat-value">{stats.totalPrograms}</div>
            <div className="stat-detail">
              활성: {stats.activePrograms} | 대기: {stats.pendingPrograms}
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="stat-card">
          <div className="stat-content">
            <div className="stat-label">전체 신청</div>
            <div className="stat-value">{stats.totalApplications}</div>
            <div className="stat-detail">
              대기중: {stats.pendingApplications} | 승인: {stats.approvedApplications}
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="stat-card">
          <div className="stat-content">
            <div className="stat-label">전체 매칭</div>
            <div className="stat-value">{stats.totalMatchings}</div>
            <div className="stat-detail">
              활성: {stats.activeMatchings} | 대기: {stats.pendingMatchings}
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="stat-card">
          <div className="stat-content">
            <div className="stat-label">전체 일정</div>
            <div className="stat-value">{stats.totalSchedules}</div>
            <div className="stat-detail">캘린더에서 확인하세요</div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="stat-card">
          <div className="stat-content">
            <div className="stat-label">전체 정산</div>
            <div className="stat-value">{stats.totalSettlements}</div>
            <div className="stat-detail">
              대기: {stats.pendingSettlements} | 지급완료: {stats.paidSettlements}
            </div>
          </div>
        </MdCard>

        <MdCard variant="elevated" className="stat-card highlight">
          <div className="stat-content">
            <div className="stat-label">총 정산 금액</div>
            <div className="stat-value">{formatAmount(stats.totalSettlementAmount)}원</div>
            <div className="stat-detail">승인/지급완료 합계</div>
          </div>
        </MdCard>
      </div>

      {/* 최근 활동 */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>최근 활동</h2>
          <CustomButton variant="tertiary" onClick={() => navigate('/applications')}>
            전체 보기
          </CustomButton>
        </div>
        <MdCard variant="elevated" className="activity-card">
          <div className="activity-list">
            {recentActivities.length === 0 ? (
              <div className="empty-activity">최근 활동이 없습니다.</div>
            ) : (
              recentActivities.map(activity => (
                <div
                  key={activity.id}
                  className="activity-item"
                  onClick={() => navigate(activity.link)}
                >
                  <div className="activity-type">{getActivityTypeLabel(activity.type)}</div>
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-date">{formatDate(activity.date)}</div>
                  {activity.status && <div className="activity-status">{activity.status}</div>}
                </div>
              ))
            )}
          </div>
        </MdCard>
      </div>

      {/* 빠른 액션 */}
      <div className="dashboard-section">
        <h2>빠른 액션</h2>
        <div className="quick-actions">
          <CustomButton variant="primary" onClick={() => navigate('/programs/new')}>
            프로그램 등록
          </CustomButton>
          <CustomButton variant="primary" onClick={() => navigate('/matchings/new')}>
            매칭 등록
          </CustomButton>
          <CustomButton variant="primary" onClick={() => navigate('/schedules/new')}>
            일정 등록
          </CustomButton>
          <CustomButton variant="secondary" onClick={() => navigate('/settlements')}>
            정산 관리
          </CustomButton>
        </div>
      </div>
    </div>
  )
}
