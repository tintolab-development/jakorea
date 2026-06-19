import { useMemo } from 'react'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { filterAssignmentVolunteersForDisplay } from './use-list'
import { UjatEducationProgressAssignmentTable } from './assignment-table'
import type { UjatAssignmentFilters, UjatAssignmentSessionGroup } from './types'

export function UjatAssignmentSessionGroupPanel({
  session,
  appliedFilters,
}: {
  session: UjatAssignmentSessionGroup
  appliedFilters: UjatAssignmentFilters
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
      <h3 className="ujat-education-progress-assignments__session-header">
        <span className="ujat-education-progress-assignments__session-leading">
          <span className="ujat-education-progress-assignments__session-date">
            {session.dateLabel}
          </span>
          <span className="ujat-education-progress-assignments__session-meta">
            교육 계획서 제출 기간 : {session.planSubmissionPeriodLabel}
          </span>
        </span>
        <DividerVertical
          height={16}
          className="ujat-education-progress-assignments__session-divider"
        />
        <span className="ujat-education-progress-assignments__session-meta">
          교육일지 제출 기간 : {session.logSubmissionPeriodLabel} 총 {displayRows.length}건
        </span>
      </h3>
      <div className="ujat-education-progress-assignments__table-wrap">
        <UjatEducationProgressAssignmentTable rows={displayRows} regionLabel={regionLabel} />
      </div>
    </section>
  )
}
