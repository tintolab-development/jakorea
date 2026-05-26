import { useMemo } from 'react'
import type { Program } from '@/types/domain'
import type { EducationProgressHalfKey } from '../../tabs'
import { getUjatEducationProgressInstitutionDetail } from './detail-mock'
import { UjatEducationProgressInstitutionDetailView } from './detail-view'
import type { UjatEducationProgressInstitutionDetailTab } from '@/features/program/ujat/lib/ujat-program-detail-url'

export function UjatEducationProgressInstitutionDetailPage({
  program,
  institutionId,
  half,
  activeTab,
  onSelectTab,
}: {
  program: Program
  institutionId: string
  half: EducationProgressHalfKey
  activeTab: UjatEducationProgressInstitutionDetailTab
  onSelectTab: (tab: UjatEducationProgressInstitutionDetailTab) => void
}) {
  const detail = useMemo(
    () => getUjatEducationProgressInstitutionDetail(program.id, half, institutionId),
    [program.id, half, institutionId]
  )

  if (!detail) return null

  return (
    <UjatEducationProgressInstitutionDetailView
      detail={detail}
      program={program}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
    />
  )
}
