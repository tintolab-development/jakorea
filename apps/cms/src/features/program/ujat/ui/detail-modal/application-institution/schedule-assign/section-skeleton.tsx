const DATE_BLOCK_COUNT = 3

function SkeletonBone({ className }: { className?: string }) {
  return (
    <span
      className={
        className
          ? `ujat-schedule-assign-skeleton__bone ${className}`
          : 'ujat-schedule-assign-skeleton__bone'
      }
      aria-hidden
    />
  )
}

/** 지역 탭 전환·hydrate 중 레이아웃 시프트 방지용 자리 표시 */
export function UjatInstitutionScheduleAssignSectionSkeleton() {
  return (
    <div
      className="ujat-schedule-assign-section ujat-schedule-assign-skeleton"
      role="status"
      aria-busy="true"
      aria-label="임시 배정 불러오는 중"
    >
      <div className="ujat-schedule-assign-section__dates">
        {Array.from({ length: DATE_BLOCK_COUNT }, (_, index) => (
          <div key={index} className="ujat-schedule-assign-skeleton__date-block">
            <div className="ujat-schedule-assign-skeleton__date-header">
              <SkeletonBone className="ujat-schedule-assign-skeleton__bone--title" />
              <SkeletonBone className="ujat-schedule-assign-skeleton__bone--button" />
            </div>
            <div className="ujat-schedule-assign-skeleton__row">
              <SkeletonBone className="ujat-schedule-assign-skeleton__bone--label" />
              <SkeletonBone className="ujat-schedule-assign-skeleton__bone--field" />
              <SkeletonBone className="ujat-schedule-assign-skeleton__bone--field" />
              <SkeletonBone className="ujat-schedule-assign-skeleton__bone--total" />
            </div>
          </div>
        ))}
      </div>

      <hr className="ujat-schedule-assign-section__divider" aria-hidden />

      <div className="ujat-schedule-assign-skeleton__estimation">
        <div className="ujat-schedule-assign-skeleton__estimation-header">
          <SkeletonBone className="ujat-schedule-assign-skeleton__bone--title" />
          <SkeletonBone className="ujat-schedule-assign-skeleton__bone--hint" />
        </div>
        <div className="ujat-schedule-assign-skeleton__table" aria-hidden>
          <div className="ujat-schedule-assign-skeleton__table-row ujat-schedule-assign-skeleton__table-row--head">
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
          </div>
          <div className="ujat-schedule-assign-skeleton__table-row">
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
          </div>
          <div className="ujat-schedule-assign-skeleton__table-row">
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
            <SkeletonBone className="ujat-schedule-assign-skeleton__bone--cell" />
          </div>
        </div>
      </div>
    </div>
  )
}
