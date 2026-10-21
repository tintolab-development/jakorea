import type { Program } from '@/types/domain'
import {
  resolveUjatHalfEducationScheduleDisplay,
  type UjatHalfEducationScheduleDisplay,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import {
  UJAT_HALF_SEMESTER_TITLE,
  type UjatHalfSemesterKey,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { HalfEducationScheduleSection } from '@/features/program/shared/ui/half-education-schedule-section'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { UJAT_REGISTRATION_SECTION_META } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-section-meta'
import './ujat-half-education-schedule.css'

/** 프로그램 상세 — 등록 양식과 동일 블록(외곽 테두리 없음) */
export function UjatHalfEducationScheduleProgramView({
  program,
  half,
  isEdit = false,
  display: displayInput,
}: {
  program: Program
  half: UjatHalfSemesterKey
  isEdit?: boolean
  display?: UjatHalfEducationScheduleDisplay
}) {
  const display =
    displayInput ??
    resolveUjatHalfEducationScheduleDisplay(half, program.ujatRegistrationOverlay ?? {})
  const mode = isEdit ? 'edit' : 'view'
  const sectionMeta =
    half === 'h1'
      ? UJAT_REGISTRATION_SECTION_META.firstHalfEducationSchedule
      : UJAT_REGISTRATION_SECTION_META.secondHalfEducationSchedule

  return (
    <section className="ujat-half-education-schedule-program-view program-detail-fullpage-modal__info-tab-block">
      {isEdit ? (
        <FormParagraphSectionHeader
          title={sectionMeta.title}
          description={sectionMeta.description}
          surface="responseEntry"
          titleAligned
          required
          highlightParagraphId={
            half === 'h1' ? UJAT_PROGRAM_REGISTRATION_IDS[3] : UJAT_PROGRAM_REGISTRATION_IDS[4]
          }
        />
      ) : (
        <div className="ujat-half-education-schedule-program-view__header">
          <h3 className="ujat-half-education-schedule-program-view__title">
            {UJAT_HALF_SEMESTER_TITLE[half]}
          </h3>
        </div>
      )}
      <HalfEducationScheduleSection half={half} mode={mode} display={display} />
    </section>
  )
}
