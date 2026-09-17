/**
 * 교육 프로그램 > 수강 신청 현황 페이지
 * FilterTableLayout 셸 + EnrollmentStatusTable (CMS shared SSOT Phase 3)
 * 필터 필드는 추후 추가 시 showFilter+fields로 확장.
 */

import { useEffect, useState } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { EnrollmentStatusTable } from '@/features/program/general/ui/enrollment-status-table'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { Program } from '@/types/domain'

export function EducationEnrollmentPage() {
  const [programs] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useNotifyProgramApiUnavailableOnce(
    true,
    'education-enrollment-page',
    '수강 신청 현황'
  )

  useEffect(() => {
    setLoading(false)
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
