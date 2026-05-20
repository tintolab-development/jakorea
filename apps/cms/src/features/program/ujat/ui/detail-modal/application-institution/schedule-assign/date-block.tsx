import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatInstitutionApplicationRow } from '../list/types'
import type { UjatScheduleAssignDayState } from './types'
import {
  buildGradeOptionsForInstitution,
  formatScheduleAssignSchoolLabel,
  sumSelectedGradeClassCount,
} from './utils'

const TOTAL_PLACEHOLDER = '학교 및 배정 학급을 선택해 주세요'

export function UjatInstitutionScheduleAssignDateBlock({
  title,
  day,
  schoolOptions,
  onAddRow,
  onUpdateRow,
}: {
  title: string
  day: UjatScheduleAssignDayState
  schoolOptions: UjatInstitutionApplicationRow[]
  onAddRow: () => void
  onUpdateRow: (rowId: string, patch: Partial<UjatScheduleAssignDayState['rows'][number]>) => void
}) {
  const totalClassCount = useMemo(
    () => day.rows.reduce((sum, row) => sum + sumSelectedGradeClassCount(row.gradeValues), 0),
    [day.rows]
  )

  const schoolSelectOptions = useMemo(
    () =>
      schoolOptions.map(row => ({
        value: row.id,
        label: row.institutionName,
      })),
    [schoolOptions]
  )

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
      {day.rows.map((row, index) => {
        const institution =
          row.institutionRowId != null
            ? schoolOptions.find(s => s.id === row.institutionRowId)
            : undefined
        const gradeOptions = institution ? buildGradeOptionsForInstitution(institution) : []
        const rowTotal = sumSelectedGradeClassCount(row.gradeValues)
        const hasTotalValue = Boolean(row.institutionRowId && row.gradeValues.length > 0)
        const totalDisplay = hasTotalValue ? `${rowTotal}학급` : TOTAL_PLACEHOLDER

        return (
          <DetailInfoForm.Row key={row.id} type="double">
            <DetailInfoForm.Field
              label={formatScheduleAssignSchoolLabel(index, day.rows.length)}
              view="-"
              edit={
                <div className="detail-info-form-inputs-wrapper-no-gap">
                  <CmsSelect
                    inputSize="large"
                    width="100%"
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
                    inputSize="large"
                    width="100%"
                    mode="multiple"
                    withAllOption={false}
                    placeholder="배정 학급을 선택하세요"
                    options={gradeOptions}
                    value={row.gradeValues}
                    disabled={!row.institutionRowId}
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
                    hasTotalValue ? undefined : 'ujat-schedule-assign-date-block__total-hint'
                  }
                >
                  {totalDisplay}
                </span>
              }
              readOnlyDisplay
            />
          </DetailInfoForm.Row>
        )
      })}
    </DetailInfoForm>
  )
}
