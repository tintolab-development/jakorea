/**
 * 본인 정산 목록 페이지 (강사/봉사자용)
 * Phase 5.2.4: 본인 정산 정보
 * 관리자 정산 페이지와 유사한 구조로 개선
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { Space, Card, Button, Table, Tabs, Select, Segmented } from 'antd'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { PlusOutlined, CalendarOutlined, TableOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMySettlements } from '@/entities/settlement/api/instructor-settlement-service'
import { settlementStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { SettlementSubmitModal } from '@/features/settlement/ui/settlement-submit-modal'
import { SettlementCalendar } from '@/features/settlement/ui/settlement-calendar'
import { SettlementDetailDrawer } from '@/features/settlement/ui/settlement-detail-drawer'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import dayjs from 'dayjs'
import type { Settlement, SettlementStatus } from '@/types/domain'

// IA 구조에 맞는 정산 상태별 탭 정의
// 정산 미신청, 정산 신청 완료 및 대기 중, 정산 이슈 확인 필요, 정산 지급 완료, 정산 이력
const statusTabs: Array<{
  key: SettlementStatus | 'not-applied' | 'submitted' | 'issues' | 'all'
  label: string
}> = [
  { key: 'all', label: '정산 이력' },
  { key: 'not-applied', label: '정산 미신청' },
  { key: 'submitted', label: '정산 신청 완료 및 대기 중' },
  { key: 'issues', label: '정산 이슈 확인 필요' },
  { key: 'paid', label: '정산 지급 완료' },
]

type ViewMode = 'list' | 'calendar'

export function MySettlementListPage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const { params, setParams, clearParams } = useQueryParams<{
    view?: string
    period?: string
    status?: string
    search?: string
  }>()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [allSettlements, setAllSettlements] = useState<Settlement[]>([]) // 탭 카운트용
  const [loading, setLoading] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)

  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '정산 이력/현황'

  // 뷰 모드와 기간 필터 (쿼리 파라미터에서 읽기)
  const viewMode = (params.view as ViewMode) || 'list'
  const selectedPeriod = params.period || dayjs().format('YYYY-MM')

  // 필터 값 (쿼리 파라미터에서 읽기)
  const filters = useMemo(() => {
    return {
      status:
        (params.status as SettlementStatus | 'not-applied' | 'submitted' | 'issues' | 'all') ||
        'all',
      search: params.search || undefined,
    }
  }, [params])

  const loadSettlements = useCallback(async () => {
    if (!user?.instructorId) return

    setLoading(true)
    try {
      let apiFilters: { status?: SettlementStatus } | undefined

      // IA 구조에 맞게 상태 매핑
      if (filters.status === 'not-applied') {
        // 정산 미신청: 아직 신청하지 않은 상태 (pending 중에서 신청 가능한 것들)
        apiFilters = { status: 'pending' }
      } else if (filters.status === 'submitted') {
        // 정산 신청 완료 및 대기 중: calculated, review 상태
        // TODO: API에서 여러 상태를 필터링할 수 있도록 수정 필요
        apiFilters = { status: 'calculated' }
      } else if (filters.status === 'issues') {
        // 정산 이슈 확인 필요: review 상태 중 이슈가 있는 것들
        apiFilters = { status: 'review' }
      } else if (filters.status === 'paid') {
        apiFilters = { status: 'paid' }
      } else if (filters.status !== 'all') {
        apiFilters = { status: filters.status as SettlementStatus }
      }

      const data = await getMySettlements(user.instructorId, {
        ...apiFilters,
        search: filters.search,
      })

      // IA 구조에 맞게 필터링 (클라이언트 사이드 추가 필터링)
      let filteredData = data
      if (filters.status === 'not-applied') {
        // 정산 미신청: 신청 가능한 정산만 표시 (추가 필터링 로직 필요)
        filteredData = data.filter(s => s.status === 'pending')
      } else if (filters.status === 'submitted') {
        // 정산 신청 완료 및 대기 중: calculated, review 상태
        filteredData = data.filter(s => s.status === 'calculated' || s.status === 'review')
      } else if (filters.status === 'issues') {
        // 정산 이슈 확인 필요: review 상태 중 이슈가 있는 것들
        filteredData = data.filter(s => s.status === 'review')
      }

      setSettlements(filteredData)
    } catch (error) {
      console.error('정산 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.search, filters.status, user?.instructorId])

  const loadAllSettlements = useCallback(async () => {
    if (!user?.instructorId) return

    try {
      const data = await getMySettlements(user.instructorId)
      setAllSettlements(data)
    } catch (error) {
      console.error('전체 정산 로드 실패:', error)
    }
  }, [user?.instructorId])

  useEffect(() => {
    if (user?.instructorId) {
      loadSettlements()
      loadAllSettlements() // 탭 카운트용
    }
  }, [user?.instructorId, filters, loadSettlements, loadAllSettlements])

  const handleStatusChange = (
    status: SettlementStatus | 'not-applied' | 'submitted' | 'issues' | 'all'
  ) => {
    setParams({
      status: status === 'all' ? undefined : status,
    })
  }

  const handleSearch = (value: string) => {
    setParams({
      search: value || undefined,
    })
  }

  const handleSearchChange = (value: string) => {
    setParams({
      search: value || undefined,
    })
  }

  const handleViewSettlement = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setDrawerOpen(true)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setParams({
      view: mode,
    })
  }

  const handlePeriodChange = (period: string) => {
    setParams({
      period: period,
    })
  }

  const handleCalendarSelect = (_date: dayjs.Dayjs, settlement?: Settlement) => {
    if (settlement) {
      handleViewSettlement(settlement)
    }
  }

  // 사용 가능한 기간 목록
  const availablePeriods = useMemo(() => {
    const periods = new Set<string>()
    allSettlements.forEach(s => {
      const period = s.period || dayjs(s.createdAt).format('YYYY-MM')
      periods.add(period)
    })
    // 최근 순 정렬
    return Array.from(periods).sort((a, b) => (a > b ? -1 : 1))
  }, [allSettlements])

  // 선택된 기간의 정산만 필터링
  const filteredByPeriod = useMemo(() => {
    return settlements.filter(s => {
      const period = s.period || dayjs(s.createdAt).format('YYYY-MM')
      return period === selectedPeriod
    })
  }, [settlements, selectedPeriod])

  const columns = [
    {
      title: '정산 ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id: string, record: Settlement) => (
        <Button type="link" onClick={() => handleViewSettlement(record)} style={{ padding: 0 }}>
          {id}
        </Button>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: SettlementStatus) => (
        <StatusBadge status={status} statusConfig={settlementStatusStatusConfig} />
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
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string | Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '업데이트일',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (date: string | Date) => dayjs(date).format('YYYY-MM-DD'),
    },
  ]

  if (!user?.instructorId) {
    return (
      <div>
        <h1>본인 정산</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px', color: 'rgba(0, 0, 0, 0.45)' }}>
            강사 정보가 없습니다.
          </div>
        </Card>
      </div>
    )
  }

  const activeTabKey = filters.status

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        <Space>
          <Segmented
            value={viewMode}
            onChange={value => handleViewModeChange(value as ViewMode)}
            options={[
              {
                label: (
                  <span>
                    <TableOutlined style={{ marginRight: 4 }} />
                    목록 보기
                  </span>
                ),
                value: 'list',
                title: '정산 목록을 테이블 형태로 확인합니다.',
              },
              {
                label: (
                  <span>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    캘린더 보기
                  </span>
                ),
                value: 'calendar',
                title:
                  '정산 일정을 캘린더 형태로 확인합니다. 기간별 정산 현황을 한눈에 파악할 수 있습니다.',
              },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setSubmitModalOpen(true)}>
            정산 제출
          </Button>
        </Space>
      </Space>

      {/* 상태별 탭 */}
      <Tabs
        activeKey={activeTabKey}
        onChange={key => handleStatusChange(key as SettlementStatus | 'all')}
        items={statusTabs.map(tab => ({
          key: tab.key,
          label: (
            <span>
              {tab.label}
              {tab.key !== 'all' && (
                <span style={{ marginLeft: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
                  {(() => {
                    let count = 0
                    if (tab.key === 'not-applied') {
                      count = allSettlements.filter(s => s.status === 'pending').length
                    } else if (tab.key === 'submitted') {
                      count = allSettlements.filter(
                        s => s.status === 'calculated' || s.status === 'review'
                      ).length
                    } else if (tab.key === 'issues') {
                      count = allSettlements.filter(s => s.status === 'review').length
                    } else {
                      count = allSettlements.filter(s => s.status === tab.key).length
                    }
                    return `(${count})`
                  })()}
                </span>
              )}
            </span>
          ),
        }))}
        style={{ marginBottom: 16 }}
      />

      {viewMode === 'list' ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Space size="middle" wrap align="start">
              <LabeledSearchInput
                label="정산 ID"
                placeholder="정산 ID를 입력하세요"
                value={filters.search || ''}
                onChange={handleSearchChange}
                onSearch={handleSearch}
                width={300}
              />
              <Space>
                <span>기간 선택:</span>
                <Select
                  value={selectedPeriod}
                  onChange={handlePeriodChange}
                  style={{ width: 160 }}
                  options={availablePeriods.map(p => ({
                    label: dayjs(p).format('YYYY년 MM월'),
                    value: p,
                  }))}
                />
              </Space>
              <Button onClick={() => clearParams()}>필터 초기화</Button>
            </Space>
          </Card>
          <Card>
            <Table
              columns={columns}
              dataSource={filteredByPeriod}
              rowKey="id"
              loading={loading}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showTotal: total => `총 ${total}개`,
              }}
            />
          </Card>
        </>
      ) : (
        <Card title="정산 캘린더">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Space>
              <span>기간 선택:</span>
              <Select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                style={{ width: 160 }}
                options={availablePeriods.map(p => ({
                  label: dayjs(p).format('YYYY년 MM월'),
                  value: p,
                }))}
              />
            </Space>
            <SettlementCalendar
              settlements={filteredByPeriod}
              onDateSelect={handleCalendarSelect}
              selectedPeriod={selectedPeriod}
            />
          </Space>
        </Card>
      )}

      <SettlementDetailDrawer
        open={drawerOpen}
        settlement={selectedSettlement}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedSettlement(null)
        }}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={async () => {}}
        loading={loading}
      />

      <SettlementSubmitModal
        open={submitModalOpen}
        onCancel={() => setSubmitModalOpen(false)}
        onSuccess={() => {
          loadSettlements()
          loadAllSettlements()
        }}
      />
    </div>
  )
}
