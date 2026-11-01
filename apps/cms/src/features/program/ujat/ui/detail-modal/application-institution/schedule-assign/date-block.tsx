import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL,
  type UjatInstitutionApplicationRow,
} from '../list/types'
import type { UjatScheduleAssignDayState } from './types'
import {
  buildGradeOptionsForInstitution,
  formatScheduleAssignSchoolLabel,
  isScheduleAssignBlockedInstitution,
  sumSelectedGradeClassCount,
} from './utils'

const TOTAL_PLACEHOLDER = '학교 및 배정 학급을 선택해 주세요'

export function UjatInstitutionScheduleAssignDateBlock({
  title,
  day,
  schoolOptions,
  organizationNamesByApplicationId,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
}: {
  title: string
  day: UjatScheduleAssignDayState
  schoolOptions: UjatInstitutionApplicationRow[]
  organizationNamesByApplicationId: Record<string, string>
  onAddRow: () => void
  onUpdateRow: (rowId: string, patch: Partial<UjatScheduleAssignDayState['rows'][number]>) => void
  onRemoveRow: (rowId: string) => void
}) {
  const totalClassCount = useMemo(
    () => day.rows.reduce((sum, row) => sum + sumSelectedGradeClassCount(row.gradeValues), 0),
    [day.rows]
  )

  const schoolSelectOptions = useMemo(
    () => {
      const options = schoolOptions.map(row =>
        isScheduleAssignBlockedInstitution(row)
          ? {
              value: row.id,
              label: `${row.institutionName} (${UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL[row.tempAssignmentStatus]})`,
              disabled: true,
            }
          : { value: row.id, label: row.institutionName }
      )
      const knownIds = new Set(options.map(option => option.value))

      for (const row of day.rows) {
        const id = row.institutionRowId
        const name = id ? organizationNamesByApplicationId[id]?.trim() : ''
        if (id && name && !knownIds.has(id)) {
          options.push({ value: id, label: name })
        }
      }
      return options
    },
    [day.rows, organizationNamesByApplicationId, schoolOptions]
  )

  const showRowDelete = day.rows.length >= 2

  return (
    <DetailInfoForm
      className="ujat-schedule-assign-date-block"
      title={title}
      mode="edit"
      headerNote={
        totalClassCount > 0 ? (
          <span className="ujat-schedule-assign-date-block__total-note">{totalClassCount}학급</span>
        ) : undefined
      }
      titleTrailing={
        <CmsButton type="button" variant="secondary" size="medium" onClick={onAddRow}>
          추가 배정
        </CmsButton>
      }
    >
      <DetailInfoForm.Row type="custom">
        <div className="ujat-schedule-assign-date-block__rows">
          {day.rows.map((row, index) => {
            const institution =
              row.institutionRowId != null
                ? schoolOptions.find(s => s.id === row.institutionRowId)
                : undefined
            const gradeOptions = institution ? buildGradeOptionsForInstitution(institution) : []
            const institutionBlocked = institution
              ? isScheduleAssignBlockedInstitution(institution)
              : false
            const rowTotal = sumSelectedGradeClassCount(row.gradeValues)
            const hasTotalValue = Boolean(row.institutionRowId && row.gradeValues.length > 0)
            const totalDisplay = hasTotalValue ? `${rowTotal}학급` : TOTAL_PLACEHOLDER

            return (
              <div key={row.id} className="ujat-schedule-assign-date-block__row">
                <div className="ujat-schedule-assign-date-block__row-body">
                  <DetailInfoForm.Row type="double" className="ujat-schedule-assign-date-block__row-fields">
                    <DetailInfoForm.Field
                      label={formatScheduleAssignSchoolLabel(index, day.rows.length)}
                      view="-"
                      edit={
                        <div className="detail-info-form-inputs-wrapper-no-gap ujat-schedule-assign-date-block__school-inputs">
                          <CmsSelect
                            inputSize="small"
                            placeholder="학교 선택"
                            options={schoolSelectOptions}
                            value={row.institutionRowId ?? undefined}
                            onChange={value => {
                              onUpdateRow(row.id, {
                                institutionRowId: value ? String(value) : null,
                                gradeValues: [],
                              })
                            }}
                          />
                          <DetailInfoForm.InputsSeparator />
                          <CmsSelect
                            inputSize="small"
                            mode="multiple"
                            withAllOption={false}
                            placeholder="배정 학급을 선택하세요"
                            options={gradeOptions}
                            value={row.gradeValues}
                            disabled={!row.institutionRowId || institutionBlocked}
                            onChange={values => {
                              onUpdateRow(row.id, {
                                gradeValues: Array.isArray(values)
                                  ? values.map(String)
                                  : values != null
                                    ? [String(values)]
                                    : [],
                              })
                            }}
                          />
                        </div>
                      }
                    />
                    <DetailInfoForm.Field
                      label="총 학급 수"
                      view={
                        <span
                          className={
                            hasTotalValue
                              ? undefined
                              : 'ujat-schedule-assign-date-block__total-hint'
                          }
                        >
                          {totalDisplay}
                        </span>
                      }
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                </div>
                {showRowDelete && index > 0 ? (
                  <div className="ujat-schedule-assign-date-block__delete-cell">
                    <ItemDeleteButton
                      className="item-delete-button"
                      aria-label={`${formatScheduleAssignSchoolLabel(index, day.rows.length)} 삭제`}
                      onClick={event => {
                        event.stopPropagation()
                        onRemoveRow(row.id)
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
