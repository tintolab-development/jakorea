import { DetailInfoForm } from '@/features/form-template'
import { PFDateInput, PFSelect, PFText, PFTextInput, PFTimeInput } from '@/shared/ui'
import { resolvePreferredScheduleBlockTitle } from '@jakorea/form-schema/program-application'
import { clampEducationScheduleApplyConstraint } from '../../lib/apply-form-schedule'
import {
  ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT,
  createEmptyEconomyPreferredScheduleBlock,
  resolveEconomySecondClassPeriod,
  type EconomyPreferredScheduleBlock,
  type EconomyPreferredScheduleSession,
} from '../../lib/economy-preferred-schedule'
import styles from './apply-economy-preferred-schedule.module.css'

/** CMS `1c-1s/paragraphs/preferred-schedule-paragraph.tsx` SESSION_OPTIONS */
const SESSION_OPTIONS = [
  { value: '1', label: '1차시' },
  { value: '2', label: '2차시' },
]

type TimeRowProps = {
  label: string
  classPeriod: string
  start: string
  end: string
  onClassPeriodChange?: (next: string) => void
  onStartChange: (next: string) => void
  onEndChange: (next: string) => void
  classPeriodDisabled?: boolean
  note?: string
}

/** CMS `ScheduleTimeRow` — 교시 + 시작~종료 (+ 안내) */
function ScheduleTimeRow({
  label,
  classPeriod,
  start,
  end,
  onClassPeriodChange,
  onStartChange,
  onEndChange,
  classPeriodDisabled = false,
  note,
}: TimeRowProps) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        fullRow
        view="-"
        edit={
          <div className={`detail-info-form-inputs-wrapper-no-gap ${styles.inputs}`}>
            <PFTextInput
              variant="formPage"
              size="large"
              width={120}
              inputMode="numeric"
              placeholder="수업 진행 교시"
              aria-label={`${label} 교시`}
              value={classPeriod}
              disabled={classPeriodDisabled}
              onValueChange={next => onClassPeriodChange?.(next.replace(/[^\d]/g, ''))}
            />
            <PFText as="span" typo="bd-md-md" color="black" className={styles.unit}>
              교시
            </PFText>
            <DetailInfoForm.InputsSeparator />
            <PFTimeInput
              placeholder="수업 시작"
              aria-label={`${label} 시작`}
              value={start}
              onValueChange={onStartChange}
              width={168}
              className={styles.timePicker}
            />
            <PFText as="span" typo="bd-md-md" color="neutral-cool-500" className={styles.tilde}>
              ~
            </PFText>
            <PFTimeInput
              placeholder="수업 종료"
              aria-label={`${label} 종료`}
              value={end}
              onValueChange={onEndChange}
              width={168}
              className={styles.timePicker}
            />
            {note ? (
              <PFText as="span" typo="bd-sm-md" color="neutral-cool-500" className={styles.note}>
                {note}
              </PFText>
            ) : null}
          </div>
        }
      />
    </DetailInfoForm.Row>
  )
}

type BlockProps = {
  title: string
  block: EconomyPreferredScheduleBlock
  onPatch: (patch: Partial<EconomyPreferredScheduleBlock>) => void
  minDate?: string | null
  maxDate?: string | null
  enabledDates?: ReadonlySet<string> | null
  disabled?: boolean
}

function ScheduleBlock({
  title,
  block,
  onPatch,
  minDate,
  maxDate,
  enabledDates,
  disabled = false,
}: BlockProps) {
  const secondClassPeriod = resolveEconomySecondClassPeriod(block.firstClassPeriod)
  return (
    <div className={styles.block}>
      <PFText as="p" typo="bd-md-sb" color="black" className={styles.blockTitle}>
        {title}
      </PFText>
      <DetailInfoForm title={title} hideHeader mode="edit" className={styles.scheduleForm}>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="희망 교육일 및 차시"
            fullRow
            view="-"
            edit={
              <div className={`detail-info-form-inputs-wrapper-no-gap ${styles.inputs}`}>
                <PFDateInput
                  variant="formPage"
                  size="large"
                  picker="date"
                  width={240}
                  className={styles.datePicker}
                  placeholder="희망 교육 날짜를 선택해 주세요"
                  value={block.date}
                  minDate={minDate}
                  maxDate={maxDate}
                  enabledDates={enabledDates}
                  disabled={disabled}
                  onValueChange={next => onPatch({ date: next })}
                />
                <DetailInfoForm.InputsSeparator />
                <PFSelect
                  variant="formPage"
                  size="large"
                  width={120}
                  className={styles.sessionSelect}
                  placeholder="희망 차시"
                  aria-label={`${title} 희망 차시`}
                  options={SESSION_OPTIONS}
                  value={block.session || undefined}
                  disabled={disabled}
                  onValueChange={next =>
                    onPatch({
                      session: (next === '1' || next === '2'
                        ? next
                        : '') as EconomyPreferredScheduleSession,
                    })
                  }
                />
              </div>
            }
          />
        </DetailInfoForm.Row>
        <ScheduleTimeRow
          label="1차시 희망 교육 시간"
          classPeriod={block.firstClassPeriod}
          start={block.firstStart}
          end={block.firstEnd}
          onClassPeriodChange={next => onPatch({ firstClassPeriod: next })}
          onStartChange={next => onPatch({ firstStart: next })}
          onEndChange={next => onPatch({ firstEnd: next })}
        />
        {block.session === '2' ? (
          <ScheduleTimeRow
            label="2차시 희망 교육 시간"
            classPeriod={secondClassPeriod}
            start={block.secondStart}
            end={block.secondEnd}
            onStartChange={next => onPatch({ secondStart: next })}
            onEndChange={next => onPatch({ secondEnd: next })}
            classPeriodDisabled
            note="※ 1차시가 진행되는 교시의 다음 수업 시간을 작성해 주세요."
          />
        ) : null}
      </DetailInfoForm>
    </div>
  )
}

type Props = {
  value: EconomyPreferredScheduleBlock[]
  onChange: (next: EconomyPreferredScheduleBlock[]) => void
  minDate?: string | null
  maxDate?: string | null
  enabledDates?: ReadonlySet<string> | null
  disabled?: boolean
}

/** 1사1교 진행 희망 교육 일정 — 1·2지망 고정 (추가·삭제 없음) */
export function ApplyEconomyPreferredSchedule({
  value,
  onChange,
  minDate = null,
  maxDate = null,
  enabledDates = null,
  disabled = false,
}: Props) {
  const blocks = Array.from(
    { length: ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT },
    (_, index) => value[index] ?? createEmptyEconomyPreferredScheduleBlock()
  )
  const patchBlock = (index: number, patch: Partial<EconomyPreferredScheduleBlock>) => {
    onChange(blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)))
  }
  const selectable = clampEducationScheduleApplyConstraint({
    minDate,
    maxDate,
    enabledDates,
    configured: true,
  })
  return (
    <div className={styles.root}>
      {blocks.map((block, index) => (
        <ScheduleBlock
          key={index}
          title={
            resolvePreferredScheduleBlockTitle(
              index,
              ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT,
              ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT
            ) || `■ ${index + 1}지망`
          }
          block={block}
          onPatch={patch => patchBlock(index, patch)}
          minDate={selectable.minDate}
          maxDate={selectable.maxDate}
          enabledDates={selectable.enabledDates}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
