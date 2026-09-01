/**
 * 강사 상세 컴포넌트
 * Phase 1.2: 상세 정보 표시
 * 강사단 관리: 강의 진행 및 정산 현황 추가
 */

import { CmsRadio } from '@/shared/ui'
import { useEffect, useState, useMemo } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Table,
  Tabs,
  Badge,
  Select,
  Collapse,
  Statistic,
  Row,
  Col,
  Modal,
} from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { Instructor } from '@/types/domain'
import { formatInstructorSettlementAccountParts } from '@/features/user/detail/ui/user-basic-info/display'
import type { Settlement, Matching, Program } from '@/types/domain'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { StatusBadge } from '@/shared/components/status-badge'
import { getStatusConfigAccentColor, settlementStatusStatusConfig } from '@/shared/constants/status'
import { SettlementCalendar } from '@/features/settlement/ui/settlement-calendar'
import { programService } from '@/entities/program/api/program-service'
import { mockMatchings, mockSchedules } from '@/data/mock'
import { getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import dayjs, { type Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Panel } = Collapse

interface InstructorDetailProps {
  instructor: Instructor
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

type ViewMode = 'list' | 'calendar'

export function InstructorDetail({ instructor, onEdit, onDelete, loading }: InstructorDetailProps) {
  const { settlements, fetchSettlements, selectedSettlement, setSelectedSettlement } =
    useSettlementStore()
  const [activeTab, setActiveTab] = useState('info')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(dayjs().format('YYYY-MM'))
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  // 강사별 정산 목록
  const instructorSettlements = useMemo(() => {
    return settlements.filter(s => s.instructorId === instructor.id)
  }, [settlements, instructor.id])

  // 강사별 매칭 목록 (프로그램 정보 포함)
  const instructorMatchings = useMemo(() => {
    const allMatchings = mockMatchings
    return allMatchings
      .filter((m: Matching) => m.instructorId === instructor.id)
      .map((m: Matching) => {
        const program = programService.getByIdSync(m.programId)
        return { ...m, program }
      })
      .filter((m): m is Matching & { program: Program } => m.program !== null)
  }, [instructor.id])

  // 강사별 스케줄 목록 (매칭과 연계)
  const instructorSchedules = useMemo(() => {
    return mockSchedules
      .filter(schedule => schedule.instructorId === instructor.id)
      .map(schedule => {
        const matching = instructorMatchings.find(m => m.scheduleId === schedule.id)
        const program = programService.getByIdSync(schedule.programId)
        return { ...schedule, matching, program }
      })
  }, [instructor.id, instructorMatchings])

  // 일정 변경 및 취소 횟수 집계
  const scheduleStats = useMemo(() => {
    // 일정 변경 횟수: updatedAt과 createdAt이 다르면 변경된 것으로 간주
    const changedCount = instructorSchedules.filter(
      schedule => schedule.updatedAt !== schedule.createdAt
    ).length

    // 일정 취소 횟수: Matching에서 cancelledAt이 있고, 해당 일정이 강사와 관련된 경우
    const cancelledMatchings = instructorMatchings.filter(
      matching => matching.cancelledAt && matching.scheduleId
    )

    const cancelledCount = cancelledMatchings.length

    return {
      totalSchedules: instructorSchedules.length,
      changedCount,
      cancelledCount,
    }
  }, [instructorSchedules, instructorMatchings])

  // 월별로 그룹화된 데이터
  const monthlyData = useMemo(() => {
    const grouped: Record<
      string,
      {
        period: string
        periodLabel: string
        settlements: Settlement[]
        matchings: Array<Matching & { program: Program }>
        schedules: typeof instructorSchedules
        totalAmount: number
      }
    > = {}

    // 정산을 월별로 그룹화
    instructorSettlements.forEach(settlement => {
      const period = settlement.period || dayjs(settlement.createdAt).format('YYYY-MM')
      if (!grouped[period]) {
        grouped[period] = {
          period,
          periodLabel: dayjs(period).format('YYYY년 MM월'),
          settlements: [],
          matchings: [],
          schedules: [],
          totalAmount: 0,
        }
      }
      grouped[period].settlements.push(settlement)
      grouped[period].totalAmount += settlement.totalAmount
    })

    // 매칭을 월별로 그룹화 (매칭일 기준)
    instructorMatchings.forEach(matching => {
      const period = dayjs(matching.matchedAt).format('YYYY-MM')
      if (!grouped[period]) {
        grouped[period] = {
          period,
          periodLabel: dayjs(period).format('YYYY년 MM월'),
          settlements: [],
          matchings: [],
          schedules: [],
          totalAmount: 0,
        }
      }
      grouped[period].matchings.push(matching)
    })

    // 스케줄을 월별로 그룹화
    instructorSchedules.forEach(schedule => {
      const period = dayjs(schedule.date).format('YYYY-MM')
      if (!grouped[period]) {
        grouped[period] = {
          period,
          periodLabel: dayjs(period).format('YYYY년 MM월'),
          settlements: [],
          matchings: [],
          schedules: [],
          totalAmount: 0,
        }
      }
      grouped[period].schedules.push(schedule)
    })

    // 월별로 정렬 (최신순)
    return Object.values(grouped).sort((a, b) => b.period.localeCompare(a.period))
  }, [instructorSettlements, instructorMatchings, instructorSchedules])

  // 선택된 월의 데이터
  const currentMonthData = useMemo(() => {
    return monthlyData.find(m => m.period === selectedPeriod) || null
  }, [monthlyData, selectedPeriod])

  // 사용 가능한 월 목록
  const availablePeriods = useMemo(() => {
    return monthlyData.map(m => ({
      label: m.periodLabel,
      value: m.period,
    }))
  }, [monthlyData])

  const handleViewSettlement = (settlement: Settlement) => {
    // 정산 상세 Drawer 열기 (정산 > 강사 상세와 동일한 화면)
    setSelectedSettlement(settlement)
    setDrawerOpen(true)
  }

  const settlementAccountParts = formatInstructorSettlementAccountParts({
    bankName: instructor.bankName,
    accountNumber: instructor.bankAccount,
    accountHolder: instructor.accountHolder,
  })
  const settlementAccountDisplay = settlementAccountParts
    ? settlementAccountParts.left && settlementAccountParts.holder
      ? `${settlementAccountParts.left} | ${settlementAccountParts.holder}`
      : settlementAccountParts.left || settlementAccountParts.holder || '-'
    : null

  const settlementColumns: ColumnsType<Settlement> = [
    {
      title: '기간',
      dataIndex: 'period',
      key: 'period',
      render: (period: string) => <Tag color="geekblue">{period}</Tag>,
    },
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? (
          <Tag color={domainColorsHex.program.primary}>{program.title}</Tag>
        ) : (
          <Tag color="error">프로그램 정보 오류</Tag>
        )
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: Settlement['status']) => (
        <Badge
          status={getSettlementStatusColor(status) as any}
          text={getSettlementStatusLabel(status)}
        />
      ),
    },
    {
      title: '총액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
    },
    {
      title: '작업',
      key: 'action',
      render: (_: unknown, record: Settlement) => (
        <Button type="link" onClick={() => handleViewSettlement(record)}>
          상세 보기
        </Button>
      ),
    },
  ]

  // 프로그램별 매칭 횟수 집계
  const programMatchingStats = useMemo(() => {
    const stats: Record<
      string,
      {
        program: Program
        totalCount: number
        activeCount: number
        completedCount: number
        cancelledCount: number
      }
    > = {}

    instructorMatchings.forEach(matching => {
      const programId = matching.programId
      if (!stats[programId]) {
        stats[programId] = {
          program: matching.program,
          totalCount: 0,
          activeCount: 0,
          completedCount: 0,
          cancelledCount: 0,
        }
      }

      stats[programId].totalCount++
      if (matching.status === 'active') {
        stats[programId].activeCount++
      } else if (matching.status === 'completed') {
        stats[programId].completedCount++
      } else if (matching.status === 'cancelled') {
        stats[programId].cancelledCount++
      }
    })

    return Object.values(stats).sort((a, b) => b.totalCount - a.totalCount)
  }, [instructorMatchings])

  const matchingColumns: ColumnsType<Matching & { program: Program }> = [
    {
      title: '프로그램',
      dataIndex: ['program', 'title'],
      key: 'program',
      render: (_: unknown, record: Matching & { program: Program }) => (
        <Tag color={domainColorsHex.program.primary}>{record.program.title}</Tag>
      ),
    },
    {
      title: '매칭일',
      dataIndex: 'matchedAt',
      key: 'matchedAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag>{status}</Tag>,
    },
  ]

  const tabItems = [
    {
      key: 'info',
      label: '기본 정보',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="연락처">{instructor.contactPhone}</Descriptions.Item>
            <Descriptions.Item label="이메일">{instructor.contactEmail || '-'}</Descriptions.Item>
            <Descriptions.Item label="지역">{instructor.region}</Descriptions.Item>
            <Descriptions.Item label="전문분야">
              <Space wrap>
                {instructor.specialty.map(s => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            {instructor.availableTime && (
              <Descriptions.Item label="가능 시간">{instructor.availableTime}</Descriptions.Item>
            )}
            {instructor.experience && (
              <Descriptions.Item label="이력">{instructor.experience}</Descriptions.Item>
            )}
            {instructor.rating && (
              <Descriptions.Item label="평점">{instructor.rating.toFixed(1)}/5.0</Descriptions.Item>
            )}
            {settlementAccountDisplay ? (
              <Descriptions.Item label="정산 계좌">{settlementAccountDisplay}</Descriptions.Item>
            ) : null}
            <Descriptions.Item label="등록일">
              {new Date(instructor.createdAt).toLocaleDateString('ko-KR')}
            </Descriptions.Item>
            <Descriptions.Item label="수정일">
              {new Date(instructor.updatedAt).toLocaleDateString('ko-KR')}
            </Descriptions.Item>
          </Descriptions>

          {/* 일정 통계 정보 */}
          <Card size="small" title="일정 통계">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="총 일정 수" value={scheduleStats.totalSchedules} suffix="건" />
              </Col>
              <Col span={8}>
                <Statistic title="일정 변경 횟수" value={scheduleStats.changedCount} suffix="건" />
              </Col>
              <Col span={8}>
                <Statistic
                  title="일정 취소 횟수"
                  value={scheduleStats.cancelledCount}
                  suffix="건"
                />
              </Col>
            </Row>
          </Card>
        </Space>
      ),
    },
    {
      key: 'programs',
      label: `강의 진행 (${instructorMatchings.length})`,
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 프로그램별 집계 통계 */}
          <Card size="small" title="프로그램별 진행 횟수">
            <Row gutter={16} align="stretch">
              {programMatchingStats.map(stat => (
                <Col span={8} key={stat.program.id} style={{ marginBottom: 16 }}>
                  <Card
                    size="small"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%', flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 'bold',
                          marginBottom: 8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                        }}
                        title={stat.program.title}
                      >
                        {stat.program.title}
                      </div>
                      <Statistic title="총 진행 횟수" value={stat.totalCount} suffix="건" />
                      <Space size="small" wrap>
                        <Tag color="blue">진행중 {stat.activeCount}</Tag>
                        <Tag color="green">완료 {stat.completedCount}</Tag>
                        {stat.cancelledCount > 0 && (
                          <Tag color="red">취소 {stat.cancelledCount}</Tag>
                        )}
                      </Space>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
            {programMatchingStats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(0, 0, 0, 0.45)' }}>
                프로그램 진행 이력이 없습니다.
              </div>
            )}
          </Card>

          {/* 전체 매칭 목록 */}
          <Card size="small" title="전체 매칭 목록">
            <Table
              dataSource={instructorMatchings}
              columns={matchingColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'settlements',
      label: `정산 현황 (${instructorSettlements.length})`,
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 월 선택 및 뷰 모드 */}
          <Card size="small">
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <span>기간 선택:</span>
                <Select
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  style={{ width: 150 }}
                  options={availablePeriods}
                />
              </Space>
              <CmsRadio.Group
                value={viewMode}
                onChange={e => setViewMode(e.target.value)}
                buttonStyle="solid"
              >
                <CmsRadio.Button value="list">
                  <UnorderedListOutlined /> 목록
                </CmsRadio.Button>
                <CmsRadio.Button value="calendar">
                  <CalendarOutlined /> 캘린더
                </CmsRadio.Button>
              </CmsRadio.Group>
            </Space>
          </Card>

          {/* 선택된 월의 통계 */}
          {currentMonthData && (
            <Card size="small">
              <Space size="large" wrap>
                <Statistic
                  title="강의 진행"
                  value={currentMonthData.matchings.length}
                  suffix="건"
                />
                <Statistic
                  title="정산 건수"
                  value={currentMonthData.settlements.length}
                  suffix="건"
                />
                <Statistic
                  title="총 정산 금액"
                  value={currentMonthData.totalAmount}
                  suffix="원"
                  formatter={value => `${Number(value).toLocaleString('ko-KR')}`}
                />
              </Space>
            </Card>
          )}

          {/* 목록 뷰 */}
          {viewMode === 'list' && (
            <Collapse defaultActiveKey={selectedPeriod}>
              {monthlyData.map(month => (
                <Panel
                  key={month.period}
                  header={
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <span>
                        <strong>{month.periodLabel}</strong>
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          강의 {month.matchings.length}건
                        </Tag>
                        <Tag color="green" style={{ marginLeft: 4 }}>
                          정산 {month.settlements.length}건
                        </Tag>
                        {month.totalAmount > 0 && (
                          <Tag color="orange" style={{ marginLeft: 4 }}>
                            {month.totalAmount.toLocaleString('ko-KR')}원
                          </Tag>
                        )}
                      </span>
                    </Space>
                  }
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {/* 강의 진행 내역 */}
                    {month.matchings.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: 8 }}>강의 진행 내역</h4>
                        <Table
                          dataSource={month.matchings}
                          columns={matchingColumns}
                          rowKey="id"
                          pagination={false}
                          size="small"
                        />
                      </div>
                    )}

                    {/* 정산 내역 */}
                    {month.settlements.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: 8 }}>정산 내역</h4>
                        <Table
                          dataSource={month.settlements}
                          columns={settlementColumns}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          onRow={record => ({
                            onClick: () => handleViewSettlement(record),
                            style: { cursor: 'pointer' },
                          })}
                        />
                      </div>
                    )}

                    {month.matchings.length === 0 && month.settlements.length === 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: 'rgba(0, 0, 0, 0.45)',
                        }}
                      >
                        해당 월의 강의 진행 내역 및 정산 내역이 없습니다.
                      </div>
                    )}
                  </Space>
                </Panel>
              ))}
            </Collapse>
          )}

          {/* 캘린더 뷰 */}
          {viewMode === 'calendar' && currentMonthData && (
            <Card title={`${currentMonthData.periodLabel} 정산 캘린더`}>
              <SettlementCalendar
                settlements={currentMonthData.settlements}
                onDateSelect={(_date: Dayjs, settlement?: Settlement) => {
                  if (settlement) {
                    handleViewSettlement(settlement)
                  }
                }}
                selectedPeriod={selectedPeriod}
              />
            </Card>
          )}

          {viewMode === 'calendar' && !currentMonthData && (
            <Card>
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(0, 0, 0, 0.45)' }}>
                선택한 월의 데이터가 없습니다.
              </div>
            </Card>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card
      title={instructor.name}
      extra={
        <Space>
          <Button onClick={onEdit}>수정</Button>
          <Button danger onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title="정산 상세"
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false)
          setSelectedSettlement(null)
        }}
        width={800}
        zIndex={1001}
        destroyOnHidden
        footer={
          <Space>
            <Button
              onClick={() => {
                setDrawerOpen(false)
                setSelectedSettlement(null)
              }}
            >
              닫기
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (selectedSettlement) {
                  window.location.href = `/settlements/${selectedSettlement.id}/edit`
                }
              }}
            >
              수정
            </Button>
          </Space>
        }
      >
        {selectedSettlement && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="정산 ID">{selectedSettlement.id}</Descriptions.Item>
            <Descriptions.Item label="상태">
              <StatusBadge
                domain="custom"
                label={settlementStatusStatusConfig[selectedSettlement.status].label}
                accentColor={getStatusConfigAccentColor(
                  settlementStatusStatusConfig[selectedSettlement.status].color
                )}
              />
            </Descriptions.Item>
            <Descriptions.Item label="기간">{selectedSettlement.period}</Descriptions.Item>
            <Descriptions.Item label="프로그램">
              {programService.getByIdSync(selectedSettlement.programId)?.title ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="정산 금액">
              {selectedSettlement.totalAmount.toLocaleString()}원
            </Descriptions.Item>
            <Descriptions.Item label="항목 요약">
              {selectedSettlement.items
                .map(i => `${i.description}: ${i.amount.toLocaleString()}원`)
                .join(' / ') || '-'}
            </Descriptions.Item>
            {selectedSettlement.notes ? (
              <Descriptions.Item label="비고">{selectedSettlement.notes}</Descriptions.Item>
            ) : null}
            <Descriptions.Item label="생성일">
              {dayjs(selectedSettlement.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="수정일">
              {dayjs(selectedSettlement.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  )
}
