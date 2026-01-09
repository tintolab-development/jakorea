/**
 * 내 봉사 일정 페이지
 * Phase: 봉사단 권한 마이그레이션
 */

import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Card,
  Space,
  Typography,
  Calendar,
  Badge,
  List,
  Tag,
  Empty,
  Row,
  Col,
  Avatar,
  Button,
  Tooltip,
  Popover,
  Divider,
} from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { mockPrograms } from '@/data/mock'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'

const { Paragraph, Text, Title } = Typography

// 금요일만 활동하는 봉사단 특성에 맞춘 mock 데이터
const getFriday = (weekOffset: number) => dayjs().day(5).add(weekOffset, 'week').format('YYYY-MM-DD')

const mockSchedules = [
  {
    id: '1',
    date: getFriday(0), // 이번 주 금요일
    title: '서울초등학교 금융교육 봉사',
    status: 'approved',
    time: '09:00 ~ 13:00',
    location: '서울초등학교 3학년 2반',
    partner: '김봉사',
    programType: 'school',
    description: '초등학생 대상 기초 금융 상식 및 용돈 관리 교육',
  },
  {
    id: '2',
    date: getFriday(1), // 다음 주 금요일
    title: '경기중학교 진로체험 멘토링',
    status: 'reviewing',
    time: '14:00 ~ 17:00',
    location: '경기중학교 대강당',
    partner: '이봉사',
    programType: 'individual',
    description: '중학생 대상 IT 직군 진로 탐색 및 멘토링 세션',
  },
  {
    id: '3',
    date: getFriday(-1), // 지난 주 금요일
    title: '강남청소년수련관 경제 교실',
    status: 'approved',
    time: '10:00 ~ 12:00',
    location: '강남청소년수련관 2층 세미나실',
    partner: '박봉사',
    programType: 'school',
    description: '청소년 대상 생활 경제 및 투자 기초 교육',
  },
]

export default function MyVolunteerSchedulePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  
  // Drawer 상태 관리
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  
  const categoryName = getCategoryNameByPath(location.pathname, 3) || '내 봉사 일정'

  // 선택된 날짜의 일정 필터링 (isSame 사용으로 더 정확한 비교)
  const selectedDateSchedules = useMemo(() => {
    return mockSchedules.filter(item => dayjs(item.date).isSame(selectedDate, 'day'))
  }, [selectedDate])

  // 다가오는 일정 (오늘 포함 이후)
  const upcomingSchedules = useMemo(() => {
    return mockSchedules
      .filter(item => dayjs(item.date).isAfter(dayjs().subtract(1, 'day'), 'day'))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
  }, [])

  // 호버 시 보여줄 요약 정보 컴포넌트
  const getPopoverContent = (item: any) => (
    <div style={{ maxWidth: 250 }}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} /> {item.time}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <EnvironmentOutlined style={{ marginRight: 4 }} /> {item.location}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <TeamOutlined style={{ marginRight: 4 }} /> 파트너: {item.partner}
        </Text>
        <Divider style={{ margin: '8px 0' }} />
        <Text type="secondary" style={{ fontSize: 11 }}>
          * 클릭하면 전체 상세 정보를 확인하실 수 있습니다.
        </Text>
      </Space>
    </div>
  )

  const dateCellRender = (value: Dayjs) => {
    const listData = mockSchedules.filter(item => dayjs(item.date).isSame(value, 'day'))
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map(item => (
          <li key={item.id} style={{ marginBottom: 4 }}>
            <Popover
              title={<Text strong>{item.title}</Text>}
              content={getPopoverContent(item)}
              trigger="hover"
              placement="rightTop"
              overlayStyle={{ width: 280 }}
            >
              <div
                style={{
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: 4,
                  transition: 'all 0.3s'
                }}
                className="calendar-event-item"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDetails(item.id)
                }}
              >
                <Badge
                  status={item.status === 'approved' ? 'success' : 'processing'}
                  text={
                    <Text ellipsis style={{ fontSize: 11, maxWidth: '100%' }}>
                      {item.title}
                    </Text>
                  }
                />
              </div>
            </Popover>
          </li>
        ))}
      </ul>
    )
  }

  const handleDateSelect = (newValue: Dayjs) => {
    setSelectedDate(newValue)
  }

  const handleViewDetails = (programId: string) => {
    // mock 데이터에서 해당 프로그램 찾기
    const program = mockPrograms.find(p => p.id === programId) || mockSchedules.find(s => s.id === programId)
    
    if (program) {
      // Program 타입 형식을 맞추기 위해 필수 필드 보완 (rounds 등)
      const fullProgram: Program = {
        ...program,
        rounds: (program as any).rounds || [],
        status: (program as any).status || 'active',
        type: (program as any).type || 'offline',
        format: (program as any).format || 'workshop',
        sponsorId: (program as any).sponsorId || '1',
        startDate: (program as any).startDate || dayjs().toISOString(),
        endDate: (program as any).endDate || dayjs().toISOString(),
        createdAt: (program as any).createdAt || dayjs().toISOString(),
        updatedAt: (program as any).updatedAt || dayjs().toISOString(),
      } as Program
      
      setSelectedProgram(fullProgram)
      setDrawerOpen(false)
      setTimeout(() => setDrawerOpen(true), 0)
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'approved':
        return <Tag color="success">확정</Tag>
      case 'reviewing':
        return <Tag color="processing">대기</Tag>
      case 'cancelled':
        return <Tag color="error">취소</Tag>
      default:
        return <Tag color="default">미정</Tag>
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 페이지 헤더 영역 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ ...PAGE_HEADER_STYLE, marginBottom: 8 }}>{categoryName}</h1>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              나의 봉사 활동 일정을 캘린더와 목록으로 확인하세요.
            </Paragraph>
          </div>
          <Space>
            <Button 
              icon={<CalendarOutlined />} 
              onClick={() => setSelectedDate(dayjs())}
              type={selectedDate.isSame(dayjs(), 'day') ? 'primary' : 'default'}
            >
              오늘로 이동
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          {/* 왼쪽: 캘린더 영역 */}
          <Col xs={24} lg={16}>
            <Card
              styles={{ body: { padding: 12 } }}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <Calendar
                fullscreen={true}
                dateCellRender={dateCellRender}
                onSelect={handleDateSelect}
                value={selectedDate}
                headerRender={({ value, onChange }) => {
                  return (
                    <div style={{ padding: '16px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Title level={4} style={{ margin: 0 }}>
                        {value.format('YYYY년 MM월')}
                      </Title>
                      <Space>
                        <Button
                          icon={<ArrowRightOutlined style={{ transform: 'rotate(180deg)' }} />}
                          onClick={() => {
                            const newValue = value.clone().subtract(1, 'month')
                            onChange(newValue)
                            setSelectedDate(newValue) // 상태 동기화
                          }}
                        />
                        <Button
                          icon={<ArrowRightOutlined />}
                          onClick={() => {
                            const newValue = value.clone().add(1, 'month')
                            onChange(newValue)
                            setSelectedDate(newValue) // 상태 동기화
                          }}
                        />
                      </Space>
                    </div>
                  )
                }}
              />
            </Card>
          </Col>

          {/* 오른쪽: 일정 상세 및 다가오는 일정 */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 선택된 날짜의 일정 */}
              <Card
                title={
                  <Space>
                    <CalendarOutlined />
                    <span>{selectedDate.format('MM월 DD일')}의 일정</span>
                  </Space>
                }
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                extra={<Badge count={selectedDateSchedules.length} style={{ backgroundColor: '#1890ff' }} />}
              >
                {selectedDateSchedules.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="해당 날짜에 예정된 일정이 없습니다."
                  />
                ) : (
                  <List
                    dataSource={selectedDateSchedules}
                    renderItem={item => (
                      <div style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                            {getStatusTag(item.status)}
                          </div>
                          <Space direction="vertical" size={4}>
                            <Space size="middle">
                              <Tooltip title="봉사 시간">
                                <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                              </Tooltip>
                              <Text type="secondary">{item.time}</Text>
                            </Space>
                            <Space size="middle">
                              <Tooltip title="봉사 장소">
                                <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
                              </Tooltip>
                              <Text type="secondary">{item.location}</Text>
                            </Space>
                            <Space size="middle">
                              <Tooltip title="함께하는 파트너">
                                <TeamOutlined style={{ color: '#8c8c8c' }} />
                              </Tooltip>
                              <Space size="small">
                                <Avatar size="small" icon={<UserOutlined />} />
                                <Text type="secondary">{item.partner} 봉사자</Text>
                              </Space>
                            </Space>
                          </Space>
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: 0, marginTop: 4 }}
                            icon={<ArrowRightOutlined />}
                            onClick={() => handleViewDetails(item.id)}
                          >
                            상세 정보 보기
                          </Button>
                        </Space>
                      </div>
                    )}
                  />
                )}
              </Card>

              {/* 다가오는 일정 전체 보기 */}
              <Card
                title={
                  <Space>
                    <ClockCircleOutlined />
                    <span>다가오는 봉사 일정</span>
                  </Space>
                }
                styles={{ body: { padding: '0 12px' } }}
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <List
                  dataSource={upcomingSchedules.slice(0, 3)}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button type="text" icon={<ArrowRightOutlined />} onClick={() => setSelectedDate(dayjs(item.date))} />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 45,
                            height: 45,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Text strong style={{ fontSize: 12, lineHeight: 1 }}>{dayjs(item.date).format('MM')}</Text>
                            <Text strong style={{ fontSize: 16, lineHeight: 1 }}>{dayjs(item.date).format('DD')}</Text>
                          </div>
                        }
                        title={<Text strong ellipsis>{item.title}</Text>}
                        description={<Text type="secondary" style={{ fontSize: 12 }}>{item.time} | {item.partner}</Text>}
                      />
                    </List.Item>
                  )}
                />
                {upcomingSchedules.length > 3 && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <Button type="link" onClick={() => navigate('/volunteers/my/programs')}>전체 일정 보기</Button>
                  </div>
                )}
              </Card>

              <Card style={{ borderRadius: 12, backgroundColor: '#f9f9f9', border: 'none' }}>
                <Title level={5}>활동 안내</Title>
                <ul style={{ paddingLeft: 20, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                  <li>봉사 시작 10분 전까지 도착해주세요.</li>
                  <li>일정 변경이 필요한 경우 최소 3일 전 담당자에게 연락 바랍니다.</li>
                  <li>활동 종료 후 24시간 이내에 보고서를 제출해주세요.</li>
                </ul>
              </Card>
            </Space>
          </Col>
        </Row>
      </Space>

      {/* 프로그램 상세 정보 Drawer */}
      <ProgramDetailDrawer
        open={drawerOpen}
        program={selectedProgram}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedProgram(null)
        }}
        onEdit={() => {}}
        onDelete={() => {}}
        loading={false}
        hideActions // 봉사자는 수정/삭제 권한이 없으므로 액션 숨김
      />
    </div>
  )
}
