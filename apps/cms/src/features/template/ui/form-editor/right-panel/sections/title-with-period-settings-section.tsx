import { useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Form } from 'antd'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
} from '@/features/template/lib/title-with-period-settings'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import type { FormEditorRightPanelUpdateParagraph } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

function patchTitlePeriod(
  paragraph: TitleWithPeriodParagraph,
  patch: Partial<TitleWithPeriodParagraph>
): TitleWithPeriodParagraph {
  const next = { ...paragraph, ...patch }
  const startPeriodMode = resolveTitleStartPeriodMode(next)
  const endPeriodMode = resolveTitleEndPeriodMode(next)
  return {
    ...next,
    startPeriodMode,
    endPeriodMode,
    startAt: startPeriodMode === 'immediate' ? null : next.startAt,
    endAt: endPeriodMode === 'immediate' ? null : next.endAt,
    endPeriodPresetLabel:
      endPeriodMode === 'immediate' ? null : next.endPeriodPresetLabel ?? null,
    periodMode:
      startPeriodMode === 'custom' || endPeriodMode === 'custom' ? 'custom' : 'immediate',
  }
}

export function TitleWithPeriodSettingsSection({
  active,
  updateParagraph,
}: {
  active: TitleWithPeriodParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  const startMode = resolveTitleStartPeriodMode(active)
  const endMode = resolveTitleEndPeriodMode(active)

  const startAnchorDate = useMemo((): Dayjs => {
    if (active.startAt) {
      const d = dayjs(active.startAt)
      if (d.isValid()) return d
    }
    return dayjs()
  }, [active.startAt])

  const endAnchorDate = useMemo((): Dayjs => {
    if (active.endAt) {
      const d = dayjs(active.endAt)
      if (d.isValid()) return d
    }
    return dayjs()
  }, [active.endAt])

  const endAppliedSurfaceRange = useMemo((): [Dayjs, Dayjs] | null => {
    if (endMode !== 'custom' || !active.endAt) return null
    const end = dayjs(active.endAt)
    if (!end.isValid()) return null
    const start = active.startAt ? dayjs(active.startAt) : end
    if (!start.isValid()) return [end, end]
    return start.isBefore(end, 'day') ? [start, end] : [end, end]
  }, [active.endAt, active.startAt, endMode])

  const endAppliedSurfaceWithTime = useMemo(() => {
    if (endAppliedSurfaceRange == null) return false
    return dateRangeUsesClockTime(endAppliedSurfaceRange[0], endAppliedSurfaceRange[1])
  }, [endAppliedSurfaceRange])

  const endPickerPlaceholder = active.endPeriodPresetLabel?.trim() || '종료일을 선택하세요'

  return (
    <>
      <Form.Item label="작성 시작일">
        <CmsRadioGroup
          value={startMode}
          onChange={e =>
            updateParagraph(active.id, cur => {
              if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
              const mode = e.target.value as TitleWithPeriodParagraph['startPeriodMode']
              return patchTitlePeriod(cur, {
                startPeriodMode: mode,
                ...(mode === 'immediate' ? { startAt: null } : {}),
              })
            })
          }
        >
          <CmsRadio value="immediate">바로 시작</CmsRadio>
          <CmsRadio value="custom">직접 설정</CmsRadio>
        </CmsRadioGroup>
      </Form.Item>
      {startMode === 'custom' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={active.startAt ? startAnchorDate : null}
            placeholder="시작일을 선택하세요"
            onChange={next => {
              if (next == null) return
              updateParagraph(active.id, cur => {
                if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
                return patchTitlePeriod(cur, {
                  startPeriodMode: 'custom',
                  startAt: next.startOf('day').toISOString(),
                })
              })
            }}
          />
        </Form.Item>
      ) : null}

      <Form.Item label="작성 종료일">
        <CmsRadioGroup
          value={endMode}
          onChange={e =>
            updateParagraph(active.id, cur => {
              if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
              const mode = e.target.value as TitleWithPeriodParagraph['endPeriodMode']
              return patchTitlePeriod(cur, {
                endPeriodMode: mode,
                ...(mode === 'immediate'
                  ? { endAt: null, endPeriodPresetLabel: null }
                  : {}),
              })
            })
          }
        >
          <CmsRadio value="immediate">마감 없음</CmsRadio>
          <CmsRadio value="custom">직접 설정</CmsRadio>
        </CmsRadioGroup>
      </Form.Item>
      {endMode === 'custom' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="period"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={active.endAt ? endAnchorDate : null}
            placeholder={endPickerPlaceholder}
            presetDisplayText={!active.endAt ? active.endPeriodPresetLabel ?? undefined : undefined}
            preferPeriodModeInPopover
            appliedSurfaceRange={endAppliedSurfaceRange}
            appliedSurfaceWithTime={endAppliedSurfaceWithTime}
            onRangeChange={([, end]) => {
              updateParagraph(active.id, cur => {
                if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
                return patchTitlePeriod(cur, {
                  endPeriodMode: 'custom',
                  endAt: end.toISOString(),
                  endPeriodPresetLabel: null,
                })
              })
            }}
            onChange={next => {
              if (next == null) return
              updateParagraph(active.id, cur => {
                if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
                return patchTitlePeriod(cur, {
                  endPeriodMode: 'custom',
                  endAt: next.endOf('day').toISOString(),
                  endPeriodPresetLabel: null,
                })
              })
            }}
          />
        </Form.Item>
      ) : null}
    </>
  )
}
