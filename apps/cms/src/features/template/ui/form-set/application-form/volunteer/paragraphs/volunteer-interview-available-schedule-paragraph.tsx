import { useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/instructor/paragraphs/instructor-available-schedule-paragraph'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { UnavailableDatesBulkExclusionsRow } from '@/features/template/ui/form-set/shared/unavailable-dates-bulk-exclusions-row'
import './volunteer-interview-available-schedule-paragraph.css'

type InterviewTimeUnit = '15' | '30' | '60'

type InterviewTimeSlot = {
  key: string
  label: string
}

function buildInterviewTimeSlots(
  range: [Dayjs, Dayjs] | null,
  unit: InterviewTimeUnit
): InterviewTimeSlot[] {
  if (range == null) return []

  const [start, end] = range
  const minutes = Number(unit)
  const slots: InterviewTimeSlot[] = []
  let cursor = start

  while (slots.length < 96) {
    const next = cursor.add(minutes, 'minute')
    if (next.isAfter(end)) break

    slots.push({
      key: `${cursor.valueOf()}-${next.valueOf()}`,
      label: `${cursor.format('HH:mm')} ~ ${next.format('HH:mm')}`,
    })
    cursor = next
  }

  return slots
}

function VolunteerInterviewScheduleBlock({
  title,
  type,
}: {
  title: string
  type: 'common' | 'exception'
}) {
  const [exceptionDate, setExceptionDate] = useState<Dayjs | null>(null)
  const [interviewTime, setInterviewTime] = useState<Dayjs | null>(null)
  const [interviewTimeRange, setInterviewTimeRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [timeUnit, setTimeUnit] = useState<InterviewTimeUnit>('30')
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([])
  const interviewTimeSlots = useMemo(
    () => buildInterviewTimeSlots(interviewTimeRange, timeUnit),
    [interviewTimeRange, timeUnit]
  )

  useEffect(() => {
    setSelectedSlotKeys(prev => {
      const availableKeys = new Set(interviewTimeSlots.map(slot => slot.key))
      const next = prev.filter(key => availableKeys.has(key))
      if (next.length > 0 || interviewTimeSlots.length === 0) return next
      return [interviewTimeSlots[0].key]
    })
  }, [interviewTimeSlots])

  const toggleTimeSlot = (slotKey: string) => {
    setSelectedSlotKeys(prev =>
      prev.includes(slotKey) ? prev.filter(key => key !== slotKey) : [...prev, slotKey]
    )
  }

  return (
    <div className="volunteer-interview-available-schedule__schedule-block">
      <div className="detail-info-form--text-bold volunteer-interview-available-schedule__block-title">
        {title}
      </div>

      <DetailInfoForm title="면접 진행 가능 일정" hideHeader mode="edit">
        {type === 'common' ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="면접 진행 불가일"
              fullRow
              edit={
                <UnavailableDatesBulkExclusionsRow
                  modalUnavailableDescriptionLead="면접 진행 불가한 날짜를 모두 선택해 주세요."
                  modalUnavailableDescriptionSecond="선택된 날짜는 면접 일정으로 신청할 수 없습니다."
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        ) : (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="예외 진행 일정"
              fullRow
              edit={
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  value={exceptionDate}
                  onChange={setExceptionDate}
                  width={240}
                  placeholder="날짜를 선택하세요"
                  suppressAutoTodayWhenEmpty
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        )}

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="면접 진행 가능 시간"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <ParagraphTimePicker
                  value={interviewTime}
                  onChange={setInterviewTime}
                  onTimeRangeChange={setInterviewTimeRange}
                  width={240}
                  placeholder="시간을 선택해 주세요"
                  endTimeAlwaysOn
                />
                <DetailInfoForm.InputsSeparator />
                <CmsRadioGroup
                  value={timeUnit}
                  onChange={event => setTimeUnit(String(event.target.value) as InterviewTimeUnit)}
                >
                  <CmsRadio value="15">15분 단위</CmsRadio>
                  <CmsRadio value="30">30분 단위</CmsRadio>
                  <CmsRadio value="60">1시간 단위</CmsRadio>
                </CmsRadioGroup>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <div className="volunteer-interview-available-schedule__summary">
        <span className="volunteer-interview-available-schedule__summary-hint">
          진행 가능한 시간대를 선택해 주세요. 미선택 된 시간은 사용자가 신청 불가합니다.
        </span>
        {interviewTimeSlots.length > 0 ? (
          <div className="volunteer-interview-available-schedule__time-slots">
            {interviewTimeSlots.map(slot => (
              <ParagraphChip
                key={slot.key}
                className="volunteer-interview-available-schedule__time-slot"
                selected={selectedSlotKeys.includes(slot.key)}
                onClick={() => toggleTimeSlot(slot.key)}
              >
                {slot.label}
              </ParagraphChip>
            ))}
          </div>
        ) : (
          <div className="volunteer-interview-available-schedule__empty">
            설정된 면접 시간이 없습니다. 면접 시간을 설정해 주세요.
          </div>
        )}
      </div>
    </div>
  )
}

function VolunteerInterviewScheduleTemplateUi({
  exceptionScheduleCount = 0,
}: {
  exceptionScheduleCount?: number
}) {
  return (
    <div className="volunteer-interview-available-schedule">
      <VolunteerInterviewScheduleBlock title="■ 공통 진행 일정" type="common" />
      {Array.from({ length: exceptionScheduleCount }, (_, index) => (
        <VolunteerInterviewScheduleBlock
          key={index}
          title={`■ 예외 일정 ${String(index + 1).padStart(2, '0')}`}
          type="exception"
        />
      ))}
    </div>
  )
}

/** 봉사자 신청 폼 — 면접 진행 가능 일정 */
export function VolunteerInterviewAvailableScheduleParagraph({
  isTemplateAuthoringMode = false,
  exceptionScheduleCount = 0,
}: {
  isTemplateAuthoringMode?: boolean
  exceptionScheduleCount?: number
}) {
  if (isTemplateAuthoringMode) {
    return <VolunteerInterviewScheduleTemplateUi exceptionScheduleCount={exceptionScheduleCount} />
  }

  return <InstructorAvailableScheduleParagraph summaryFieldLabel="면접 진행 가능일" />
}
