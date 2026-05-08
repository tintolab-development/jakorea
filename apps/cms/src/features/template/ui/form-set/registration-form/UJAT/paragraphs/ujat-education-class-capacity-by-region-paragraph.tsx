import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

type SemesterKey = 'first' | 'second'

const REGION_ROWS = [
  { left: '서울', right: '경기(남부)' },
  { left: '인천', right: '대전' },
  { left: '대구', right: '부산' },
  { left: '광주', right: '전북(전주)' },
] as const

const SEMESTER_TITLES: Record<SemesterKey, string> = {
  first: '■ 상반기 (1학기)',
  second: '■ 하반기 (2학기)',
}

function RegionClassCapacityRows({
  semester,
  values,
  onChange,
}: {
  semester: SemesterKey
  values: Record<string, string>
  onChange: (region: string, value: string) => void
}) {
  return REGION_ROWS.map((row, rowIndex) => {
    const isLast = rowIndex === REGION_ROWS.length - 1
    return (
      <div
        key={`${semester}-${row.left}-${row.right}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '140px minmax(0,1fr) 140px minmax(0,1fr)',
          borderBottom: isLast ? 'none' : '1px solid var(--table-line, #e0e0e0)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 8px',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--default-BK, #3d3d3d)',
            background: '#f5f6f7',
            borderRight: '1px solid var(--table-line, #e0e0e0)',
          }}
        >
          {row.left}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRight: '1px solid var(--table-line, #e0e0e0)',
            minWidth: 0,
          }}
        >
          <CmsInput
            inputSize="medium"
            width={88}
            placeholder="최대 학급 수"
            value={values[row.left] ?? ''}
            onChange={e => onChange(row.left, e.target.value)}
          />
          <span style={{ color: 'var(--default-BK, #3d3d3d)', fontSize: 16, lineHeight: '140%' }}>
            개 학급
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 8px',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--default-BK, #3d3d3d)',
            background: '#f5f6f7',
            borderRight: '1px solid var(--table-line, #e0e0e0)',
          }}
        >
          {row.right}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            minWidth: 0,
          }}
        >
          <CmsInput
            inputSize="medium"
            width={88}
            placeholder="최대 학급 수"
            value={values[row.right] ?? ''}
            onChange={e => onChange(row.right, e.target.value)}
          />
          <span style={{ color: 'var(--default-BK, #3d3d3d)', fontSize: 16, lineHeight: '140%' }}>
            개 학급
          </span>
        </div>
      </div>
    )
  })
}

function SemesterClassCapacityDetailInfoForm({
  semester,
  values,
  onChange,
}: {
  semester: SemesterKey
  values: Record<string, string>
  onChange: (region: string, value: string) => void
}) {
  return (
    <div>
      <div
        style={{
          marginBottom: 8,
          color: 'var(--main-BK, #3d3d3d)',
          fontSize: 16,
          fontWeight: 700,
          lineHeight: '150%',
        }}
      >
        {SEMESTER_TITLES[semester]}
      </div>
      <DetailInfoForm
        title={SEMESTER_TITLES[semester]}
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="custom">
          <div style={{ width: '100%' }}>
            <RegionClassCapacityRows semester={semester} values={values} onChange={onChange} />
          </div>
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

/** 지역 별 교육 진행 가능 학급 수 설정 */
export function UjatEducationClassCapacityByRegionParagraph() {
  const [valuesBySemester, setValuesBySemester] = useState<{
    first: Record<string, string>
    second: Record<string, string>
  }>({
    first: {},
    second: {},
  })

  const updateValue = (semester: SemesterKey, region: string, value: string) => {
    setValuesBySemester(prev => ({
      ...prev,
      [semester]: {
        ...prev[semester],
        [region]: value,
      },
    }))
  }

  return (
    <div className="paragraph-card__slot">
      <SemesterClassCapacityDetailInfoForm
        semester="first"
        values={valuesBySemester.first}
        onChange={(region, value) => updateValue('first', region, value)}
      />
      <SemesterClassCapacityDetailInfoForm
        semester="second"
        values={valuesBySemester.second}
        onChange={(region, value) => updateValue('second', region, value)}
      />
    </div>
  )
}
