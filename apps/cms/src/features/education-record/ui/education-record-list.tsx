/**
 * 실적 통계 목록 컴포넌트
 * 엑셀 데이터 기반 통합 테이블 - 모든 컬럼 포함
 */

import { Table, Button, Tag, Tooltip } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useEducationRecordTable } from '../model/use-education-record-table'
import type { Program } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import { schoolService } from '@/entities/school/api/school-service'
import { mockApplications } from '@/data/mock'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { commonStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { useMemo, useState, useCallback, useEffect } from 'react'
import { MOCK_SIDO_SIGUNGU } from '@/shared/constants/sido-sigungu'
import { exportTableToExcel } from '@/shared/utils/table-export'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'

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

  // 필터 상태 분리 (pendingFilters: 입력 중, appliedFilters: 적용된 필터)
  const [pendingFilters, setPendingFilters] = useState({
    title: '',
    educationMonth: '',
    businessArea: '',
    sponsorId: '',
    ips: '',
    targetLevel: '',
    institutionType: '',
    sido: params.sido || '',
    gun: params.gun || '',
    gu: params.gu || '',
  })

  const [appliedFilters, setAppliedFilters] = useState({
    title: '',
    educationMonth: '',
    businessArea: '',
    sponsorId: '',
    ips: '',
    targetLevel: '',
    institutionType: '',
    sido: params.sido || '',
    gun: params.gun || '',
    gu: params.gu || '',
  })

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
    const sidoFilter = appliedFilters.sido
    const gunFilter = appliedFilters.gun
    const guFilter = appliedFilters.gu

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
  }, [data, appliedFilters.sido, appliedFilters.gun, appliedFilters.gu])

  const { table } = useEducationRecordTable(filteredDataByRegion)

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
  const currentSido = pendingFilters.sido
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

  // 후원사 옵션
  const sponsorOptions = useMemo(() => {
    return [
      { label: '전체', value: '' },
      ...sponsors.map(sponsor => ({ label: sponsor.name, value: sponsor.id })),
    ]
  }, [sponsors])

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(() => {
    setAppliedFilters(pendingFilters)
    // 쿼리 파라미터 업데이트 (시/도/군/구)
    setParams({
      sido: pendingFilters.sido || undefined,
      gun: pendingFilters.gun || undefined,
      gu: pendingFilters.gu || undefined,
    })
    // 테이블 필터 적용
    Object.keys(pendingFilters).forEach(key => {
      if (key !== 'sido' && key !== 'gun' && key !== 'gu') {
        const column = table.getColumn(key)
        if (column) {
          column.setFilterValue(pendingFilters[key as keyof typeof pendingFilters] || null)
        }
      }
    })
  }, [pendingFilters, setParams, table])

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
          <StatusBadge status={status} statusConfig={commonStatusStatusConfig} />
        ),
      },
    ],
    [sponsors, programSchoolMap]
  )

  const handleExportExcel = async () => {
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original)
    await exportTableToExcel(tableColumns, filteredData, '실적통계')
  }

  // appliedFilters 변경 시 테이블 필터 동기화
  useEffect(() => {
    Object.keys(appliedFilters).forEach(key => {
      if (key === 'sido' || key === 'gun' || key === 'gu') return
      const filterValue = appliedFilters[key as keyof typeof appliedFilters]
      const column = table.getColumn(key)
      if (column) {
        column.setFilterValue(filterValue || null)
      }
    })
  }, [appliedFilters, table])

  return (
    <div>
      {/* 필터 위젯 */}
      <UnifiedFilterCard
        fields={[
          {
            key: 'title',
            type: 'search',
            label: '프로그램명',
            placeholder: '프로그램명을 입력하세요',
          },
          {
            key: 'educationMonth',
            type: 'select',
            label: '교육 월',
            placeholder: '전체',
            options: [
              { label: '전체', value: '' },
              ...educationMonths.map(month => ({ label: month.label, value: month.value })),
            ],
          },
          {
            key: 'businessArea',
            type: 'select',
            label: '사업분야',
            placeholder: '전체',
            options: [
              { label: '전체', value: '' },
              ...businessAreas.map(area => ({ label: area.label, value: area.value })),
            ],
          },
          {
            key: 'sponsorId',
            type: 'select',
            label: '후원사 선택',
            placeholder: '전체',
            options: sponsorOptions,
          },
          {
            key: 'ips',
            type: 'select',
            label: 'IPS 분류',
            placeholder: '전체',
            options: [
              { label: '전체', value: '' },
              ...ipsOptions.map(ips => ({ label: ips.label, value: ips.value })),
            ],
          },
          {
            key: 'targetLevel',
            type: 'select',
            label: '대상 구분',
            placeholder: '전체',
            options: [
              { label: '전체', value: '' },
              ...targetLevelOptions.map(level => ({ label: level.label, value: level.value })),
            ],
          },
          {
            key: 'institutionType',
            type: 'select',
            label: '기관 구분',
            placeholder: '전체',
            options: [
              { label: '전체', value: '' },
              ...institutionTypeOptions.map(type => ({ label: type.label, value: type.value })),
            ],
          },
          {
            key: 'sido',
            type: 'select',
            label: '시/도',
            placeholder: '전체',
            options: [
              { label: '전체', value: '' },
              ...sidoList.map(sido => ({ label: sido, value: sido })),
            ],
          },
          {
            key: 'gun',
            type: 'select',
            label: '군',
            placeholder: '전체',
            options: [
              { label: '전체', value: '' },
              ...gunList.map(gun => ({ label: gun, value: gun })),
            ],
          },
          {
            key: 'gu',
            type: 'select',
            label: '구',
            placeholder: '전체',
            options: [
              { label: '전체', value: '' },
              ...guList.map(gu => ({ label: gu, value: gu })),
            ],
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => {
            const updated = { ...prev, [key]: value || '' }
            // 시/도가 변경되면 군/구 초기화
            if (key === 'sido') {
              updated.gun = ''
              updated.gu = ''
            }
            return updated
          })
        }}
        onSearch={handleSearch}
        loading={loading}
        extra={
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportExcel}>
            엑셀 다운로드
          </Button>
        }
      />

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
