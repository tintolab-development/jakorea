import { useMemo, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import {
  buildInstitutionSessionCountOptions,
  clampInstitutionScheduleBlockCount,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import {
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import {
  useGeneralApplicationOverlayKv,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
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

function PreferenceScheduleFields({
  block,
  onPatch,
  sessionOptions,
  showSessionSelect,
}: {
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
  sessionOptions: { value: string; label: string }[]
  showSessionSelect: boolean
}) {
  return (
    <>
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
              value={block.date}
              onChange={next => onPatch({ date: next })}
              width={240}
              style={{ flex: '0 0 240px', width: 240 }}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="희망 교육 시간"
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap institution-preferred-schedule-paragraph__time-inputs">
              {showSessionSelect ? (
                <>
                  <CmsSelect
                    inputSize="medium"
                    width={120}
                    withAllOption={false}
                    placeholder="희망 차시"
                    value={block.session}
                    onChange={value =>
                      onPatch({ session: value == null ? undefined : String(value) })
                    }
                    options={sessionOptions}
                  />
                  <DetailInfoForm.InputsSeparator />
                </>
              ) : null}
              <ParagraphTimePicker
                value={block.start}
                onChange={next => onPatch({ start: next, end: next == null ? null : block.end })}
                placeholder="수업 시작"
                width={168}
                showEndTimeToggle={false}
              />
              <span className="institution-preferred-schedule-paragraph__tilde">~</span>
              <ParagraphTimePicker
                value={block.end}
                onChange={next => onPatch({ end: next })}
                placeholder="수업 종료"
                width={168}
                showEndTimeToggle={false}
                disabled={block.start == null}
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
  deleteAction,
}: {
  title: string
  block: ScheduleBlockState
  onPatch: (patch: Partial<ScheduleBlockState>) => void
  sessionOptions: { value: string; label: string }[]
  showSessionSelect: boolean
  deleteAction?: ReactNode
}) {
  return (
    <div className="institution-preferred-schedule-paragraph__block-row">
      <div className="institution-preferred-schedule-paragraph__block-body">
        <div className="detail-info-form--text-bold institution-preferred-schedule-paragraph__block-title">
          {title}
        </div>
        <DetailInfoForm title={title} hideHeader mode="edit">
          <PreferenceScheduleFields
            block={block}
            onPatch={onPatch}
            sessionOptions={sessionOptions}
            showSessionSelect={showSessionSelect}
          />
        </DetailInfoForm>
      </div>
      {deleteAction ? (
        <div className="institution-preferred-schedule-paragraph__delete-cell">{deleteAction}</div>
      ) : null}
    </div>
  )
}

/** 일반 프로그램 참여자 신청(학교·기관) — 희망 교육 일정 (모집 설정 상한·유형 연동) */
export function ProgramApplicationFormInstitutionPreferredScheduleParagraph({
  readOnlyPreview = false,
}: {
  readOnlyPreview?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  const maxBlocks = clampInstitutionScheduleBlockCount(bridge.maxScheduleCount)
  const showSessionSelect = shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)
  const sessionOptions = useMemo(
    () => buildInstitutionSessionCountOptions(bridge.maxSessionsPerDay),
    [bridge.maxSessionsPerDay]
  )

  const [blocks] = useGeneralApplicationOverlayKv<ScheduleBlockState[]>(
    'application.institution.preferredSchedules',
    []
  )

  useMemo(() => {
    if (blocks.length === 0) {
      updateGeneralApplicationOverlayKey<ScheduleBlockState[]>(
        'application.institution.preferredSchedules',
        () => Array.from({ length: 1 }, () => createEmptyBlockState())
      )
    }
  }, [blocks.length])

  const visibleBlockCount = Math.min(Math.max(blocks.length, 1), maxBlocks)
  const displayBlocks = blocks.slice(0, visibleBlockCount)

  const patchBlock = (index: number, patch: Partial<ScheduleBlockState>) => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>(
      'application.institution.preferredSchedules',
      prev => {
        const current = (prev ?? []) as ScheduleBlockState[]
        return current.map((b, i) => (i === index ? { ...b, ...patch } : b))
      }
    )
  }

  const removeBlock = (index: number) => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>(
      'application.institution.preferredSchedules',
      prev => {
        const current = (prev ?? []) as ScheduleBlockState[]
        if (current.length <= 1) return [createEmptyBlockState()]
        return current.filter((_, i) => i !== index)
      }
    )
  }

  const addBlock = () => {
    updateGeneralApplicationOverlayKey<ScheduleBlockState[]>('application.institution.preferredSchedules', prev => {
      const current = (prev ?? []) as ScheduleBlockState[]
      return current.length >= maxBlocks ? current : [...current, createEmptyBlockState()]
    })
  }

  return (
    <div className="program-registration-paragraph institution-preferred-schedule-paragraph">
      <div className="institution-preferred-schedule-paragraph__header">
        {readOnlyPreview || displayBlocks.length >= maxBlocks ? (
          <span />
        ) : (
          <CmsButton size="small" onClick={addBlock}>
            + 희망 교육 일정 추가
          </CmsButton>
        )}
      </div>
      {displayBlocks.map((block, index) => (
        <ScheduleBlock
          key={index}
          title={`■ ${index + 1}지망`}
          block={block}
          onPatch={patch => patchBlock(index, patch)}
          sessionOptions={sessionOptions}
          showSessionSelect={showSessionSelect}
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
