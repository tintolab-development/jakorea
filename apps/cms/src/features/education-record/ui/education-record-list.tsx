/**
 * 실적 통계 목록 컴포넌트
 * 엑셀 데이터 기반 통합 테이블 - 모든 컬럼 포함
 */

import { Table, Input, Select, Button, Space, Tag, Tooltip } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useEducationRecordTable } from '../model/use-education-record-table'
import type { Program } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import { schoolService } from '@/entities/school/api/school-service'
import { mockApplications } from '@/data/mock'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'
import { useMemo } from 'react'
import { MOCK_SIDO_SIGUNGU } from '@/shared/constants/sido-sigungu'
import { exportTableToExcel } from '@/shared/utils/table-export'

const { Option } = Select

interface EducationRecordListProps {
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
  si?: string // 시
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

export function EducationRecordList({ data, loading, onView }: EducationRecordListProps) {
  const { params, setParams } = useQueryParams<EducationRecordQueryParams>()

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

  // 시/도 + 시/군/구 필터를 적용한 데이터 (컴포넌트 레벨 필터링)
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
          // 행정구역 Mock에서 시/군/구가 속한 시/도 찾기
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
    applications.forEach(app => {
      if (app.subjectType === 'school' && app.programId) {
        const school = schools.find(s => s.id === app.subjectId)
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
      // 시/도 변경 시 하위 시/군/구 필터 초기화
      setParams({ sido: value || undefined, si: undefined, gun: undefined, gu: undefined })
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

  // 테이블 columns 정의
  const tableColumns = useMemo(
    () => [
      {
        title: '교육 월',
        dataIndex: 'startDate',
        key: 'educationMonth',
        width: 90,
        align: 'center' as const,
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
        title: '후원사명(영문)',
        dataIndex: 'sponsorId',
        key: 'sponsorNameEn',
        width: 160,
        ellipsis: true,
        render: (sponsorId: string) => {
          const sponsor = sponsors.find(s => s.id === sponsorId)
          return sponsor?.nameEn || '-'
        },
      },
      {
        title: '후원사명(국문)',
        dataIndex: 'sponsorId',
        key: 'sponsorName',
        width: 160,
        ellipsis: true,
        render: (sponsorId: string) => sponsorService.getNameById(sponsorId),
      },
      {
        title: '프로그램명(영문)',
        dataIndex: 'titleEn',
        key: 'titleEn',
        width: 200,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '대표 프로그램명(국문)',
        dataIndex: 'mainTitle',
        key: 'mainTitle',
        width: 180,
        ellipsis: true,
        render: (value: string) => value || '-',
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
        title: '교재명(국문)',
        dataIndex: 'textbookName',
        key: 'textbookName',
        width: 150,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '교재명(영문)',
        dataIndex: 'textbookNameEn',
        key: 'textbookNameEn',
        width: 150,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '학교명 (기관)',
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
        title: 'IP Owned',
        dataIndex: 'ipOwned',
        key: 'ipOwned',
        width: 100,
        align: 'center' as const,
        render: (value: string) => value || 'JA',
      },
      {
        title: 'Course Delivered By',
        dataIndex: 'courseDeliveredBy',
        key: 'courseDeliveredBy',
        width: 150,
        align: 'center' as const,
        render: (value: string) => {
          if (!value) return '-'
          const map: Record<string, string> = {
            JA: 'JA',
            Jointly: 'Jointly',
          }
          return map[value] || value
        },
      },
      {
        title: 'Partner Involvement',
        dataIndex: 'partnerInvolvement',
        key: 'partnerInvolvement',
        width: 150,
        align: 'center' as const,
        render: (value: boolean) => (value ? 'Yes' : 'No'),
      },
      {
        title: 'IPS',
        dataIndex: 'ips',
        key: 'ips',
        width: 90,
        align: 'center' as const,
        render: (value: string) => {
          if (!value) return '-'
          const option = ipsOptions.find(opt => opt.value === value)
          return <Tag>{option?.label || value}</Tag>
        },
      },
      {
        title: '대상 구분',
        dataIndex: 'targetLevel',
        key: 'targetLevel',
        width: 90,
        align: 'center' as const,
        render: (value: string) => {
          if (!value) return '-'
          const option = targetLevelOptions.find(opt => opt.value === value)
          return option?.label || value
        },
      },
      {
        title: '기관 구분',
        dataIndex: 'institutionType',
        key: 'institutionType',
        width: 110,
        align: 'center' as const,
        render: (value: string) => {
          if (!value) return '-'
          const option = institutionTypeOptions.find(opt => opt.value === value)
          return option?.label || value
        },
      },
      {
        title: '프로그램 종류',
        dataIndex: 'programCategory',
        key: 'programCategory',
        width: 120,
        ellipsis: true,
        render: (value: string | null, record: Program) => {
          // IPS가 Succeed일 때만 표시
          if (record.ips === 'Succeed') {
            return value || '-'
          }
          return '-'
        },
      },
      {
        title: '프로그램 채널 및 형식',
        dataIndex: 'programChannel',
        key: 'programChannel',
        width: 150,
        ellipsis: true,
        render: (value: string | null, record: Program) => {
          // IPS가 Inspire일 때만 표시
          if (record.ips === 'Inspire') {
            return value || '-'
          }
          return '-'
        },
      },
      {
        title: '교육 형태',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        align: 'center' as const,
        render: (type: string) => {
          const typeMap: Record<string, string> = {
            online: '온라인',
            offline: '오프라인',
            hybrid: '하이브리드',
          }
          return typeMap[type] || type
        },
      },
      {
        title: '교육시간',
        dataIndex: 'educationTime',
        key: 'educationTime',
        width: 90,
        align: 'right' as const,
        render: (value: number) => (value ? `${value}시간` : '-'),
      },
      {
        title: '학급수',
        dataIndex: ['rounds', 0, 'classCount'],
        key: 'classCount',
        width: 80,
        align: 'right' as const,
        render: (value: number) => value || '-',
      },
      {
        title: '남',
        dataIndex: 'maleParticipants',
        key: 'maleParticipants',
        width: 70,
        align: 'right' as const,
        render: (value: number) => value ?? '-',
      },
      {
        title: '여',
        dataIndex: 'femaleParticipants',
        key: 'femaleParticipants',
        width: 70,
        align: 'right' as const,
        render: (value: number) => value ?? '-',
      },
      {
        title: '총 참가자',
        dataIndex: 'totalParticipants',
        key: 'totalParticipants',
        width: 100,
        align: 'right' as const,
        render: (value: number) => <strong>{value ?? '-'}</strong>,
      },
      {
        title: '일반 자원봉사자',
        dataIndex: 'generalVolunteers',
        key: 'generalVolunteers',
        width: 130,
        align: 'right' as const,
        render: (value: number) => value ?? '-',
      },
      {
        title: '임직원 자원봉사자',
        dataIndex: 'staffVolunteers',
        key: 'staffVolunteers',
        width: 140,
        align: 'right' as const,
        render: (value: number) => value ?? '-',
      },
      {
        title: '재참여 자원봉사자',
        dataIndex: 'returningVolunteers',
        key: 'returningVolunteers',
        width: 140,
        align: 'right' as const,
        render: (value: number) => value ?? '-',
      },
      {
        title: '일반담당교사',
        dataIndex: 'generalTeachers',
        key: 'generalTeachers',
        width: 120,
        align: 'right' as const,
        render: (value: number) => value ?? '-',
      },
      {
        title: '교육받은교사',
        dataIndex: 'educatedTeachers',
        key: 'educatedTeachers',
        width: 130,
        align: 'right' as const,
        render: (value: number) => value ?? '-',
      },
      {
        title: '강사',
        dataIndex: 'instructors',
        key: 'instructors',
        width: 70,
        align: 'right' as const,
        render: (value: number) => value ?? '-',
      },
      {
        title: '담당자명',
        dataIndex: 'managerName',
        key: 'managerName',
        width: 100,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        width: 80,
        align: 'center' as const,
        render: (status: string) => (
          <Tag color={getCommonStatusColor(status)}>{getCommonStatusLabel(status)}</Tag>
        ),
      },
    ],
    [sponsors, programSchoolMap]
  )

  const handleExportExcel = async () => {
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original)
    await exportTableToExcel(tableColumns, filteredData, '실적통계')
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
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportExcel}>
          엑셀 다운로드
        </Button>
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={tableColumns}
        rowKey="id"
        loading={loading}
        onRow={record => ({
          onClick: () => onView?.(record),
          style: { cursor: onView ? 'pointer' : 'default' },
        })}
        scroll={{ x: 3500 }}
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
    </div>
  )
}
