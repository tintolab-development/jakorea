/**
 * 참여 봉사자 캘린더 — split-card 우측 (기관 멀티셀렉트 + 일정 리스트)
 * shell: 공통 `.calendar-list` / `.calendar-list-item` (`calendar-sub-right.css`)
 */

import { calendarListItemBackground } from '@/shared/components/calendar/lib/calendar-list-item-background'
import { useCallback, useMemo } from 'react'
import { EmptyState } from '@/shared/ui'
import type { ParticipatingVolunteerCalendarEvent } from '@/features/program/general/lib/build-participating-volunteer-calendar-events'
import { formatInstitutionRegionForCalendarListDisplay } from '@/shared/lib/format-institution-region-display'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { CmsSelect } from '@/shared/ui'
import { formatParticipatingSessionPeriodForCalendarDisplay } from './participating-institutions-calendar-day-list'
import {
  ParticipatingVolunteerCalendarListItem,
  type ParticipatingVolunteerCalendarListRow,
} from './participating-volunteer-calendar-list-item'

export type ParticipatingVolunteersCalendarRightProps = {
  events: readonly ParticipatingVolunteerCalendarEvent[]
  schoolFilterOptions: ReadonlyArray<{
    value: string
    label: string
    tagColor?: string
    tagTextColor?: string
  }>
  effectiveSelectedSchools: string[]
  onSelectedSchoolsChange: (schools: string[]) => void
  getColorForSchool: (schoolName: string) => ScheduleColorPair
  selectedVolunteerIds: string[]
  onVolunteerSelectionChange: (ids: string[]) => void
  /**
   * `institution` — 일반 기관형 Figma 07-1/01-2: 상단 기관 선택 셀렉트 없음(해당 날짜 전체), 「활동 포기」 뱃지.
   * 생략(`default`)은 기존(기관 멀티셀렉트, 뱃지 없음).
   */
  variant?: 'default' | 'institution'
}

function toListRow(
  event: ParticipatingVolunteerCalendarEvent,
  showActivityWithdrawn: boolean
): ParticipatingVolunteerCalendarListRow {
  const { row, volunteerId, volunteerName, sessionsOnDate } = event.originalItem
  const session = sessionsOnDate[0]
  return {
    id: event.id,
    volunteerId,
    schoolName: row.schoolName?.trim() || '-',
    volunteerName,
    regionLabel: formatInstitutionRegionForCalendarListDisplay(row.region),
    sessionLabel: session ? formatParticipatingSessionPeriodForCalendarDisplay(session) : '-',
    activityWithdrawn: showActivityWithdrawn && event.originalItem.activityWithdrawn === true,
  }
}

export function ParticipatingVolunteersCalendarRight({
  events,
  schoolFilterOptions,
  effectiveSelectedSchools,
  onSelectedSchoolsChange,
  getColorForSchool,
  selectedVolunteerIds,
  onVolunteerSelectionChange,
  variant = 'default',
}: ParticipatingVolunteersCalendarRightProps) {
  const isInstitution = variant === 'institution'
  const selectedSet = useMemo(() => new Set(selectedVolunteerIds), [selectedVolunteerIds])

  const filteredEvents = useMemo(() => {
    // 기관형은 셀렉트가 없으므로 해당 날짜 일정 전체
    if (isInstitution) return [...events]
    if (effectiveSelectedSchools.length === 0) return []
    const selected = new Set(effectiveSelectedSchools)
    return events.filter(event => selected.has(event.originalItem.row.schoolName))
  }, [effectiveSelectedSchools, events, isInstitution])

  const selectSchoolFilterOptions = useMemo(
    () =>
      schoolFilterOptions.map(option => ({
        label: option.label,
        value: option.value,
        tagColor: option.tagColor,
        tagTextColor: option.tagTextColor,
      })),
    [schoolFilterOptions]
  )

  const listRows = useMemo(() => {
    return [...filteredEvents]
      .sort((a, b) => {
        const schoolCmp = (a.originalItem.row.schoolName || '').localeCompare(
          b.originalItem.row.schoolName || '',
          'ko'
        )
        if (schoolCmp !== 0) return schoolCmp
        return (a.originalItem.volunteerName || '').localeCompare(
          b.originalItem.volunteerName || '',
          'ko'
        )
      })
      .map(event => toListRow(event, isInstitution))
  }, [filteredEvents, isInstitution])

  const handleToggle = useCallback(
    (volunteerId: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(volunteerId)) return
        onVolunteerSelectionChange([...selectedVolunteerIds, volunteerId])
      } else {
        onVolunteerSelectionChange(selectedVolunteerIds.filter(id => id !== volunteerId))
      }
    },
    [onVolunteerSelectionChange, selectedSet, selectedVolunteerIds]
  )

  const isEmpty = listRows.length === 0

  return (
    <div
      className={['calendar-list', isInstitution ? '' : 'calendar-list--with-toolbar']
        .filter(Boolean)
        .join(' ')}
    >
      {isInstitution ? null : (
        <div className="calendar-list__toolbar">
          <CmsSelect
            mode="multiple"
            withAllOption={false}
            width="100%"
            value={effectiveSelectedSchools}
            onChange={next => onSelectedSchoolsChange(next as string[])}
            options={selectSchoolFilterOptions}
            placeholder="기관 선택"
          />
        </div>
      )}
      <div
        className={['calendar-list__items', isEmpty ? 'calendar-list__items--empty' : '']
          .filter(Boolean)
          .join(' ')}
      >
        {isEmpty ? (
          <EmptyState description="해당 날짜에 일정이 없습니다" />
        ) : (
          listRows.map(row => {
            const colors = getColorForSchool(row.schoolName) ?? SCHEDULE_COLORS[0]
            const checked = selectedSet.has(row.volunteerId)
            return (
              <div
                key={row.id}
                className={[
                  'calendar-list-item',
                  checked ? 'calendar-list-item--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-has-color="true"
                style={{
                  backgroundColor: calendarListItemBackground(colors.bg),
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="calendar-list-item__column">
                  <ParticipatingVolunteerCalendarListItem
                    row={row}
                    checked={checked}
                    onToggle={handleToggle}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
