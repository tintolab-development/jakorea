import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import { EMPTY_UJAT_TYPED_DETAIL, type UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import {
  resolveUjatHalfEducationScheduleDisplayFromTypedDetail,
  resolveUjatHalfScheduleGroupedTextFromTypedDetail,
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
import {
  buildUjatHalfEducationScheduleRows,
  UjatHalfEducationScheduleReadonly,
} from './ujat-half-education-schedule-readonly'
import './ujat-half-education-schedule.css'

/**
 * 프로그램 상세 — 수정: 등록 양식과 동일 블록 / 조회: 상세 시안(4082:89939) 4열 표.
 * 조회에서 사전교육·해단식 일정은 같은 날짜의 지역을 한 줄로 묶는다.
 */
export function UjatHalfEducationScheduleProgramView({
  program,
  half,
  isEdit = false,
  display: displayInput,
  scheduleForm,
}: {
  program: Program & { ujatTypedDetail?: UjatTypedDetail }
  half: UjatHalfSemesterKey
  isEdit?: boolean
  display?: UjatHalfEducationScheduleDisplay
  scheduleForm?: UseFormReturn<UjatTypedDetail>
}) {
  const display =
    displayInput ??
    resolveUjatHalfEducationScheduleDisplayFromTypedDetail(
      program.ujatTypedDetail ?? EMPTY_UJAT_TYPED_DETAIL,
      half
    )
  if (!isEdit) {
    const typedDetail = program.ujatTypedDetail ?? EMPTY_UJAT_TYPED_DETAIL
    const viewDisplay: UjatHalfEducationScheduleDisplay = displayInput
      ? display
      : {
          ...display,
          preEducation: {
            ...display.preEducation,
            scheduleText: resolveUjatHalfScheduleGroupedTextFromTypedDetail(typedDetail, half, 'pre'),
          },
          closingCeremony: {
            ...display.closingCeremony,
            scheduleText: resolveUjatHalfScheduleGroupedTextFromTypedDetail(typedDetail, half, 'closing'),
          },
        }
    return (
      <section className="program-detail-fullpage-modal__info-tab-block">
        <UjatHalfEducationScheduleReadonly
          title={UJAT_HALF_SEMESTER_TITLE[half]}
          rows={buildUjatHalfEducationScheduleRows(viewDisplay)}
        />
      </section>
    )
  }

  const sectionMeta =
    half === 'h1'
      ? UJAT_REGISTRATION_SECTION_META.firstHalfEducationSchedule
      : UJAT_REGISTRATION_SECTION_META.secondHalfEducationSchedule

  return (
    <section className="ujat-half-education-schedule-program-view program-detail-fullpage-modal__info-tab-block">
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
      <HalfEducationScheduleSection half={half} mode="edit" display={display} scheduleForm={scheduleForm} />
    </section>
  )
}
