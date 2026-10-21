import type { Program } from '@/types/domain'
import {
  resolveUjatEducationScheduleSettingsSemesterDisplay,
  type UjatEducationScheduleSettingsSemesterDisplay,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import {
  ujatEventRangeToScheduleLine,
  ujatScheduleLineToEventRange,
} from '@/features/program/ujat/lib/ujat-education-schedule-change-lines'
import {
  type UjatHalfEventRangeSeal,
  type UjatHalfSemesterKey,
  ujatHalfScheduleOverlayKeys,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { UjatEducationScheduleSettingsSection } from '@/features/program/ujat/ui/detail-modal/info/ujat-education-schedule-settings-section'
import { EducationScheduleChangeTitleAction } from '@/features/program/shared/ui/education-schedule-change-title-action'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import {
  getUjatProgramRegistrationOverlayRecord,
  useUjatProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { UJAT_REGISTRATION_SECTION_META } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-section-meta'

const UJAT_SCHEDULE_CHANGE_ROWS = [
  { half: 'h1', label: '상반기' },
  { half: 'h2', label: '하반기' },
] as const satisfies readonly { half: UjatHalfSemesterKey; label: string }[]

function readEventRangeSeal(
  half: UjatHalfSemesterKey,
  fallback: UjatHalfEventRangeSeal
): UjatHalfEventRangeSeal {
  const key = ujatHalfScheduleOverlayKeys(half).eventRange
  const stored = getUjatProgramRegistrationOverlayRecord()[key]
  if (!stored || typeof stored !== 'object') return fallback
  const seal = stored as UjatHalfEventRangeSeal
  return { start: seal.start ?? null, end: seal.end ?? null }
}

/** 상·하반기 행사 기간을 일정 변경 팝업의 두 줄로 읽고, 바꾼 줄만 overlay에 다시 쓴다. */
function UjatEducationScheduleChangeTitleAction({
  programId,
  operationStart,
  operationEnd,
  h1Default,
  h2Default,
}: {
  programId: string
  operationStart?: Program['startDate']
  operationEnd?: Program['endDate']
  h1Default: UjatHalfEventRangeSeal
  h2Default: UjatHalfEventRangeSeal
}) {
  const defaults = [h1Default, h2Default]
  const h1Key = ujatHalfScheduleOverlayKeys('h1').eventRange
  const h2Key = ujatHalfScheduleOverlayKeys('h2').eventRange
  const [, setH1Seal] = useUjatProgramRegistrationOverlayKv<UjatHalfEventRangeSeal>(h1Key, h1Default)
  const [, setH2Seal] = useUjatProgramRegistrationOverlayKv<UjatHalfEventRangeSeal>(h2Key, h2Default)
  const setters = [setH1Seal, setH2Seal]
  const seals = UJAT_SCHEDULE_CHANGE_ROWS.map((row, index) =>
    readEventRangeSeal(row.half, defaults[index] ?? h1Default)
  )
  const lines = seals.map(ujatEventRangeToScheduleLine)

  return (
    <EducationScheduleChangeTitleAction
      programId={programId}
      scheduleLines={lines}
      scheduleRowLabels={UJAT_SCHEDULE_CHANGE_ROWS.map(row => row.label)}
      educationScheduleMode="period"
      operationStart={operationStart}
      operationEnd={operationEnd}
      onApply={nextLines => {
        UJAT_SCHEDULE_CHANGE_ROWS.forEach((_, index) => {
          const next = nextLines[index] ?? ''
          if (next === lines[index]) return
          setters[index]?.(ujatScheduleLineToEventRange(next))
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
}: {
  program: Program
  isEdit?: boolean
  h1Display?: UjatEducationScheduleSettingsSemesterDisplay
  h2Display?: UjatEducationScheduleSettingsSemesterDisplay
}) {
  const overlay = program.ujatRegistrationOverlay ?? {}
  const h1Display =
    h1DisplayInput ?? resolveUjatEducationScheduleSettingsSemesterDisplay('h1', overlay)
  const h2Display =
    h2DisplayInput ?? resolveUjatEducationScheduleSettingsSemesterDisplay('h2', overlay)
  const mode = isEdit ? 'edit' : 'view'

  return (
    <section className="ujat-education-schedule-settings-program-view program-detail-fullpage-modal__info-tab-block">
      {isEdit ? (
        <FormParagraphSectionHeader
          title={UJAT_REGISTRATION_SECTION_META.educationScheduleSettings.title}
          description={UJAT_REGISTRATION_SECTION_META.educationScheduleSettings.description}
          titleTrailing={
            <UjatEducationScheduleChangeTitleAction
              programId={program.id}
              operationStart={program.startDate}
              operationEnd={program.endDate}
              h1Default={h1Display.eventRange}
              h2Default={h2Display.eventRange}
            />
          }
          surface="responseEntry"
          titleAligned
          required
          highlightParagraphId={UJAT_PROGRAM_REGISTRATION_IDS[5]}
        />
      ) : (
        <div className="ujat-education-schedule-settings-program-view__header">
          <h3 className="ujat-education-schedule-settings-program-view__title">교육 진행 일정 설정</h3>
        </div>
      )}
      <UjatEducationScheduleSettingsSection mode={mode} h1Display={h1Display} h2Display={h2Display} />
    </section>
  )
}
