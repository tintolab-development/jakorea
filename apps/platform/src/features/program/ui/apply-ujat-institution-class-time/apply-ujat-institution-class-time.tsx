import {
  PFCheckbox,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormPeriodPair,
  PFFormPeriodTilde,
  PFItemDeleteButton,
  PFText,
  PFTimeInput,
} from '@/shared/ui'
import formStyles from '@/shared/ui/pf-form/pf-form.module.css'
import hostStyles from '../apply-form-field-host.module.css'
import type { ApplyUjatGradeBlock } from '../apply-ujat-institution-grade-info/apply-ujat-institution-grade-info'
import blockStyles from '../apply-preferred-schedule/apply-preferred-schedule.module.css'
import styles from './apply-ujat-institution-class-time.module.css'

const PERIOD_IDS = ['period1', 'period2', 'period3', 'period4'] as const

export type ApplyUjatClassTimePeriod = { start: string; end: string }

export type ApplyUjatClassTimeBlock = {
  id: string
  checkedGrades: Record<string, boolean>
  periods: Record<string, ApplyUjatClassTimePeriod>
}

type ApplyUjatInstitutionClassTimeProps = {
  value: ApplyUjatClassTimeBlock[]
  onChange: (next: ApplyUjatClassTimeBlock[]) => void
  gradeBlocks: ApplyUjatGradeBlock[]
}

function uniqueGrades(gradeBlocks: ApplyUjatGradeBlock[]): string[] {
  return [...new Set(gradeBlocks.map(block => block.grade).filter(Boolean))]
}

function createClassTimeBlock(index: number): ApplyUjatClassTimeBlock {
  return { id: `ujat-class-time-${index + 1}`, checkedGrades: {}, periods: {} }
}

export function emptyUjatInstitutionClassTimeBlocks(): ApplyUjatClassTimeBlock[] {
  return [createClassTimeBlock(0)]
}

export function appendUjatInstitutionClassTimeBlock(
  blocks: ApplyUjatClassTimeBlock[],
): ApplyUjatClassTimeBlock[] {
  return [...blocks, createClassTimeBlock(blocks.length)]
}

export function findIncompleteUjatInstitutionClassTimeMessage(
  blocks: ApplyUjatClassTimeBlock[],
  gradeBlocks: ApplyUjatGradeBlock[],
): string | null {
  const grades = uniqueGrades(gradeBlocks)
  if (grades.length === 0) return '학년 별 신청 정보를 먼저 입력해 주세요.'
  for (const [index, block] of blocks.entries()) {
    const checked = grades.filter(grade => block.checkedGrades[grade])
    if (checked.length === 0) {
      return `수업 시간 ${String(index + 1).padStart(2, '0')}의 해당 학년을 선택해 주세요.`
    }
    const hasPeriod = PERIOD_IDS.some(periodId => {
      const period = block.periods[periodId]
      return Boolean(period?.start && period?.end)
    })
    if (!hasPeriod) {
      return `수업 시간 ${String(index + 1).padStart(2, '0')}의 교시 시간을 입력해 주세요.`
    }
  }
  return null
}

export function ujatInstitutionClassTimeAnswerFromValues(
  blocks: ApplyUjatClassTimeBlock[],
  gradeBlocks: ApplyUjatGradeBlock[],
): Record<string, unknown> {
  const grades = uniqueGrades(gradeBlocks)
  const checkedByBlock: Record<string, Record<string, boolean>> = {}
  const periodsByBlock: Record<string, Record<string, { start: string | null; end: string | null }>> =
    {}
  const classTimeRows = blocks.map(block => {
    checkedByBlock[block.id] = Object.fromEntries(
      grades.map(grade => [grade, block.checkedGrades[grade] === true]),
    )
    periodsByBlock[block.id] = Object.fromEntries(
      PERIOD_IDS.map(periodId => [
        periodId,
        {
          start: block.periods[periodId]?.start || null,
          end: block.periods[periodId]?.end || null,
        },
      ]),
    )
    const selectedGrades = grades.filter(grade => block.checkedGrades[grade])
    return {
      id: block.id,
      gradeValues: selectedGrades,
      gradeRangeLabel: selectedGrades.map(grade => `${grade}학년`).join(', '),
      periods: PERIOD_IDS.flatMap(periodId => {
        const period = block.periods[periodId]
        if (!period?.start || !period.end) return []
        return [{ periodLabel: `${periodId.replace('period', '')}교시`, start: period.start, end: period.end }]
      }),
    }
  })
  return {
    classTimeRows,
    ujatApplication: {
      classTimeCheckedByBlock: checkedByBlock,
      classTimePeriodsByBlock: periodsByBlock,
    },
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function normalizeClassPeriodClock(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed === '00:00') return ''
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return trimmed
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return ''
  if (hour === 0 && minute === 0) return ''
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function periodIdFromLabel(label: string, index: number): string {
  const matched = label.match(/(\d+)/)
  const number = matched?.[1] ?? String(index + 1)
  return `period${number}`
}

function periodsFromRaw(
  rawPeriods: unknown,
): Record<string, ApplyUjatClassTimePeriod> {
  const periods: Record<string, ApplyUjatClassTimePeriod> = {}
  if (Array.isArray(rawPeriods)) {
    rawPeriods.forEach((item, index) => {
      const period = asRecord(item)
      const label =
        typeof period?.periodLabel === 'string'
          ? period.periodLabel
          : typeof period?.classPeriod === 'string'
            ? period.classPeriod
            : ''
      const periodId = periodIdFromLabel(label || String(index + 1), index)
      const start = normalizeClassPeriodClock(period?.start ?? period?.startAt)
      const end = normalizeClassPeriodClock(period?.end ?? period?.endAt)
      if (!start && !end) return
      periods[periodId] = { start, end }
    })
    return periods
  }
  const record = asRecord(rawPeriods)
  if (!record) return periods
  for (const [periodId, raw] of Object.entries(record)) {
    const period = asRecord(raw)
    const start = normalizeClassPeriodClock(period?.start ?? period?.startAt ?? raw)
    const end = normalizeClassPeriodClock(period?.end ?? period?.endAt)
    if (!start && !end) continue
    periods[periodId.startsWith('period') ? periodId : periodIdFromLabel(periodId, 0)] = {
      start,
      end,
    }
  }
  return periods
}

export function ujatInstitutionClassTimeValuesFromDraftAnswer(
  answer: unknown,
): ApplyUjatClassTimeBlock[] | null {
  const record = asRecord(answer)
  if (!record) return null
  const nested = asRecord(record.ujatApplication)
  const checkedByBlock = asRecord(
    nested?.classTimeCheckedByBlock ??
      record['ujatApplication.classTimeCheckedByBlock'] ??
      record.classTimeCheckedByBlock,
  )
  const periodsByBlock = asRecord(
    nested?.classTimePeriodsByBlock ??
      record['ujatApplication.classTimePeriodsByBlock'] ??
      record.classTimePeriodsByBlock,
  )
  const list = Array.isArray(record.classTimeRows) ? record.classTimeRows : null
  if (list && list.length > 0) {
    return list.map((row, index) => {
      const item = asRecord(row)
      const id = String(item?.id ?? `ujat-class-time-${index + 1}`)
      const grades = Array.isArray(item?.gradeValues)
        ? item.gradeValues.map(value => String(value))
        : []
      const fromRow = periodsFromRaw(item?.periods)
      const fromByBlock = periodsFromRaw(periodsByBlock?.[id])
      return {
        id,
        checkedGrades: Object.fromEntries(grades.map(grade => [grade, true])),
        periods: { ...fromByBlock, ...fromRow },
      }
    })
  }
  if (!checkedByBlock && !periodsByBlock) return null
  const ids = [...new Set([...Object.keys(checkedByBlock ?? {}), ...Object.keys(periodsByBlock ?? {})])]
  if (ids.length === 0) return null
  return ids.map(id => {
    return {
      id,
      checkedGrades: (asRecord(checkedByBlock?.[id]) ?? {}) as Record<string, boolean>,
      periods: periodsFromRaw(periodsByBlock?.[id]),
    }
  })
}

function PeriodTimePair({
  start,
  end,
  onChange,
}: {
  start: string
  end: string
  onChange: (next: ApplyUjatClassTimePeriod) => void
}) {
  return (
    <PFFormPeriodPair className={[formStyles.periodPairFill, styles.periodPair].join(' ')}>
      <PFTimeInput
        variant="formPage"
        size="large"
        width="100%"
        placeholder="수업 시작"
        value={start}
        onValueChange={next => onChange({ start: next, end })}
      />
      <PFFormPeriodTilde />
      <PFTimeInput
        variant="formPage"
        size="large"
        width="100%"
        placeholder="수업 종료"
        value={end}
        onValueChange={next => onChange({ start, end: next })}
      />
    </PFFormPeriodPair>
  )
}

export function ApplyUjatInstitutionClassTime({
  value,
  onChange,
  gradeBlocks,
}: ApplyUjatInstitutionClassTimeProps) {
  const grades = uniqueGrades(gradeBlocks)

  const patchBlock = (id: string, partial: Partial<ApplyUjatClassTimeBlock>) => {
    onChange(value.map(block => (block.id === id ? { ...block, ...partial } : block)))
  }

  const toggleGrade = (blockId: string, grade: string, checked: boolean) => {
    onChange(
      value.map(block => {
        if (block.id === blockId) {
          return { ...block, checkedGrades: { ...block.checkedGrades, [grade]: checked } }
        }
        if (checked && block.checkedGrades[grade]) {
          return { ...block, checkedGrades: { ...block.checkedGrades, [grade]: false } }
        }
        return block
      }),
    )
  }

  const patchPeriod = (
    block: ApplyUjatClassTimeBlock,
    periodId: string,
    next: ApplyUjatClassTimePeriod,
  ) => {
    patchBlock(block.id, {
      periods: { ...block.periods, [periodId]: next },
    })
  }

  return (
    <div className={blockStyles.root}>
      {value.map((block, blockIndex) => {
        const eligible = grades.filter(grade => {
          const takenElsewhere = value.some(
            other => other.id !== block.id && other.checkedGrades[grade],
          )
          return !takenElsewhere
        })
        const allChecked = eligible.length > 0 && eligible.every(grade => block.checkedGrades[grade])
        const rankTitle = `수업 진행 시간 ${String(blockIndex + 1).padStart(2, '0')}`
        return (
          <div key={block.id} className={blockStyles.blockRow}>
            <div className={blockStyles.blockBody}>
              <PFText as="p" typo="bd-md-sb" color="black" className={blockStyles.blockTitle}>
                {rankTitle}
              </PFText>
              <PFFormFieldTable className={[styles.table, hostStyles.root].join(' ')}>
                <PFFormFieldRow type="single">
                  <PFFormField label="해당 학년" fullWidth>
                    <div className={styles.gradeRow}>
                      <PFCheckbox
                        checked={allChecked}
                        disabled={eligible.length === 0}
                        onCheckedChange={nextChecked => {
                          const next = { ...block.checkedGrades }
                          for (const grade of eligible) next[grade] = nextChecked
                          patchBlock(block.id, { checkedGrades: next })
                        }}
                      >
                        전체
                      </PFCheckbox>
                      {grades.map(grade => {
                        const disabled = value.some(
                          other => other.id !== block.id && other.checkedGrades[grade],
                        )
                        return (
                          <PFCheckbox
                            key={`${block.id}-${grade}`}
                            checked={block.checkedGrades[grade] === true}
                            disabled={disabled}
                            onCheckedChange={nextChecked =>
                              toggleGrade(block.id, grade, nextChecked)
                            }
                          >
                            {grade}학년
                          </PFCheckbox>
                        )
                      })}
                    </div>
                  </PFFormField>
                </PFFormFieldRow>
                <PFFormFieldRow type="double" className={styles.compactPeriodRow}>
                  {PERIOD_IDS.slice(0, 2).map(periodId => (
                    <PFFormField key={periodId} label={`${periodId.replace('period', '')}교시`}>
                      <PeriodTimePair
                        start={block.periods[periodId]?.start ?? ''}
                        end={block.periods[periodId]?.end ?? ''}
                        onChange={next => patchPeriod(block, periodId, next)}
                      />
                    </PFFormField>
                  ))}
                </PFFormFieldRow>
                <PFFormFieldRow type="double" className={styles.compactPeriodRow}>
                  {PERIOD_IDS.slice(2).map(periodId => (
                    <PFFormField key={periodId} label={`${periodId.replace('period', '')}교시`}>
                      <PeriodTimePair
                        start={block.periods[periodId]?.start ?? ''}
                        end={block.periods[periodId]?.end ?? ''}
                        onChange={next => patchPeriod(block, periodId, next)}
                      />
                    </PFFormField>
                  ))}
                </PFFormFieldRow>
              </PFFormFieldTable>
            </div>
            {blockIndex > 0 ? (
              <div className={blockStyles.deleteCell}>
                <PFItemDeleteButton
                  aria-label={`${rankTitle} 삭제`}
                  onClick={() => onChange(value.filter(item => item.id !== block.id))}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
