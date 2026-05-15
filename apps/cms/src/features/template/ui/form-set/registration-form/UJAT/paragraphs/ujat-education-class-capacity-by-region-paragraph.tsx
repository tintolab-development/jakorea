import {
  updateUjatProgramRegistrationOverlayKey,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import './ujat-education-class-capacity-by-region-paragraph.css'

const REGION_ROWS = [
  { left: '서울', right: '경기(남부)' },
  { left: '인천', right: '대전' },
  { left: '대구', right: '부산' },
  { left: '광주', right: '전북(전주)' },
] as const

type SemesterKey = 'first' | 'second'
type CapacityField = 'classCount' | 'volunteerCount'
type RegionName = (typeof REGION_ROWS)[number]['left'] | (typeof REGION_ROWS)[number]['right']
type RegionCapacityValues = Partial<Record<CapacityField, string>>
type SemesterCapacityValues = Partial<Record<RegionName, RegionCapacityValues>>

type CapacityBySemesterState = {
  first: SemesterCapacityValues
  second: SemesterCapacityValues
}

const SEMESTER_TITLES: Record<SemesterKey, string> = {
  first: '■ 상반기 (1학기)',
  second: '■ 하반기 (2학기)',
}

function RegionCapacityInputs({
  region,
  values,
  onChange,
}: {
  region: RegionName
  values?: RegionCapacityValues
  onChange: (region: RegionName, field: CapacityField, value: string) => void
}) {
  return (
    <div className="ujat-education-class-capacity__inputs">
      <CmsInput
        inputSize="medium"
        width={120}
        placeholder="최대 학급 수"
        value={values?.classCount ?? ''}
        onChange={e => onChange(region, 'classCount', e.target.value)}
      />
      <span className="ujat-education-class-capacity__unit">개 학급</span>
      <DetailInfoForm.InputsSeparator />
      <CmsInput
        inputSize="medium"
        width={120}
        placeholder="최대 봉사자 수"
        value={values?.volunteerCount ?? ''}
        onChange={e => onChange(region, 'volunteerCount', e.target.value)}
      />
      <span className="ujat-education-class-capacity__unit">명</span>
    </div>
  )
}

function SemesterClassCapacityTable({
  semester,
  values,
  onChange,
}: {
  semester: SemesterKey
  values: SemesterCapacityValues
  onChange: (region: RegionName, field: CapacityField, value: string) => void
}) {
  return (
    <div className="ujat-education-class-capacity__semester">
      <div className="ujat-education-class-capacity__semester-title">
        {SEMESTER_TITLES[semester]}
      </div>
      <DetailInfoForm
        title={SEMESTER_TITLES[semester]}
        hideHeader
        mode="edit"
        className="ujat-education-class-capacity__form"
      >
        {REGION_ROWS.map(row => (
          <DetailInfoForm.Row key={`${semester}-${row.left}-${row.right}`} type="double">
            <DetailInfoForm.Field
              label={row.left}
              edit={
                <RegionCapacityInputs
                  region={row.left}
                  values={values[row.left]}
                  onChange={onChange}
                />
              }
              view="-"
            />
            <DetailInfoForm.Field
              label={row.right}
              edit={
                <RegionCapacityInputs
                  region={row.right}
                  values={values[row.right]}
                  onChange={onChange}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        ))}
      </DetailInfoForm>
    </div>
  )
}

const UJAT_CAPACITY_DEFAULT: CapacityBySemesterState = {
  first: {},
  second: {},
}

const UJAT_CAPACITY_OVERLAY_KEY = 'ujat.capacity.byRegion' as const

/** 지역 별 교육 진행 가능 학급 및 봉사단 수 설정 */
export function UjatEducationClassCapacityByRegionParagraph() {
  const [valuesBySemester] = useUjatProgramRegistrationOverlayKv<CapacityBySemesterState>(
    UJAT_CAPACITY_OVERLAY_KEY,
    UJAT_CAPACITY_DEFAULT
  )

  const updateValue = (
    semester: SemesterKey,
    region: RegionName,
    field: CapacityField,
    value: string
  ) => {
    updateUjatProgramRegistrationOverlayKey<CapacityBySemesterState>(UJAT_CAPACITY_OVERLAY_KEY, prev => {
      const p = prev ?? UJAT_CAPACITY_DEFAULT
      return {
        ...p,
        [semester]: {
          ...p[semester],
          [region]: {
            ...p[semester][region],
            [field]: value,
          },
        },
      }
    })
  }

  return (
    <div className="paragraph-card__slot ujat-education-class-capacity">
      <SemesterClassCapacityTable
        semester="first"
        values={valuesBySemester.first}
        onChange={(region, field, value) => updateValue('first', region, field, value)}
      />
      <SemesterClassCapacityTable
        semester="second"
        values={valuesBySemester.second}
        onChange={(region, field, value) => updateValue('second', region, field, value)}
      />
    </div>
  )
}
