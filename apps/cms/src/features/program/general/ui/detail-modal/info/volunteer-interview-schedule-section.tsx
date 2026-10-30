import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { DateValue } from '@/types'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { GeneralProgramVolunteerInterviewScheduleDisplay } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import {
  isGeneralProgramVolunteerInterviewScheduleVisible,
  resolveGeneralProgramVolunteerInterviewScheduleDisplay,
  resolveGeneralProgramVolunteerInterviewScheduleEditSeed,
} from '@/features/program/general/lib/volunteer-interview-schedule-display'
import {
  resolveGeneralProgramVolunteerRecruitmentDisplay,
  resolveVolunteerRecruitmentInterviewEnabled,
} from '@/features/program/general/lib/volunteer-recruitment-display'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  hydrateMissingVolunteerInterviewOverlay,
  listFilledVolunteerInterviewExceptionBlockIds,
  syncVolunteerInterviewRangeSealOverlay,
  VOLUNTEER_INTERVIEW_RANGE_SEAL_KEY,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { ensureRecruitOperationalEditScope } from '@/features/program/general/lib/detail-operational-save-merge'
import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'
import { RECRUIT_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/recruit-form-volunteer-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import { ButtonAddIcon } from '@/shared/ui/icons/ButtonIcons'
import '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph.css'

const FORM_CLASS = 'program-registration-paragraph'

const INTERVIEW_SCHEDULE_EDIT_DESCRIPTION =
  '서류 합격 시 면접이 진행됩니다. 면접이 진행 가능한 일정 모두 선택해 주세요. 신청자 면접 선택지는 2차 면접 심사 기간 안에서 열리며, 기간을 비우면 봉사자 모집 기간이 쓰입니다.'

function UnavailableDatesReadRow({
  recurring,
  specific,
}: {
  recurring: string
  specific: string
}) {
  const recurringTrim = recurring.trim()
  const specificTrim = specific.trim()

  if (!recurringTrim && !specificTrim) return <>진행 불가일 없음</>
  if (!specificTrim) return <>{recurringTrim || '진행 불가일 없음'}</>
  if (!recurringTrim) return <>{specificTrim}</>
  return (
    <div className="program-detail-info-tab__contact-inline">
      <span>{recurringTrim}</span>
      <DetailInfoForm.InputsSeparator />
      <span>{specificTrim}</span>
    </div>
  )
}

function GeneralProgramVolunteerInterviewScheduleBody({
  display,
  isEdit,
  exceptionBlockKeys,
  onRemoveExceptionBlock,
  commonScheduleSeed,
  onCommonExclusionChange,
  interviewPeriodRange,
}: {
  display: GeneralProgramVolunteerInterviewScheduleDisplay
  isEdit: boolean
  exceptionBlockKeys: number[]
  onRemoveExceptionBlock: (key: number) => void
  commonScheduleSeed?: ReturnType<typeof resolveGeneralProgramVolunteerInterviewScheduleEditSeed>
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  interviewPeriodRange?: [Dayjs, Dayjs] | null
}) {
  if (isEdit) {
    return (
      <RecruitFormVolunteerInterviewScheduleParagraph
        exceptionBlockKeys={exceptionBlockKeys}
        onRemoveExceptionBlock={onRemoveExceptionBlock}
        commonScheduleSeed={commonScheduleSeed}
        onCommonExclusionChange={onCommonExclusionChange}
        freezeUnavailableCalendar={false}
        interviewPeriodRange={interviewPeriodRange}
      />
    )
  }

  return (
    <div className="volunteer-interview-available-schedule volunteer-interview-available-schedule--readonly">
      <div className="volunteer-interview-available-schedule__schedule-block">
        <DetailInfoForm title="면접 진행 가능 일정" hideHeader mode="view" className={FORM_CLASS}>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="면접 진행 불가일"
              fullRow
              view={
                <UnavailableDatesReadRow
                  recurring={display.recurringUnavailable}
                  specific={display.specificUnavailableDates}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="면접 진행 가능 시간"
              fullRow
              view={display.availableTimeSlots}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
      {display.exceptions.map((exception, index) => (
        <div
          key={exception.blockId}
          className="volunteer-interview-available-schedule__schedule-block"
        >
          <div className="detail-info-form--text-bold volunteer-interview-available-schedule__block-title">
            {`■ 예외 일정 ${String(index + 1).padStart(2, '0')}`}
          </div>
          <DetailInfoForm title="예외 일정" hideHeader mode="view" className={FORM_CLASS}>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="예외 진행 일정"
                fullRow
                view={exception.exceptionDate?.trim() || '-'}
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="면접 진행 가능 시간"
                fullRow
                view={
                  <span className="volunteer-interview-available-schedule__readonly-slots">
                    {exception.availableTimeSlots?.trim() || '-'}
                  </span>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      ))}
    </div>
  )
}

function coerceInterviewBoundary(value: DateValue | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  return undefined
}

function useVolunteerInterviewOverlayHydration(
  program: Program,
  interviewStart: DateValue | undefined,
  interviewEnd: DateValue | undefined
) {
  const interviewStartIso = coerceInterviewBoundary(interviewStart)
  const interviewEndIso = coerceInterviewBoundary(interviewEnd)
  const [exceptionBlockKeys, setExceptionBlockKeys] = useState<number[]>([])
  const programIdRef = useRef(program.id)

  useLayoutEffect(() => {
    const source =
      program.registrationOverlay != null &&
      typeof program.registrationOverlay === 'object' &&
      !Array.isArray(program.registrationOverlay)
        ? program.registrationOverlay
        : undefined
    hydrateMissingVolunteerInterviewOverlay({
      source,
      store: 'recruit',
      additionalKeys: [VOLUNTEER_INTERVIEW_RANGE_SEAL_KEY],
    })
    syncVolunteerInterviewRangeSealOverlay(interviewStartIso, interviewEndIso)
    const filled = listFilledVolunteerInterviewExceptionBlockIds(
      { ...(source ?? {}), ...getGeneralRecruitOverlayRecord() },
      'recruit'
    )
    setExceptionBlockKeys(prev => {
      if (programIdRef.current !== program.id) {
        programIdRef.current = program.id
        return filled
      }
      if (prev.length === 0) return filled
      return [...filled, ...prev.filter(id => !filled.includes(id))]
    })
  }, [interviewEndIso, interviewStartIso, program.id, program.registrationOverlay])

  return { exceptionBlockKeys, setExceptionBlockKeys }
}

function GeneralProgramVolunteerInterviewScheduleReadSection({ program }: { program: Program }) {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const interviewStart = program.interviewStartDate
  const interviewEnd = program.interviewEndDate
  const { exceptionBlockKeys, setExceptionBlockKeys } = useVolunteerInterviewOverlayHydration(
    program,
    interviewStart,
    interviewEnd
  )

  return (
    <section aria-label="면접 진행 가능 일정">
      <FormParagraphSectionHeader
        title="면접 진행 가능 일정"
        surface="responseEntry"
        titleAligned
        highlightParagraphId={RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule}
      />
      <GeneralProgramVolunteerInterviewScheduleBody
        display={display}
        isEdit={false}
        exceptionBlockKeys={exceptionBlockKeys}
        onRemoveExceptionBlock={key =>
          setExceptionBlockKeys(prev => prev.filter(blockKey => blockKey !== key))
        }
      />
    </section>
  )
}

function GeneralProgramVolunteerInterviewScheduleEditSection({
  program,
  form,
}: {
  program: Program
  form: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const editSeed = resolveGeneralProgramVolunteerInterviewScheduleEditSeed(program)
  const interviewEnabledField = useWatch({
    control: form.control,
    name: 'volunteerRecruitmentInterviewEnabled',
  }) as ProgramDetailEditFormValues['volunteerRecruitmentInterviewEnabled'] | undefined
  const watchedInterviewStart = useWatch({
    control: form.control,
    name: 'interviewStartDate',
  }) as string | undefined
  const watchedInterviewEnd = useWatch({
    control: form.control,
    name: 'interviewEndDate',
  }) as string | undefined
  const interviewStart = watchedInterviewStart ?? program.interviewStartDate
  const interviewEnd = watchedInterviewEnd ?? program.interviewEndDate
  const [exceptionScheduleAddDisabled, setExceptionScheduleAddDisabled] = useState(
    () => editSeed?.excludeNone ?? false
  )

  useLayoutEffect(() => {
    ensureRecruitOperationalEditScope(program, 'volunteer')
  }, [program])

  const { exceptionBlockKeys, setExceptionBlockKeys } = useVolunteerInterviewOverlayHydration(
    program,
    interviewStart,
    interviewEnd
  )

  const interviewPeriodRange = useMemo((): [Dayjs, Dayjs] | null => {
    if (interviewStart == null || interviewEnd == null) return null
    const start = dayjs(interviewStart)
    const end = dayjs(interviewEnd)
    if (!start.isValid() || !end.isValid()) return null
    return start.isBefore(end, 'day') ? [start, end] : [end, start]
  }, [interviewEnd, interviewStart])

  if (!resolveVolunteerRecruitmentInterviewEnabled(program, interviewEnabledField)) return null

  return (
    <section aria-label="면접 진행 가능 일정">
      <FormParagraphSectionHeader
        title="면접 진행 가능 일정"
        surface="responseEntry"
        titleAligned
        required
        highlightParagraphId={RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule}
        description={INTERVIEW_SCHEDULE_EDIT_DESCRIPTION}
        titleTrailing={
          <div className="volunteer-interview-available-schedule__card-title-actions">
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={160}
              disabled={exceptionScheduleAddDisabled}
              icon={<ButtonAddIcon aria-hidden />}
              onClick={() => setExceptionBlockKeys(prev => [...prev, Date.now()])}
            >
              예외 일정 추가
            </CmsButton>
          </div>
        }
      />
      <GeneralProgramVolunteerInterviewScheduleBody
        display={display}
        isEdit
        exceptionBlockKeys={exceptionBlockKeys}
        onRemoveExceptionBlock={key =>
          setExceptionBlockKeys(prev => prev.filter(blockKey => blockKey !== key))
        }
        commonScheduleSeed={editSeed}
        onCommonExclusionChange={state => setExceptionScheduleAddDisabled(state.excludeNone)}
        interviewPeriodRange={interviewPeriodRange}
      />
    </section>
  )
}

export function GeneralProgramVolunteerInterviewScheduleSection({
  program,
  form,
  isEdit,
}: {
  program: Program
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
}) {
  if (isEdit && form) {
    return <GeneralProgramVolunteerInterviewScheduleEditSection program={program} form={form} />
  }

  const recruitmentDisplay = resolveGeneralProgramVolunteerRecruitmentDisplay(program)
  const showInterviewSchedule =
    isGeneralProgramVolunteerInterviewScheduleVisible(program) &&
    recruitmentDisplay.interviewEnabledLabel === '면접 있음'

  if (!showInterviewSchedule) return null

  return <GeneralProgramVolunteerInterviewScheduleReadSection program={program} />
}
