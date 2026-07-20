/**
 * 프로그램 상세 이력/현황 페이지
 * Phase 4: 추가 기능 구현
 * 사용자 강사 권한용 프로그램 상세 이력 및 현황 조회
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Table, Space, Tabs, Spin, Timeline } from 'antd'
import { ProgramCategoryBadge } from '@/shared/components/program-category-badge'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getMyProgramDetail,
  type MyProgram,
} from '@/entities/program/api/instructor-program-service'
import { getMySettlements } from '@/entities/settlement/api/instructor-settlement-service'
import {
  commonStatusStatusConfig,
  getStatusConfigAccentColor,
  settlementStatusStatusConfig,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/components/status-badge'
import { mockApplications, mockMatchings } from '@/data/mock'
import { useProgramService } from '@/features/program/general/hooks/use-program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { CmsButton, EmptyState, LoadingButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import dayjs from 'dayjs'
import type { Settlement } from '@/types/domain'

export function MyProgramHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { getByIdSync: getProgramByIdSync } = useProgramService()
  const [program, setProgram] = useState<MyProgram | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)

  const loadProgram = useCallback(async () => {
    if (!id || !user?.instructorId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getMyProgramDetail(user.instructorId, id)
      if (!data) {
        navigate('/programs/my/active')
        return
      }
      setProgram(data)
    } catch (error) {
      console.error('프로그램 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [id, navigate, user?.instructorId])

  const loadSettlements = useCallback(async () => {
    if (!id || !user?.instructorId) return

    try {
      const data = await getMySettlements(user.instructorId)
      // 해당 프로그램의 정산만 필터링
      const programSettlements = data.filter(s => s.programId === id)
      setSettlements(programSettlements)
    } catch (error) {
      console.error('정산 로드 실패:', error)
    }
  }, [id, user?.instructorId])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    if (user?.instructorId) {
      void loadProgram()
      void loadSettlements()
      return
    }
    setLoading(false)
  }, [id, user?.instructorId, loadProgram, loadSettlements])

  if (loading) {
    return (
      <div
        className="page-content-loading page-content-loading--viewport"
        role="status"
        aria-label="프로그램 이력 불러오는 중"
      >
        <Spin size="large" />
      </div>
    )
  }

  if (!program) {
    return (
      <div>
        <CmsButton
          variant="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/programs/my/active/${id}`)}
          style={{ marginBottom: 16 }}
        >
          목록으로
        </CmsButton>
        <EmptyState description="프로그램 정보를 찾을 수 없습니다." />
      </div>
    )
  }

  const fullProgram = getProgramByIdSync(program.id)
  const matching = mockMatchings.find(
    m => m.programId === program.id && m.instructorId === user?.instructorId
  )
  const applications = mockApplications.filter(app => app.programId === program.id)

  // 타임라인 이벤트 생성
  const timelineEvents = [
    {
      color: 'blue',
      label: '프로그램 생성',
      time: dayjs(program.createdAt).format('YYYY-MM-DD HH:mm'),
      description: `프로그램 "${program.title}"가 생성되었습니다.`,
    },
  ]

  if (applications.length > 0) {
    const firstApp = applications[0]
    timelineEvents.push({
      color: 'green',
      label: '신청 접수',
      time: dayjs(firstApp.submittedAt).format('YYYY-MM-DD HH:mm'),
      description: '프로그램 신청이 접수되었습니다.',
    })
  }

  if (matching) {
    timelineEvents.push({
      color: 'purple',
      label: '매칭 완료',
      time: dayjs(matching.matchedAt).format('YYYY-MM-DD HH:mm'),
      description: '강사와 프로그램이 매칭되었습니다.',
    })
  }

  if (program.schedules.length > 0) {
    program.schedules.forEach((schedule, index) => {
      if (index === 0) {
        timelineEvents.push({
          color: 'orange',
          label: '일정 확정',
          time: dayjs(schedule.date).format('YYYY-MM-DD HH:mm'),
          description: `첫 일정이 확정되었습니다: ${schedule.title}`,
        })
      }
    })
  }

  const settlementColumns = [
    {
      title: '정산 ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id: string) => (
        <LoadingButton
          type="link"
          onClick={() => navigate(`/settlements/my/${id}`)}
          style={{ padding: 0 }}
        >
          {id}
        </LoadingButton>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Settlement['status']) => (
        <StatusBadge
          domain="custom"
          label={settlementStatusStatusConfig[status].label}
          accentColor={getStatusConfigAccentColor(settlementStatusStatusConfig[status].color)}
        />
      ),
    },
    {
      title: '정산 금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
    {
      title: '기간',
      dataIndex: 'period',
      key: 'period',
      width: 150,
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string | Date) => dayjs(date).format('YYYY-MM-DD'),
    },
  ]

  const tabItems = [
    {
      key: 'timeline',
      label: (
        <span>
          <FileTextOutlined /> 전체 이력
        </span>
      ),
      children: (
        <Card>
          <Timeline
            items={timelineEvents.map(event => ({
              color: event.color,
              children: (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{event.label}</div>
                  <div style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>
                    {event.description}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>{event.time}</div>
                </div>
              ),
            }))}
          />
        </Card>
      ),
    },
    {
      key: 'settlements',
      label: (
        <span>
          <DollarOutlined /> 정산 이력
        </span>
      ),
      children: (
        <Card>
          {settlements.length > 0 ? (
            <Table
              columns={settlementColumns}
              dataSource={settlements}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <EmptyState description="정산 이력이 없습니다." />
          )}
        </Card>
      ),
    },
    {
      key: 'schedules',
      label: (
        <span>
          <CalendarOutlined /> 일정 정보
        </span>
      ),
      children: (
        <Card>
          {program.schedules.length > 0 ? (
            <Table
              columns={[
                {
                  title: '일정명',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: '날짜',
                  dataIndex: 'date',
                  key: 'date',
                  render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
                },
                {
                  title: '장소',
                  dataIndex: 'location',
                  key: 'location',
                  render: (location: string) => location || '-',
                },
                {
                  title: '상태',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <StatusBadge
                      domain="custom"
                      label={
                        commonStatusStatusConfig[status as keyof typeof commonStatusStatusConfig]
                          ?.label ?? status
                      }
                      accentColor={getStatusConfigAccentColor(
                        commonStatusStatusConfig[status as keyof typeof commonStatusStatusConfig]
                          ?.color
                      )}
                    />
                  ),
                },
              ]}
              dataSource={program.schedules}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <EmptyState description="등록된 일정이 없습니다." />
          )}
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <CmsButton
          variant="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/programs/my/active/${id}`)}
        >
          프로그램 상세로
        </CmsButton>
      </Space>

      <Card title={program.title} style={{ marginBottom: 16 }}>
        <DetailInfoForm title="프로그램 정보" mode="view" hideHeader>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="상태"
              view={<ProgramCategoryBadge category={program.category} />}
            />
            <DetailInfoForm.Field
              label="매칭일"
              view={dayjs(program.matchedAt).format('YYYY-MM-DD')}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="진행 기간"
              fullRow
              view={`${dayjs(program.startDate).format('YYYY-MM-DD')} ~ ${dayjs(program.endDate).format('YYYY-MM-DD')}`}
            />
          </DetailInfoForm.Row>
          {fullProgram?.schoolId ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="학교명"
                fullRow
                view={schoolService.getByIdSync(fullProgram.schoolId)?.name || '-'}
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}
