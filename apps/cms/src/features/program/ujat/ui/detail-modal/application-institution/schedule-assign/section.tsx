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
    setEstimationField,
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
            />
          )
        })}
      </div>

      <UjatInstitutionScheduleAssignEstimationTable
        estimation={regionState.estimation}
        semesterClassTotals={semesterClassTotals}
        volunteerEducationDays={volunteerEducationDays}
        onMaxClassesPerDayChange={(semester, value) =>
          setEstimationField(semester, 'maxClassesPerDay', value)
        }
        onExpectedVolunteerCountChange={(semester, value) =>
          setEstimationField(semester, 'expectedVolunteerCount', value)
        }
      />
    </div>
  )
}
