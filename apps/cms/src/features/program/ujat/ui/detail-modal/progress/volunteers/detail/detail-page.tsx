import { useMemo, useState } from 'react'
import type { EducationProgressHalfKey } from '../../tabs'
import type { UjatEducationProgressVolunteerDetailTab } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { getUjatEducationProgressVolunteerDetail } from './detail-mock'
import { UjatEducationProgressVolunteerDetailView } from './detail-view'

export function UjatEducationProgressVolunteerDetailPage({
  programId,
  half,
  volunteerId,
  activeTab,
  onSelectTab,
}: {
  programId: string
  half: EducationProgressHalfKey
  volunteerId: string
  activeTab: UjatEducationProgressVolunteerDetailTab
  onSelectTab: (tab: UjatEducationProgressVolunteerDetailTab) => void
}) {
  const [detailRevision, setDetailRevision] = useState(0)

  const detail = useMemo(
    () => getUjatEducationProgressVolunteerDetail(programId, half, volunteerId),
    [programId, half, volunteerId, detailRevision]
  )

  if (!detail) return null

  return (
    <UjatEducationProgressVolunteerDetailView
      detail={detail}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      onDetailSaved={() => setDetailRevision(revision => revision + 1)}
    />
  )
}
