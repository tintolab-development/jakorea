import { useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Form } from 'antd'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
import {
  LECTURE_REPORT_END_ACTIVITY_PRESET_LABEL,
  LECTURE_REPORT_START_ACTIVITY_PRESET_LABEL,
  lectureReportEndActivityPreviewLabel,
  lectureReportStartActivityPreviewLabel,
  resolveLectureReportActivityDaySample,
  resolveLectureReportEndPeriodChoice,
  resolveLectureReportStartPeriodChoice,
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
  type LectureReportEndPeriodChoice,
  type LectureReportStartPeriodChoice,
  UJAT_EDU_JOURNAL_END_ACTIVITY_PRESET_LABEL,
  UJAT_EDU_JOURNAL_END_NO_DEADLINE_PREVIEW_LABEL,
  UJAT_EDU_JOURNAL_START_ACTIVITY_PRESET_LABEL,
  resolveUjatEduJournalActivityDaySample,
  resolveUjatEduJournalEndPeriodChoice,
  resolveUjatEduJournalStartPeriodChoice,
  ujatEduJournalEndActivityPreviewLabel,
  ujatEduJournalStartActivityPreviewLabel,
  ujatEduJournalStartImmediatePreviewLabel,
  type UjatEduJournalEndPeriodChoice,
  type UjatEduJournalStartPeriodChoice,
  UJAT_EDU_PLAN_END_ACTIVITY_PRESET_LABEL,
  UJAT_EDU_PLAN_END_NO_DEADLINE_PREVIEW_LABEL,
  resolveUjatEduPlanActivityDaySample,
  resolveUjatEduPlanEndPeriodChoice,
  resolveUjatEduPlanStartPeriodChoice,
  ujatEduPlanEndActivityPreviewLabel,
  ujatEduPlanStartImmediatePreviewLabel,
  type UjatEduPlanEndPeriodChoice,
  type UjatEduPlanStartPeriodChoice,
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
    startPeriodPresetLabel:
      startPeriodMode === 'immediate' ? null : (next.startPeriodPresetLabel ?? null),
    endPeriodPresetLabel:
      endPeriodMode === 'immediate' ? null : (next.endPeriodPresetLabel ?? null),
    periodMode:
      startPeriodMode === 'custom' || endPeriodMode === 'custom' ? 'custom' : 'immediate',
  }
}

const LECTURE_REPORT_START_OPTIONS: Array<{
  value: LectureReportStartPeriodChoice
  label: string
}> = [
  { value: 'immediate', label: '바로 시작' },
  { value: 'custom', label: '직접 설정' },
  { value: 'activity', label: LECTURE_REPORT_START_ACTIVITY_PRESET_LABEL },
]

const LECTURE_REPORT_END_OPTIONS: Array<{
  value: LectureReportEndPeriodChoice
  label: string
}> = [
  { value: 'immediate', label: '마감 없음' },
  { value: 'custom', label: '직접 설정' },
  { value: 'activity', label: LECTURE_REPORT_END_ACTIVITY_PRESET_LABEL },
]

function LectureReportTitlePeriodSettings({
  active,
  updateParagraph,
}: {
  active: TitleWithPeriodParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  const startChoice = resolveLectureReportStartPeriodChoice(active)
  const endChoice = resolveLectureReportEndPeriodChoice(active)
  const activityDay = useMemo(() => resolveLectureReportActivityDaySample(active.startAt), [active.startAt])

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
    if (endChoice !== 'custom' || !active.endAt) return null
    const end = dayjs(active.endAt)
    if (!end.isValid()) return null
    const start = active.startAt ? dayjs(active.startAt) : end
    if (!start.isValid()) return [end, end]
    return start.isBefore(end, 'day') ? [start, end] : [end, end]
  }, [active.endAt, active.startAt, endChoice])

  const endAppliedSurfaceWithTime = useMemo(() => {
    if (endAppliedSurfaceRange == null) return false
    return dateRangeUsesClockTime(endAppliedSurfaceRange[0], endAppliedSurfaceRange[1])
  }, [endAppliedSurfaceRange])

  return (
    <>
      <Form.Item label="작성 시작일">
        <CmsSelect
          width="100%"
          withAllOption={false}
          options={LECTURE_REPORT_START_OPTIONS}
          value={startChoice}
          onChange={next => {
            const choice = String(next ?? 'immediate') as LectureReportStartPeriodChoice
            updateParagraph(active.id, cur => {
              if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
              if (choice === 'immediate') {
                return patchTitlePeriod(cur, {
                  startPeriodMode: 'immediate',
                  startAt: null,
                  startPeriodPresetLabel: null,
                })
              }
              if (choice === 'activity') {
                return patchTitlePeriod(cur, {
                  startPeriodMode: 'custom',
                  startAt: null,
                  startPeriodPresetLabel: LECTURE_REPORT_START_ACTIVITY_PRESET_LABEL,
                })
              }
              return patchTitlePeriod(cur, {
                startPeriodMode: 'custom',
                startPeriodPresetLabel: null,
              })
            })
          }}
        />
      </Form.Item>
      {startChoice === 'custom' ? (
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
                  startPeriodPresetLabel: null,
                })
              })
            }}
          />
        </Form.Item>
      ) : null}
      {startChoice === 'activity' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={lectureReportStartActivityPreviewLabel(activityDay)}
            presetDisplayText={lectureReportStartActivityPreviewLabel(activityDay)}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}

      <Form.Item label="작성 종료일">
        <CmsSelect
          width="100%"
          withAllOption={false}
          options={LECTURE_REPORT_END_OPTIONS}
          value={endChoice}
          onChange={next => {
            const choice = String(next ?? 'immediate') as LectureReportEndPeriodChoice
            updateParagraph(active.id, cur => {
              if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
              if (choice === 'immediate') {
                return patchTitlePeriod(cur, {
                  endPeriodMode: 'immediate',
                  endAt: null,
                  endPeriodPresetLabel: null,
                })
              }
              if (choice === 'activity') {
                return patchTitlePeriod(cur, {
                  endPeriodMode: 'custom',
                  endAt: null,
                  endPeriodPresetLabel: LECTURE_REPORT_END_ACTIVITY_PRESET_LABEL,
                })
              }
              return patchTitlePeriod(cur, {
                endPeriodMode: 'custom',
                endPeriodPresetLabel: null,
              })
            })
          }}
        />
      </Form.Item>
      {endChoice === 'custom' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="period"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={active.endAt ? endAnchorDate : null}
            placeholder="종료일을 선택하세요"
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
      {endChoice === 'activity' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={lectureReportEndActivityPreviewLabel(activityDay)}
            presetDisplayText={lectureReportEndActivityPreviewLabel(activityDay)}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
    </>
  )
}

const UJAT_EDU_JOURNAL_START_OPTIONS: Array<{
  value: UjatEduJournalStartPeriodChoice
  label: string
}> = [
  { value: 'immediate', label: '바로 시작' },
  { value: 'custom', label: '직접 설정' },
  { value: 'activity', label: UJAT_EDU_JOURNAL_START_ACTIVITY_PRESET_LABEL },
]

const UJAT_EDU_JOURNAL_END_OPTIONS: Array<{
  value: UjatEduJournalEndPeriodChoice
  label: string
}> = [
  { value: 'immediate', label: '마감 없음' },
  { value: 'custom', label: '직접 설정' },
  { value: 'activity', label: UJAT_EDU_JOURNAL_END_ACTIVITY_PRESET_LABEL },
]

function UjatEduJournalTitlePeriodSettings({
  active,
  updateParagraph,
}: {
  active: TitleWithPeriodParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  const startChoice = resolveUjatEduJournalStartPeriodChoice(active)
  const endChoice = resolveUjatEduJournalEndPeriodChoice(active)
  const activityDay = useMemo(
    () => resolveUjatEduJournalActivityDaySample(active.startAt),
    [active.startAt]
  )
  const todayPreviewLabel = useMemo(() => ujatEduJournalStartImmediatePreviewLabel(), [])
  const startActivityPreviewLabel = useMemo(
    () => ujatEduJournalStartActivityPreviewLabel(activityDay),
    [activityDay]
  )
  const endActivityPreviewLabel = useMemo(
    () => ujatEduJournalEndActivityPreviewLabel(activityDay),
    [activityDay]
  )

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
    if (endChoice !== 'custom' || !active.endAt) return null
    const end = dayjs(active.endAt)
    if (!end.isValid()) return null
    const start = active.startAt ? dayjs(active.startAt) : end
    if (!start.isValid()) return [end, end]
    return start.isBefore(end, 'day') ? [start, end] : [end, end]
  }, [active.endAt, active.startAt, endChoice])

  const endAppliedSurfaceWithTime = useMemo(() => {
    if (endAppliedSurfaceRange == null) return false
    return dateRangeUsesClockTime(endAppliedSurfaceRange[0], endAppliedSurfaceRange[1])
  }, [endAppliedSurfaceRange])

  return (
    <>
      <Form.Item label="작성 시작일">
        <CmsSelect
          width="100%"
          withAllOption={false}
          options={UJAT_EDU_JOURNAL_START_OPTIONS}
          value={startChoice}
          onChange={next => {
            const choice = String(next ?? 'immediate') as UjatEduJournalStartPeriodChoice
            updateParagraph(active.id, cur => {
              if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
              if (choice === 'immediate') {
                return patchTitlePeriod(cur, {
                  startPeriodMode: 'immediate',
                  startAt: null,
                  startPeriodPresetLabel: null,
                })
              }
              if (choice === 'activity') {
                return patchTitlePeriod(cur, {
                  startPeriodMode: 'custom',
                  startAt: null,
                  startPeriodPresetLabel: UJAT_EDU_JOURNAL_START_ACTIVITY_PRESET_LABEL,
                })
              }
              return patchTitlePeriod(cur, {
                startPeriodMode: 'custom',
                startPeriodPresetLabel: null,
              })
            })
          }}
        />
      </Form.Item>
      {startChoice === 'immediate' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={todayPreviewLabel}
            presetDisplayText={todayPreviewLabel}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
      {startChoice === 'custom' ? (
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
                  startPeriodPresetLabel: null,
                })
              })
            }}
          />
        </Form.Item>
      ) : null}
      {startChoice === 'activity' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={startActivityPreviewLabel}
            presetDisplayText={startActivityPreviewLabel}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}

      <Form.Item label="작성 종료일">
        <CmsSelect
          width="100%"
          withAllOption={false}
          options={UJAT_EDU_JOURNAL_END_OPTIONS}
          value={endChoice}
          onChange={next => {
            const choice = String(next ?? 'immediate') as UjatEduJournalEndPeriodChoice
            updateParagraph(active.id, cur => {
              if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
              if (choice === 'immediate') {
                return patchTitlePeriod(cur, {
                  endPeriodMode: 'immediate',
                  endAt: null,
                  endPeriodPresetLabel: null,
                })
              }
              if (choice === 'activity') {
                return patchTitlePeriod(cur, {
                  endPeriodMode: 'custom',
                  endAt: null,
                  endPeriodPresetLabel: UJAT_EDU_JOURNAL_END_ACTIVITY_PRESET_LABEL,
                })
              }
              return patchTitlePeriod(cur, {
                endPeriodMode: 'custom',
                endPeriodPresetLabel: null,
              })
            })
          }}
        />
      </Form.Item>
      {endChoice === 'immediate' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={UJAT_EDU_JOURNAL_END_NO_DEADLINE_PREVIEW_LABEL}
            presetDisplayText={UJAT_EDU_JOURNAL_END_NO_DEADLINE_PREVIEW_LABEL}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
      {endChoice === 'custom' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="period"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={active.endAt ? endAnchorDate : null}
            placeholder="종료일을 선택하세요"
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
      {endChoice === 'activity' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={endActivityPreviewLabel}
            presetDisplayText={endActivityPreviewLabel}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
    </>
  )
}

const UJAT_EDU_PLAN_START_OPTIONS: Array<{
  value: UjatEduPlanStartPeriodChoice
  label: string
}> = [
  { value: 'immediate', label: '바로 시작' },
  { value: 'custom', label: '직접 설정' },
]

const UJAT_EDU_PLAN_END_OPTIONS: Array<{
  value: UjatEduPlanEndPeriodChoice
  label: string
}> = [
  { value: 'immediate', label: '마감 없음' },
  { value: 'custom', label: '직접 설정' },
  { value: 'activity', label: UJAT_EDU_PLAN_END_ACTIVITY_PRESET_LABEL },
]

function UjatEduPlanTitlePeriodSettings({
  active,
  updateParagraph,
}: {
  active: TitleWithPeriodParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  const startChoice = resolveUjatEduPlanStartPeriodChoice(active)
  const endChoice = resolveUjatEduPlanEndPeriodChoice(active)
  const activityDay = useMemo(
    () => resolveUjatEduPlanActivityDaySample(active.startAt),
    [active.startAt]
  )
  const todayPreviewLabel = useMemo(() => ujatEduPlanStartImmediatePreviewLabel(), [])
  const endActivityPreviewLabel = useMemo(
    () => ujatEduPlanEndActivityPreviewLabel(activityDay),
    [activityDay]
  )

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
    if (endChoice !== 'custom' || !active.endAt) return null
    const end = dayjs(active.endAt)
    if (!end.isValid()) return null
    const start = active.startAt ? dayjs(active.startAt) : end
    if (!start.isValid()) return [end, end]
    return start.isBefore(end, 'day') ? [start, end] : [end, end]
  }, [active.endAt, active.startAt, endChoice])

  const endAppliedSurfaceWithTime = useMemo(() => {
    if (endAppliedSurfaceRange == null) return false
    return dateRangeUsesClockTime(endAppliedSurfaceRange[0], endAppliedSurfaceRange[1])
  }, [endAppliedSurfaceRange])

  return (
    <>
      <Form.Item label="작성 시작일">
        <CmsSelect
          width="100%"
          withAllOption={false}
          options={UJAT_EDU_PLAN_START_OPTIONS}
          value={startChoice}
          onChange={next => {
            const choice = String(next ?? 'immediate') as UjatEduPlanStartPeriodChoice
            updateParagraph(active.id, cur => {
              if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
              if (choice === 'immediate') {
                return patchTitlePeriod(cur, {
                  startPeriodMode: 'immediate',
                  startAt: null,
                  startPeriodPresetLabel: null,
                })
              }
              return patchTitlePeriod(cur, {
                startPeriodMode: 'custom',
                startPeriodPresetLabel: null,
              })
            })
          }}
        />
      </Form.Item>
      {startChoice === 'immediate' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={todayPreviewLabel}
            presetDisplayText={todayPreviewLabel}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
      {startChoice === 'custom' ? (
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
                  startPeriodPresetLabel: null,
                })
              })
            }}
          />
        </Form.Item>
      ) : null}

      <Form.Item label="작성 종료일">
        <CmsSelect
          width="100%"
          withAllOption={false}
          options={UJAT_EDU_PLAN_END_OPTIONS}
          value={endChoice}
          onChange={next => {
            const choice = String(next ?? 'immediate') as UjatEduPlanEndPeriodChoice
            updateParagraph(active.id, cur => {
              if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
              if (choice === 'immediate') {
                return patchTitlePeriod(cur, {
                  endPeriodMode: 'immediate',
                  endAt: null,
                  endPeriodPresetLabel: null,
                })
              }
              if (choice === 'activity') {
                return patchTitlePeriod(cur, {
                  endPeriodMode: 'custom',
                  endAt: null,
                  endPeriodPresetLabel: UJAT_EDU_PLAN_END_ACTIVITY_PRESET_LABEL,
                })
              }
              return patchTitlePeriod(cur, {
                endPeriodMode: 'custom',
                endPeriodPresetLabel: null,
              })
            })
          }}
        />
      </Form.Item>
      {endChoice === 'immediate' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={UJAT_EDU_PLAN_END_NO_DEADLINE_PREVIEW_LABEL}
            presetDisplayText={UJAT_EDU_PLAN_END_NO_DEADLINE_PREVIEW_LABEL}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
      {endChoice === 'custom' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="period"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={active.endAt ? endAnchorDate : null}
            placeholder="종료일을 선택하세요"
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
      {endChoice === 'activity' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={endActivityPreviewLabel}
            presetDisplayText={endActivityPreviewLabel}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
    </>
  )
}

function DefaultTitleWithPeriodSettings({
  active,
  updateParagraph,
}: {
  active: TitleWithPeriodParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  const startMode = resolveTitleStartPeriodMode(active)
  const endMode = resolveTitleEndPeriodMode(active)
  const todayPreviewLabel = useMemo(() => ujatEduJournalStartImmediatePreviewLabel(), [])

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
                ...(mode === 'immediate'
                  ? { startAt: null, startPeriodPresetLabel: null }
                  : {}),
              })
            })
          }
        >
          <CmsRadio value="immediate">바로 시작</CmsRadio>
          <CmsRadio value="custom">직접 설정</CmsRadio>
        </CmsRadioGroup>
      </Form.Item>
      {startMode === 'immediate' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={todayPreviewLabel}
            presetDisplayText={todayPreviewLabel}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
      {startMode === 'custom' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={active.startAt ? startAnchorDate : null}
            placeholder="시작일을 선택하세요"
            presetDisplayText={
              !active.startAt ? active.startPeriodPresetLabel ?? undefined : undefined
            }
            onChange={next => {
              if (next == null) return
              updateParagraph(active.id, cur => {
                if (cur.kind !== 'description' || cur.variant !== 'survey_title_with_period') return cur
                return patchTitlePeriod(cur, {
                  startPeriodMode: 'custom',
                  startAt: next.startOf('day').toISOString(),
                  startPeriodPresetLabel: null,
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
      {endMode === 'immediate' ? (
        <Form.Item>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            width="100%"
            suppressAutoTodayWhenEmpty
            value={null}
            disabled
            placeholder={UJAT_EDU_JOURNAL_END_NO_DEADLINE_PREVIEW_LABEL}
            presetDisplayText={UJAT_EDU_JOURNAL_END_NO_DEADLINE_PREVIEW_LABEL}
            onChange={() => undefined}
          />
        </Form.Item>
      ) : null}
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

export function TitleWithPeriodSettingsSection({
  active,
  updateParagraph,
}: {
  active: TitleWithPeriodParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  if (active.id === LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.title) {
    return <LectureReportTitlePeriodSettings active={active} updateParagraph={updateParagraph} />
  }
  if (active.id === UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.title) {
    return <UjatEduJournalTitlePeriodSettings active={active} updateParagraph={updateParagraph} />
  }
  if (active.id === UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.title) {
    return <UjatEduPlanTitlePeriodSettings active={active} updateParagraph={updateParagraph} />
  }
  return <DefaultTitleWithPeriodSettings active={active} updateParagraph={updateParagraph} />
}
