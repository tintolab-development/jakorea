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
}: {
  row: ScheduleRowState
  onPatch: (patch: Partial<ScheduleRowState>) => void
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
            placeholder="희망 교육 날짜를 선택하세요"
            value={row.date}
            onChange={next => onPatch({ date: next })}
            inputSize="medium"
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
              value={row.start}
              onChange={next => onPatch({ start: next, end: next == null ? null : row.end })}
              placeholder="수업 시작"
              width={168}
              showEndTimeToggle={false}
            />
            <span className="gemini-preferred-schedule-paragraph__tilde">~</span>
            <ParagraphTimePicker
              value={row.end}
              onChange={next => onPatch({ end: next })}
              placeholder="수업 종료"
              width={168}
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
  return (
    <DetailInfoForm title={title} mode="edit">
      <PreferenceScheduleFields row={row} onPatch={onPatch} />
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
