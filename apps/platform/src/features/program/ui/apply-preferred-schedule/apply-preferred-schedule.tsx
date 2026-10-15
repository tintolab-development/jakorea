import { useState, type MouseEvent } from 'react'
import {
  PFButton,
  PFDateInput,
  PFItemDeleteButton,
  PFSelect,
  PFText,
  PFTextInput,
  type PFSelectOption,
} from '@/shared/ui'
import { resolvePreferredScheduleBlockTitle } from '@jakorea/form-schema/program-application'
import styles from './apply-preferred-schedule.module.css'

export type ApplyPreferredScheduleBlock = {
  date: string
  classPeriod: string
  /** `HH:mm` */
  startTime: string
  /** `HH:mm` */
  endTime: string
}

function createEmptyBlock(): ApplyPreferredScheduleBlock {
  return { date: '', classPeriod: '', startTime: '', endTime: '' }
}

/** Platform DS에 전용 시간 모달은 없고, CMS ParagraphTimePicker에 대응해 PFSelect(HH:mm) 드롭다운을 쓴다. */
function buildPreferredScheduleTimeOptions(): PFSelectOption[] {
  const options: PFSelectOption[] = []
  for (let hour = 7; hour <= 22; hour += 1) {
    for (let minute = 0; minute < 60; minute += 5) {
      if (hour === 22 && minute > 0) break
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      options.push({ value, label: value })
    }
  }
  return options
}

const PREFERRED_SCHEDULE_TIME_OPTIONS = buildPreferredScheduleTimeOptions()

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

function timeSelectOptionsFor(value: string): PFSelectOption[] {
  const normalized = normalizeHHmm(value)
  if (!normalized) return PREFERRED_SCHEDULE_TIME_OPTIONS
  if (PREFERRED_SCHEDULE_TIME_OPTIONS.some(option => option.value === normalized)) {
    return PREFERRED_SCHEDULE_TIME_OPTIONS
  }
  return [{ value: normalized, label: normalized }, ...PREFERRED_SCHEDULE_TIME_OPTIONS]
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
      + 희망 교육 일정 추가
    </PFButton>
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
  showFooterAddButton = false,
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
        const startTime = normalizeHHmm(block.startTime)
        const endTime = normalizeHHmm(block.endTime)
        const rankTitle = resolvePreferredScheduleBlockTitle(index, displayBlocks.length, cap)
        return (
          <div key={index} className={styles.block}>
            <div className={styles.blockBody}>
              {rankTitle ? (
                <PFText as="p" typo="bd-md-md" color="black" className={styles.title}>
                  {rankTitle}
                </PFText>
              ) : null}
              <div className={styles.field}>
                <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.fieldLabel}>
                  희망 교육일
                </PFText>
                <PFDateInput
                  variant="formPage"
                  size="large"
                  picker="date"
                  placeholder="희망 교육 날짜를 선택하세요"
                  value={block.date}
                  minDate={minDate}
                  maxDate={maxDate}
                  enabledDates={enabledDates}
                  onValueChange={next => patchBlock(index, { date: next })}
                />
              </div>
              <div className={styles.field}>
                <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.fieldLabel}>
                  {showSessionSelect && !dateOnlyPreferred
                    ? '희망 교육 시간'
                    : '1차시 희망 교육 시간'}
                </PFText>
                <div className={styles.timeRow}>
                  {showSessionSelect && !dateOnlyPreferred ? (
                    <PFSelect
                      variant="formPage"
                      size="large"
                      width={120}
                      placeholder="희망 차시"
                      options={sessionOptions}
                      value={block.classPeriod || undefined}
                      onValueChange={next => patchBlock(index, { classPeriod: next ?? '' })}
                      aria-label="희망 차시"
                      disabled={dateOnlyPreferred}
                    />
                  ) : dateOnlyPreferred ? null : (
                    <>
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={120}
                        inputMode="numeric"
                        placeholder="수업 진행 교시"
                        value={block.classPeriod}
                        onValueChange={next =>
                          patchBlock(index, { classPeriod: next.replace(/[^\d]/g, '') })
                        }
                      />
                      <PFText as="span" typo="bd-md-md" color="black" className={styles.timeUnit}>
                        교시
                      </PFText>
                    </>
                  )}
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={140}
                    placeholder={showSessionSelect && !dateOnlyPreferred ? '수업 시작' : '시작 시간'}
                    options={timeSelectOptionsFor(startTime)}
                    value={startTime}
                    onValueChange={next => patchBlock(index, { startTime: next })}
                    aria-label="시작 시간"
                    disabled={dateOnlyPreferred}
                  />
                  <PFText as="span" typo="bd-md-md" color="neutral-cool-500" className={styles.timeUnit}>
                    ~
                  </PFText>
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={140}
                    placeholder={showSessionSelect && !dateOnlyPreferred ? '수업 종료' : '종료 시간'}
                    options={timeSelectOptionsFor(endTime)}
                    value={endTime}
                    onValueChange={next => patchBlock(index, { endTime: next })}
                    aria-label="종료 시간"
                    disabled={dateOnlyPreferred}
                  />
                  </div>
                </div>
            </div>
            {index > 0 ? (
              <div className={styles.delete}>
                <PFItemDeleteButton
                  aria-label={`${index + 1}지망 삭제`}
                  onClick={() => removeBlock(index)}
                />
              </div>
            ) : null}
          </div>
        )
      })}
      {showFooterAddButton && displayBlocks.length < cap ? (
        <ApplyPreferredScheduleAddButton onClick={addBlock} />
      ) : null}
    </div>
  )
}
