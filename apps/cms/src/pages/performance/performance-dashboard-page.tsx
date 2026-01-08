/**
 * 예산 및 실적 관리 대시보드 (Phase 9 스캐폴딩)
 * - Program Mock 데이터를 기반으로 월별/지역별/프로그램별 실적 요약을 보여주는 관리자용 화면
 */

import { useMemo } from 'react'
import { Card, Space, Statistic, Table, Tag, Select, Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { mockPrograms } from '@/data/mock'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { exportTableToExcel } from '@/shared/utils/table-export'

interface PerformanceRow {
  key: string
  period: string // YYYY-MM
  region: string
  sponsorName: string
  programCount: number
  totalParticipants: number
}

export default function PerformanceDashboardPage() {
  const { params, setParams } = useQueryParams<{ period?: string; region?: string }>()

  // 원본 데이터에서 월, 지역, 후원사 기준 집계
  const allRows: PerformanceRow[] = useMemo(() => {
    const map = new Map<string, PerformanceRow>()

    mockPrograms.forEach(program => {
      if (!program.startDate) return
      const period = dayjs(program.startDate).format('YYYY-MM')
      const region = program.district || '미지정'
      const sponsor = sponsorService.getByIdSync(program.sponsorId)
      const sponsorName = sponsor?.name || '알 수 없음'
      const key = `${period}__${region}__${sponsorName}`
      const participants =
        typeof program.totalParticipants === 'number' ? program.totalParticipants : 0

      const existing = map.get(key)
      if (existing) {
        existing.programCount += 1
        existing.totalParticipants += participants
      } else {
        map.set(key, {
          key,
          period,
          region,
          sponsorName,
          programCount: 1,
          totalParticipants: participants,
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period))
  }, [])

  const periods = Array.from(new Set(allRows.map(r => r.period))).sort()
  const regions = Array.from(new Set(allRows.map(r => r.region))).sort()

  const selectedPeriod = params.period || periods[periods.length - 1] || undefined
  const selectedRegion = params.region

  const filteredRows = allRows.filter(row => {
    if (selectedPeriod && row.period !== selectedPeriod) return false
    if (selectedRegion && row.region !== selectedRegion) return false
    return true
  })

  const totalProgramCount = filteredRows.reduce((sum, r) => sum + r.programCount, 0)
  const totalParticipants = filteredRows.reduce((sum, r) => sum + r.totalParticipants, 0)
  const uniqueRegions = new Set(filteredRows.map(r => r.region)).size

  const handleExportExcel = async () => {
    await exportTableToExcel(columns, filteredRows, '실적통계')
  }

  const columns: ColumnsType<PerformanceRow> = [
    {
      title: '기간',
      dataIndex: 'period',
      key: 'period',
      width: 120,
      render: (value: string) => dayjs(value).format('YYYY년 MM월'),
    },
    {
      title: '지역(시군구)',
      dataIndex: 'region',
      key: 'region',
      width: 180,
      render: (value: string) => value || '-',
    },
    {
      title: '후원사',
      dataIndex: 'sponsorName',
      key: 'sponsorName',
      width: 200,
      render: (value: string) => <Tag color="cyan">{value}</Tag>,
    },
    {
      title: '프로그램 수',
      dataIndex: 'programCount',
      key: 'programCount',
      width: 120,
      align: 'right',
      render: (value: number) => `${value}개`,
    },
    {
      title: '총 참가자 수',
      dataIndex: 'totalParticipants',
      key: 'totalParticipants',
      width: 140,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}명`,
    },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>실적 통계</h1>
        </Space>

        {/* 기간/지역 선택 + 요약 카드 */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space size="middle" wrap>
              <span>기간 선택:</span>
              <Select
                value={selectedPeriod}
                style={{ width: 160 }}
                onChange={value => setParams({ period: value || undefined })}
                options={periods.map(p => ({
                  label: dayjs(p).format('YYYY년 MM월'),
                  value: p,
                }))}
              />
              <span>지역:</span>
              <Select
                allowClear
                placeholder="전체"
                value={selectedRegion}
                style={{ width: 200 }}
                onChange={value => setParams({ region: (value as string) || undefined })}
                options={regions.map(r => ({
                  label: r,
                  value: r,
                }))}
              />
            </Space>
            <Space size="large" wrap>
              <Statistic title="총 프로그램 수" value={totalProgramCount} suffix="개" />
              <Statistic
                title="총 참가자 수"
                value={totalParticipants}
                suffix="명"
                formatter={value => Number(value).toLocaleString('ko-KR')}
              />
              <Statistic title="운영 지역 수" value={uniqueRegions} suffix="개" />
            </Space>
          </Space>
        </Card>

        {/* 테이블 */}
        <Card
          title="기간/지역/후원사별 실적 요약"
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
            >
              엑셀 다운로드
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredRows}
            rowKey="key"
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
