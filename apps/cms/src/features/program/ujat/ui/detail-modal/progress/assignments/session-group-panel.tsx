import { useMemo } from 'react'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { filterAssignmentVolunteersForDisplay } from './use-list'
import { UjatEducationProgressAssignmentTable } from './assignment-table'
import type { UjatAssignmentFilters, UjatAssignmentSessionGroup } from './types'

export function UjatAssignmentSessionGroupHeader({
  session,
  totalCount,
}: {
  session: UjatAssignmentSessionGroup
  totalCount: number
}) {
  return (
    <div className="table-header-title--wrapper">
      <span className="table-title">{session.dateLabel}</span>
      <span className="table-description--black">
        교육 계획서 제출 기간 : {session.planSubmissionPeriodLabel}
      </span>
      <DividerVertical height={16} />
      <span className="table-description--black">
        교육일지 제출 기간 : {session.logSubmissionPeriodLabel}
      </span>
      <span className="table-description">총 {totalCount}건</span>
    </div>
  )
}

export function UjatAssignmentSessionGroupPanel({
  session,
  appliedFilters,
  showHeader = true,
}: {
  session: UjatAssignmentSessionGroup
  appliedFilters: UjatAssignmentFilters
  showHeader?: boolean
}) {
  const { regions } = useUjatEducationRegions()
  const regionLabelMap = useMemo(
    () => new Map(regions.map(region => [region.key, region.label])),
    [regions]
  )
  const displayRows = useMemo(
    () => filterAssignmentVolunteersForDisplay(session.volunteers, appliedFilters),
    [appliedFilters, session.volunteers]
  )

  const regionLabel = regionLabelMap.get(session.regionKey) ?? session.regionKey

  return (
    <section className="ujat-education-progress-assignments__session-group">
      {showHeader ? (
        <UjatAssignmentSessionGroupHeader session={session} totalCount={displayRows.length} />
      ) : null}
      <div className="ujat-education-progress-assignments__table-wrap">
        <UjatEducationProgressAssignmentTable rows={displayRows} regionLabel={regionLabel} />
      </div>
    </section>
  )
}
