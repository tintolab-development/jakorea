/**
 * 학교 목록 페이지
 * Phase 1.4: 목록 페이지
 * Phase 2: 리팩토링 패턴 적용
 * 학교 등록을 모달로 변경
 */

import { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Space, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SchoolList } from '@/features/school/ui/school-list'
import { SchoolForm } from '@/features/school/ui/school-form'
import { useSchoolStore } from '@/features/school/model/school-store'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useListFilters } from '@/shared/hooks/use-list-filters'
import type { SchoolFormData } from '@/entities/school/model/schema'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { ListPageFilters } from '@/shared/ui/list-page-filters'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import type { School } from '@/types/domain'

interface SchoolListQueryParams extends Record<string, string | undefined> {
  search?: string
  region?: string
}

export function SchoolListPage() {
  const location = useLocation()
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const { schools, loading, fetchSchools, createSchool, updateSchool } = useSchoolStore()
  const { params, setParams } = useQueryParams<SchoolListQueryParams>()
  
  // Form 모달 상태 관리
  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingSchool,
    isEditing: isEditingMode,
  } = useModalState<{ id: string; data: SchoolFormData }>()

  const [formLoading, setFormLoading] = useState(false)

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '회원 관리'

  useEffect(() => {
    fetchSchools()
  }, [fetchSchools])

  // 지역 옵션 생성
  const regionOptions = useMemo(() => {
    const regions = Array.from(new Set(schools.map(s => s.region))).sort()
    return [
      { label: '전체', value: 'all' },
      ...regions.map(region => ({ label: region, value: region })),
    ]
  }, [schools])

  // useListFilters로 필터링 로직 개선
  const {
    searchText,
    setSearchText,
    filters,
    handleFilterChange: handleListFilterChange,
    filtered: filteredByListFilters,
    resetFilters,
  } = useListFilters<School>({
    data: schools,
    filterConfig: {
      search: { keys: ['name', 'contactPerson', 'contactEmail'] },
      selects: {
        region: {
          key: 'region',
          options: regionOptions,
        },
      },
    },
    defaultFilters: { region: 'all' },
  })

  // useQueryParams와 useListFilters 동기화 (초기 로드 시)
  useEffect(() => {
    if (params.search && params.search !== searchText) {
      setSearchText(params.search)
    }
    if (params.region && params.region !== filters.region) {
      handleListFilterChange('region', params.region)
    } else if (!params.region && filters.region !== 'all') {
      handleListFilterChange('region', 'all')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 초기 로드 시에만 실행

  // 필터링된 데이터 (useListFilters 결과 사용)
  const filteredSchools = useMemo(() => {
    // useListFilters의 결과를 사용하되, 'all' 값 필터링
    return filteredByListFilters.filter(school => {
      if (filters.region && filters.region !== 'all') {
        return school.region === filters.region
      }
      return true
    })
  }, [filteredByListFilters, filters.region])

  // 필터 핸들러 (useQueryParams와 연동)
  const handleFilterChange = (key: keyof SchoolListQueryParams, value: any) => {
    handleListFilterChange(key, value)
    setParams({
      [key]: value === 'all' || value === '' ? undefined : value,
    })
  }

  const handleFilterReset = () => {
    resetFilters()
    setParams({
      search: undefined,
      region: undefined,
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    setParams({ search: value || undefined })
  }

  const handleNewClick = () => {
    openFormModal()
  }

  const handleFormSubmit = async (data: SchoolFormData) => {
    setFormLoading(true)
    try {
      if (editingSchool) {
        await updateSchool(editingSchool.id, data)
        showSuccessMessage(MESSAGES.success.updated)
      } else {
        await createSchool(data)
        showSuccessMessage(MESSAGES.success.created)
      }
      closeFormModal()
      fetchSchools()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingSchool ? MESSAGES.error.update : MESSAGES.error.create,
        context: 'SchoolFormSubmit',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    closeFormModal()
  }

  return (
    <div>
      <Space style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
            학교 등록
          </Button>
        )}
      </Space>
      <ListPageFilters
        filters={{
          region: filters.region || 'all',
        }}
        onFilterChange={handleFilterChange}
        searchValue={searchText}
        onSearchChange={handleSearchChange}
        searchPlaceholder="학교명, 담당자, 이메일 검색"
        filterConfig={[
          {
            key: 'region',
            type: 'select',
            options: regionOptions,
            placeholder: '지역 선택',
          },
        ]}
        onReset={handleFilterReset}
        showReset={!!(searchText || (filters.region && filters.region !== 'all'))}
      />

      <SchoolList data={filteredSchools} loading={loading} />

      <Modal
        open={formModalOpen}
        title={isEditingMode ? '학교 수정' : '학교 등록'}
        onCancel={handleFormCancel}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
        destroyOnHidden
      >
        <SchoolForm
          school={editingSchool ? schools.find(s => s.id === editingSchool.id) : undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}








