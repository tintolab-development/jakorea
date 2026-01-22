/**
 * 강사 교육 일정 페이지
 * Phase 0.2.6: 강사 캘린더/일정 (FR-E02)
 * 목록/캘린더 보기 전환 및 상세 정보 표시
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Radio, Space, Typography, Modal, Descriptions, Tag, Button, Empty } from 'antd'
import { CalendarOutlined, TableOutlined } from '@ant-design/icons'
import { Calendar, Badge } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMySchedules } from '@/entities/schedule/api/instructor-schedule-service'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { mockMatchings } from '@/data/mock'
import { mockApplications } from '@/data/mock'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import type { Schedule } from '@/types/domain'

const { Title, Paragraph } = Typography

type ViewMode = 'calendar' | 'list'

interface ScheduleWithDetails extends Schedule {
  programName?: string
  schoolName?: string
  region?: string
  grade?: string
  address?: string
  contactPerson?: string
  contactPhone?: string
  waitingRoom?: string
  mealInfo?: string
}

export function InstructorSchedulePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [schedulesWithDetails, setSchedulesWithDetails] = useState<ScheduleWithDetails[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [loading, setLoading] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithDetails | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Phase 0.2.6: 일정 상세 정보 조회 (개선)
  const enrichScheduleDetails = useCallback((schedule: Schedule): ScheduleWithDetails => {
    const program = programService.getByIdSync(schedule.programId)
    const programName = program?.title

    // 매칭 정보에서 학교 정보 찾기 (scheduleId로 정확히 매칭)
    const matching = mockMatchings.find(
      m => m.scheduleId === schedule.id && m.instructorId === schedule.instructorId
    )

    // 매칭이 있으면 해당 매칭의 프로그램/신청 정보 사용
    // 없으면 프로그램의 첫 번째 승인된 학교 신청 사용
    let application = null
    if (matching) {
      // 매칭된 신청 찾기
      application = mockApplications.find(
        app =>
          app.programId === matching.programId &&
          app.subjectType === 'school' &&
          app.status === 'approved'
      )
    } else {
      // 매칭이 없으면 프로그램의 첫 번째 승인된 학교 신청 사용
      application = mockApplications.find(
        app =>
          app.programId === schedule.programId &&
          app.subjectType === 'school' &&
          app.status === 'approved'
      )
    }

    const school = application
      ? schoolService.getByIdSync(application.subjectId)
      : null

    // 학교 사용자 정보 찾기 (대기실, 급식 정보 등)
    // Mock: 학교 정보에서 추출 또는 기본값
    const schoolUser = application
      ? {
          waitingRoom: school?.address ? `${school.address} 1층 교무실` : '1층 교무실',
          mealInfo: '급식 가능',
        }
      : null

    return {
      ...schedule,
      programName,
      schoolName: school?.name,
      region: school?.region,
      grade: program?.targetLevel ? (program.targetLevel === 'elementary' ? '초' : program.targetLevel === 'middle' ? '중' : '고') : undefined,
      address: school?.address,
      contactPerson: school?.contactPerson,
      contactPhone: school?.contactPhone,
      waitingRoom: schoolUser?.waitingRoom,
      mealInfo: schoolUser?.mealInfo,
    }
  }, [])

  const loadSchedules = useCallback(async () => {
    if (!user?.instructorId) return

    setLoading(true)
    try {
      const data = await getMySchedules(user.instructorId)

      // Phase 0.2.6: 일정 상세 정보 추가
      const enriched = data.map(schedule => enrichScheduleDetails(schedule))
      setSchedulesWithDetails(enriched)
    } catch (error) {
      console.error('일정 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.instructorId, enrichScheduleDetails])

  useEffect(() => {
    if (user?.instructorId) {
      loadSchedules()
    }
  }, [loadSchedules, user?.instructorId])

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    return schedulesWithDetails.filter(schedule => {
      const scheduleDate = dayjs(schedule.date).format('YYYY-MM-DD')
      return scheduleDate === dateStr
    })
  }

  // Phase 0.2.6: 캘린더 일정 표시 (학교명/지역/학년/시간)
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
                    handleScheduleClick(item)
                  }}
                >
                  {item.schoolName || item.programName || item.title}
                  {item.startTime && ` (${item.startTime})`}
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
    const monthSchedules = schedulesWithDetails.filter(schedule => {
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

  const handleScheduleClick = (schedule: ScheduleWithDetails) => {
    setSelectedSchedule(schedule)
    setModalOpen(true)
  }

  const handleCalendarSelect = (date: Dayjs) => {
    const listData = getListData(date)
    if (listData.length === 1) {
      handleScheduleClick(listData[0])
    } else if (listData.length > 1) {
      // 여러 일정이 있으면 목록 뷰로 전환하고 해당 날짜로 필터링
      setViewMode('list')
      // TODO: 날짜 필터링 기능 추가
    }
  }

  if (!user?.instructorId) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <Empty description="강사 정보가 없습니다." />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={PAGE_HEADER_STYLE}>
        <Title level={2} style={{ margin: 0 }}>
          교육 일정
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          본인의 강의 일정을 캘린더 또는 목록으로 확인할 수 있습니다.
        </Paragraph>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Phase 0.2.6: 목록/캘린더 보기 전환 */}
        <Card>
          <Radio.Group
            value={viewMode}
            onChange={e => setViewMode(e.target.value)}
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="calendar">
              <CalendarOutlined /> 캘린더
            </Radio.Button>
            <Radio.Button value="list">
              <TableOutlined /> 목록
            </Radio.Button>
          </Radio.Group>
        </Card>

        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' && (
          <Card loading={loading}>
            {schedulesWithDetails.length === 0 ? (
              <Empty description="일정이 없습니다." />
            ) : (
              <Calendar
                dateCellRender={dateCellRender}
                monthCellRender={monthCellRender}
                onSelect={handleCalendarSelect}
              />
            )}
          </Card>
        )}

        {/* 목록 뷰 */}
        {viewMode === 'list' && (
          <Card loading={loading}>
            {schedulesWithDetails.length === 0 ? (
              <Empty description="일정이 없습니다." />
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {schedulesWithDetails.map(schedule => (
                  <Card
                    key={schedule.id}
                    size="small"
                    hoverable
                    onClick={() => handleScheduleClick(schedule)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Tag color="blue">{schedule.programName || '-'}</Tag>
                        {schedule.schoolName && <Tag>{schedule.schoolName}</Tag>}
                        {schedule.region && <Tag>{schedule.region}</Tag>}
                        {schedule.grade && <Tag>{schedule.grade}</Tag>}
                      </div>
                      <div>
                        <strong>{schedule.title}</strong>
                      </div>
                      <div>
                        {dayjs(schedule.date).format('YYYY-MM-DD')} {schedule.startTime} -{' '}
                        {schedule.endTime}
                      </div>
                      {schedule.location && <div>장소: {schedule.location}</div>}
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        )}
      </Space>

      {/* Phase 0.2.6: 일정 상세 모달 */}
      <Modal
        title="일정 상세 정보"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setModalOpen(false)}>
            닫기
          </Button>,
          <Button
            key="detail"
            type="primary"
            onClick={() => {
              if (selectedSchedule) {
                navigate(`/schedules/${selectedSchedule.id}`)
                setModalOpen(false)
              }
            }}
          >
            상세 페이지 보기
          </Button>,
        ]}
        width={600}
      >
        {selectedSchedule && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="프로그램">
              <Tag color="blue">{selectedSchedule.programName || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="일정 제목">{selectedSchedule.title}</Descriptions.Item>
            {selectedSchedule.schoolName && (
              <Descriptions.Item label="학교명">{selectedSchedule.schoolName}</Descriptions.Item>
            )}
            {selectedSchedule.region && (
              <Descriptions.Item label="지역">{selectedSchedule.region}</Descriptions.Item>
            )}
            {selectedSchedule.grade && (
              <Descriptions.Item label="학년">{selectedSchedule.grade}</Descriptions.Item>
            )}
            <Descriptions.Item label="날짜">
              {dayjs(selectedSchedule.date).format('YYYY년 MM월 DD일')}
            </Descriptions.Item>
            <Descriptions.Item label="시간">
              {selectedSchedule.startTime} - {selectedSchedule.endTime}
            </Descriptions.Item>
            {selectedSchedule.location && (
              <Descriptions.Item label="장소">{selectedSchedule.location}</Descriptions.Item>
            )}
            {selectedSchedule.address && (
              <Descriptions.Item label="주소">{selectedSchedule.address}</Descriptions.Item>
            )}
            {selectedSchedule.contactPerson && (
              <Descriptions.Item label="담당자">{selectedSchedule.contactPerson}</Descriptions.Item>
            )}
            {selectedSchedule.contactPhone && (
              <Descriptions.Item label="연락처">{selectedSchedule.contactPhone}</Descriptions.Item>
            )}
            {selectedSchedule.waitingRoom && (
              <Descriptions.Item label="대기실">{selectedSchedule.waitingRoom}</Descriptions.Item>
            )}
            {selectedSchedule.mealInfo && (
              <Descriptions.Item label="급식 정보">{selectedSchedule.mealInfo}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
