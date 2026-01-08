/**
 * 실적 통계 목록 컴포넌트 (v2)
 * 핵심 컬럼만 표시, 상세 정보는 상세 패널에서 확인
 * 테이블 / 차트 탭 전환 지원
 */

import { Table, Input, Select, Button, Space, Tag, Tooltip, Tabs, Card, Segmented } from 'antd'
import { useEducationRecordTable } from '../model/use-education-record-table'
import type { Program } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import { schoolService } from '@/entities/school/api/school-service'
import { mockApplications } from '@/data/mock'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'
import { useMemo, useState } from 'react'
import { MOCK_SIDO_SIGUNGU } from '@/shared/constants/sido-sigungu'
import dayjs from 'dayjs'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'

const { Option } = Select

interface EducationRecordListV2Props {
  data: Program[]
  loading?: boolean
  onView?: (record: Program) => void
}

interface EducationRecordQueryParams extends Record<string, string | undefined> {
  educationMonth?: string
  businessArea?: string
  sponsorId?: string
  ips?: string
  targetLevel?: string
  institutionType?: string
  sido?: string // 시/도
  gun?: string // 군
  gu?: string // 구
}

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

const educationMonths = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}월`,
}))

export function EducationRecordListV2({ data, loading, onView }: EducationRecordListV2Props) {
  const { params, setParams } = useQueryParams<EducationRecordQueryParams>()
  const [chartView, setChartView] = useState<'trend' | 'ips' | 'level'>('trend')

  // helper: region/address 문자열에서 시/군/구 단위 추출 (접미사 기준)
  const parseRegion = (region?: string) => {
    if (!region) return { si: '', gun: '', gu: '' }
    const tokens = region.trim().split(/\s+/)
    let si = ''
    let gun = ''
    let gu = ''
    tokens.forEach(token => {
      if (token.endsWith('시')) si = si || token
      else if (token.endsWith('군')) gun = gun || token
      else if (token.endsWith('구')) gu = gu || token
    })
    return { si, gun, gu }
  }

  // 시/도 + 군/구 필터를 적용한 데이터 (컴포넌트 레벨 필터링)
  const filteredDataByRegion = useMemo(() => {
    const sidoFilter = params.sido
    const gunFilter = params.gun
    const guFilter = params.gu

    // Program별 학교 정보 매핑 (Application을 통해)
    const map = new Map<
      string,
      {
        schoolId: string
        schoolName: string
        region: string
        sido: string
        si: string
        gun: string
        gu: string
      }
    >()
    mockApplications.forEach(app => {
      if (app.subjectType === 'school' && app.programId) {
        const school = schoolService.getAllSync().find(s => s.id === app.subjectId)
        if (school && !map.has(app.programId)) {
          const baseRegionText = school.address ?? school.region
          const { si, gun, gu } = parseRegion(baseRegionText)
          const matchedSido =
            MOCK_SIDO_SIGUNGU.find(sido =>
              sido.sigungu.some(sg => sg.name === si || sg.name === gun || sg.name === gu)
            )?.name || ''
          map.set(app.programId, {
            schoolId: school.id,
            schoolName: school.name,
            region: school.region,
            sido: matchedSido,
            si,
            gun,
            gu,
          })
        }
      }
    })

    return data.filter(program => {
      const schoolInfo = map.get(program.id)
      const parsed = schoolInfo || parseRegion(program.district)
      if (sidoFilter && schoolInfo?.sido !== sidoFilter) return false
      if (gunFilter && parsed.gun !== gunFilter) return false
      if (guFilter && parsed.gu !== guFilter) return false
      return true
    })
  }, [data, params.sido, params.gun, params.gu])

  const { table, resetFilters } = useEducationRecordTable(filteredDataByRegion)

  const sponsors = sponsorService.getAllSync()
  const schools = schoolService.getAllSync()
  const applications = mockApplications

  // Program별 학교 정보 매핑 (Application을 통해)
  const programSchoolMap = useMemo(() => {
    const map = new Map<
      string,
      { schoolId: string; schoolName: string; region: string; si: string; gun: string; gu: string }
    >()
    applications.forEach(app => {
      if (app.subjectType === 'school' && app.programId) {
        const school = schools.find(s => s.id === app.subjectId)
        if (school && !map.has(app.programId)) {
          const baseRegionText = school.address ?? school.region
          const { si, gun, gu } = parseRegion(baseRegionText)
          map.set(app.programId, {
            schoolId: school.id,
            schoolName: school.name,
            region: school.region,
            si,
            gun,
            gu,
          })
        }
      }
    })
    return map
  }, [applications, schools])

  // 시/도, 군, 구 옵션 (Mock SIDO/SIGUNGU 기준)
  const sidoList = MOCK_SIDO_SIGUNGU.map(s => s.name)
  const currentSido = params.sido
  const currentSidoConfig = MOCK_SIDO_SIGUNGU.find(s => s.name === currentSido)
  const baseSigungu = currentSidoConfig
    ? currentSidoConfig.sigungu
    : MOCK_SIDO_SIGUNGU.flatMap(s => s.sigungu)

  const gunList = Array.from(
    new Set(baseSigungu.filter(sg => sg.type === '군').map(sg => sg.name))
  ).sort()
  const guList = Array.from(
    new Set(baseSigungu.filter(sg => sg.type === '구').map(sg => sg.name))
  ).sort()

  const handleFilterChange = (key: string, value: string | undefined) => {
    if (key === 'sido') {
      // 시/도 변경 시 하위 군/구 필터 초기화
      setParams({ sido: value || undefined, gun: undefined, gu: undefined })
    } else if (key === 'gun') {
      setParams({ gun: value || undefined })
    } else if (key === 'gu') {
      setParams({ gu: value || undefined })
    } else {
      const column = table.getColumn(key)
      if (column) {
        column.setFilterValue(value || null)
      }
    }
  }

  const handleResetFilters = () => {
    // 공통 훅에서 필터 + 페이지네이션 + 쿼리파라미터 전체 초기화
    // (useTableWithQuery.resetFilters가 clearParams까지 처리)
    resetFilters()
  }

  // 필터 값 읽기
  // - sido: URL 쿼리와 연동
  // - 그 외: 테이블 필터 상태 사용 (다른 카테고리와 동일)
  const getFilterValue = (key: string) => {
    if (key === 'sido') return params.sido
    if (key === 'gun') return params.gun
    if (key === 'gu') return params.gu
    return (table.getColumn(key)?.getFilterValue() as string | undefined) || undefined
  }

  // 테이블에 실제로 표시되는(필터 적용된) 행 기준으로 차트 데이터 생성
  const filteredRows = table.getRowModel().rows.map(row => row.original)

  const monthlyStats = useMemo(
    () =>
      filteredRows
        .reduce<
          {
            monthKey: string
            monthLabel: string
            totalParticipants: number
            programCount: number
            elementaryParticipants: number
            middleParticipants: number
            highParticipants: number
          }[]
        >((acc, program) => {
          if (!program.startDate) return acc
          const date = dayjs(program.startDate)
          if (!date.isValid()) return acc

          const monthKey = date.format('YYYY-MM')
          const monthLabel = date.format('YYYY년 MM월')

          const existing = acc.find(item => item.monthKey === monthKey)
          const participants =
            typeof program.totalParticipants === 'number' ? program.totalParticipants : 0

          const levelKey =
            program.targetLevel === 'elementary'
              ? 'elementaryParticipants'
              : program.targetLevel === 'middle'
                ? 'middleParticipants'
                : program.targetLevel === 'high'
                  ? 'highParticipants'
                  : null

          if (existing) {
            existing.totalParticipants += participants
            existing.programCount += 1
            if (levelKey) {
              existing[levelKey] += participants
            }
          } else {
            acc.push({
              monthKey,
              monthLabel,
              totalParticipants: participants,
              programCount: 1,
              elementaryParticipants: levelKey === 'elementaryParticipants' ? participants : 0,
              middleParticipants: levelKey === 'middleParticipants' ? participants : 0,
              highParticipants: levelKey === 'highParticipants' ? participants : 0,
            })
          }

          return acc
        }, [])
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    [filteredRows]
  )

  const ipsStats = useMemo(
    () =>
      filteredRows
        .reduce<
          {
            ips: string
            label: string
            totalParticipants: number
            programCount: number
          }[]
        >((acc, program) => {
          const ips = program.ips || '기타'
          const label =
            ipsOptions.find(opt => opt.value === ips)?.label || (ips === '기타' ? '기타' : ips)
          const existing = acc.find(item => item.ips === ips)
          const participants =
            typeof program.totalParticipants === 'number' ? program.totalParticipants : 0

          if (existing) {
            existing.totalParticipants += participants
            existing.programCount += 1
          } else {
            acc.push({
              ips,
              label,
              totalParticipants: participants,
              programCount: 1,
            })
          }
          return acc
        }, [])
        .sort((a, b) => b.totalParticipants - a.totalParticipants),
    [filteredRows]
  )

  const levelStats = useMemo(
    () =>
      filteredRows
        .reduce<
          {
            key: string
            label: string
            totalParticipants: number
            programCount: number
          }[]
        >((acc, program) => {
          const level = program.targetLevel || 'unknown'
          const label = targetLevelOptions.find(opt => opt.value === level)?.label || '기타/미지정'
          const existing = acc.find(item => item.key === level)
          const participants =
            typeof program.totalParticipants === 'number' ? program.totalParticipants : 0

          if (existing) {
            existing.totalParticipants += participants
            existing.programCount += 1
          } else {
            acc.push({
              key: level,
              label,
              totalParticipants: participants,
              programCount: 1,
            })
          }
          return acc
        }, [])
        .sort((a, b) => b.totalParticipants - a.totalParticipants),
    [filteredRows]
  )

  const pieColors = ['#1890ff', '#13c2c2', '#52c41a', '#fa8c16', '#f5222d']

  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Input
          placeholder="프로그램명 검색"
          value={getFilterValue('title') || ''}
          onChange={e => handleFilterChange('title', e.target.value || undefined)}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          placeholder="교육 월"
          value={getFilterValue('educationMonth')}
          onChange={value => handleFilterChange('educationMonth', value)}
          allowClear
          style={{ width: 120 }}
        >
          {educationMonths.map(month => (
            <Option key={month.value} value={month.value}>
              {month.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="사업분야"
          value={getFilterValue('businessArea')}
          onChange={value => handleFilterChange('businessArea', value)}
          allowClear
          style={{ width: 120 }}
        >
          {businessAreas.map(area => (
            <Option key={area.value} value={area.value}>
              {area.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="후원사 선택"
          value={getFilterValue('sponsorId')}
          onChange={value => handleFilterChange('sponsorId', value)}
          allowClear
          style={{ width: 150 }}
          showSearch
          filterOption={(input, option) => {
            const label = option?.label as string | undefined
            return label ? label.toLowerCase().includes(input.toLowerCase()) : false
          }}
        >
          {sponsors.map(sponsor => (
            <Option key={sponsor.id} value={sponsor.id}>
              {sponsor.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="IPS 분류"
          value={getFilterValue('ips')}
          onChange={value => handleFilterChange('ips', value)}
          allowClear
          style={{ width: 120 }}
        >
          {ipsOptions.map(ips => (
            <Option key={ips.value} value={ips.value}>
              {ips.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="대상 구분"
          value={getFilterValue('targetLevel')}
          onChange={value => handleFilterChange('targetLevel', value)}
          allowClear
          style={{ width: 100 }}
        >
          {targetLevelOptions.map(level => (
            <Option key={level.value} value={level.value}>
              {level.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="기관 구분"
          value={getFilterValue('institutionType')}
          onChange={value => handleFilterChange('institutionType', value)}
          allowClear
          style={{ width: 120 }}
        >
          {institutionTypeOptions.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="시/도"
          value={getFilterValue('sido')}
          onChange={value => handleFilterChange('sido', value)}
          allowClear
          style={{ width: 130 }}
          showSearch
        >
          {sidoList.map(sido => (
            <Option key={sido} value={sido}>
              {sido}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="군"
          value={getFilterValue('gun')}
          onChange={value => handleFilterChange('gun', value)}
          allowClear
          style={{ width: 130 }}
          showSearch
        >
          {gunList.map(gun => (
            <Option key={gun} value={gun}>
              {gun}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="구"
          value={getFilterValue('gu')}
          onChange={value => handleFilterChange('gu', value)}
          allowClear
          style={{ width: 150 }}
          showSearch
        >
          {guList.map(gu => (
            <Option key={gu} value={gu}>
              {gu}
            </Option>
          ))}
        </Select>
        <Button onClick={handleResetFilters}>필터 초기화</Button>
      </Space>

      <Tabs
        defaultActiveKey="table"
        items={[
          {
            key: 'table',
            label: '테이블',
            children: (
              <Table
                dataSource={table.getRowModel().rows.map(row => row.original)}
                columns={[
                  {
                    title: '교육 월',
                    dataIndex: 'startDate',
                    key: 'educationMonth',
                    width: 90,
                    align: 'center',
                    render: (date: string) => {
                      if (!date) return '-'
                      const month = new Date(date).getMonth() + 1
                      return `${month}월`
                    },
                  },
                  {
                    title: '사업분야',
                    dataIndex: 'businessArea',
                    key: 'businessArea',
                    width: 110,
                    ellipsis: true,
                    render: (value: string) => value || '-',
                  },
                  {
                    title: '후원사명',
                    dataIndex: 'sponsorId',
                    key: 'sponsorName',
                    width: 160,
                    ellipsis: true,
                    render: (sponsorId: string) => sponsorService.getNameById(sponsorId),
                  },
                  {
                    title: '세부 프로그램명',
                    dataIndex: 'title',
                    key: 'title',
                    width: 220,
                    ellipsis: {
                      showTitle: false,
                    },
                    render: (text: string) => (
                      <Tooltip title={text.length > 25 ? text : undefined}>
                        <Tag
                          color="blue"
                          style={{
                            maxWidth: '200px',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: '1.5',
                            }}
                          >
                            {text}
                          </span>
                        </Tag>
                      </Tooltip>
                    ),
                  },
                  {
                    title: '학교명',
                    dataIndex: 'id',
                    key: 'schoolName',
                    width: 150,
                    ellipsis: true,
                    render: (_: unknown, record: Program) => {
                      const schoolInfo = programSchoolMap.get(record.id)
                      return schoolInfo?.schoolName || '-'
                    },
                  },
                  {
                    title: '시군구',
                    dataIndex: 'id',
                    key: 'district',
                    width: 100,
                    ellipsis: true,
                    render: (_: unknown, record: Program) => {
                      const schoolInfo = programSchoolMap.get(record.id)
                      return schoolInfo?.region || record.district || '-'
                    },
                  },
                  {
                    title: 'IPS',
                    dataIndex: 'ips',
                    key: 'ips',
                    width: 90,
                    align: 'center',
                    render: (value: string) => {
                      if (!value) return '-'
                      const option = ipsOptions.find(opt => opt.value === value)
                      return <Tag>{option?.label || value}</Tag>
                    },
                  },
                  {
                    title: '총 참가자',
                    dataIndex: 'totalParticipants',
                    key: 'totalParticipants',
                    width: 100,
                    align: 'right',
                    render: (value: number) => <strong>{value ?? '-'}</strong>,
                  },
                  {
                    title: '상태',
                    dataIndex: 'status',
                    key: 'status',
                    width: 80,
                    align: 'center',
                    render: (status: string) => (
                      <Tag color={getCommonStatusColor(status)}>{getCommonStatusLabel(status)}</Tag>
                    ),
                  },
                ]}
                rowKey="id"
                loading={loading}
                onRow={record => ({
                  onClick: () => onView?.(record),
                  style: { cursor: onView ? 'pointer' : 'default' },
                })}
                scroll={{ x: 1200 }}
                pagination={{
                  current: table.getState().pagination.pageIndex + 1,
                  pageSize: table.getState().pagination.pageSize,
                  total: table.getFilteredRowModel().rows.length,
                  showSizeChanger: true,
                  showTotal: total => `총 ${total}개`,
                  onChange: (page, pageSize) => {
                    table.setPageIndex(page - 1)
                    table.setPageSize(pageSize)
                  },
                }}
              />
            ),
          },
          {
            key: 'chart',
            label: '차트',
            children: (
              <Card>
                {monthlyStats.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#8c8c8c' }}>
                    표시할 실적 통계 데이터가 없습니다.
                  </div>
                ) : (
                  <>
                    <Space style={{ marginBottom: 16 }}>
                      <Segmented
                        value={chartView}
                        onChange={value => setChartView(value as typeof chartView)}
                        options={[
                          { label: '월별 추이', value: 'trend' },
                          { label: 'IPS 분포', value: 'ips' },
                          { label: '대상 구분 분포', value: 'level' },
                        ]}
                      />
                    </Space>
                    {chartView === 'trend' && (
                      <div style={{ width: '100%', height: 360 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={monthlyStats}
                            margin={{ top: 16, right: 16, left: 0, bottom: 16 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monthLabel" />
                            <YAxis yAxisId="left" />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tickFormatter={value => `${value}`}
                            />
                            <RechartsTooltip />
                            <Legend />
                            <Bar
                              yAxisId="left"
                              stackId="participants"
                              dataKey="elementaryParticipants"
                              name="초등 참가자 수"
                              fill="#69c0ff"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              yAxisId="left"
                              stackId="participants"
                              dataKey="middleParticipants"
                              name="중등 참가자 수"
                              fill="#ffc53d"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              yAxisId="left"
                              stackId="participants"
                              dataKey="highParticipants"
                              name="고등 참가자 수"
                              fill="#ff9c6e"
                              radius={[4, 4, 0, 0]}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="programCount"
                              name="프로그램 수"
                              stroke="#52c41a"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {chartView === 'ips' && (
                      <div style={{ width: '100%', height: 360 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <RechartsTooltip />
                            <Legend />
                            <Pie
                              data={ipsStats}
                              dataKey="totalParticipants"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
                              label
                            >
                              {ipsStats.map((entry, index) => (
                                <Cell key={entry.ips} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {chartView === 'level' && (
                      <div style={{ width: '100%', height: 360 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <RechartsTooltip />
                            <Legend />
                            <Pie
                              data={levelStats}
                              dataKey="totalParticipants"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
                              label
                            >
                              {levelStats.map((entry, index) => (
                                <Cell key={entry.key} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  )
}
