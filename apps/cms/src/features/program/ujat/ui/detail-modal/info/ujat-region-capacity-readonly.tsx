/** UJAT 공통 정보 — 지역 별 교육 진행 가능 학급 및 봉사단 수 조회 (시안 4082:89939, 한 줄 4지역 · 라벨|값 8열) */

import type {
  UjatRegionCapacityRegionValues,
  UjatRegionCapacitySemesterValues,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { UJAT_REGION_CAPACITY_SEMESTER_LABEL } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import {
  formatUjatRegionCapacityClassView,
  formatUjatRegionCapacityVolunteerView,
} from '@/features/program/ujat/lib/ujat-region-capacity-display'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './ujat-program-detail-common-info-view.css'

const REGIONS_PER_ROW = 4

/** 값 칸이 좁아 한 줄로 두면 단위 중간에서 줄이 바뀌므로 학급 수와 봉사자 수를 두 줄로 고정한다. */
function RegionCapacityValue({ value }: { value: UjatRegionCapacityRegionValues | undefined }) {
  if (!value?.classCount?.trim() && !value?.volunteerCount?.trim()) return <>-</>
  return (
    <>
      <span className="ujat-region-capacity-readonly__value-line">
        {formatUjatRegionCapacityClassView(value?.classCount)}
      </span>
      <span className="ujat-region-capacity-readonly__value-line">
        {formatUjatRegionCapacityVolunteerView(value?.volunteerCount)}
      </span>
    </>
  )
}

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
          {region ? <RegionCapacityValue value={values[region]} /> : ''}
        </div>,
      ])}
    </div>
  )
}

/**
 * 봉사자 수는 배정 상한(409 UJAT_REGION_VOLUNTEER_CAPACITY_EXCEEDED)을 확인할 수 있는 유일한 화면이라
 * 기획에서 숨김을 확정하기 전까지 학급 수와 함께 표시한다.
 */
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
        지역 별 교육 진행 가능 학급 및 봉사단 수
      </h2>
      {semesters.map(semester => (
        <div key={semester.key} className="ujat-region-capacity-readonly__semester">
          <div className="ujat-region-capacity-readonly__subtitle">
            {UJAT_REGION_CAPACITY_SEMESTER_LABEL[semester.key]}
          </div>
          <RegionCapacityGrid
            regionLabels={regionLabels}
            values={semester.values}
            ariaLabel={`${UJAT_REGION_CAPACITY_SEMESTER_LABEL[semester.key]} 지역 별 교육 진행 가능 학급 및 봉사단 수`}
          />
        </div>
      ))}
    </div>
  )
}
