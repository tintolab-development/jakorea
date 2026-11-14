import { useWatch, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import { EMPTY_UJAT_TYPED_DETAIL, type UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import {
  resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail,
  type UjatEducationScheduleSettingsSemesterDisplay,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import {
  ujatEventRangeToScheduleLine,
  ujatScheduleLineToEventRange,
} from '@/features/program/ujat/lib/ujat-education-schedule-change-lines'
import type { UjatHalfSemesterKey } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { UjatEducationScheduleSettingsSection } from '@/features/program/ujat/ui/detail-modal/info/ujat-education-schedule-settings-section'
import { updateUjatTypedEventRow } from '@/features/program/ujat/ui/detail-modal/info/ujat-education-schedule-settings-section'
import { EducationScheduleChangeTitleAction } from '@/features/program/shared/ui/education-schedule-change-title-action'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { UJAT_REGISTRATION_SECTION_META } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-section-meta'
import {
  buildUjatEducationScheduleSettingsRows,
  UjatEducationScheduleSettingsReadonly,
} from './ujat-education-schedule-settings-readonly'

const UJAT_SCHEDULE_CHANGE_ROWS = [
  { half: 'h1', label: '상반기' },
  { half: 'h2', label: '하반기' },
] as const satisfies readonly { half: UjatHalfSemesterKey; label: string }[]

function TypedUjatEducationScheduleChangeTitleAction({
  programId,
  operationStart,
  operationEnd,
  scheduleForm,
}: {
  programId: string
  operationStart?: Program['startDate']
  operationEnd?: Program['endDate']
  scheduleForm: UseFormReturn<UjatTypedDetail>
}) {
  const detail = useWatch({ control: scheduleForm.control }) as UjatTypedDetail | undefined
  const displays = UJAT_SCHEDULE_CHANGE_ROWS.map(row =>
    resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail(
      row.half,
      detail ?? { schemaVersion: 1, halfPlans: [], common: null }
    )
  )
  const lines = displays.map(display => ujatEventRangeToScheduleLine(display.eventRange))
  return (
    <EducationScheduleChangeTitleAction
      programId={programId}
      scheduleLines={lines}
      scheduleRowLabels={UJAT_SCHEDULE_CHANGE_ROWS.map(row => row.label)}
      educationScheduleMode="period"
      operationStart={operationStart}
      operationEnd={operationEnd}
      onApply={nextLines => {
        UJAT_SCHEDULE_CHANGE_ROWS.forEach((row, index) => {
          const next = nextLines[index] ?? ''
          if (next === lines[index]) return
          const range = ujatScheduleLineToEventRange(next)
          updateUjatTypedEventRow(scheduleForm, row.half, current => ({
            ...current,
            startDate: range.start || null,
            endDate: range.end || null,
            dates: range.start ? [range.start] : [],
          }))
        })
      }}
    />
  )
}

export function UjatEducationScheduleSettingsProgramView({
  program,
  isEdit = false,
  h1Display: h1DisplayInput,
  h2Display: h2DisplayInput,
  scheduleForm,
}: {
  program: Program & { ujatTypedDetail?: UjatTypedDetail }
  isEdit?: boolean
  h1Display?: UjatEducationScheduleSettingsSemesterDisplay
  h2Display?: UjatEducationScheduleSettingsSemesterDisplay
  scheduleForm?: UseFormReturn<UjatTypedDetail>
}) {
  const typedDetail = program.ujatTypedDetail ?? EMPTY_UJAT_TYPED_DETAIL
  const h1Display =
    h1DisplayInput ?? resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail('h1', typedDetail)
  const h2Display =
    h2DisplayInput ?? resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail('h2', typedDetail)
  // 조회: 상세 시안(4082:89939) 4열 표 / 수정: 등록 양식과 동일 블록
  if (!isEdit) {
    return (
      <section className="program-detail-fullpage-modal__info-tab-block">
        <UjatEducationScheduleSettingsReadonly
          rows={buildUjatEducationScheduleSettingsRows(h1Display, h2Display)}
        />
      </section>
    )
  }

  return (
    <section className="ujat-education-schedule-settings-program-view program-detail-fullpage-modal__info-tab-block">
      <FormParagraphSectionHeader
        title={UJAT_REGISTRATION_SECTION_META.educationScheduleSettings.title}
        description={UJAT_REGISTRATION_SECTION_META.educationScheduleSettings.description}
        titleTrailing={
          scheduleForm ? (
            <TypedUjatEducationScheduleChangeTitleAction
              programId={program.id}
              operationStart={program.startDate}
              operationEnd={program.endDate}
              scheduleForm={scheduleForm}
            />
          ) : null}
        surface="responseEntry"
        titleAligned
        required
        highlightParagraphId={UJAT_PROGRAM_REGISTRATION_IDS[5]}
      />
      <UjatEducationScheduleSettingsSection
        mode="edit"
        h1Display={h1Display}
        h2Display={h2Display}
        scheduleForm={scheduleForm}
      />
    </section>
  )
}
