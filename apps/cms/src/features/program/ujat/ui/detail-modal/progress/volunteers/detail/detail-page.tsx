import { useState } from 'react'
import { Spin } from 'antd'
import type { Program } from '@/types/domain'
import type { EducationProgressHalfKey } from '../../tabs'
import type { UjatEducationProgressVolunteerDetailTab } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { useUjatEducationProgressVolunteerDetail } from './use-detail'
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
  const { detail, loading } = useUjatEducationProgressVolunteerDetail({
    programId: program.id,
    half,
    volunteerId,
  })

  // detailRevision은 저장 후 로컬 재조회 트리거(원격은 query invalidate로 대체)
  void detailRevision

  if (loading && !detail) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }

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
