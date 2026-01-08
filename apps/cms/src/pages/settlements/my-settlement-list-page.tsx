/**
 * 본인 정산 목록 페이지 (강사/봉사자용)
 * Phase 5.2.4: 본인 정산 정보
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input, Space, Card, Tag, Button, Table, Tabs } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMySettlements } from '@/entities/settlement/api/instructor-settlement-service'
import { getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { SettlementSubmitModal } from '@/features/settlement/ui/settlement-submit-modal'
import dayjs from 'dayjs'
import type { Settlement, SettlementStatus } from '@/types/domain'
const { Search } = Input

// 정산 상태별 탭 정의
const statusTabs: Array<{ key: SettlementStatus | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'calculated', label: '산출 완료' },
  { key: 'approved', label: '승인' },
  { key: 'paid', label: '지급 완료' },
  { key: 'cancelled', label: '취소' },
]

export function MySettlementListPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [allSettlements, setAllSettlements] = useState<Settlement[]>([]) // 탭 카운트용
  const [loading, setLoading] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  // 필터 값 (쿼리 파라미터에서 읽기)
  const filters = useMemo(() => {
    return {
      status: (searchParams.get('status') as SettlementStatus | 'all') || 'all',
      search: searchParams.get('search') || undefined,
    }
  }, [searchParams])

  useEffect(() => {
    if (user?.instructorId) {
      loadSettlements()
      loadAllSettlements() // 탭 카운트용
    }
  }, [user?.instructorId, filters])

  const loadSettlements = async () => {
    if (!user?.instructorId) return

    setLoading(true)
    try {
      const apiFilters = filters.status !== 'all' ? { status: filters.status } : undefined
      const data = await getMySettlements(user.instructorId, {
        ...apiFilters,
        search: filters.search,
      })
      setSettlements(data)
    } catch (error) {
      console.error('정산 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllSettlements = async () => {
    if (!user?.instructorId) return

    try {
      const data = await getMySettlements(user.instructorId)
      setAllSettlements(data)
    } catch (error) {
      console.error('전체 정산 로드 실패:', error)
    }
  }

  const handleStatusChange = (status: SettlementStatus | 'all') => {
    const newParams = new URLSearchParams(searchParams)
    if (status === 'all') {
      newParams.delete('status')
    } else {
      newParams.set('status', status)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleSearch = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (!value) {
      newParams.delete('search')
    } else {
      newParams.set('search', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleViewSettlement = (settlement: Settlement) => {
    navigate(`/settlements/my/${settlement.id}`)
  }

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
        <Tag color={getSettlementStatusColor(status)}>{getSettlementStatusLabel(status)}</Tag>
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
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>본인 정산</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/settlements/my/submit')}
        >
          정산 제출
        </Button>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Search
            placeholder="정산 ID 검색"
            allowClear
            style={{ width: 250 }}
            defaultValue={filters.search}
            onSearch={handleSearch}
            enterButton
          />
          <Button onClick={() => setSearchParams({}, { replace: true })}>필터 초기화</Button>
        </Space>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTabKey}
          onChange={(key) => handleStatusChange(key as SettlementStatus | 'all')}
          items={statusTabs.map(tab => ({
            key: tab.key,
            label: (
              <span>
                {tab.label}
                {tab.key !== 'all' && (
                  <span style={{ marginLeft: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
                    ({allSettlements.filter(s => s.status === tab.key).length})
                  </span>
                )}
              </span>
            ),
            children: (
              <Table
                columns={columns}
                dataSource={settlements}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: total => `총 ${total}개`,
                }}
              />
            ),
          }))}
        />
      </Card>

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

