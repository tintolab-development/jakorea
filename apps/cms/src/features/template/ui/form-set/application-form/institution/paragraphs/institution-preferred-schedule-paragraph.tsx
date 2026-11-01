import { useEffect, useMemo, type ReactNode } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { buildInstitutionSessionCountOptions } from '@/features/template/lib/participant-recruitment-institution-limits'
import {
  getInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationPreferredScheduleSessionSelect,
  shouldShowInstitutionApplicationSchedulePeriodDateOnlyPreferred,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import {
  resolveInstitutionPreferredScheduleDescription,
  resolveInstitutionPreferredScheduleInitialBlockCount,
  resolveInstitutionPreferredScheduleMaxBlocks,
} from '@/features/template/lib/institution-application-schedule-copy'
import { resolvePreferredScheduleBlockTitle } from '@jakorea/form-schema/program-application'
import {
  useGeneralApplicationOverlayKv,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { toValidDayjsOrNull } from '@/shared/components/date-time-picker-shared'
import { ButtonAddIcon } from '@/shared/ui/icons/ButtonIcons'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './institution-preferred-schedule-paragraph.css'

type ScheduleBlockState = {
  date: Dayjs | null
  session: string | undefined
  start: Dayjs | null
  end: Dayjs | null
}

function createEmptyBlockState(): ScheduleBlockState {
  return {
    date: null,
    session: undefined,
    start: null,
    end: null,
  }
}

function coerceScheduleBlock(block: ScheduleBlockState): ScheduleBlockState {
  return {
    date: toValidDayjsOrNull(block.date),
    session: block.session,
    start: toValidDayjsOrNull(block.start),
    end: toValidDayjsOrNull(block.end),
  }
}

function PreferenceScheduleFields({
  block,
  onPatch,
  sessionOptions,
  showSessionSelect,
  dateOnlyPreferred,
  disabledDate,
}: {
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
  sessionOptions: { value: string; label: string }[]
  showSessionSelect: boolean
  dateOnlyPreferred: boolean
  disabledDate?: (date: Dayjs) => boolean
}) {
  const dateField = (
    <DetailInfoForm.Field
      label="희망 교육일"
      edit={
        <ParagraphDatePicker inputSize="small"
          mode="single"
          presetMode="date"
          customizable={false}
          suppressAutoTodayWhenEmpty
          placeholder="희망 교육 날짜를 선택하세요"
          value={block.date}
          onChange={next => onPatch({ date: next })}
          disabledDate={disabledDate}
          width={220}
          className="institution-preferred-schedule-paragraph__date-picker"
          style={{ flex: '0 0 220px', width: 220 }}
        />
      }
      view="-"
    />
  )

  const timeInputsDisabled = dateOnlyPreferred

  if (dateOnlyPreferred) {
    return <DetailInfoForm.Row type="single">{dateField}</DetailInfoForm.Row>
  }

  return (
    <>
      <DetailInfoForm.Row type="double">
        {dateField}
        <DetailInfoForm.Field
          label="희망 교육 시간"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap institution-preferred-schedule-paragraph__time-inputs">
              {showSessionSelect && !dateOnlyPreferred ? (
                <>
                  <CmsSelect
                    inputSize="small"
                    width={120}
                    withAllOption={false}
                    placeholder="희망 차시"
                    value={block.session}
                    onChange={value =>
                      onPatch({ session: value == null ? undefined : String(value) })
                    }
                    options={sessionOptions}
                    disabled={timeInputsDisabled}
                  />
                  <DetailInfoForm.InputsSeparator />
                </>
              ) : null}
              <ParagraphTimePicker inputSize="small"
                value={block.start}
                onChange={next => onPatch({ start: next, end: next == null ? null : block.end })}
                placeholder="수업 시작"
                width={140}
                showEndTimeToggle={false}
                disabled={timeInputsDisabled}
              />
              <span className="institution-preferred-schedule-paragraph__tilde">~</span>
              <ParagraphTimePicker inputSize="small"
                value={block.end}
                onChange={next => onPatch({ end: next })}
                placeholder="수업 종료"
                width={140}
                showEndTimeToggle={false}
                disabled={timeInputsDisabled || block.start == null}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </>
  )
}

function ScheduleBlock({
  title,
  block,
  onPatch,
  sessionOptions,
  showSessionSelect,
  dateOnlyPreferred,
  disabledDate,
  deleteAction,
}: {
  title: string
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
  sessionOptions: { value: string; label: string }[]
  showSessionSelect: boolean
  dateOnlyPreferred: boolean
  disabledDate?: (date: Dayjs) => boolean
  deleteAction?: ReactNode
}) {
  return (
    <div className="institution-preferred-schedule-paragraph__block-row">
      <div className="institution-preferred-schedule-paragraph__block-body">
        {title ? (
          <div className="detail-info-form--text-bold institution-preferred-schedule-paragraph__block-title">
            {title}
          </div>
        ) : null}
        <DetailInfoForm title={title || '희망 교육 일정'} hideHeader mode="edit">
          <PreferenceScheduleFields
            block={block}
            onPatch={onPatch}
            sessionOptions={sessionOptions}
            showSessionSelect={showSessionSelect}
            dateOnlyPreferred={dateOnlyPreferred}
            disabledDate={disabledDate}
          />
        </DetailInfoForm>
      </div>
      {deleteAction ? (
        <div className="institution-preferred-schedule-paragraph__delete-cell">{deleteAction}</div>
      ) : null}
    </div>
  )
}

export const INSTITUTION_PREFERRED_SCHEDULES_OVERLAY_KEY =
  'application.institution.preferredSchedules' as const

function isBlankScheduleBlock(block: ScheduleBlockState, dateOnlyPreferred = false): boolean {
  if (dateOnlyPreferred) return block.date == null
  return block.date == null && block.session == null && block.start == null && block.end == null
}

export function addInstitutionPreferredScheduleBlock(): void {
  const maxBlocks = resolveInstitutionPreferredScheduleMaxBlocks(
    getInstitutionApplicationProgramBridge()
  )
  updateGeneralApplicationOverlayKey<ScheduleBlockState[]>(
    INSTITUTION_PREFERRED_SCHEDULES_OVERLAY_KEY,
    prev => {
      const current = (prev ?? []) as ScheduleBlockState[]
      return current.length >= maxBlocks ? current : [...current, createEmptyBlockState()]
    }
  )
}

/** 카드 제목 줄 — 커리큘럼 복수+기간 희망 일정 설명 */
export function InstitutionPreferredScheduleCardDescription() {
  const bridge = useInstitutionApplicationProgramBridge()
  return <>{resolveInstitutionPreferredScheduleDescription(bridge)}</>
}

/** 카드 제목 우측 — 「+ 희망 교육 일정 추가」 */
export function InstitutionPreferredScheduleCardTitleTrailing({
  readOnly = false,
}: {
  readOnly?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  const [blocks] = useGeneralApplicationOverlayKv<ScheduleBlockState[]>(
    INSTITUTION_PREFERRED_SCHEDULES_OVERLAY_KEY,
    []
  )
  const maxBlocks = resolveInstitutionPreferredScheduleMaxBlocks(bridge)
  const atMax = blocks.length >= maxBlocks
  if (readOnly) return null
  return (
    <CmsButton
      type="button"
      variant="secondary"
      size="medium"
      disabled={atMax}
      icon={<ButtonAddIcon />}
      onClick={event => {
        event.stopPropagation()
        addInstitutionPreferredScheduleBlock()
      }} >
      희망 교육 일정 추가
    </CmsButton>
  )
}

/** 일반 프로그램 참여자 신청(학교·기관) — 희망 교육 일정 (모집 설정 상한·유형 연동) */
export function ProgramApplicationFormInstitutionPreferredScheduleParagraph({
  readOnlyPreview = false,
}: {
  readOnlyPreview?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  const maxBlocks = resolveInstitutionPreferredScheduleMaxBlocks(bridge)
  /** 프로그램 상세 신청 정보 미리보기 — 기본 노출은 1지망만 (추가는 헤더 버튼으로만) */
  const initialBlockCount = readOnlyPreview
    ? 1
    : resolveInstitutionPreferredScheduleInitialBlockCount(bridge)
  const showSessionSelect = shouldShowInstitutionApplicationPreferredScheduleSessionSelect(bridge)
  const dateOnlyPreferred = shouldShowInstitutionApplicationSchedulePeriodDateOnlyPreferred(bridge)
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
    INSTITUTION_PREFERRED_SCHEDULES_OVERLAY_KEY,
    []
  )

  useEffect(() => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>(
      INSTITUTION_PREFERRED_SCHEDULES_OVERLAY_KEY,
      prev => {
        const current = (prev ?? []) as ScheduleBlockState[]
        if (current.length >= initialBlockCount) return current
        if (
          current.length > 0 &&
          !current.every(block => isBlankScheduleBlock(block, dateOnlyPreferred))
        ) {
          return current
        }
        return [
          ...current,
          ...Array.from({ length: initialBlockCount - current.length }, () =>
            createEmptyBlockState()
          ),
        ]
      }
    )
  }, [
    initialBlockCount,
    bridge.educationStructure,
    bridge.sessionRound,
    bridge.educationScheduleMode,
    bridge.maxScheduleCount,
    dateOnlyPreferred,
  ])

  const displayBlocks = readOnlyPreview
    ? blocks.length === 0
      ? [createEmptyBlockState()]
      : blocks.slice(0, 1).map(coerceScheduleBlock)
    : blocks.length === 0
      ? Array.from({ length: initialBlockCount }, () => createEmptyBlockState())
      : blocks.slice(0, maxBlocks).map(coerceScheduleBlock)

  const patchBlock = (index: number, patch: Partial<ScheduleBlockState>) => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>(
      INSTITUTION_PREFERRED_SCHEDULES_OVERLAY_KEY,
      prev => {
        const current = (prev ?? []) as ScheduleBlockState[]
        return current.map((b, i) => (i === index ? { ...b, ...patch } : b))
      }
    )
  }

  const removeBlock = (index: number) => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>(
      INSTITUTION_PREFERRED_SCHEDULES_OVERLAY_KEY,
      prev => {
        const current = (prev ?? []) as ScheduleBlockState[]
        if (current.length <= 1) return [createEmptyBlockState()]
        return current.filter((_, i) => i !== index)
      }
    )
  }

  const blockTitle = (index: number) =>
    resolvePreferredScheduleBlockTitle(index, displayBlocks.length, maxBlocks)

  return (
    <div className="program-registration-paragraph institution-preferred-schedule-paragraph">
      {displayBlocks.map((block, index) => (
        <ScheduleBlock
          key={index}
          title={blockTitle(index)}
          block={block}
          onPatch={patch => patchBlock(index, patch)}
          sessionOptions={sessionOptions}
          showSessionSelect={showSessionSelect}
          dateOnlyPreferred={dateOnlyPreferred}
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
    </div>
  )
}
