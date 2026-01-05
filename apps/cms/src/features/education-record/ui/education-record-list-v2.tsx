/**
 * 교육실적 목록 컴포넌트 (v2)
 * 핵심 컬럼만 표시, 상세 정보는 상세 패널에서 확인
 */

import { Table, Input, Select, Button, Space, Tag, Tooltip } from 'antd'
import { useEducationRecordTable } from '../model/use-education-record-table'
import type { Program } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import { schoolService } from '@/entities/school/api/school-service'
import { mockApplications } from '@/data/mock'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'
import { useMemo } from 'react'

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
  region?: string
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
  
  // region 필터를 적용한 데이터 (컴포넌트 레벨 필터링)
  const filteredDataByRegion = useMemo(() => {
    const regionFilter = params.region
    if (!regionFilter) return data
    
    // Program별 학교 정보 매핑 (Application을 통해)
    const map = new Map<string, { schoolId: string; schoolName: string; region: string }>()
    mockApplications.forEach(app => {
      if (app.subjectType === 'school' && app.programId) {
        const school = schoolService.getAllSync().find(s => s.id === app.subjectId)
        if (school && !map.has(app.programId)) {
          map.set(app.programId, {
            schoolId: school.id,
            schoolName: school.name,
            region: school.region,
          })
        }
      }
    })
    
    return data.filter(program => {
      const schoolInfo = map.get(program.id)
      const programRegion = schoolInfo?.region || program.district
      return programRegion === regionFilter
    })
  }, [data, params.region])
  
  const { table, resetFilters } = useEducationRecordTable(filteredDataByRegion)

  const sponsors = sponsorService.getAllSync()
  const schools = schoolService.getAllSync()
  const applications = mockApplications

  // Program별 학교 정보 매핑 (Application을 통해)
  const programSchoolMap = useMemo(() => {
    const map = new Map<string, { schoolId: string; schoolName: string; region: string }>()
    applications.forEach(app => {
      if (app.subjectType === 'school' && app.programId) {
        const school = schools.find(s => s.id === app.subjectId)
        if (school && !map.has(app.programId)) {
          map.set(app.programId, {
            schoolId: school.id,
            schoolName: school.name,
            region: school.region,
          })
        }
      }
    })
    return map
  }, [applications, schools])

  // 지역 목록 추출 (중복 제거)
  const regions = Array.from(
    new Set(schools.map(school => school.region).filter(Boolean))
  ).sort()

  const handleFilterChange = (key: string, value: string | undefined) => {
    setParams({ [key]: value || undefined })
    // 테이블 필터도 동기화 (region은 제외 - 컴포넌트 레벨에서 처리)
    if (key !== 'region') {
      const column = table.getColumn(key)
      if (column) {
        column.setFilterValue(value || null)
      }
    }
  }

  const handleResetFilters = () => {
    resetFilters()
    setParams({})
  }

  // 쿼리 파라미터에서 필터 값 읽기 (쿼리 파라미터 우선, 없으면 테이블 필터)
  const getFilterValue = (key: string) => {
    const queryValue = params[key as keyof EducationRecordQueryParams]
    if (queryValue) return queryValue
    const tableValue = table.getColumn(key)?.getFilterValue() as string | undefined
    return tableValue || undefined
  }

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
          placeholder="시군구"
          value={getFilterValue('region')}
          onChange={value => handleFilterChange('region', value)}
          allowClear
          style={{ width: 150 }}
          showSearch
        >
          {regions.map(region => (
            <Option key={region} value={region}>
              {region}
            </Option>
          ))}
        </Select>
        <Button onClick={handleResetFilters}>필터 초기화</Button>
      </Space>

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
                    verticalAlign: 'middle'
                  }}
                >
                  <span style={{ 
                    display: 'block', 
                    maxWidth: '180px', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    lineHeight: '1.5'
                  }}>
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
            render: (value: number) => (
              <strong>{value ?? '-'}</strong>
            ),
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
          showTotal: (total) => `총 ${total}개`,
          onChange: (page, pageSize) => {
            table.setPageIndex(page - 1)
            table.setPageSize(pageSize)
          },
        }}
      />
    </div>
  )
}

