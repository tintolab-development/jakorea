/**
 * 예산 및 실적 관리 대시보드
 * - 프로그램별 실적 통계 요약 (익명/집계)
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Card, Space, Statistic, Table, Tag, Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { exportTableToExcel } from '@/shared/utils/table-export'
import type { PerformanceStats } from '@/types/domain'
import { usePerformanceStats } from '@/features/performance/hooks/use-performance-stats'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import './performance-dashboard-page.css'

// 필터 옵션 상수
const businessAreas = [
  { value: '경제금융', label: '경제금융' },
  { value: '기업가정신', label: '기업가정신' },
  { value: '진로탐색', label: '진로탐색' },
  { value: '리더십', label: '리더십' },
]

const ipsOptions = [
  { value: 'Prepare', label: 'Prepare' },
  { value: 'Succeed', label: 'Succeed' },
  { value: 'Inspire', label: 'Inspire' },
]

const targetLevelOptions = [
  { value: 'elementary', label: '초' },
  { value: 'middle', label: '중' },
  { value: 'high', label: '고' },
]

const institutionTypeOptions = [
  { value: 'inside_school', label: '학교 안' },
  { value: 'outside_school', label: '학교 밖' },
]

export default function PerformanceDashboardPage() {
  const { params, setParams } = useQueryParams<{ period?: string; programId?: string }>()

  const { stats, loading, availablePeriods, fetchStats } = usePerformanceStats({
    period: undefined, // 페이지에서 직접 필터링
    programId: undefined,
  })

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // 필터 상태 (임시)
  const [pendingFilters, setPendingFilters] = useState<{
    programName: string
    period: string
    businessArea: string
    sponsorId: string
    ips: string
    targetLevel: string
    institutionType: string
    si: string
    gun: string
    gu: string
  }>({
    programName: '',
    period: '',
    businessArea: '',
    sponsorId: '',
    ips: '',
    targetLevel: '',
    institutionType: '',
    si: '',
    gun: '',
    gu: '',
  })

  // 적용된 필터 상태
  const [appliedFilters, setAppliedFilters] = useState<{
    programName: string
    period: string
    businessArea: string
    sponsorId: string
    ips: string
    targetLevel: string
    institutionType: string
    si: string
    gun: string
    gu: string
  }>({
    programName: '',
    period: '',
    businessArea: '',
    sponsorId: '',
    ips: '',
    targetLevel: '',
    institutionType: '',
    si: '',
    gun: '',
    gu: '',
  })

  // 후원사 목록
  const [sponsors, setSponsors] = useState<Array<{ label: string; value: string }>>([])

  useEffect(() => {
    const loadSponsors = async () => {
      try {
        const sponsorList = await sponsorService.getAll()
        setSponsors([
          { label: '전체', value: '' },
          ...sponsorList.map(s => ({ label: s.name, value: s.id })),
        ])
      } catch (error) {
        console.error('Failed to load sponsors:', error)
      }
    }
    loadSponsors()
  }, [])

  // 시/도/군/구 옵션 (실제 데이터에서 추출)
  const regionOptions = useMemo(() => {
    const regions = new Set<string>()
    stats.forEach(item => {
      // region에서 시/도/군/구 추출 (예: "경기 의정부시" -> "경기", "의정부시")
      if (item.region) {
        const parts = item.region.trim().split(/\s+/)
        parts.forEach(part => {
          if (part.endsWith('시') || part.endsWith('도')) {
            regions.add(part)
          }
        })
      }
    })
    return Array.from(regions)
      .sort()
      .map(r => ({ label: r, value: r }))
  }, [stats])

  const gunOptions = useMemo(() => {
    if (!appliedFilters.si) return []
    const guns = new Set<string>()
    stats.forEach(item => {
      if (item.region && item.region.includes(appliedFilters.si)) {
        const parts = item.region.trim().split(/\s+/)
        parts.forEach(part => {
          if (part.endsWith('군')) {
            guns.add(part)
          }
        })
      }
    })
    return Array.from(guns)
      .sort()
      .map(g => ({ label: g, value: g }))
  }, [stats, appliedFilters.si])

  const guOptions = useMemo(() => {
    if (!appliedFilters.si) return []
    const gus = new Set<string>()
    stats.forEach(item => {
      if (item.region && item.region.includes(appliedFilters.si)) {
        const parts = item.region.trim().split(/\s+/)
        parts.forEach(part => {
          if (part.endsWith('구')) {
            gus.add(part)
          }
        })
      }
    })
    return Array.from(gus)
      .sort()
      .map(g => ({ label: g, value: g }))
  }, [stats, appliedFilters.si])

  // 초기화 여부 추적
  const initializedRef = useRef(false)

  // 쿼리 파라미터 및 availablePeriods 변경 시 pendingFilters 동기화
  useEffect(() => {
    if (availablePeriods.length === 0) return
    
    const defaultPeriod = params.period || availablePeriods[0] || ''
    
    // 초기화는 한 번만 수행
    if (!initializedRef.current) {
      initializedRef.current = true
      setPendingFilters({
        programName: '',
        period: defaultPeriod,
        businessArea: '',
        sponsorId: '',
        ips: '',
        targetLevel: '',
        institutionType: '',
        si: '',
        gun: '',
        gu: '',
      })
      
      // 쿼리 파라미터에 period가 있으면 자동 적용
      if (params.period) {
        setAppliedFilters({
          programName: '',
          period: defaultPeriod,
          businessArea: '',
          sponsorId: '',
          ips: '',
          targetLevel: '',
          institutionType: '',
          si: '',
          gun: '',
          gu: '',
        })
      }
    } else {
      // 이후에는 period 변경 시에만 pendingFilters 업데이트
      if (params.period) {
        setPendingFilters(prev => ({
          ...prev,
          period: params.period || '',
        }))
      }
    }
  }, [params.period, availablePeriods])

  // 필터링된 통계
  const filteredStats = useMemo(() => {
    return stats.filter(item => {
      // 프로그램명 검색
      if (appliedFilters.programName.trim()) {
        const query = appliedFilters.programName.trim().toLowerCase()
        if (!item.programName.toLowerCase().includes(query)) {
          return false
        }
      }

      // 기간 필터
      if (appliedFilters.period) {
        const period = dayjs(item.period.startDate).format('YYYY-MM')
        if (period !== appliedFilters.period) {
          return false
        }
      }

      // 사업분야 필터
      if (appliedFilters.businessArea && item.businessArea !== appliedFilters.businessArea) {
        return false
      }

      // 후원사 필터
      if (appliedFilters.sponsorId && item.sponsorId !== appliedFilters.sponsorId) {
        return false
      }

      // IPS 분류 필터
      if (appliedFilters.ips && item.ips !== appliedFilters.ips) {
        return false
      }

      // 대상 구분 필터
      if (appliedFilters.targetLevel && item.targetLevel !== appliedFilters.targetLevel) {
        return false
      }

      // 기관 구분 필터
      if (
        appliedFilters.institutionType &&
        item.institutionType !== appliedFilters.institutionType
      ) {
        return false
      }

      // 시/도 필터
      if (appliedFilters.si) {
        if (!item.region || !item.region.includes(appliedFilters.si)) {
          return false
        }
      }

      // 군 필터
      if (appliedFilters.gun) {
        if (!item.region || !item.region.includes(appliedFilters.gun)) {
          return false
        }
      }

      // 구 필터
      if (appliedFilters.gu) {
        if (!item.region || !item.region.includes(appliedFilters.gu)) {
          return false
        }
      }

      return true
    })
  }, [stats, appliedFilters])

  // 요약 통계 계산
  const summary = useMemo(() => {
    return filteredStats.reduce(
      (acc, item) => {
        acc.programCount += 1
        acc.totalApplications += item.stats.totalApplications
        acc.approvedApplications += item.stats.approvedApplications
        acc.totalStudents += item.stats.totalStudents
        acc.totalInstructors += item.stats.totalInstructors
        acc.totalSettlementAmount += item.stats.totalSettlementAmount
        return acc
      },
      {
        programCount: 0,
        totalApplications: 0,
        approvedApplications: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalSettlementAmount: 0,
      }
    )
  }, [filteredStats])

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(() => {
    setAppliedFilters(pendingFilters)
    // 쿼리 파라미터 업데이트
    setParams({
      period: pendingFilters.period || undefined,
    })
  }, [pendingFilters, setParams])

  // 필터 초기화 핸들러
  const handleFilterReset = useCallback(() => {
    const defaultPeriod = availablePeriods[0] || ''
    const resetFilters = {
      programName: '',
      period: defaultPeriod,
      businessArea: '',
      sponsorId: '',
      ips: '',
      targetLevel: '',
      institutionType: '',
      si: '',
      gun: '',
      gu: '',
    }
    setPendingFilters(resetFilters)
    setAppliedFilters(resetFilters)
    setParams({
      period: undefined,
    })
  }, [availablePeriods, setParams])

  // 필터 옵션
  const periodOptions = useMemo(() => {
    return [
      { label: '전체', value: '' },
      ...availablePeriods.map(period => ({
        label: dayjs(period).format('YYYY년 MM월'),
        value: period,
      })),
    ]
  }, [availablePeriods])

  const handleExportExcel = async () => {
    await exportTableToExcel(columns, filteredStats, '실적통계')
  }

  const columns: ColumnsType<PerformanceStats> = [
    {
      title: '프로그램',
      dataIndex: 'programName',
      key: 'programName',
      width: 220,
      render: (value: string) => <Tag color="cyan">{value}</Tag>,
    },
    {
      title: '기간',
      dataIndex: 'period',
      key: 'period',
      width: 120,
      render: (value: PerformanceStats['period']) =>
        `${dayjs(value.startDate).format('YYYY.MM')} ~ ${dayjs(value.endDate).format('YYYY.MM')}`,
    },
    {
      title: '총 신청',
      dataIndex: ['stats', 'totalApplications'],
      key: 'totalApplications',
      width: 110,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}건`,
    },
    {
      title: '승인',
      dataIndex: ['stats', 'approvedApplications'],
      key: 'approvedApplications',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}건`,
    },
    {
      title: '학교',
      dataIndex: ['stats', 'totalSchools'],
      key: 'totalSchools',
      width: 80,
      align: 'right',
      render: (value: number) => `${value}곳`,
    },
    {
      title: '학생',
      dataIndex: ['stats', 'totalStudents'],
      key: 'totalStudents',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}명`,
    },
    {
      title: '강사',
      dataIndex: ['stats', 'totalInstructors'],
      key: 'totalInstructors',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}명`,
    },
    {
      title: '총 차시',
      dataIndex: ['stats', 'totalSessions'],
      key: 'totalSessions',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}차시`,
    },
    {
      title: '총 정산액',
      dataIndex: ['stats', 'totalSettlementAmount'],
      key: 'totalSettlementAmount',
      width: 140,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}원`,
    },
    {
      title: '만족도',
      dataIndex: ['stats', 'satisfactionScore'],
      key: 'satisfactionScore',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toFixed(1)} / 5`,
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" className="performance-dashboard">
        {/* 필터 */}
        <UnifiedFilterCard
          fields={[
            {
              key: 'programName',
              type: 'search',
              label: '프로그램명',
              placeholder: '프로그램명을 입력하세요',
            },
            {
              key: 'period',
              type: 'select',
              label: '교육 월',
              placeholder: '전체',
              options: periodOptions,
            },
            {
              key: 'businessArea',
              type: 'select',
              label: '사업분야',
              placeholder: '전체',
              options: businessAreas,
            },
            {
              key: 'sponsorId',
              type: 'select',
              label: '후원사 선택',
              placeholder: '전체',
              options: sponsors,
            },
            {
              key: 'ips',
              type: 'select',
              label: 'IPS 분류',
              placeholder: '전체',
              options: ipsOptions,
            },
            {
              key: 'targetLevel',
              type: 'select',
              label: '대상 구분',
              placeholder: '전체',
              options: targetLevelOptions,
            },
            {
              key: 'institutionType',
              type: 'select',
              label: '기관 구분',
              placeholder: '전체',
              options: institutionTypeOptions,
            },
            {
              key: 'si',
              type: 'select',
              label: '시/도',
              placeholder: '전체',
              options: regionOptions,
            },
            {
              key: 'gun',
              type: 'select',
              label: '군',
              placeholder: '전체',
              options: gunOptions,
            },
            {
              key: 'gu',
              type: 'select',
              label: '구',
              placeholder: '전체',
              options: guOptions,
            },
          ]}
          filters={pendingFilters}
          onFilterChange={(key, value) => {
            setPendingFilters(prev => {
              const updated = { ...prev, [key]: value }
              // 시/도가 변경되면 군/구 초기화
              if (key === 'si') {
                updated.gun = ''
                updated.gu = ''
              }
              return updated
            })
          }}
          onSearch={handleSearch}
          onReset={handleFilterReset}
          loading={loading}
          resetButtonText="초기화"
          extra={
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportExcel}>
              엑셀 다운로드
            </Button>
          }
        />

        {/* 요약 카드 */}
        <Card>
          <Space size="large" wrap className="performance-dashboard__summary">
            <Statistic title="프로그램 수" value={summary.programCount} suffix="개" />
            <Statistic
              title="총 신청 수"
              value={summary.totalApplications}
              formatter={value => Number(value).toLocaleString('ko-KR')}
            />
            <Statistic
              title="총 학생 수"
              value={summary.totalStudents}
              formatter={value => Number(value).toLocaleString('ko-KR')}
            />
            <Statistic
              title="총 정산액"
              value={summary.totalSettlementAmount}
              formatter={value => Number(value).toLocaleString('ko-KR')}
            />
          </Space>
        </Card>

        {/* 테이블 */}
        <Card
          title="프로그램별 실적 통계"
          extra={
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportExcel}>
              엑셀 다운로드
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredStats}
            rowKey="id"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: total => `총 ${total}개`,
            }}
          />
        </Card>
      </Space>
    </div>
  )
}
