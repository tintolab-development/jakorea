/**
 * 본인 활동 요약 카드
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * 강사/봉사자용: 본인 활동 요약
 */

import { Card, Row, Col, Statistic, Tag } from 'antd'
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMemo } from 'react'
import { mockSchedules, mockMatchings, mockApplications } from '@/data/mock'

export function MyActivitySummary() {
  const { user } = useAuthStore()

  // 본인 활동 데이터 필터링
  const myData = useMemo(() => {
    if (!user?.instructorId) {
      return {
        schedules: [],
        matchings: [],
        applications: [],
      }
    }

    // 본인 일정 (강사 ID 기준)
    const mySchedules = mockSchedules.filter(
      schedule => schedule.instructorId === user.instructorId
    )

    // 본인 매칭 (강사 ID 기준)
    const myMatchings = mockMatchings.filter(
      matching => matching.instructorId === user.instructorId
    )

    // 본인 신청 (subjectId 기준 - 강사/봉사자의 경우 instructorId와 매칭)
    const myApplications = mockApplications.filter(
      application => application.subjectType === 'instructor' && application.subjectId === user.instructorId
    )

    return {
      schedules: mySchedules,
      matchings: myMatchings,
      applications: myApplications,
    }
  }, [user])

  // 이번 달 일정 수
  const thisMonthSchedules = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    return myData.schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date)
      return (
        scheduleDate.getMonth() === thisMonth &&
        scheduleDate.getFullYear() === thisYear
      )
    }).length
  }, [myData.schedules])

  // 진행 중인 매칭 수
  const activeMatchings = myData.matchings.filter(
    matching => matching.status === 'active'
  ).length

  // 대기 중인 신청 수
  const pendingApplications = myData.applications.filter(
    application => application.status === 'reviewing'
  ).length

  // 다음 일정 (가장 가까운 일정)
  const nextSchedule = useMemo(() => {
    const now = new Date()
    const upcoming = myData.schedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.date)
        const [hours, minutes] = schedule.startTime.split(':').map(Number)
        scheduleDate.setHours(hours, minutes, 0, 0)
        return scheduleDate > now
      })
      .sort((a, b) => {
        const dateA = new Date(a.date)
        const [hoursA, minutesA] = a.startTime.split(':').map(Number)
        dateA.setHours(hoursA, minutesA, 0, 0)
        const dateB = new Date(b.date)
        const [hoursB, minutesB] = b.startTime.split(':').map(Number)
        dateB.setHours(hoursB, minutesB, 0, 0)
        return dateA.getTime() - dateB.getTime()
      })[0]

    return upcoming
  }, [myData.schedules])

  return (
    <Card title="내 활동 요약">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="이번 달 일정"
            value={thisMonthSchedules}
            prefix={<CalendarOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="진행 중인 매칭"
            value={activeMatchings}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="대기 중인 신청"
            value={pendingApplications}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <div>
            <div style={{ marginBottom: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
              다음 일정
            </div>
            {nextSchedule ? (
              <div>
                <Tag color="blue">
                  {(() => {
                    const scheduleDate = new Date(nextSchedule.date)
                    return scheduleDate.toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                    })
                  })()}
                </Tag>
                <div style={{ marginTop: 4, fontSize: '12px', color: 'rgba(0, 0, 0, 0.65)' }}>
                  {nextSchedule.title}
                </div>
              </div>
            ) : (
              <div style={{ color: 'rgba(0, 0, 0, 0.25)' }}>예정된 일정이 없습니다</div>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  )
}

