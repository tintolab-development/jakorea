import type { ReactNode } from 'react'
import '@/shared/ui/cross-table.css'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import type { UjatInstitutionEducationSemesterKey } from '../education-schedule'
import type { UjatScheduleAssignRegionState } from './types'

const SEMESTER_ROWS: ReadonlyArray<{ key: UjatInstitutionEducationSemesterKey; label: string }> = [
  { key: 'h1', label: '1학기' },
  { key: 'h2', label: '2학기' },
]

const COLUMN_HEADERS = [
  '1일 최대 교육 학급 수',
  '총 학급 수',
  '봉사단 수',
  '봉사단 교육 진행일 수',
] as const

const EMPTY_COMPUTED_VALUE = '-'

function formatComputedDays(value: number | null): string {
  return value != null && Number.isFinite(value) ? String(value) : EMPTY_COMPUTED_VALUE
}

function ComputedCell({
  filled,
  placeholder,
  children,
}: {
  filled: boolean
  placeholder: string
  children: ReactNode
}) {
  return (
    <span
      className={
        filled
          ? 'ujat-schedule-assign-estimation__computed ujat-schedule-assign-estimation__computed--filled'
          : 'ujat-schedule-assign-estimation__computed'
      }
    >
      {filled ? children : placeholder}
    </span>
  )
}

export function UjatInstitutionScheduleAssignEstimationTable({
  maxClassesPerDay,
  estimation,
  semesterClassTotals,
  volunteerEducationDays,
  onMaxClassesPerDayChange,
  onExpectedVolunteerCountChange,
}: {
  maxClassesPerDay: string
  estimation: UjatScheduleAssignRegionState['estimation']
  semesterClassTotals: Record<UjatInstitutionEducationSemesterKey, number>
  volunteerEducationDays: Record<UjatInstitutionEducationSemesterKey, number | null>
  onMaxClassesPerDayChange: (value: string) => void
  onExpectedVolunteerCountChange: (
    semester: UjatInstitutionEducationSemesterKey,
    value: string
  ) => void
}) {
  return (
    <DetailInfoForm
      className="ujat-schedule-assign-estimation"
      title="배정값 임시 산정"
      mode="edit"
      description={
        <span className="ujat-schedule-assign-estimation__hint">
          봉사단 교육 일수는 모든 입력값이 작성되어야 계산됩니다.
        </span>
      }
    >
      <DetailInfoForm.Row type="custom">
        <div className="cross-table ujat-schedule-assign-estimation__table">
          <table className="cross-table__table" aria-label="배정값 임시 산정">
            <colgroup>
              <col className="cross-table__label-col" />
              {COLUMN_HEADERS.map((_, index) => (
                <col key={index} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="cross-table__cell cross-table__cell--corner">학기 / 항목</th>
                {COLUMN_HEADERS.map(header => (
                  <th
                    key={header}
                    className="cross-table__cell cross-table__cell--column-header"
                    scope="col"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEMESTER_ROWS.map(semester => (
                <tr key={semester.key}>
                  <th className="cross-table__cell cross-table__cell--row-header" scope="row">
                    {semester.label}
                  </th>
                  <td className="cross-table__cell cross-table__cell--data">
                    <CmsNumericInput
                      mode="integer"
                      min={0}
                      inputSize="small"
                      width="100%"
                      placeholder="예상 최대 학급 수를 입력하세요"
                      value={maxClassesPerDay}
                      onValueChange={onMaxClassesPerDayChange}
                    />
                  </td>
                  <td className="cross-table__cell cross-table__cell--data">
                    <ComputedCell
                      filled={semesterClassTotals[semester.key] > 0}
                      placeholder="예상 학급 수"
                    >
                      {semesterClassTotals[semester.key]}
                    </ComputedCell>
                  </td>
                  <td className="cross-table__cell cross-table__cell--data">
                    <CmsNumericInput
                      mode="integer"
                      min={0}
                      inputSize="small"
                      width="100%"
                      placeholder="예상 봉사단 인원을 입력하세요"
                      value={estimation[semester.key].expectedVolunteerCount}
                      onValueChange={value =>
                        onExpectedVolunteerCountChange(semester.key, value)
                      }
                    />
                  </td>
                  <td className="cross-table__cell cross-table__cell--data">
                    <ComputedCell
                      filled={volunteerEducationDays[semester.key] != null}
                      placeholder={EMPTY_COMPUTED_VALUE}
                    >
                      {formatComputedDays(volunteerEducationDays[semester.key])}
                    </ComputedCell>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
