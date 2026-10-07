import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { GeneralProgramVolunteerInterviewScheduleDisplay } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import {
  isGeneralProgramVolunteerInterviewScheduleVisible,
  resolveGeneralProgramVolunteerInterviewScheduleDisplay,
  resolveGeneralProgramVolunteerInterviewScheduleEditSeed,
} from '@/features/program/general/lib/volunteer-interview-schedule-display'
import { resolveGeneralProgramVolunteerRecruitmentDisplay } from '@/features/program/general/lib/volunteer-recruitment-display'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  hydrateMissingVolunteerInterviewOverlay,
  listFilledVolunteerInterviewExceptionBlockIds,
  syncVolunteerInterviewRangeSealOverlay,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'
import { RECRUIT_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/recruit-form-volunteer-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph.css'

const FORM_CLASS = 'program-registration-paragraph'

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

function GeneralProgramVolunteerInterviewScheduleView({
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

const INTERVIEW_SCHEDULE_EDIT_DESCRIPTION =
  '서류 합격 시 면접이 진행됩니다. 면접이 진행 가능한 일정 모두 선택해 주세요. 신청자 면접 선택지는 2차 면접 심사 기간 안에서 열리며, 기간을 비우면 봉사자 모집 기간이 쓰입니다.'

export function GeneralProgramVolunteerInterviewScheduleSection({
  program,
  form,
  isEdit,
}: {
  program: Program
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
}) {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const editSeed = resolveGeneralProgramVolunteerInterviewScheduleEditSeed(program)
  const recruitmentDisplay = resolveGeneralProgramVolunteerRecruitmentDisplay(program)
  const interviewEnabledField = form?.watch('volunteerRecruitmentInterviewEnabled')
  const interviewStart = form?.watch('interviewStartDate') ?? program.interviewStartDate
  const interviewEnd = form?.watch('interviewEndDate') ?? program.interviewEndDate
  const [exceptionBlockKeys, setExceptionBlockKeys] = useState<number[]>([])
  const [exceptionScheduleAddDisabled, setExceptionScheduleAddDisabled] = useState(
    () => editSeed?.excludeNone ?? false
  )
  const programIdRef = useRef(program.id)
  useLayoutEffect(() => {
    const source =
      program.registrationOverlay != null &&
      typeof program.registrationOverlay === 'object' &&
      !Array.isArray(program.registrationOverlay)
        ? program.registrationOverlay
        : undefined
    hydrateMissingVolunteerInterviewOverlay({ source, store: 'recruit' })
    syncVolunteerInterviewRangeSealOverlay(interviewStart, interviewEnd)
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
  }, [interviewEnd, interviewStart, program.id, program.registrationOverlay])
  const showInterviewSchedule =
    isEdit && form
      ? interviewEnabledField === 'yes'
      : isGeneralProgramVolunteerInterviewScheduleVisible(program) &&
        recruitmentDisplay.interviewEnabledLabel === '면접 있음'

  if (!showInterviewSchedule) return null

  const isFormEdit = Boolean(isEdit && form)
  const interviewPeriodRange = useMemo((): [Dayjs, Dayjs] | null => {
    if (interviewStart == null || interviewEnd == null) return null
    const start = dayjs(interviewStart)
    const end = dayjs(interviewEnd)
    if (!start.isValid() || !end.isValid()) return null
    return start.isBefore(end, 'day') ? [start, end] : [end, start]
  }, [interviewEnd, interviewStart])

  return (
    <section aria-label="면접 진행 가능 일정">
      <FormParagraphSectionHeader
        title="면접 진행 가능 일정"
        surface="responseEntry"
        titleAligned
        required={isFormEdit}
        highlightParagraphId={RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule}
        description={isFormEdit ? INTERVIEW_SCHEDULE_EDIT_DESCRIPTION : undefined}
        titleTrailing={
          isFormEdit ? (
            <div className="volunteer-interview-available-schedule__card-title-actions">
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={160}
                disabled={exceptionScheduleAddDisabled}
                icon={<PlusOutlined aria-hidden />}
                onClick={() => setExceptionBlockKeys(prev => [...prev, Date.now()])}
              >
                예외 일정 추가
              </CmsButton>
            </div>
          ) : undefined
        }
      />
      <GeneralProgramVolunteerInterviewScheduleView
        display={display}
        isEdit={isFormEdit}
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
