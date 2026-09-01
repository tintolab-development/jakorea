/**
 * 참여 봉사자 캘린더 — split-card 우측 (기관 멀티셀렉트 + 일정 리스트)
 * shell: 공통 `.calendar-list` / `.calendar-list-item` (`calendar-sub-right.css`)
 */

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
}

function toListRow(event: ParticipatingVolunteerCalendarEvent): ParticipatingVolunteerCalendarListRow {
  const { row, volunteerId, volunteerName, sessionsOnDate } = event.originalItem
  const session = sessionsOnDate[0]
  return {
    id: event.id,
    volunteerId,
    schoolName: row.schoolName?.trim() || '-',
    volunteerName,
    regionLabel: formatInstitutionRegionForCalendarListDisplay(row.region),
    sessionLabel: session ? formatParticipatingSessionPeriodForCalendarDisplay(session) : '-',
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
}: ParticipatingVolunteersCalendarRightProps) {
  const selectedSet = useMemo(() => new Set(selectedVolunteerIds), [selectedVolunteerIds])

  const filteredEvents = useMemo(() => {
    if (effectiveSelectedSchools.length === 0) return []
    const selected = new Set(effectiveSelectedSchools)
    return events.filter(event => selected.has(event.originalItem.row.schoolName))
  }, [effectiveSelectedSchools, events])

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
      .map(toListRow)
  }, [filteredEvents])

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
    <div className="calendar-list calendar-list--with-toolbar">
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
                  backgroundColor: colors.bg,
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
