import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  updateGeneralApplicationOverlayKey,
  useGeneralApplicationOverlayKv,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './gemini-preferred-schedule-paragraph.css'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

type ScheduleRowState = {
  date: Dayjs | null
  start: Dayjs | null
  end: Dayjs | null
}

function emptyRow(): ScheduleRowState {
  return { date: null, start: null, end: null }
}

function PreferenceScheduleFields({
  row,
  onPatch,
  timeInputWidth,
}: {
  row: ScheduleRowState
  onPatch: (patch: Partial<ScheduleRowState>) => void
  timeInputWidth: number
}) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="희망 교육일"
        edit={
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            customizable={false}
            suppressAutoTodayWhenEmpty
            placeholder="희망 교육 날짜를 선택해 주세요"
            value={row.date}
            onChange={next => onPatch({ date: next })}
            inputSize="small"
            width={240}
            className="gemini-preferred-schedule-paragraph__date-picker"
            style={{ flex: '0 0 240px', width: 240, gap: 6 }}
          />
        }
        view="-"
      />
      <DetailInfoForm.Field
        label="희망 교육 시간"
        edit={
          <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap gemini-preferred-schedule-paragraph__time-inputs">
            <ParagraphTimePicker
              inputSize="small"
              value={row.start}
              onChange={next => onPatch({ start: next, end: next == null ? null : row.end })}
              placeholder="수업 시작"
              width={timeInputWidth}
              showEndTimeToggle={false}
            />
            <span className="gemini-preferred-schedule-paragraph__tilde">~</span>
            <ParagraphTimePicker
              inputSize="small"
              value={row.end}
              onChange={next => onPatch({ end: next })}
              placeholder="수업 종료"
              width={timeInputWidth}
              showEndTimeToggle={false}
              disabled={row.start == null}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function PreferenceDetailForm({
  title,
  row,
  onPatch,
}: {
  title: string
  row: ScheduleRowState
  onPatch: (patch: Partial<ScheduleRowState>) => void
}) {
  /**
   * 템플릿 관리 시안(12875:515810) — 「■ N지망」 16px 소제목 ↔ 표 4, 시간 입력 120.
   * 그 외 화면은 기존 DetailInfoForm 헤더·168 폭 유지.
   */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  if (isTemplateManagementScreen) {
    return (
      <div className="gemini-preferred-schedule-paragraph__block--spec">
        <div className="program-registration-curriculum__session-heading gemini-preferred-schedule-paragraph__heading--spec">
          {title}
        </div>
        <DetailInfoForm title={title} hideHeader mode="edit">
          <PreferenceScheduleFields row={row} onPatch={onPatch} timeInputWidth={120} />
        </DetailInfoForm>
      </div>
    )
  }
  return (
    <DetailInfoForm title={title} mode="edit">
      <PreferenceScheduleFields row={row} onPatch={onPatch} timeInputWidth={168} />
    </DetailInfoForm>
  )
}

/** Gemini 찾아가는 연수 참여 기관 신청 — 진행 희망 교육 일정(1~3지망 고정) */
export function GeminiVisitingTrainingPreferredScheduleParagraph() {
  const [first] = useGeneralApplicationOverlayKv<ScheduleRowState>(
    'application.gemini.inst.schedule.first',
    emptyRow()
  )
  const [second] = useGeneralApplicationOverlayKv<ScheduleRowState>(
    'application.gemini.inst.schedule.second',
    emptyRow()
  )
  const [third] = useGeneralApplicationOverlayKv<ScheduleRowState>(
    'application.gemini.inst.schedule.third',
    emptyRow()
  )

  return (
    <div className="program-registration-paragraph">
      <div style={{ marginBottom: 16 }}>
        <PreferenceDetailForm
          title="■ 1지망"
          row={first}
          onPatch={patch =>
            updateGeneralApplicationOverlayKey<ScheduleRowState>(
              'application.gemini.inst.schedule.first',
              prev => ({ ...(prev ?? emptyRow()), ...patch })
            )
          }
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <PreferenceDetailForm
          title="■ 2지망"
          row={second}
          onPatch={patch =>
            updateGeneralApplicationOverlayKey<ScheduleRowState>(
              'application.gemini.inst.schedule.second',
              prev => ({ ...(prev ?? emptyRow()), ...patch })
            )
          }
        />
      </div>
      <div>
        <PreferenceDetailForm
          title="■ 3지망"
          row={third}
          onPatch={patch =>
            updateGeneralApplicationOverlayKey<ScheduleRowState>(
              'application.gemini.inst.schedule.third',
              prev => ({ ...(prev ?? emptyRow()), ...patch })
            )
          }
        />
      </div>
    </div>
  )
}
