import { useCallback, useEffect, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { DirectUnavailableDateAddButton } from '@/features/template/ui/form-set/shared/direct-unavailable-date-add-button'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { createDefaultUnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import './unavailable-dates-bulk-exclusions-row.css'

export type { UnavailableDatesExclusionState }

export type UnavailableDatesBulkExclusionsRowProps = {
  disabledDate?: (date: Dayjs) => boolean
  initialCalendarDate?: Dayjs | null
  /** `YYYY-MM-DD` 목록 — 넘기면 직접 추가 칩이 제어 모드(풀페이지·미리보기 공유) */
  appliedDates?: string[]
  onApplyDatesChange?: (dates: string[]) => void
  /** 모달 본문 첫 줄 — 면접/교육 등 맥락별 (예: 면접 진행 불가한 날짜를…) */
  modalUnavailableDescriptionLead?: string
  /** 모달 본문 둘째 줄 */
  modalUnavailableDescriptionSecond?: string
  defaultExcludeSaturday?: boolean
  defaultExcludeSunday?: boolean
  defaultExcludeHoliday?: boolean
  defaultExcludeNone?: boolean
  /** 제어 모드 — 미전달 시 내부 state */
  exclusionState?: UnavailableDatesExclusionState
  onExclusionChange?: (state: UnavailableDatesExclusionState) => void
  /**
   * `false`이면 「진행 불가일 직접 추가」 클릭 시 날짜 모달을 열지 않고 `onDirectUnavailableModalBlocked`만 호출
   * (예: 교육 진행 일정 범위 미선택)
   */
  canOpenDirectUnavailableModal?: boolean
  onDirectUnavailableModalBlocked?: () => void
}

function resolveInitialExclusionState({
  exclusionState,
  defaultExcludeNone,
  defaultExcludeSaturday,
  defaultExcludeSunday,
  defaultExcludeHoliday,
  appliedDates,
}: Pick<
  UnavailableDatesBulkExclusionsRowProps,
  | 'exclusionState'
  | 'defaultExcludeNone'
  | 'defaultExcludeSaturday'
  | 'defaultExcludeSunday'
  | 'defaultExcludeHoliday'
  | 'appliedDates'
>): UnavailableDatesExclusionState {
  if (exclusionState) return exclusionState

  const excludeSaturday = defaultExcludeSaturday ?? false
  const excludeSunday = defaultExcludeSunday ?? false
  const excludeHoliday = defaultExcludeHoliday ?? true
  const hasSpecificDates = (appliedDates?.length ?? 0) > 0
  const hasRecurring = excludeSaturday || excludeSunday || excludeHoliday

  if (defaultExcludeNone != null) {
    return {
      excludeNone: defaultExcludeNone,
      excludeSaturday: defaultExcludeNone ? false : excludeSaturday,
      excludeSunday: defaultExcludeNone ? false : excludeSunday,
      excludeHoliday: defaultExcludeNone ? false : excludeHoliday,
    }
  }

  if (hasRecurring || hasSpecificDates) {
    return {
      excludeNone: false,
      excludeSaturday,
      excludeSunday,
      excludeHoliday,
    }
  }

  return createDefaultUnavailableDatesExclusionState({ excludeNone: true, excludeHoliday: false })
}

function exclusionStateEquals(
  a: UnavailableDatesExclusionState,
  b: UnavailableDatesExclusionState
): boolean {
  return (
    a.excludeNone === b.excludeNone &&
    a.excludeSaturday === b.excludeSaturday &&
    a.excludeSunday === b.excludeSunday &&
    a.excludeHoliday === b.excludeHoliday
  )
}

/** 면접·교육 등 공통 — 진행 불가일 직접 추가(chips) + 없음/토·일/공휴일 제외 */
export function UnavailableDatesBulkExclusionsRow({
  disabledDate,
  initialCalendarDate,
  appliedDates,
  onApplyDatesChange,
  modalUnavailableDescriptionLead,
  modalUnavailableDescriptionSecond,
  canOpenDirectUnavailableModal,
  onDirectUnavailableModalBlocked,
  defaultExcludeSaturday,
  defaultExcludeSunday,
  defaultExcludeHoliday,
  defaultExcludeNone,
  exclusionState: controlledExclusionState,
  onExclusionChange,
}: UnavailableDatesBulkExclusionsRowProps) {
  const [internalExclusionState, setInternalExclusionState] = useState(() =>
    resolveInitialExclusionState({
      exclusionState: controlledExclusionState,
      defaultExcludeNone,
      defaultExcludeSaturday,
      defaultExcludeSunday,
      defaultExcludeHoliday,
      appliedDates,
    })
  )

  const exclusionState = controlledExclusionState ?? internalExclusionState

  const updateExclusionState = useCallback(
    (next: UnavailableDatesExclusionState) => {
      if (controlledExclusionState == null) {
        setInternalExclusionState(prev => (exclusionStateEquals(prev, next) ? prev : next))
      }
      onExclusionChange?.(next)
    },
    [controlledExclusionState, onExclusionChange]
  )

  useEffect(() => {
    if (controlledExclusionState == null) return
    setInternalExclusionState(prev =>
      exclusionStateEquals(prev, controlledExclusionState) ? prev : controlledExclusionState
    )
  }, [controlledExclusionState])

  const handleApplyDatesChange = useCallback(
    (dates: string[]) => {
      onApplyDatesChange?.(dates)
      if (dates.length > 0 && exclusionState.excludeNone) {
        updateExclusionState({ ...exclusionState, excludeNone: false })
      }
    },
    [exclusionState, onApplyDatesChange, updateExclusionState]
  )

  const hasRecurringExclusion =
    exclusionState.excludeSaturday || exclusionState.excludeSunday || exclusionState.excludeHoliday
  const hasSpecificDates = (appliedDates?.length ?? 0) > 0
  const excludeNoneDisabled = hasRecurringExclusion || hasSpecificDates
  const recurringExclusionDisabled = exclusionState.excludeNone

  const handleExcludeNoneChange = (checked: boolean) => {
    if (checked) {
      updateExclusionState({
        excludeNone: true,
        excludeSaturday: false,
        excludeSunday: false,
        excludeHoliday: false,
      })
      return
    }

    updateExclusionState({ ...exclusionState, excludeNone: false })
  }

  const handleRecurringExclusionChange = (
    key: 'excludeSaturday' | 'excludeSunday' | 'excludeHoliday',
    checked: boolean
  ) => {
    updateExclusionState({
      ...exclusionState,
      excludeNone: false,
      [key]: checked,
    })
  }

  return (
    <div className="unavailable-dates-bulk-exclusions-row">
      <DirectUnavailableDateAddButton
        appliedDatesDisplay="chips"
        disabled={exclusionState.excludeNone}
        disabledDate={disabledDate}
        initialCalendarDate={initialCalendarDate}
        appliedDates={appliedDates}
        onApplyDatesChange={handleApplyDatesChange}
        modalUnavailableDescriptionLead={modalUnavailableDescriptionLead}
        modalUnavailableDescriptionSecond={modalUnavailableDescriptionSecond}
        canOpenDirectUnavailableModal={canOpenDirectUnavailableModal}
        onDirectUnavailableModalBlocked={onDirectUnavailableModalBlocked}
      />
      <DetailInfoForm.InputsSeparator />
      <CmsCheckbox
        checkboxSize="medium"
        checked={exclusionState.excludeNone}
        disabled={excludeNoneDisabled}
        onChange={event => handleExcludeNoneChange(event.target.checked)}
      >
        진행 불가일 없음
      </CmsCheckbox>
      <CmsCheckbox
        checkboxSize="medium"
        checked={exclusionState.excludeSaturday}
        disabled={recurringExclusionDisabled}
        onChange={event =>
          handleRecurringExclusionChange('excludeSaturday', event.target.checked)
        }
      >
        토요일 제외
      </CmsCheckbox>
      <CmsCheckbox
        checkboxSize="medium"
        checked={exclusionState.excludeSunday}
        disabled={recurringExclusionDisabled}
        onChange={event => handleRecurringExclusionChange('excludeSunday', event.target.checked)}
      >
        일요일 제외
      </CmsCheckbox>
      <CmsCheckbox
        checkboxSize="medium"
        checked={exclusionState.excludeHoliday}
        disabled={recurringExclusionDisabled}
        onChange={event => handleRecurringExclusionChange('excludeHoliday', event.target.checked)}
      >
        공휴일 제외
      </CmsCheckbox>
    </div>
  )
}
