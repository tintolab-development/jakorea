import { useState, type MouseEvent } from 'react'
import { DetailInfoForm } from '@/features/form-template'
import {
  PFButton,
  PFDateInput,
  PFItemDeleteButton,
  PFSelect,
  PFText,
  PFTextInput,
  PFTimeInput,
  type PFSelectOption,
} from '@/shared/ui'
import { resolvePreferredScheduleBlockTitle } from '@jakorea/form-schema/program-application'
import styles from './apply-preferred-schedule.module.css'

export type ApplyPreferredScheduleBlock = {
  date: string
  scheduleOptionId?: string
  session?: string
  classPeriod: string
  /** `HH:mm` */
  startTime: string
  /** `HH:mm` */
  endTime: string
}

function createEmptyBlock(): ApplyPreferredScheduleBlock {
  return { date: '', classPeriod: '', startTime: '', endTime: '' }
}

function normalizeHHmm(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return trimmed
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return trimmed
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return trimmed
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

type ApplyPreferredScheduleAddButtonProps = {
  onClick: () => void
  disabled?: boolean
}

/** 단락 카드 제목 우측 — CMS `InstitutionPreferredScheduleCardTitleTrailing` 대응 */
export function ApplyPreferredScheduleAddButton({
  onClick,
  disabled = false,
}: ApplyPreferredScheduleAddButtonProps) {
  return (
    <PFButton
      type="button"
      variant="secondary"
      size="medium"
      className={styles.headerAddButton}
      disabled={disabled}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <span className={styles.addButtonLabel}>
        <span className={styles.addButtonIcon} aria-hidden />
        희망 교육 일정 추가
      </span>
    </PFButton>
  )
}

type PreferenceScheduleFieldsProps = {
  block: ApplyPreferredScheduleBlock
  onPatch: (patch: Partial<ApplyPreferredScheduleBlock>) => void
  minDate: string | null
  maxDate: string | null
  enabledDates: ReadonlySet<string> | null
  showSessionSelect: boolean
  sessionOptions: PFSelectOption[]
  dateOnlyPreferred: boolean
  disabled: boolean
  disabledOptionValues: ReadonlySet<string>
  fixedScheduleOptions: readonly {
    value: string
    label: string
    date: string
    classPeriod: string
    startTime: string
    endTime: string
    session?: string
  }[]
}

/** CMS `PreferenceScheduleFields` — DetailInfoForm 격자(희망 교육일 | 희망 교육 시간) */
function PreferenceScheduleFields({
  block,
  onPatch,
  minDate,
  maxDate,
  enabledDates,
  showSessionSelect,
  sessionOptions,
  dateOnlyPreferred,
  disabled,
  disabledOptionValues,
  fixedScheduleOptions,
}: PreferenceScheduleFieldsProps) {
  const startTime = normalizeHHmm(block.startTime)
  const endTime = normalizeHHmm(block.endTime)
  const timeLabel = showSessionSelect ? '희망 교육 시간' : '1차시 희망 교육 시간'

  const dateField = fixedScheduleOptions.length > 0 ? (
    <DetailInfoForm.Field
      label="희망 교육 일정"
      view="-"
      edit={
        <PFSelect
          variant="formPage"
          size="large"
          width={420}
          placeholder="희망 교육 일정을 선택하세요"
          options={fixedScheduleOptions.map(option => ({
            value: option.value,
            label: option.label,
            disabled: disabledOptionValues.has(option.value),
          }))}
          value={block.scheduleOptionId}
          disabled={disabled}
          onValueChange={next => {
            const selected = fixedScheduleOptions.find(option => option.value === next)
            if (!selected) return
            onPatch({
              scheduleOptionId: selected.value,
              session: selected.session,
              date: selected.date,
              classPeriod: selected.classPeriod,
              startTime: selected.startTime,
              endTime: selected.endTime,
            })
          }}
        />
      }
    />
  ) : (
    <DetailInfoForm.Field
      label="희망 교육일"
      view="-"
      edit={
        <PFDateInput
          variant="formPage"
          size="large"
          picker="date"
          width={220}
          className={styles.datePicker}
          placeholder="희망 교육 날짜를 선택하세요"
          value={block.date}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          enabledDates={enabledDates}
          onValueChange={next => onPatch({ date: next })}
        />
      }
    />
  )

  if (fixedScheduleOptions.length > 0) {
    return <DetailInfoForm.Row type="single">{dateField}</DetailInfoForm.Row>
  }

  if (dateOnlyPreferred) {
    return <DetailInfoForm.Row type="single">{dateField}</DetailInfoForm.Row>
  }

  return (
    <DetailInfoForm.Row type="double">
      {dateField}
      <DetailInfoForm.Field
        label={timeLabel}
        view="-"
        edit={
          <div className={`detail-info-form-inputs-wrapper-no-gap ${styles.timeInputs}`}>
            {showSessionSelect && !dateOnlyPreferred ? (
              <>
                <PFSelect
                  variant="formPage"
                  size="large"
                  width={140}
                  className={styles.sessionSelect}
                  placeholder="희망 차시"
                  options={sessionOptions}
                  value={block.classPeriod || undefined}
                  disabled={disabled}
                  onValueChange={next => onPatch({ classPeriod: next ?? '' })}
                  aria-label="희망 차시"
                />
                <DetailInfoForm.InputsSeparator />
              </>
            ) : (
              <>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={120}
                  inputMode="numeric"
                  placeholder="수업 진행 교시"
                  value={block.classPeriod}
                  disabled={disabled}
                  onValueChange={next =>
                    onPatch({ classPeriod: next.replace(/[^\d]/g, '') })
                  }
                />
                <PFText as="span" typo="bd-md-md" color="black" className={styles.timeUnit}>
                  교시
                </PFText>
                <DetailInfoForm.InputsSeparator />
              </>
            )}
            <PFTimeInput
              placeholder={showSessionSelect ? '수업 시작' : '시작 시간'}
              value={startTime}
              onValueChange={next => onPatch({ startTime: next })}
              aria-label="시작 시간"
              disabled={disabled}
              className={styles.timePicker}
            />
            <PFText as="span" typo="bd-md-md" color="neutral-cool-500" className={styles.tilde}>
              ~
            </PFText>
            <PFTimeInput
              placeholder={showSessionSelect ? '수업 종료' : '종료 시간'}
              value={endTime}
              onValueChange={next => onPatch({ endTime: next })}
              aria-label="종료 시간"
              disabled={disabled}
              className={styles.timePicker}
            />
          </div>
        }
      />
    </DetailInfoForm.Row>
  )
}

type ApplyPreferredScheduleProps = {
  maxBlocks: number
  value?: ApplyPreferredScheduleBlock[]
  onChange?: (blocks: ApplyPreferredScheduleBlock[]) => void
  /** false면 하단 추가 버튼 숨김 (제목 trailing만 쓸 때) */
  showFooterAddButton?: boolean
  /** 희망 교육일 선택 최소 `YYYY-MM-DD`. null이면 제한 없음 */
  minDate?: string | null
  /** 희망 교육일 선택 최대 `YYYY-MM-DD`. null이면 제한 없음 */
  maxDate?: string | null
  /** 지정 시 이 날짜만 선택 가능 (교육 예정일 구간 합집합) */
  enabledDates?: ReadonlySet<string> | null
  /** 기관 복수+기간 — 모집 1일 최대 차시 희망 차시 셀렉 (CMS institution preferred) */
  showSessionSelect?: boolean
  sessionOptions?: PFSelectOption[]
  /** 일정형 단일 기간 — 희망 교육일만 */
  dateOnlyPreferred?: boolean
  /** 날짜 지정형 교육받은 교사 — 서버 등록 일정 선택지 */
  fixedScheduleOptions?: readonly {
    value: string
    label: string
    date: string
    classPeriod: string
    startTime: string
    endTime: string
    session?: string
  }[]
  /** runtime 일정 계약이 없을 때 일정 입력을 fail-closed 한다. */
  disabled?: boolean
}

export function ApplyPreferredSchedule({
  maxBlocks,
  value,
  onChange,
  minDate = null,
  maxDate = null,
  enabledDates = null,
  showSessionSelect = false,
  sessionOptions = [],
  dateOnlyPreferred = false,
  fixedScheduleOptions = [],
  showFooterAddButton = false,
  disabled = false,
}: ApplyPreferredScheduleProps) {
  const cap = Math.max(1, Math.min(maxBlocks, 10))
  const [uncontrolled, setUncontrolled] = useState<ApplyPreferredScheduleBlock[]>(() => [
    createEmptyBlock(),
  ])
  const blocks = value ?? uncontrolled
  const setBlocks = (next: ApplyPreferredScheduleBlock[]) => {
    if (onChange) onChange(next)
    else setUncontrolled(next)
  }

  const displayBlocks = blocks.slice(0, cap)

  const patchBlock = (index: number, patch: Partial<ApplyPreferredScheduleBlock>) => {
    setBlocks(blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)))
  }

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) {
      setBlocks([createEmptyBlock()])
      return
    }
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  const addBlock = () => {
    if (blocks.length >= cap) return
    setBlocks([...blocks, createEmptyBlock()])
  }

  return (
    <div className={styles.root}>
      {displayBlocks.map((block, index) => {
        const rankTitle = resolvePreferredScheduleBlockTitle(index, displayBlocks.length, cap)
        return (
          <div key={index} className={styles.blockRow}>
            <div className={styles.blockBody}>
              {rankTitle ? (
                <PFText as="p" typo="bd-md-sb" color="black" className={styles.blockTitle}>
                  {rankTitle}
                </PFText>
              ) : null}
              <DetailInfoForm
                title={rankTitle || '희망 교육 일정'}
                hideHeader
                mode="edit"
                className={styles.scheduleForm}
              >
                <PreferenceScheduleFields
                  block={block}
                  onPatch={patch => patchBlock(index, patch)}
                  minDate={minDate}
                  maxDate={maxDate}
                  enabledDates={enabledDates}
                  showSessionSelect={showSessionSelect}
                  sessionOptions={sessionOptions}
                  dateOnlyPreferred={dateOnlyPreferred}
                  disabled={disabled}
                  disabledOptionValues={new Set(
                    displayBlocks
                      .filter((_, selectedIndex) => selectedIndex !== index)
                      .map(selectedBlock => selectedBlock.scheduleOptionId?.trim())
                      .filter((value): value is string => Boolean(value))
                  )}
                  fixedScheduleOptions={fixedScheduleOptions}
                />
              </DetailInfoForm>
            </div>
            {index > 0 ? (
              <div className={styles.deleteCell}>
                <PFItemDeleteButton
                  aria-label={`${index + 1}지망 삭제`}
                  onClick={() => removeBlock(index)}
                />
              </div>
            ) : null}
          </div>
        )
      })}
      {showFooterAddButton ? (
        <ApplyPreferredScheduleAddButton
          onClick={addBlock}
          disabled={displayBlocks.length >= cap}
        />
      ) : null}
    </div>
  )
}
