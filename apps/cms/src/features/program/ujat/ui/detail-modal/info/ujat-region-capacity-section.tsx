import { useMemo } from 'react'
import { buildUjatRegionCapacityPairRows } from '@/features/program/ujat/lib/ujat-education-regions'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import type { UjatRegionCapacitySemesterValues } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import {
  formatUjatRegionCapacityClassView,
  formatUjatRegionCapacityVolunteerView,
  parseUjatRegionCapacityNumericInput,
} from '@/features/program/ujat/lib/ujat-region-capacity-display'
import {
  EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER,
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
  UJAT_REGION_CAPACITY_SEMESTER_LABEL,
  type UjatRegionCapacityBySemesterState,
  type UjatRegionCapacityField,
  type UjatRegionCapacityRegionName,
  type UjatRegionCapacitySemesterKey,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import {
  updateUjatProgramRegistrationOverlayKey,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-class-capacity-by-region-paragraph.css'

function RegionCapacityView({
  values,
}: {
  values?: UjatRegionCapacitySemesterValues[UjatRegionCapacityRegionName]
}) {
  return (
    <div className="ujat-education-class-capacity__inputs ujat-education-class-capacity__inputs--view">
      <span className="ujat-education-class-capacity__unit">
        {formatUjatRegionCapacityClassView(values?.classCount)}
      </span>
      <DetailInfoForm.InputsSeparator />
      <span className="ujat-education-class-capacity__unit">
        {formatUjatRegionCapacityVolunteerView(values?.volunteerCount)}
      </span>
    </div>
  )
}

function RegionCapacityInputs({
  region,
  values,
  onChange,
}: {
  region: UjatRegionCapacityRegionName
  values?: UjatRegionCapacitySemesterValues[UjatRegionCapacityRegionName]
  onChange: (region: UjatRegionCapacityRegionName, field: UjatRegionCapacityField, value: string) => void
}) {
  return (
    <div className="ujat-education-class-capacity__inputs">
      <CmsNumericInput
        mode="integer"
        inputSize="medium"
        width={120}
        placeholder="최대 학급 수"
        value={values?.classCount ?? ''}
        onValueChange={value =>
          onChange(region, 'classCount', parseUjatRegionCapacityNumericInput(value))
        }
      />
      <span className="ujat-education-class-capacity__unit">개 학급</span>
      <DetailInfoForm.InputsSeparator />
      <CmsNumericInput
        mode="integer"
        inputSize="medium"
        width={120}
        placeholder="최대 봉사자 수"
        value={values?.volunteerCount ?? ''}
        onValueChange={value =>
          onChange(region, 'volunteerCount', parseUjatRegionCapacityNumericInput(value))
        }
      />
      <span className="ujat-education-class-capacity__unit">명</span>
    </div>
  )
}

function SemesterRegionCapacityTable({
  half,
  mode,
  values,
  onChange,
  regionRows,
}: {
  half: UjatRegionCapacitySemesterKey
  mode: 'view' | 'edit'
  values: UjatRegionCapacitySemesterValues
  onChange?: (region: UjatRegionCapacityRegionName, field: UjatRegionCapacityField, value: string) => void
  regionRows: Array<{ left: string; right: string }>
}) {
  return (
    <div className="ujat-education-class-capacity__semester">
      <div className="ujat-education-class-capacity__semester-title">
        {UJAT_REGION_CAPACITY_SEMESTER_LABEL[half]}
      </div>
      <DetailInfoForm
        title={UJAT_REGION_CAPACITY_SEMESTER_LABEL[half]}
        hideHeader
        mode={mode}
        className="ujat-education-class-capacity__form"
      >
        {regionRows.map(row => (
          <DetailInfoForm.Row key={`${half}-${row.left}-${row.right}`} type="double">
            <DetailInfoForm.Field
              label={row.left}
              view={<RegionCapacityView values={values[row.left]} />}
              edit={
                mode === 'edit' && onChange ? (
                  <RegionCapacityInputs
                    region={row.left}
                    values={values[row.left]}
                    onChange={onChange}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label={row.right}
              view={<RegionCapacityView values={values[row.right]} />}
              edit={
                mode === 'edit' && onChange ? (
                  <RegionCapacityInputs
                    region={row.right}
                    values={values[row.right]}
                    onChange={onChange}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
        ))}
      </DetailInfoForm>
    </div>
  )
}

function SemesterRegionCapacityTableConnected({
  half,
  mode,
  fallbackValues,
  regionRows,
}: {
  half: UjatRegionCapacitySemesterKey
  mode: 'view' | 'edit'
  fallbackValues: UjatRegionCapacitySemesterValues
  regionRows: Array<{ left: string; right: string }>
}) {
  const [valuesBySemester] = useUjatProgramRegistrationOverlayKv<UjatRegionCapacityBySemesterState>(
    UJAT_REGION_CAPACITY_OVERLAY_KEY,
    EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER
  )
  const values = { ...fallbackValues, ...valuesBySemester[half] }

  const updateValue = (
    region: UjatRegionCapacityRegionName,
    field: UjatRegionCapacityField,
    value: string
  ) => {
    updateUjatProgramRegistrationOverlayKey<UjatRegionCapacityBySemesterState>(
      UJAT_REGION_CAPACITY_OVERLAY_KEY,
      prev => {
        const p = prev ?? EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER
        return {
          ...p,
          [half]: {
            ...p[half],
            [region]: {
              ...p[half][region],
              [field]: value,
            },
          },
        }
      }
    )
  }

  return (
    <SemesterRegionCapacityTable
      half={half}
      mode={mode}
      values={values}
      onChange={mode === 'edit' ? updateValue : undefined}
      regionRows={regionRows}
    />
  )
}

export function UjatRegionCapacitySection({
  mode,
  h1Values,
  h2Values,
}: {
  mode: 'view' | 'edit'
  h1Values: UjatRegionCapacitySemesterValues
  h2Values: UjatRegionCapacitySemesterValues
}) {
  const { labels } = useUjatEducationRegions()
  const regionRows = useMemo(() => buildUjatRegionCapacityPairRows(), [labels])

  return (
    <div className="ujat-education-class-capacity">
      <SemesterRegionCapacityTableConnected
        half="h1"
        mode={mode}
        fallbackValues={h1Values}
        regionRows={regionRows}
      />
      <SemesterRegionCapacityTableConnected
        half="h2"
        mode={mode}
        fallbackValues={h2Values}
        regionRows={regionRows}
      />
    </div>
  )
}
