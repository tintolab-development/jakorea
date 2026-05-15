import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { UnavailableDatesBulkExclusionsRow } from '@/features/template/ui/form-set/shared/unavailable-dates-bulk-exclusions-row'
import { useUjatProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './ujat-education-schedule-settings-paragraph.css'

const FRIDAY_DAY = 5
const disableNonFriday = (date: Dayjs) => date.day() !== FRIDAY_DAY

type SemesterRangeSeal = { start: string | null; end: string | null }
const EMPTY_SEMESTER_SEAL: SemesterRangeSeal = { start: null, end: null }

function SemesterScheduleBlock({ title, semesterKey }: { title: string; semesterKey: 'first' | 'second' }) {
  const storageKey = `ujat.eduScheduleSettings.${semesterKey}` as const
  const unavailableDatesKey = `ujat.eduScheduleSettings.unavailable.${semesterKey}` as const
  const [seal, setSeal] = useUjatProgramRegistrationOverlayKv<SemesterRangeSeal>(
    storageKey,
    EMPTY_SEMESTER_SEAL
  )
  const [unavailableDates, setUnavailableDates] = useUjatProgramRegistrationOverlayKv<string[]>(
    unavailableDatesKey,
    []
  )
  const range: [Dayjs | null, Dayjs | null] = useMemo(
    () => [seal.start ? dayjs(seal.start) : null, seal.end ? dayjs(seal.end) : null],
    [seal.end, seal.start]
  )
  const setRange = (next: [Dayjs | null, Dayjs | null]) => {
    setSeal({
      start: next[0]?.toISOString() ?? null,
      end: next[1]?.toISOString() ?? null,
    })
  }
  const [rangeStart, rangeEnd] = range
  const educationScheduleRangeComplete = rangeStart != null && rangeEnd != null

  const disableUnavailableDate = useCallback(
    (date: Dayjs) => {
      if (rangeStart == null || rangeEnd == null) return true

      const start = rangeStart.isBefore(rangeEnd, 'day') ? rangeStart : rangeEnd
      const end = rangeStart.isBefore(rangeEnd, 'day') ? rangeEnd : rangeStart

      return disableNonFriday(date) || date.isBefore(start, 'day') || date.isAfter(end, 'day')
    },
    [rangeStart, rangeEnd]
  )

  const handleDirectUnavailableModalBlocked = useCallback(() => {
    cmsAlertModal.show({
      title: '진행 불가일 추가 불가',
      content: '교육 진행 일정을 먼저 선택해주세요.',
    })
  }, [])

  return (
    <div className="ujat-education-schedule-settings__block">
      <div className="ujat-education-schedule-settings__subheading">{title}</div>
      <DetailInfoForm
        title={title}
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 일정"
            edit={
              <ParagraphDatePicker
                mode="range"
                value={range}
                onChange={setRange}
                placeholder={['시작일', '종료일']}
                disabledDate={disableNonFriday}
                className="ujat-education-schedule-settings__range-picker"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 불가일"
            fullRow
            edit={
              <UnavailableDatesBulkExclusionsRow
                disabledDate={disableUnavailableDate}
                initialCalendarDate={rangeStart ?? rangeEnd}
                appliedDates={unavailableDates}
                onApplyDatesChange={setUnavailableDates}
                modalUnavailableDescriptionLead="교육 진행 불가한 날짜를 모두 선택해 주세요."
                modalUnavailableDescriptionSecond="선택된 날짜는 교육 진행 일정으로 신청할 수 없습니다."
                canOpenDirectUnavailableModal={educationScheduleRangeComplete}
                onDirectUnavailableModalBlocked={handleDirectUnavailableModalBlocked}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

/** 교육 진행 일정 설정 — 상/하반기 공통 UI */
export function UjatEducationScheduleSettingsParagraph() {
  return (
    <div className="ujat-education-schedule-settings">
      <SemesterScheduleBlock title="■ 상반기 (1학기)" semesterKey="first" />
      <SemesterScheduleBlock title="■ 하반기 (2학기)" semesterKey="second" />
    </div>
  )
}
