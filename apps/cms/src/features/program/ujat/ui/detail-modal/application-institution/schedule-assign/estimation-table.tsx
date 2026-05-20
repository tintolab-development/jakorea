import { CrossTable } from '@/shared/ui/cross-table'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import type { UjatInstitutionEducationSemesterKey } from '../education-schedule'
import type { UjatScheduleAssignRegionState } from './types'

const SEMESTER_ROWS: ReadonlyArray<{ key: UjatInstitutionEducationSemesterKey; label: string }> = [
  { key: 'h1', label: '1학기' },
  { key: 'h2', label: '2학기' },
]

function formatComputedDays(value: number | null): string {
  if (value == null) return '-'
  return String(value)
}

export function UjatInstitutionScheduleAssignEstimationTable({
  estimation,
  semesterClassTotals,
  volunteerEducationDays,
  onMaxClassesPerDayChange,
  onExpectedVolunteerCountChange,
}: {
  estimation: UjatScheduleAssignRegionState['estimation']
  semesterClassTotals: Record<UjatInstitutionEducationSemesterKey, number>
  volunteerEducationDays: Record<UjatInstitutionEducationSemesterKey, number | null>
  onMaxClassesPerDayChange: (semester: UjatInstitutionEducationSemesterKey, value: string) => void
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
        <CrossTable
          wide
          aria-label="배정값 임시 산정"
          corner="학기 / 항목"
          columnHeaders={[
            '1일 최대 교육 학급 수',
            '총 학급 수',
            '봉사단 수',
            '봉사단 교육 진행일 수',
          ]}
          rows={SEMESTER_ROWS.map(({ key, label }) => ({
            id: key,
            rowHeader: label,
            cells: [
              <CmsInput
                key={`${key}-max`}
                inputSize="large"
                width="100%"
                placeholder="최대 학급 수를 입력하세요"
                value={estimation[key].maxClassesPerDay}
                onChange={e => onMaxClassesPerDayChange(key, e.target.value)}
              />,
              <span
                key={`${key}-classes`}
                className={
                  semesterClassTotals[key] > 0
                    ? 'ujat-schedule-assign-estimation__computed ujat-schedule-assign-estimation__computed--filled'
                    : 'ujat-schedule-assign-estimation__computed'
                }
              >
                {semesterClassTotals[key] > 0 ? semesterClassTotals[key] : '예상 학급 수'}
              </span>,
              <CmsInput
                key={`${key}-vol`}
                inputSize="large"
                width="100%"
                placeholder="예상 봉사단 인원을 입력하세요"
                value={estimation[key].expectedVolunteerCount}
                onChange={e => onExpectedVolunteerCountChange(key, e.target.value)}
              />,
              <span
                key={`${key}-days`}
                className={
                  volunteerEducationDays[key] != null
                    ? 'ujat-schedule-assign-estimation__computed ujat-schedule-assign-estimation__computed--filled'
                    : 'ujat-schedule-assign-estimation__computed'
                }
              >
                {volunteerEducationDays[key] != null
                  ? formatComputedDays(volunteerEducationDays[key])
                  : '예상 봉사단 교육 진행일 수'}
              </span>,
            ],
          }))}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
