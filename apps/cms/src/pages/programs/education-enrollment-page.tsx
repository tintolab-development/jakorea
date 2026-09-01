/**
 * 교육 프로그램 > 수강 신청 현황 페이지
 * FilterTableLayout 셸 + EnrollmentStatusTable (CMS shared SSOT Phase 3)
 * 필터 필드는 추후 추가 시 showFilter+fields로 확장.
 */

import { useState, useEffect } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { EnrollmentStatusTable } from '@/features/program/general/ui/enrollment-status-table'
import { getEducationPrograms } from '@/data/mock/education-programs'
import type { Program } from '@/types/domain'

export function EducationEnrollmentPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.resolve(getEducationPrograms())
      .then(setPrograms)
      .finally(() => setLoading(false))
  }, [])

  return (
    <FilterTableLayout
      showFilter={false}
      title="수강 신청 현황"
      description={programs.length > 0 ? `총 ${programs.length.toLocaleString()}건` : undefined}
      hideExcelDownload
      fields={[]}
      filters={{}}
      onFilterChange={() => undefined}
      onSearch={() => undefined}
    >
      <EnrollmentStatusTable data={programs} loading={loading} />
    </FilterTableLayout>
  )
}
