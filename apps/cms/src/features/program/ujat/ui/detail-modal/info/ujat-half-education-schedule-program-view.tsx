import type { Program } from '@/types/domain'
import {
  resolveUjatHalfEducationScheduleDisplay,
  type UjatHalfEducationScheduleDisplay,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import {
  UJAT_HALF_SEMESTER_TITLE,
  type UjatHalfSemesterKey,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { UjatHalfEducationScheduleSection } from '@/features/program/ujat/ui/detail-modal/info/ujat-half-education-schedule-section'
import './ujat-half-education-schedule.css'

/** 프로그램 상세 — 등록 양식과 동일 블록(외곽 테두리 없음) */
export function UjatHalfEducationScheduleProgramView({
  half,
  isEdit = false,
  display: displayInput,
}: {
  program: Program
  half: UjatHalfSemesterKey
  isEdit?: boolean
  display?: UjatHalfEducationScheduleDisplay
}) {
  const display = displayInput ?? resolveUjatHalfEducationScheduleDisplay(half)
  const mode = isEdit ? 'edit' : 'view'

  return (
    <section className="ujat-half-education-schedule-program-view program-detail-fullpage-modal__info-tab-block">
      <div className="ujat-half-education-schedule-program-view__header">
        <h3 className="ujat-half-education-schedule-program-view__title">
          {UJAT_HALF_SEMESTER_TITLE[half]}
        </h3>
      </div>
      <UjatHalfEducationScheduleSection half={half} mode={mode} display={display} />
    </section>
  )
}
