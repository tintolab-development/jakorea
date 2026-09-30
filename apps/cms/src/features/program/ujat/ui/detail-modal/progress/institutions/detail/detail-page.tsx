import { Spin } from 'antd'
import type { Program } from '@/types/domain'
import type { EducationProgressHalfKey } from '../../tabs'
import { useUjatEducationProgressInstitutionDetail } from './use-detail'
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
  const { detail, loading } = useUjatEducationProgressInstitutionDetail({
    programId: program.id,
    half,
    institutionId,
  })

  if (loading && !detail) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
        <Spin />
      </div>
    )
  }

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
