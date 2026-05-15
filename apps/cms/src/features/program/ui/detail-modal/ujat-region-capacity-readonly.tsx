/** UJAT 공통 정보 — 지역 별 교육 진행 가능 학급 수 (학기별 2행×4지역, 8열 그리드) */

import '@/shared/components/detail-info-form/detail-info-form.css'
import './ujat-program-detail-common-info-view.css'

export type UjatRegionCapacityCell = {
  region: string
  classes: string
}

export type UjatRegionCapacitySemesterBlock = {
  subtitle: string
  rows: readonly [readonly UjatRegionCapacityCell[], readonly UjatRegionCapacityCell[]]
}

const REGION_CAPACITY_ROW_1: readonly UjatRegionCapacityCell[] = [
  { region: '서울', classes: '50개 학급' },
  { region: '경기(남부)', classes: '60개 학급' },
  { region: '인천', classes: '40개 학급' },
  { region: '대전', classes: '46개 학급' },
]

const REGION_CAPACITY_ROW_2: readonly UjatRegionCapacityCell[] = [
  { region: '대구', classes: '52개 학급' },
  { region: '부산', classes: '54개 학급' },
  { region: '광주', classes: '46개 학급' },
  { region: '전북(전주)', classes: '44개 학급' },
]

export const UJAT_REGION_CAPACITY_SEMESTERS: readonly UjatRegionCapacitySemesterBlock[] = [
  {
    subtitle: '■ 상반기 (1학기)',
    rows: [REGION_CAPACITY_ROW_1, REGION_CAPACITY_ROW_2],
  },
  {
    subtitle: '■ 하반기 (2학기)',
    rows: [REGION_CAPACITY_ROW_1, REGION_CAPACITY_ROW_2],
  },
]

function RegionCapacityGrid({
  rows,
}: {
  rows: readonly [readonly UjatRegionCapacityCell[], readonly UjatRegionCapacityCell[]]
}) {
  const cells = rows.flatMap(row =>
    row.flatMap(cell => [
      { key: `${cell.region}-label`, kind: 'label' as const, text: cell.region },
      { key: `${cell.region}-value`, kind: 'value' as const, text: cell.classes },
    ])
  )

  return (
    <div
      className="ujat-region-capacity-readonly__grid"
      role="table"
      aria-label="지역 별 교육 진행 가능 학급 수"
    >
      {cells.map(cell => (
        <div
          key={cell.key}
          role={cell.kind === 'label' ? 'rowheader' : 'cell'}
          className={`ujat-region-capacity-readonly__cell ujat-region-capacity-readonly__cell--${cell.kind}`}
        >
          {cell.text}
        </div>
      ))}
    </div>
  )
}

export function UjatRegionCapacityReadonly({
  semesters = UJAT_REGION_CAPACITY_SEMESTERS,
}: {
  semesters?: readonly UjatRegionCapacitySemesterBlock[]
}) {
  return (
    <div className="ujat-program-detail-common-info-view__section ujat-region-capacity-readonly">
      <h2 className="detail-info-form__title ujat-region-capacity-readonly__title">
        지역 별 교육 진행 가능 학급 수
      </h2>
      {semesters.map(semester => (
        <div key={semester.subtitle} className="ujat-region-capacity-readonly__semester">
          <div className="ujat-region-capacity-readonly__subtitle">{semester.subtitle}</div>
          <RegionCapacityGrid rows={semester.rows} />
        </div>
      ))}
    </div>
  )
}
