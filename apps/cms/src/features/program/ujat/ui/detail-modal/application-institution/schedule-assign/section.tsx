import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { UjatInstitutionScheduleAssignDateBlock } from './date-block'
import { UjatInstitutionScheduleAssignEstimationTable } from './estimation-table'
import { useUjatInstitutionScheduleAssign } from './use-schedule-assign'

export function UjatInstitutionScheduleAssignSection({
  regionKey,
}: {
  regionKey: UjatInstitutionApplicationRegionKey
}) {
  const {
    assignDates,
    regionState,
    schoolsByDate,
    addAssignmentRow,
    updateAssignmentRow,
    removeAssignmentRow,
    setMaxClassesPerDay,
    setExpectedVolunteerCount,
    semesterClassTotals,
    volunteerEducationDays,
  } = useUjatInstitutionScheduleAssign(regionKey)

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
              onAddRow={() => addAssignmentRow(isoDate)}
              onUpdateRow={(rowId, patch) => updateAssignmentRow(isoDate, rowId, patch)}
              onRemoveRow={rowId => removeAssignmentRow(isoDate, rowId)}
            />
          )
        })}
      </div>

      <hr className="ujat-schedule-assign-section__divider" aria-hidden />

      <UjatInstitutionScheduleAssignEstimationTable
        maxClassesPerDay={regionState.maxClassesPerDay}
        estimation={regionState.estimation}
        semesterClassTotals={semesterClassTotals}
        volunteerEducationDays={volunteerEducationDays}
        onMaxClassesPerDayChange={setMaxClassesPerDay}
        onExpectedVolunteerCountChange={setExpectedVolunteerCount}
      />
    </div>
  )
}
