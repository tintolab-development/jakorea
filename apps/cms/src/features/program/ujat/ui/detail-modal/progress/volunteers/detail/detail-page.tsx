import { useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import type { EducationProgressHalfKey } from '../../tabs'
import type { UjatEducationProgressVolunteerDetailTab } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { getUjatEducationProgressVolunteerDetail } from './detail-mock'
import { UjatEducationProgressVolunteerDetailView } from './detail-view'

export function UjatEducationProgressVolunteerDetailPage({
  program,
  half,
  volunteerId,
  activeTab,
  onSelectTab,
}: {
  program: Program
  half: EducationProgressHalfKey
  volunteerId: string
  activeTab: UjatEducationProgressVolunteerDetailTab
  onSelectTab: (tab: UjatEducationProgressVolunteerDetailTab) => void
}) {
  const [detailRevision, setDetailRevision] = useState(0)

  const detail = useMemo(
    () => getUjatEducationProgressVolunteerDetail(program.id, half, volunteerId),
    [program.id, half, volunteerId, detailRevision]
  )

  if (!detail) return null

  return (
    <UjatEducationProgressVolunteerDetailView
      program={program}
      detail={detail}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      onDetailSaved={() => setDetailRevision(revision => revision + 1)}
    />
  )
}
