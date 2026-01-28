/**
 * 스폰서 상세 컴포넌트
 * Phase 1.3: 상세 정보 표시
 * P0: 후원사 프로그램 목록 표시 기능 추가
 * P2: 프로그램 목록 필터/정렬 기능 추가
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Space, Button, Table, Empty, Spin, Divider } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import type { Sponsor, Program, ProgramLifecycleStatus } from '@/types/domain'
import { domainColorsHex } from '@/shared/constants/colors'
import { programService } from '@/entities/program/api/program-service'
import { StatusBadge } from '@/shared/ui/status-badge'
import {
  programLifecycleStatusConfig,
  programLifecycleStatusStatusConfig,
  getProgramLifecycleLabel,
} from '@/shared/constants/status'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'

interface SponsorDetailProps {
  sponsor: Sponsor
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

export function SponsorDetail({ sponsor, onEdit, onDelete, loading }: SponsorDetailProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [programs, setPrograms] = useState<Program[]>([])
  const [programsLoading, setProgramsLoading] = useState(false)

  // 필터 상태 관리 (조회 버튼 클릭 전까지 임시 저장)
  const [pendingFilters, setPendingFilters] = useState({
    search: '',
    status: 'all' as ProgramLifecycleStatus | 'all',
  })

  // 활성 필터 (조회 버튼 클릭 시 적용)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: 'all' as ProgramLifecycleStatus | 'all',
  })

  useEffect(() => {
    const loadPrograms = async () => {
      setProgramsLoading(true)
      try {
        const sponsorPrograms = await programService.getBySponsorId(sponsor.id)
        setPrograms(sponsorPrograms)
      } catch (error) {
        console.error('프로그램 목록 로드 실패:', error)
      } finally {
        setProgramsLoading(false)
      }
    }

    loadPrograms()
  }, [sponsor.id])

  const handleViewProgram = (programId: string) => {
    navigate(`/programs/${programId}/edit`)
  }

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(() => {
    setAppliedFilters(pendingFilters)
  }, [pendingFilters])

  // 필터 초기화 핸들러
  const handleFilterReset = useCallback(() => {
    const resetFilters = { search: '', status: 'all' as const }
    setPendingFilters(resetFilters)
    setAppliedFilters(resetFilters)
  }, [])

  // 필터링된 데이터
  const filteredPrograms = useMemo(() => {
    let filtered = [...programs]

    // 검색 필터
    if (appliedFilters.search.trim()) {
      const query = appliedFilters.search.trim().toLowerCase()
      filtered = filtered.filter(program => program.title.toLowerCase().includes(query))
    }

    // 상태 필터
    if (appliedFilters.status !== 'all') {
      filtered = filtered.filter(program => program.lifecycleStatus === appliedFilters.status)
    }

    return filtered
  }, [programs, appliedFilters])

  // 상태 옵션 생성
  const statusOptions = useMemo(() => {
    const options = [
      { value: 'all', label: '전체' },
      ...programLifecycleStatusConfig.order.map(status => ({
        value: status,
        label: getProgramLifecycleLabel(status),
      })),
    ]
    return options
  }, [])

  const programColumns: ColumnsType<Program> = [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text: string) => (
        <Tag
          color={domainColorsHex.program.primary}
          style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'lifecycleStatus',
      key: 'lifecycleStatus',
      sorter: (a, b) => {
        const aStatus = a.lifecycleStatus || ''
        const bStatus = b.lifecycleStatus || ''
        return aStatus.localeCompare(bStatus)
      },
      render: (status: string | undefined) => {
        if (!status) return '-'
        return <StatusBadge status={status} statusConfig={programLifecycleStatusStatusConfig} />
      },
    },
    {
      title: '시작일',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: (a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0
        return aDate - bDate
      },
      render: (date: string) => (date ? new Date(date).toLocaleDateString('ko-KR') : '-'),
    },
    {
      title: '종료일',
      dataIndex: 'endDate',
      key: 'endDate',
      sorter: (a, b) => {
        const aDate = a.endDate ? new Date(a.endDate).getTime() : 0
        const bDate = b.endDate ? new Date(b.endDate).getTime() : 0
        return aDate - bDate
      },
      render: (date: string) => (date ? new Date(date).toLocaleDateString('ko-KR') : '-'),
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: Program) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewProgram(record.id)}>
          상세보기
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card
        title={
          <Space>
            <Tag
              color={domainColorsHex.sponsor.primary}
              style={{ fontSize: 16, padding: '4px 12px' }}
            >
              {sponsor.name}
            </Tag>
          </Space>
        }
        extra={
          canWrite ? (
            <Space>
              <Button onClick={onEdit}>수정</Button>
              <Button danger onClick={onDelete} loading={loading}>
                삭제
              </Button>
            </Space>
          ) : null
        }
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="설명">{sponsor.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="연락처">{sponsor.contactInfo || '-'}</Descriptions.Item>
          {sponsor.securityMemo && (
            <Descriptions.Item label="보안 메모">
              <div style={{ backgroundColor: '#fff7e6', padding: 12, borderRadius: 4 }}>
                {sponsor.securityMemo}
              </div>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="등록일">
            {new Date(sponsor.createdAt).toLocaleDateString('ko-KR')}
          </Descriptions.Item>
          <Descriptions.Item label="수정일">
            {new Date(sponsor.updatedAt).toLocaleDateString('ko-KR')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      <Card title="진행 중인 프로그램" style={{ marginTop: 16 }}>
        {/* 필터 카드 */}
        <UnifiedFilterCard
          fields={[
            {
              key: 'search',
              type: 'search',
              label: '프로그램명',
              placeholder: '프로그램명을 입력하세요',
            },
            {
              key: 'status',
              type: 'select',
              label: '상태',
              placeholder: '전체',
              options: statusOptions,
            },
          ]}
          filters={{
            search: pendingFilters.search,
            status: pendingFilters.status,
          }}
          onFilterChange={(key, value) => {
            setPendingFilters(prev => ({
              ...prev,
              [key]: value || (key === 'status' ? 'all' : ''),
            }))
          }}
          onSearch={handleSearch}
          onReset={handleFilterReset}
          loading={programsLoading}
          resetButtonText="초기화"
        />

        {/* 프로그램 목록 테이블 */}
        <Spin spinning={programsLoading}>
          {filteredPrograms.length === 0 ? (
            <Empty
              description={
                programs.length === 0 ? '진행 중인 프로그램이 없습니다' : '검색 결과가 없습니다'
              }
            />
          ) : (
            <Table
              dataSource={filteredPrograms}
              columns={programColumns}
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showTotal: total => `총 ${total}개`,
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}
