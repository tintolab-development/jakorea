import { useEffect, useMemo, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { ParagraphCalendarMini } from '@/features/template/ui/shared/paragraph-calendar-mini'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './direct-unavailable-date-add-button.css'

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function findNextEnabledDate(date: Dayjs, disabledDate?: (date: Dayjs) => boolean): Dayjs {
  if (!disabledDate || !disabledDate(date)) return date

  for (let offset = 1; offset <= 366; offset += 1) {
    const next = date.add(offset, 'day')
    if (!disabledDate(next)) return next
  }

  return date
}

function areSameStringArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
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

function formatUnavailableDateLabel(value: string): string {
  if (!ISO_DATE_PATTERN.test(value)) return value

  const date = dayjs(value)
  if (!date.isValid()) return value

  return `${date.format('YY년 M월 D일')}(${WEEKDAYS_KO[date.day()]})`
}

function DirectUnavailableDateAddIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <mask
        id="direct-unavailable-date-add-icon-mask"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <rect width="20" height="20" fill="#D9D9D9" />
      </mask>
      <g mask="url(#direct-unavailable-date-add-icon-mask)">
        <path
          d="M4.7872 16.6673C4.39366 16.6673 4.06056 16.531 3.7879 16.2583C3.51524 15.9857 3.37891 15.6526 3.37891 15.259V6.39013C3.37891 5.99659 3.51524 5.66349 3.7879 5.39082C4.06056 5.11816 4.39366 4.98183 4.7872 4.98183H5.86577V3.93306C5.86577 3.76232 5.92297 3.61976 6.03735 3.50537C6.15174 3.39111 6.2943 3.33398 6.46504 3.33398C6.63591 3.33398 6.77847 3.39111 6.89273 3.50537C7.00712 3.61976 7.06431 3.76232 7.06431 3.93306V4.98183H12.967V3.91826C12.967 3.75245 13.0229 3.61359 13.1347 3.50167C13.2466 3.38988 13.3855 3.33398 13.5513 3.33398C13.7171 3.33398 13.8559 3.38988 13.9677 3.50167C14.0796 3.61359 14.1356 3.75245 14.1356 3.91826V4.98183H15.2142C15.6077 4.98183 15.9408 5.11816 16.2135 5.39082C16.4861 5.66349 16.6225 5.99659 16.6225 6.39013V15.259C16.6225 15.6526 16.4861 15.9857 16.2135 16.2583C15.9408 16.531 15.6077 16.6673 15.2142 16.6673H4.7872ZM4.7872 15.4988H15.2142C15.2741 15.4988 15.3291 15.4738 15.3789 15.4238C15.4289 15.3739 15.4539 15.319 15.4539 15.259V9.50626H4.54745V15.259C4.54745 15.319 4.57245 15.3739 4.62244 15.4238C4.67229 15.4738 4.72722 15.4988 4.7872 15.4988ZM4.54745 8.33771H15.4539V6.39013C15.4539 6.33014 15.4289 6.27522 15.3789 6.22536C15.3291 6.17537 15.2741 6.15038 15.2142 6.15038H4.7872C4.72722 6.15038 4.67229 6.17537 4.62244 6.22536C4.57245 6.27522 4.54745 6.33014 4.54745 6.39013V8.33771Z"
          fill="white"
        />
      </g>
    </svg>
  )
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
  modalUnavailableDescriptionLead?: ReactNode
  /** 모달 본문 둘째 줄 */
  modalUnavailableDescriptionSecond?: ReactNode
  /**
   * `false`이면 직접 추가 모달을 열지 않고 `onDirectUnavailableModalBlocked` 호출
   */
  canOpenDirectUnavailableModal?: boolean
  onDirectUnavailableModalBlocked?: () => void
}) {
  const isControlled = appliedDatesProp !== undefined
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'))
  const [selectedDate, setSelectedDate] = useState(() => dayjs())
  const [selectedDates, setSelectedDates] = useState<string[]>(['모든 공휴일'])
  const [uncontrolledAppliedDates, setUncontrolledAppliedDates] = useState<string[]>([])

  const appliedDates = isControlled ? appliedDatesProp! : uncontrolledAppliedDates

  useEffect(() => {
    if (!disabledDate) return

    setSelectedDates(prev => {
      const next = filterEnabledDateValues(prev, disabledDate)
      return areSameStringArray(prev, next) ? prev : next
    })

    if (isControlled) {
      const next = filterEnabledDateValues(appliedDatesProp ?? [], disabledDate)
      if (!areSameStringArray(appliedDatesProp ?? [], next)) {
        onApplyDatesChange?.(next)
      }
      return
    }

    setUncontrolledAppliedDates(prev => {
      const next = filterEnabledDateValues(prev, disabledDate)
      return areSameStringArray(prev, next) ? prev : next
    })
  }, [appliedDatesProp, disabledDate, isControlled, onApplyDatesChange])

  const selectedDateSet = useMemo(
    () =>
      new Set(
        selectedDates.filter(v => ISO_DATE_PATTERN.test(v)).map(v => dayjs(v).format('YYYY-MM-DD'))
      ),
    [selectedDates]
  )

  const appliedDateText = useMemo(
    () => appliedDates.map(formatUnavailableDateLabel).join(', '),
    [appliedDates]
  )

  const appliedDateItems = useMemo(
    () => appliedDates.map(value => ({ value, label: formatUnavailableDateLabel(value) })),
    [appliedDates]
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
    if (disabledDate?.(d)) return

    setSelectedDate(d)
    const key = d.format('YYYY-MM-DD')
    setSelectedDates(prev => (prev.includes(key) ? prev.filter(v => v !== key) : [...prev, key]))
  }

  const displayTags = selectedDates.map(v =>
    ISO_DATE_PATTERN.test(v) ? dayjs(v).format('YY년 M월 D일') : v
  )

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
          width={180}
          disabled={disabled}
          icon={<DirectUnavailableDateAddIcon />}
          onClick={() => {
            onClick?.()
            if (canOpenDirectUnavailableModal === false) {
              onDirectUnavailableModalBlocked?.()
              return
            }
            const initialDate = findNextEnabledDate(initialCalendarDate ?? dayjs(), disabledDate)
            setCurrentMonth(initialDate.startOf('month'))
            setSelectedDate(initialDate)
            setOpen(true)
          }}
        >
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
        title="진행 불가일 직접 선택"
        width={600}
        description={
          <div className="direct-unavailable-date-modal__description">
            <div>{modalUnavailableDescriptionLead}</div>
            <div>{modalUnavailableDescriptionSecond}</div>
          </div>
        }
        className="direct-unavailable-date-modal"
        footer={
          <div className="direct-unavailable-date-modal__footer">
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={120}
              onClick={closeModal}
            >
              취소
            </CmsButton>
            <CmsButton
              type="button"
              variant="primary"
              size="medium"
              width={120}
              onClick={() => {
                const nextDates = selectedDates.filter(v => {
                  if (v === '모든 공휴일') return false
                  if (!disabledDate || !ISO_DATE_PATTERN.test(v)) return true
                  return !disabledDate(dayjs(v))
                })
                if (!isControlled) {
                  setUncontrolledAppliedDates(nextDates)
                }
                onApplyDatesChange?.(nextDates)
                closeModal()
              }}
            >
              설정
            </CmsButton>
          </div>
        }
      >
        <div className="direct-unavailable-date-modal__body">
          <div className="direct-unavailable-date-modal__calendar">
            <ParagraphCalendarMini
              size="small"
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onMonthChange={setCurrentMonth}
              onSelectDate={handleCalendarSelect}
              programDates={selectedDateSet}
              disabledDate={disabledDate}
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M7.91667 8.79479L10.4775 11.3558C10.5929 11.4711 10.738 11.5301 10.9127 11.5329C11.0873 11.5356 11.235 11.4765 11.3558 11.3558C11.4765 11.235 11.5369 11.0886 11.5369 10.9167C11.5369 10.7447 11.4765 10.5983 11.3558 10.4775L8.79479 7.91667L11.3558 5.35583C11.4711 5.24042 11.5301 5.09535 11.5329 4.92063C11.5356 4.74604 11.4765 4.59833 11.3558 4.4775C11.235 4.35681 11.0886 4.29646 10.9167 4.29646C10.7447 4.29646 10.5983 4.35681 10.4775 4.4775L7.91667 7.03854L5.35583 4.4775C5.24042 4.36222 5.09535 4.30319 4.92063 4.30042C4.74604 4.29778 4.59833 4.35681 4.4775 4.4775C4.35681 4.59833 4.29646 4.74472 4.29646 4.91667C4.29646 5.08861 4.35681 5.235 4.4775 5.35583L7.03854 7.91667L4.4775 10.4775C4.36222 10.5929 4.30319 10.738 4.30042 10.9127C4.29778 11.0873 4.35681 11.235 4.4775 11.3558C4.59833 11.4765 4.74472 11.5369 4.91667 11.5369C5.08861 11.5369 5.235 11.4765 5.35583 11.3558L7.91667 8.79479ZM7.91812 15.8333C6.82312 15.8333 5.79389 15.6256 4.83042 15.21C3.86694 14.7944 3.02889 14.2305 2.31625 13.5181C1.60361 12.8058 1.03937 11.9681 0.623542 11.005C0.207847 10.0419 0 9.01299 0 7.91812C0 6.82312 0.207778 5.79389 0.623333 4.83042C1.03889 3.86694 1.60285 3.02889 2.31521 2.31625C3.02757 1.60361 3.86528 1.03937 4.82833 0.623542C5.79139 0.207847 6.82035 0 7.91521 0C9.01021 0 10.0394 0.207777 11.0029 0.623333C11.9664 1.03889 12.8044 1.60285 13.5171 2.31521C14.2297 3.02757 14.794 3.86528 15.2098 4.82833C15.6255 5.79139 15.8333 6.82035 15.8333 7.91521C15.8333 9.01021 15.6256 10.0394 15.21 11.0029C14.7944 11.9664 14.2305 12.8044 13.5181 13.5171C12.8058 14.2297 11.9681 14.794 11.005 15.2098C10.0419 15.6255 9.01299 15.8333 7.91812 15.8333Z"
                        fill="#BDC6C9"
                      />
                    </svg>
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
