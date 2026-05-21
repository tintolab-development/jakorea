/**
 * 교육 프로그램 > 수강 신청 현황 페이지
 * 프로그램 단위 테이블: 프로그램명, 지원자 수, 수강자 모집 인원, 교육 분야, 수강자/유형,
 * 교육 대상, 진행 방식, 신청자 모집 기간, 프로그램 운영 기간, 후원사, 담당자
 */

import { useState, useEffect } from 'react'
import { PageHeader } from '@/shared/ui/page-header'
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
    <div>
      <PageHeader
        title="수강 신청 현황"
        description={programs.length > 0 ? `총 ${programs.length}건` : undefined}
      />
      <EnrollmentStatusTable data={programs} loading={loading} />
    </div>
  )
}
