/**
 * 본인 일정 캘린더 페이지 (강사/봉사자용)
 * Phase 5.2.3: 본인 일정 관리
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Spin, Empty } from 'antd'
import { Calendar, Badge } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMySchedules } from '@/entities/schedule/api/instructor-schedule-service'
import type { Schedule } from '@/types/domain'

export function MyScheduleCalendarPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)

  const loadSchedules = useCallback(async () => {
    if (!user?.instructorId) return

    setLoading(true)
    try {
      const data = await getMySchedules(user.instructorId)
      setSchedules(data)
    } catch (error) {
      console.error('일정 로드 실패:', error)
      } finally {
      setLoading(false)
    }
  }, [user?.instructorId])

  useEffect(() => {
    if (user?.instructorId) {
      loadSchedules()
    }
  }, [loadSchedules, user?.instructorId])

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = dayjs(schedule.date).format('YYYY-MM-DD')
      return scheduleDate === dateStr
    })

    return daySchedules
  }

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value)
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map(item => (
          <li key={item.id} style={{ marginBottom: 4 }}>
            <Badge
              status="processing"
              text={
                <span
                  style={{ cursor: 'pointer', fontSize: '12px' }}
                  onClick={e => {
                    e.stopPropagation()
                    navigate(`/schedules/${item.id}`)
                  }}
                >
                  {item.title}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    )
  }

  const monthCellRender = (value: Dayjs) => {
    const monthStr = value.format('YYYY-MM')
    const monthSchedules = schedules.filter(schedule => {
      const scheduleDate = dayjs(schedule.date).format('YYYY-MM')
      return scheduleDate === monthStr
    })

    if (monthSchedules.length === 0) {
      return null
    }

    return (
      <div className="notes-month">
        <section>{monthSchedules.length}개 일정</section>
      </div>
    )
  }

  if (!user?.instructorId) {
    return (
      <div>
        <h1>본인 일정</h1>
        <Empty description="강사 정보가 없습니다." />
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>본인 일정</h1>

      <Card>
        <Calendar
          dateCellRender={dateCellRender}
          monthCellRender={monthCellRender}
          onSelect={date => {
            const listData = getListData(date)
            if (listData.length === 1) {
              navigate(`/schedules/${listData[0].id}`)
            } else if (listData.length > 1) {
              // 여러 일정이 있으면 목록 페이지로 이동 (선택한 날짜로 필터링)
              navigate(`/schedules/my?date=${date.format('YYYY-MM-DD')}`)
            }
          }}
        />
      </Card>
    </div>
  )
}
