import { useMemo, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  buildInstitutionSessionCountOptions,
  clampInstitutionScheduleBlockCount,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import { useInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  useGeneralApplicationOverlayKv,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

type SessionTimeState = {
  classPeriod: string
  start: Dayjs | null
  end: Dayjs | null
}

type ScheduleBlockState = {
  date: Dayjs | null
  session: string | undefined
  times: SessionTimeState[]
}

function createEmptyTimeState(): SessionTimeState {
  return { classPeriod: '', start: null, end: null }
}

function createEmptyBlockState(timeRowCount = 1): ScheduleBlockState {
  return {
    date: null,
    session: undefined,
    times: Array.from({ length: Math.max(1, timeRowCount) }, createEmptyTimeState),
  }
}

function ScheduleDateAndSessionRow({
  block,
  onPatch,
  onSessionChange,
  sessionOptions,
  disabledDate,
}: {
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
  onSessionChange: (value: string | undefined) => void
  sessionOptions: { value: string; label: string }[]
  disabledDate?: (date: Dayjs) => boolean
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="희망 교육일 및 차시"
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <ParagraphDatePicker
              mode="single"
              presetMode="date"
              customizable={false}
              suppressAutoTodayWhenEmpty
              placeholder="희망 교육 날짜를 선택하세요"
              value={block.date}
              onChange={next => onPatch({ date: next })}
              disabledDate={disabledDate}
              width={240}
              style={{ flex: '0 0 240px', width: 240 }}
            />
            <DetailInfoForm.InputsSeparator />
            <CmsSelect
              inputSize="medium"
              width={120}
              withAllOption={false}
              placeholder="희망 차시"
              value={block.session}
              onChange={value => onSessionChange(value == null ? undefined : String(value))}
              options={sessionOptions}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

/**
 * 차시별 희망 교육 시간 행 — 교육받은 교사는 교사가 진행 시간을 자유롭게 지정
 * (연강이 아니어도 됨. 예: 1교시, 4교시 진행)
 */
function ScheduleTimeRow({
  label,
  time,
  onPatch,
}: {
  label: string
  time: SessionTimeState
  onPatch: (patch: Partial<SessionTimeState>) => void
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        fullRow
        edit={
          <div
            className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
            style={{ alignItems: 'center', flexWrap: 'wrap', gap: 8, width: '100%' }}
          >
            <CmsNumericInput
              inputSize="medium"
              width={120}
              placeholder="수업 진행 교시"
              value={time.classPeriod}
              mode="integer"
              onValueChange={classPeriod => onPatch({ classPeriod })}
            />
            <span>교시</span>
            <DetailInfoForm.InputsSeparator />
            <ParagraphTimePicker
              value={time.start}
              onChange={next => onPatch({ start: next })}
              placeholder="수업 시작"
              width={160}
              showEndTimeToggle={false}
            />
            <span>~</span>
            <ParagraphTimePicker
              value={time.end}
              onChange={next => onPatch({ end: next })}
              placeholder="수업 종료"
              width={160}
              showEndTimeToggle={false}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function ScheduleBlock({
  title,
  block,
  onPatch,
  onSessionChange,
  onTimePatch,
  sessionOptions,
  disabledDate,
  deleteAction,
}: {
  title: string
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
  onSessionChange: (value: string | undefined) => void
  onTimePatch: (timeIndex: number, patch: Partial<SessionTimeState>) => void
  sessionOptions: { value: string; label: string }[]
  disabledDate?: (date: Dayjs) => boolean
  deleteAction?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <div className="detail-info-form--text-bold" style={{ marginBottom: 8 }}>
          {title}
        </div>
        <DetailInfoForm title={title} hideHeader mode="edit">
          <ScheduleDateAndSessionRow
            block={block}
            onPatch={onPatch}
            onSessionChange={onSessionChange}
            sessionOptions={sessionOptions}
            disabledDate={disabledDate}
          />
          {block.times.map((time, timeIndex) => (
            <ScheduleTimeRow
              key={timeIndex}
              label={`${timeIndex + 1}차시 희망 교육 시간`}
              time={time}
              onPatch={patch => onTimePatch(timeIndex, patch)}
            />
          ))}
        </DetailInfoForm>
      </div>
      {deleteAction ? (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'stretch',
          }}
        >
          {deleteAction}
        </div>
      ) : null}
    </div>
  )
}

/**
 * 교육받은 교사 프로그램 참여자 신청 폼 — 진행 희망 교육 일정.
 * 일반 기관 폼과 동일한 지망/차시 구조이나, 교사가 차시별 진행 시간을 자유롭게
 * 지정할 수 있어 연강 안내 문구를 노출하지 않는다.
 */
export function TrainedTeachersProgramApplicationPreferredScheduleParagraph({
  readOnlyPreview = false,
}: {
  readOnlyPreview?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  /** 프로그램 미연동(등록 위저드 등) — 모집 상한이 없으므로 기존과 같이 1·2지망 고정 노출 */
  const isProgramLinked = bridge.maxScheduleCount != null
  const maxBlocks = isProgramLinked ? clampInstitutionScheduleBlockCount(bridge.maxScheduleCount) : 2
  const sessionOptions = useMemo(
    () => buildInstitutionSessionCountOptions(bridge.maxSessionsPerDay),
    [bridge.maxSessionsPerDay]
  )

  const disabledDate = useMemo(() => {
    const range = bridge.educationScheduleRange
    if (!range) return undefined
    const start = dayjs(range.start).startOf('day')
    const end = dayjs(range.end).endOf('day')
    if (!start.isValid() || !end.isValid()) return undefined
    return (date: Dayjs) => date.isBefore(start, 'day') || date.isAfter(end, 'day')
  }, [bridge.educationScheduleRange])

  const [blocks] = useGeneralApplicationOverlayKv<ScheduleBlockState[]>(
    'application.trainedTeachers.preferredSchedules',
    []
  )

  // Initialize with correct default based on preview mode and program linkage
  useMemo(() => {
    if (blocks.length === 0) {
      updateGeneralApplicationOverlayKey<ScheduleBlockState[]>('application.trainedTeachers.preferredSchedules', () =>
        readOnlyPreview
          ? // 미리보기 — 1지망(1차시)·2지망(2차시) 예시 블록으로 차시별 시간 지정 구조를 노출
            Array.from({ length: Math.min(2, Math.max(maxBlocks, 1)) }, (_, index) =>
              createEmptyBlockState(index + 1)
            )
          : Array.from({ length: isProgramLinked ? 1 : 2 }, () => createEmptyBlockState())
      )
    }
  }, [blocks.length, isProgramLinked, maxBlocks, readOnlyPreview])

  const visibleBlockCount = Math.min(Math.max(blocks.length, 1), Math.max(maxBlocks, blocks.length))
  const displayBlocks = blocks.slice(0, visibleBlockCount)

  const patchBlock = (index: number, patch: Partial<ScheduleBlockState>) => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>('application.trainedTeachers.preferredSchedules', prev => {
      const current = (prev ?? []) as ScheduleBlockState[]
      return current.map((b, i) => (i === index ? { ...b, ...patch } : b))
    })
  }

  const setBlockSession = (index: number, value: string | undefined) => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>('application.trainedTeachers.preferredSchedules', prev => {
      const current = (prev ?? []) as ScheduleBlockState[]
      return current.map((b, i) => {
        if (i !== index) return b
        const count = Math.max(1, parseInt(value ?? '1', 10) || 1)
        const times = Array.from(
          { length: count },
          (_, timeIndex) => b.times[timeIndex] ?? createEmptyTimeState()
        )
        return { ...b, session: value, times }
      })
    })
  }

  const patchBlockTime = (index: number, timeIndex: number, patch: Partial<SessionTimeState>) => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>('application.trainedTeachers.preferredSchedules', prev => {
      const current = (prev ?? []) as ScheduleBlockState[]
      return current.map((b, i) =>
        i === index
          ? {
              ...b,
              times: b.times.map((t, ti) => (ti === timeIndex ? { ...t, ...patch } : t)),
            }
          : b
      )
    })
  }

  const removeBlock = (index: number) => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>('application.trainedTeachers.preferredSchedules', prev => {
      const current = (prev ?? []) as ScheduleBlockState[]
      if (current.length <= 1) return [createEmptyBlockState()]
      return current.filter((_, i) => i !== index)
    })
  }

  const addBlock = () => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>('application.trainedTeachers.preferredSchedules', prev => {
      const current = (prev ?? []) as ScheduleBlockState[]
      return current.length >= maxBlocks ? current : [...current, createEmptyBlockState()]
    })
  }

  return (
    <div
      className="program-registration-paragraph"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {displayBlocks.map((block, index) => (
        <ScheduleBlock
          key={index}
          title={`■ ${index + 1}지망`}
          block={block}
          onPatch={patch => patchBlock(index, patch)}
          onSessionChange={value => setBlockSession(index, value)}
          onTimePatch={(timeIndex, patch) => patchBlockTime(index, timeIndex, patch)}
          sessionOptions={sessionOptions}
          disabledDate={disabledDate}
          deleteAction={
            !readOnlyPreview && index > 0 ? (
              <ItemDeleteButton
                className="item-delete-button"
                aria-label={`${index + 1}지망 삭제`}
                onClick={event => {
                  event.stopPropagation()
                  removeBlock(index)
                }}
              />
            ) : undefined
          }
        />
      ))}
      {readOnlyPreview || displayBlocks.length >= maxBlocks ? null : (
        <button
          type="button"
          className="form-editor-template-field-hint-text"
          style={{ alignSelf: 'flex-start', cursor: 'pointer', border: 'none', background: 'none' }}
          onClick={addBlock}
        >
          + 희망 일정 추가 (최대 {maxBlocks}개)
        </button>
      )}
    </div>
  )
}
