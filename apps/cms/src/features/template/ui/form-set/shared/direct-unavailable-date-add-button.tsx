import { ButtonCalendarIcon } from '@/shared/ui/icons'
import fieldDeleteUrl from '@/shared/assets/icons/inputs/delete-20-default.svg'
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { ParagraphCalendarMini } from '@/features/template/ui/shared/paragraph-calendar-mini'
import { getPublicHolidayDateKeysForSchedule } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { useIsGeneralRegistrationWizard } from '@/features/template/context/general-registration-wizard-context'
import './direct-unavailable-date-add-button.css'

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** 강사 배정 안내 캘린더와 동일 — 공휴일 숫자 색(빨강)용 (모듈 top-level 호출 금지 — schedule-utils 순환 import) */
function unavailableModalHolidayDateKeys(): Set<string> {
  return getPublicHolidayDateKeysForSchedule()
}

/** 모달 칩 토큰 — 폼 체크박스(토·일·공휴일 제외)와 양방향 연동 */
const RECURRING_SATURDAY = '토요일'
const RECURRING_SUNDAY = '일요일'
const RECURRING_HOLIDAY = '모든 공휴일'

const RECURRING_TOKEN_SET = new Set([RECURRING_SATURDAY, RECURRING_SUNDAY, RECURRING_HOLIDAY])

function buildModalSelectedDates(
  appliedDates: string[],
  exclusionState?: UnavailableDatesExclusionState
): string[] {
  const recurring: string[] = []
  if (exclusionState && !exclusionState.excludeNone) {
    if (exclusionState.excludeSaturday) recurring.push(RECURRING_SATURDAY)
    if (exclusionState.excludeSunday) recurring.push(RECURRING_SUNDAY)
    if (exclusionState.excludeHoliday) recurring.push(RECURRING_HOLIDAY)
  }

  return [...recurring, ...appliedDates]
}

function exclusionStateFromModalSelectedDates(
  selected: string[]
): UnavailableDatesExclusionState {
  const excludeSaturday = selected.includes(RECURRING_SATURDAY)
  const excludeSunday = selected.includes(RECURRING_SUNDAY)
  const excludeHoliday = selected.includes(RECURRING_HOLIDAY)
  const hasSpecificDates = selected.some(value => ISO_DATE_PATTERN.test(value))
  const hasRecurring = excludeSaturday || excludeSunday || excludeHoliday

  return {
    excludeNone: !hasRecurring && !hasSpecificDates,
    excludeSaturday,
    excludeSunday,
    excludeHoliday,
  }
}

/**
 * 날짜 라벨 형식 — `korean`: 「26년 3월 26일」(기존), `dotted`: 「2026.03.26(목)」(일반 프로그램 등록 시안)
 */
type UnavailableDateLabelFormat = 'korean' | 'dotted'

function formatDottedDateWithWeekday(date: Dayjs): string {
  return `${date.format('YYYY.MM.DD')}(${WEEKDAYS_KO[date.day()]})`
}

function formatModalSelectedLabel(
  value: string,
  labelFormat: UnavailableDateLabelFormat = 'korean'
): string {
  if (value === RECURRING_SATURDAY) return '토요일 제외'
  if (value === RECURRING_SUNDAY) return '일요일 제외'
  if (value === RECURRING_HOLIDAY) return RECURRING_HOLIDAY
  if (ISO_DATE_PATTERN.test(value)) {
    return labelFormat === 'dotted'
      ? formatDottedDateWithWeekday(dayjs(value))
      : dayjs(value).format('YY년 M월 D일')
  }
  return value
}

/** 모달 칩(토·일·공휴일)에 따라 해당 요일·공휴일을 캘린더에서 비활성 */
function isDateBlockedByRecurringTokens(date: Dayjs, selected: string[]): boolean {
  if (selected.includes(RECURRING_SATURDAY) && date.day() === 6) return true
  if (selected.includes(RECURRING_SUNDAY) && date.day() === 0) return true
  if (
    selected.includes(RECURRING_HOLIDAY) &&
    unavailableModalHolidayDateKeys().has(date.format('YYYY-MM-DD'))
  ) {
    return true
  }
  return false
}

function buildCalendarDisabledDate(
  selected: string[],
  baseDisabledDate?: (date: Dayjs) => boolean
): (date: Dayjs) => boolean {
  return (date: Dayjs) => {
    if (baseDisabledDate?.(date)) return true
    return isDateBlockedByRecurringTokens(date, selected)
  }
}

function findNextEnabledDate(date: Dayjs, disabledDate?: (date: Dayjs) => boolean): Dayjs {
  if (!disabledDate || !disabledDate(date)) return date

  for (let offset = 1; offset <= 366; offset += 1) {
    const next = date.add(offset, 'day')
    if (!disabledDate(next)) return next
  }

  return date
}

function filterEnabledDateValues(
  values: string[],
  disabledDate?: (date: Dayjs) => boolean
): string[] {
  if (!disabledDate) return values

  return values.filter(value => {
    if (!ISO_DATE_PATTERN.test(value)) return true
    return !disabledDate(dayjs(value))
  })
}

function formatUnavailableDateLabel(
  value: string,
  labelFormat: UnavailableDateLabelFormat = 'korean'
): string {
  if (!ISO_DATE_PATTERN.test(value)) return value

  const date = dayjs(value)
  if (!date.isValid()) return value

  if (labelFormat === 'dotted') return formatDottedDateWithWeekday(date)
  return `${date.format('YY년 M월 D일')}(${WEEKDAYS_KO[date.day()]})`
}

/** 불가 날짜 추가 — 시안 버튼 달력 원본(색은 버튼 글자색) */
function DirectUnavailableDateAddIcon() {
  return <ButtonCalendarIcon />
}

const DEFAULT_MODAL_UNAVAILABLE_LEAD = '진행 불가한 날짜를 모두 선택해 주세요.'
const DEFAULT_MODAL_UNAVAILABLE_SECOND = '선택된 날짜는 사용자가 신청 불가합니다.'

export function DirectUnavailableDateAddButton({
  onClick,
  disabled,
  disabledDate,
  initialCalendarDate,
  /** 정의되면 제어 컴포넌트 — 풀페이지·미리보기 등 동일 값 공유용 */
  appliedDates: appliedDatesProp,
  onApplyDatesChange,
  appliedDatesDisplay = 'badge',
  modalUnavailableDescriptionLead = DEFAULT_MODAL_UNAVAILABLE_LEAD,
  modalUnavailableDescriptionSecond = DEFAULT_MODAL_UNAVAILABLE_SECOND,
  canOpenDirectUnavailableModal,
  onDirectUnavailableModalBlocked,
  exclusionState,
  onExclusionChange,
  /**
   * 템플릿 편집 등 — 진입 월만 샘플 노출, 월 이동·날짜 선택 불가
   * (`disabled` 스타일 없이 pointer-events로 차단 — 미리보기와 동일)
   */
  freezeCalendarInteraction = false,
}: {
  onClick?: () => void
  disabled?: boolean
  disabledDate?: (date: Dayjs) => boolean
  initialCalendarDate?: Dayjs | null
  /** `YYYY-MM-DD` 문자열 목록. 넘기면 내부 state 대신 이 값이 표시·저장 소스가 됨 */
  appliedDates?: string[]
  onApplyDatesChange?: (dates: string[]) => void
  appliedDatesDisplay?: 'badge' | 'chips'
  /** 모달 본문 첫 줄 (면접·교육 등 맥락별 문구) */
  modalUnavailableDescriptionLead?: string
  /** 모달 본문 둘째 줄 */
  modalUnavailableDescriptionSecond?: string
  /**
   * `false`이면 직접 추가 모달을 열지 않고 `onDirectUnavailableModalBlocked` 호출
   */
  canOpenDirectUnavailableModal?: boolean
  onDirectUnavailableModalBlocked?: () => void
  /** 토·일·공휴일 제외 — 모달 칩과 양방향 연동 */
  exclusionState?: UnavailableDatesExclusionState
  onExclusionChange?: (state: UnavailableDatesExclusionState) => void
  freezeCalendarInteraction?: boolean
}) {
  // 일반 프로그램 등록 위저드만 시안 날짜 형식·팝업 제목 — 그 외(UJAT·템플릿 관리·상세)는 기존 유지
  const isGeneralWizard = useIsGeneralRegistrationWizard()
  const dateLabelFormat: UnavailableDateLabelFormat = isGeneralWizard ? 'dotted' : 'korean'
  const modalTitle = isGeneralWizard ? '진행 불가일 선택' : '진행 불가일 직접 선택'
  const isControlled = appliedDatesProp !== undefined
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'))
  const [selectedDate, setSelectedDate] = useState(() => dayjs())
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [uncontrolledAppliedDates, setUncontrolledAppliedDates] = useState<string[]>([])

  const appliedDates = isControlled ? appliedDatesProp! : uncontrolledAppliedDates

  const selectedDateSet = useMemo(
    () =>
      new Set(
        selectedDates.filter(v => ISO_DATE_PATTERN.test(v)).map(v => dayjs(v).format('YYYY-MM-DD'))
      ),
    [selectedDates]
  )

  // 모달 칩(토·일·공휴일 제외) + 외부 disabledDate → 캘린더 비활성
  const calendarDisabledDate = useMemo(
    () => buildCalendarDisabledDate(selectedDates, disabledDate),
    [disabledDate, selectedDates]
  )

  const appliedDateText = useMemo(
    () => appliedDates.map(value => formatUnavailableDateLabel(value, dateLabelFormat)).join(', '),
    [appliedDates, dateLabelFormat]
  )

  const appliedDateItems = useMemo(
    () =>
      appliedDates.map(value => ({
        value,
        label: formatUnavailableDateLabel(value, dateLabelFormat),
      })),
    [appliedDates, dateLabelFormat]
  )

  const closeModal = () => setOpen(false)

  const removeDate = (date: string) => {
    setSelectedDates(prev => prev.filter(v => v !== date))
  }

  const removeAppliedDate = (date: string) => {
    setSelectedDates(prev => prev.filter(v => v !== date))
    const next = appliedDates.filter(v => v !== date)
    if (isControlled) {
      onApplyDatesChange?.(next)
    } else {
      setUncontrolledAppliedDates(next)
      onApplyDatesChange?.(next)
    }
  }

  const handleCalendarSelect = (d: Dayjs) => {
    if (freezeCalendarInteraction) return
    if (calendarDisabledDate(d)) return

    setSelectedDate(d)
    const key = d.format('YYYY-MM-DD')
    setSelectedDates(prev => (prev.includes(key) ? prev.filter(v => v !== key) : [...prev, key]))
  }

  const handleMonthChange = (month: Dayjs) => {
    if (freezeCalendarInteraction) return
    setCurrentMonth(month)
  }

  const displayTags = selectedDates.map(value => formatModalSelectedLabel(value, dateLabelFormat))

  return (
    <>
      <div
        className={[
          'direct-unavailable-date-add-button',
          appliedDatesDisplay === 'chips' && 'direct-unavailable-date-add-button--chips',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <CmsButton
          type="button"
          size="medium"
          disabled={disabled}
          icon={<DirectUnavailableDateAddIcon />}
          onClick={() => {
            onClick?.()
            if (canOpenDirectUnavailableModal === false) {
              onDirectUnavailableModalBlocked?.()
              return
            }
            const draftSelected = buildModalSelectedDates(appliedDates, exclusionState)
            const openDisabledDate = buildCalendarDisabledDate(draftSelected, disabledDate)
            const initialDate = findNextEnabledDate(
              initialCalendarDate ?? dayjs(),
              openDisabledDate
            )
            setCurrentMonth(initialDate.startOf('month'))
            setSelectedDate(initialDate)
            // 폼 체크박스(토·일·공휴일) + 직접 추가 날짜를 모달 칩에 동기화
            // 제외 대상 요일·공휴일에 걸린 개별 날짜는 칩/선택에서 제거
            setSelectedDates(filterEnabledDateValues(draftSelected, openDisabledDate))
            setOpen(true)
          }} >
          진행 불가일 직접 추가
        </CmsButton>
        {appliedDatesDisplay === 'chips' && appliedDateItems.length > 0 ? (
          <div className="direct-unavailable-date-add-button__selected-date-chips">
            {appliedDateItems.map(({ value, label }) => (
              <span key={value} className="direct-unavailable-date-add-button__selected-date-chip">
                <span>{label}</span>
                <ItemDeleteButton
                  className="direct-unavailable-date-add-button__selected-date-remove"
                  aria-label={`${label} 제거`}
                  onClick={() => removeAppliedDate(value)}
                />
              </span>
            ))}
          </div>
        ) : appliedDateText ? (
          <span className="direct-unavailable-date-add-button__selected-dates">
            {appliedDateText}
          </span>
        ) : null}
      </div>

      <ContentModal
        open={open}
        onCancel={closeModal}
        title={modalTitle}
        width={600}
        description={`${modalUnavailableDescriptionLead}\n${modalUnavailableDescriptionSecond}`}
        className="direct-unavailable-date-modal"
        footer={
          <div className="direct-unavailable-date-modal__footer">
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              onClick={closeModal} >
              취소
            </CmsButton>
            <CmsButton
              type="button"
              variant="primary"
              size="medium"
              onClick={() => {
                const nextDates = selectedDates.filter(v => {
                  if (RECURRING_TOKEN_SET.has(v)) return false
                  if (!ISO_DATE_PATTERN.test(v)) return false
                  return !calendarDisabledDate(dayjs(v))
                })
                if (!isControlled) {
                  setUncontrolledAppliedDates(nextDates)
                }
                onApplyDatesChange?.(nextDates)
                if (onExclusionChange) {
                  onExclusionChange(exclusionStateFromModalSelectedDates(selectedDates))
                }
                closeModal()
              }} >
              설정
            </CmsButton>
          </div>
        }
      >
        <div className="direct-unavailable-date-modal__body">
          <div
            className={[
              'direct-unavailable-date-modal__calendar',
              freezeCalendarInteraction &&
                'direct-unavailable-date-modal__calendar--frozen-sample',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* 선택일·지정일·토/일/공휴 색 — 강사 배정 안내 캘린더와 동일 조건 */}
            <ParagraphCalendarMini
              size="small"
              multiSelectHighlight
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onMonthChange={handleMonthChange}
              onSelectDate={handleCalendarSelect}
              programDates={selectedDateSet}
              disabledDate={calendarDisabledDate}
            />
          </div>
          <div className="direct-unavailable-date-modal__selected">
            {displayTags.length === 0 ? (
              <div className="direct-unavailable-date-modal__selected-empty">
                선택된 진행 불가일이 없습니다.
              </div>
            ) : (
              displayTags.map((label, index) => (
                <div key={`${label}-${index}`} className="direct-unavailable-date-modal__chip">
                  <span>{label}</span>
                  <button
                    type="button"
                    className="direct-unavailable-date-modal__chip-remove"
                    onClick={() => removeDate(selectedDates[index] ?? '')}
                    aria-label={`${label} 제거`}
                  >
                    <img src={fieldDeleteUrl} width={20} height={20} alt="" aria-hidden draggable={false} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </ContentModal>
    </>
  )
}
