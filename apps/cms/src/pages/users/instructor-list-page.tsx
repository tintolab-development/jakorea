/**
 * 강사 조회 페이지
 * Phase 4.1: 강사 조회/다운로드 (필라별) (FR-F00)
 */

import { useState, useEffect, useCallback } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'

import type { InstructorType } from '@/types/domain'

interface InstructorListQueryParams extends Record<string, string | undefined> {
  pillar?: string
  instructorType?: InstructorType | 'ALL'
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
  search?: string
}
import { InstructorList } from '@/features/instructor-list/ui/instructor-list'
import {
  getInstructors,
  type InstructorListFilters,
} from '@/entities/instructor/api/instructor-list-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { handleError } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import './instructor-list-page.css'


export function InstructorListPage() {
  const { params, setParam } = useQueryParams<InstructorListQueryParams>()
  const { user } = useAuthStore()

  // 필라 목록 (동적으로 가져오기)
  const [pillars, setPillars] = useState<string[]>([])
  useEffect(() => {
    const loadPillars = async () => {
      const { getInstructors } = await import('@/entities/instructor/api/instructor-list-service')
      const allInstructors = await getInstructors()
      const uniquePillars = Array.from(
        new Set(allInstructors.map(inst => inst.pillar).filter(Boolean))
      ).sort() as string[]
      setPillars(uniquePillars)
    }
    loadPillars()
  }, [])

  // 상태 관리
  const [instructors, setInstructors] = useState<Awaited<ReturnType<typeof getInstructors>>>([])
  const [loading, setLoading] = useState(false)

  // Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState({
    search: params.search || '',
    pillar: params.pillar || 'ALL',
    instructorType: (params.instructorType || 'ALL') as InstructorType | 'ALL',
    status: (params.status || 'ALL') as 'ACTIVE' | 'INACTIVE' | 'ALL',
  })

  // URL에서 필터 값을 읽어와서 pendingFilters 초기화
  useEffect(() => {
    setPendingFilters({
      search: params.search || '',
      pillar: params.pillar || 'ALL',
      instructorType: (params.instructorType || 'ALL') as InstructorType | 'ALL',
      status: (params.status || 'ALL') as 'ACTIVE' | 'INACTIVE' | 'ALL',
    })
  }, [params.search, params.pillar, params.instructorType, params.status])

  // 강사 목록 조회
  const loadInstructors = useCallback(async () => {
    setLoading(true)
    try {
      const filters: InstructorListFilters = {}
      if (pendingFilters.pillar && pendingFilters.pillar !== 'ALL') {
        filters.pillar = pendingFilters.pillar
      }
      if (pendingFilters.instructorType && pendingFilters.instructorType !== 'ALL') {
        filters.instructorType = pendingFilters.instructorType
      }
      if (pendingFilters.status !== 'ALL') {
        filters.status = pendingFilters.status
      }
      if (pendingFilters.search) {
        filters.keyword = pendingFilters.search
      }

      const data = await getInstructors(filters)
      setInstructors(data)
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.instructorListLoadFailed })
    } finally {
      setLoading(false)
    }
  }, [pendingFilters])

  // 조회 버튼 클릭 시 필터 적용 및 데이터 로드
  const handleSearch = () => {
    setParam('search', pendingFilters.search || null)
    setParam('pillar', pendingFilters.pillar === 'ALL' ? null : pendingFilters.pillar)
    setParam(
      'instructorType',
      pendingFilters.instructorType === 'ALL' ? null : pendingFilters.instructorType
    )
    setParam('status', pendingFilters.status === 'ALL' ? null : pendingFilters.status)
    loadInstructors()
  }


  // 페이지 로드 시 초기 데이터 불러오기
  useEffect(() => {
    loadInstructors()
  }, [])

  return (
    <div>
      <UnifiedFilterCard
        fields={[
          {
            key: 'search',
            type: 'search',
            label: '이름/이메일/전문분야',
            placeholder: '이름, 이메일 또는 전문분야를 입력하세요',
          },
          {
            key: 'instructorType',
            type: 'select',
            label: '강사단 종류',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'ALL' },
              { label: 'JA강사단', value: 'JA' },
              { label: '특강 강사', value: 'SPECIAL' },
              { label: '제미나이 강사단', value: 'GEMINAI' },
              { label: '기타', value: 'OTHER' },
            ],
          },
          {
            key: 'pillar',
            type: 'select',
            label: '필라',
            placeholder: '전체 필라',
            options: [
              { label: '전체 필라', value: 'ALL' },
              ...pillars.map(pillar => ({ label: pillar, value: pillar })),
            ],
          },
          {
            key: 'status',
            type: 'select',
            label: '상태',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'ALL' },
              { label: '활성', value: 'ACTIVE' },
              { label: '비활성', value: 'INACTIVE' },
            ],
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
        loading={loading}
      />

      <InstructorList data={instructors} loading={loading} currentUser={user} />
    </div>
  )
}
