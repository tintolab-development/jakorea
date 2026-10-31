import { useEffect, useMemo } from 'react'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { UjatInstitutionScheduleAssignDateBlock } from './date-block'
import { UjatInstitutionScheduleAssignEstimationTable } from './estimation-table'
import { UjatInstitutionScheduleAssignSectionSkeleton } from './section-skeleton'
import { useUjatInstitutionScheduleAssign } from './use-schedule-assign'
import { collectScheduleAssignPendingInstitutionNames } from './utils'

export type UjatScheduleAssignRemoteSave = () => Promise<
  | { ok: true; message?: string }
  | { ok: false; message: string }
>

export type UjatScheduleAssignBindMeta = {
  saving: boolean
  contentLoading: boolean
  remoteEnabled: boolean
  pendingInstitutionNames: string[]
}

export function UjatInstitutionScheduleAssignSection({
  regionKey,
  programId,
  onBindRemoteSave,
}: {
  regionKey: UjatInstitutionApplicationRegionKey
  programId?: string | null
  onBindRemoteSave?: (
    save: UjatScheduleAssignRemoteSave | null,
    meta: UjatScheduleAssignBindMeta
  ) => void
}) {
  const {
    assignDates,
    regionState,
    schoolsByDate,
    organizationNamesByApplicationId,
    addAssignmentRow,
    updateAssignmentRow,
    removeAssignmentRow,
    setMaxClassesPerDay,
    setExpectedVolunteerCount,
    semesterClassTotals,
    volunteerEducationDays,
    saveTemporarySchedules,
    contentLoading,
    saving,
    remoteEnabled,
  } = useUjatInstitutionScheduleAssign(regionKey, programId)

  const pendingInstitutionNames = useMemo(
    () =>
      collectScheduleAssignPendingInstitutionNames(
        regionState.days,
        organizationNamesByApplicationId
      ),
    [organizationNamesByApplicationId, regionState.days]
  )

  useEffect(() => {
    onBindRemoteSave?.(saveTemporarySchedules, {
      saving,
      contentLoading,
      remoteEnabled,
      pendingInstitutionNames: contentLoading ? [] : pendingInstitutionNames,
    })
    return () =>
      onBindRemoteSave?.(null, {
        saving: false,
        contentLoading: false,
        remoteEnabled: false,
        pendingInstitutionNames: [],
      })
  }, [
    contentLoading,
    onBindRemoteSave,
    pendingInstitutionNames,
    remoteEnabled,
    saveTemporarySchedules,
    saving,
  ])

  if (contentLoading) {
    return <UjatInstitutionScheduleAssignSectionSkeleton />
  }

  return (
    <div className="ujat-schedule-assign-section">
      <div className="ujat-schedule-assign-section__dates">
        {assignDates.map(({ isoDate, title }) => {
          const day = regionState.days[isoDate]
          if (!day) return null
          return (
            <UjatInstitutionScheduleAssignDateBlock
              key={isoDate}
              title={title}
              day={day}
              schoolOptions={schoolsByDate[isoDate] ?? []}
              organizationNamesByApplicationId={organizationNamesByApplicationId}
              onAddRow={() => addAssignmentRow(isoDate)}
              onUpdateRow={(rowId, patch) => updateAssignmentRow(isoDate, rowId, patch)}
              onRemoveRow={rowId => removeAssignmentRow(isoDate, rowId)}
            />
          )
        })}
      </div>

      <hr className="ujat-schedule-assign-section__divider" aria-hidden />

      <UjatInstitutionScheduleAssignEstimationTable
        estimation={regionState.estimation}
        semesterClassTotals={semesterClassTotals}
        volunteerEducationDays={volunteerEducationDays}
        onMaxClassesPerDayChange={setMaxClassesPerDay}
        onExpectedVolunteerCountChange={setExpectedVolunteerCount}
      />
    </div>
  )
}
