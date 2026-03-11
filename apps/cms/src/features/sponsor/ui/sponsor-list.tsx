/**
 * 스폰서 목록 컴포넌트
 * Phase 1.3: 테이블 + 필터
 */

import { useState, useMemo, useCallback } from 'react'
import { Table, Tag } from 'antd'
import { useSponsorTable } from '../model/use-sponsor-table'
import type { Sponsor } from '@/types/domain'
import { domainColorsHex } from '@/shared/constants/colors'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'

interface SponsorListProps {
  data: Sponsor[]
  loading?: boolean
}

export function SponsorList({ data, loading }: SponsorListProps) {
  const { table } = useSponsorTable(data)

  // 필터 상태 분리 (pendingFilters: 입력 중, appliedFilters: 적용된 필터)
  // 초기 로드 시에는 필터를 적용하지 않음 (조회 버튼을 눌러야만 필터링)
  const [pendingFilters, setPendingFilters] = useState({
    name: '',
  })

  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
  })

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(() => {
    setAppliedFilters(pendingFilters)
    // 테이블 필터 적용
    table.getColumn('name')?.setFilterValue(pendingFilters.name || undefined)
  }, [pendingFilters, table])

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!appliedFilters.name.trim()) {
      return data
    }
    const query = appliedFilters.name.trim().toLowerCase()
    return data.filter(item => item.name.toLowerCase().includes(query))
  }, [data, appliedFilters.name])

  return (
    <div>
      {/* 필터 위젯 */}
      <UnifiedFilterCard
        fields={[
          {
            key: 'name',
            type: 'search',
            label: '스폰서명',
            placeholder: '스폰서명을 입력하세요',
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
        loading={loading}
      />

      {/* 테이블 */}
      <Table
        dataSource={filteredData}
        columns={[
          {
            title: '스폰서명',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Tag color={domainColorsHex.sponsor.primary}>{text}</Tag>,
          },
          {
            title: '설명',
            dataIndex: 'description',
            key: 'description',
            render: (text?: string) => text || '-',
          },
          {
            title: '연락처',
            dataIndex: 'contactInfo',
            key: 'contactInfo',
            render: (text?: string) => text || '-',
          },
        ]}
        rowKey="id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
        }}
      />
    </div>
  )
}
