/** UJAT 공통 정보 — 지역 별 교육 진행 가능 학급 수 조회 (시안 4082:89939, 한 줄 4지역 · 라벨|값 8열) */

import type { UjatRegionCapacitySemesterValues } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { UJAT_REGION_CAPACITY_SEMESTER_LABEL } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { formatUjatRegionCapacityClassView } from '@/features/program/ujat/lib/ujat-region-capacity-display'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './ujat-program-detail-common-info-view.css'

const REGIONS_PER_ROW = 4

function RegionCapacityGrid({
  regionLabels,
  values,
  ariaLabel,
}: {
  regionLabels: readonly string[]
  values: UjatRegionCapacitySemesterValues
  ariaLabel: string
}) {
  // 마지막 줄이 4지역보다 적으면 빈 칸으로 채워 표 테두리를 유지한다.
  const rowCount = Math.max(1, Math.ceil(regionLabels.length / REGIONS_PER_ROW))
  const slots = Array.from({ length: rowCount * REGIONS_PER_ROW }, (_, index) => regionLabels[index] ?? null)

  return (
    <div className="ujat-region-capacity-readonly__grid" role="table" aria-label={ariaLabel}>
      {slots.flatMap((region, index) => [
        <div
          key={`${index}-label`}
          role={region ? 'rowheader' : undefined}
          className="ujat-region-capacity-readonly__cell ujat-region-capacity-readonly__cell--label"
        >
          {region ?? ''}
        </div>,
        <div
          key={`${index}-value`}
          role={region ? 'cell' : undefined}
          className="ujat-region-capacity-readonly__cell ujat-region-capacity-readonly__cell--value"
        >
          {region ? formatUjatRegionCapacityClassView(values[region]?.classCount) : ''}
        </div>,
      ])}
    </div>
  )
}

/** 봉사자 수는 시안에 없어 조회에서 제외(값은 수정 모드·서버에 그대로 유지) */
export function UjatRegionCapacityReadonly({
  regionLabels,
  h1Values,
  h2Values,
}: {
  regionLabels: readonly string[]
  h1Values: UjatRegionCapacitySemesterValues
  h2Values: UjatRegionCapacitySemesterValues
}) {
  const semesters = [
    { key: 'h1', values: h1Values },
    { key: 'h2', values: h2Values },
  ] as const

  return (
    <div className="ujat-region-capacity-readonly">
      <h2 className="detail-info-form__title ujat-region-capacity-readonly__title">
        지역 별 교육 진행 가능 학급 수
      </h2>
      {semesters.map(semester => (
        <div key={semester.key} className="ujat-region-capacity-readonly__semester">
          <div className="ujat-region-capacity-readonly__subtitle">
            {UJAT_REGION_CAPACITY_SEMESTER_LABEL[semester.key]}
          </div>
          <RegionCapacityGrid
            regionLabels={regionLabels}
            values={semester.values}
            ariaLabel={`${UJAT_REGION_CAPACITY_SEMESTER_LABEL[semester.key]} 지역 별 교육 진행 가능 학급 수`}
          />
        </div>
      ))}
    </div>
  )
}
