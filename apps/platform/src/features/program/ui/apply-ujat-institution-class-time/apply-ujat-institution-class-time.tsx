import { DetailInfoForm } from '@/features/form-template'
import { PFCheckbox, PFItemDeleteButton, PFText, PFTimeInput } from '@/shared/ui'
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
      const grades = Array.isArray(item?.gradeValues)
        ? item.gradeValues.map(value => String(value))
        : []
      return {
        id: String(item?.id ?? `ujat-class-time-${index + 1}`),
        checkedGrades: Object.fromEntries(grades.map(grade => [grade, true])),
        periods: {},
      }
    })
  }
  if (!checkedByBlock && !periodsByBlock) return null
  const ids = [...new Set([...Object.keys(checkedByBlock ?? {}), ...Object.keys(periodsByBlock ?? {})])]
  if (ids.length === 0) return null
  return ids.map(id => {
    const periodsRecord = asRecord(periodsByBlock?.[id]) ?? {}
    const periods: Record<string, ApplyUjatClassTimePeriod> = {}
    for (const [periodId, raw] of Object.entries(periodsRecord)) {
      const period = asRecord(raw)
      periods[periodId] = {
        start: typeof period?.start === 'string' ? period.start : '',
        end: typeof period?.end === 'string' ? period.end : '',
      }
    }
    return {
      id,
      checkedGrades: (asRecord(checkedByBlock?.[id]) ?? {}) as Record<string, boolean>,
      periods,
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
    <div className={`detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap ${blockStyles.timeInputs}`}>
      <PFTimeInput
        placeholder="수업 시작"
        value={start}
        onValueChange={next => onChange({ start: next, end })}
        className={blockStyles.timePicker}
      />
      <PFText as="span" typo="bd-md-md" color="neutral-cool-500" className={blockStyles.tilde}>
        ~
      </PFText>
      <PFTimeInput
        placeholder="수업 종료"
        value={end}
        onValueChange={next => onChange({ start, end: next })}
        className={blockStyles.timePicker}
      />
    </div>
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
              <DetailInfoForm
                title="학년 별 수업 시간"
                hideHeader
                mode="edit"
                className={blockStyles.scheduleForm}
              >
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="해당 학년"
                    fullRow
                    view="-"
                    edit={
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
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  {PERIOD_IDS.slice(0, 2).map(periodId => (
                    <DetailInfoForm.Field
                      key={periodId}
                      label={`${periodId.replace('period', '')}교시`}
                      view="-"
                      edit={
                        <PeriodTimePair
                          start={block.periods[periodId]?.start ?? ''}
                          end={block.periods[periodId]?.end ?? ''}
                          onChange={next => patchPeriod(block, periodId, next)}
                        />
                      }
                    />
                  ))}
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  {PERIOD_IDS.slice(2).map(periodId => (
                    <DetailInfoForm.Field
                      key={periodId}
                      label={`${periodId.replace('period', '')}교시`}
                      view="-"
                      edit={
                        <PeriodTimePair
                          start={block.periods[periodId]?.start ?? ''}
                          end={block.periods[periodId]?.end ?? ''}
                          onChange={next => patchPeriod(block, periodId, next)}
                        />
                      }
                    />
                  ))}
                </DetailInfoForm.Row>
              </DetailInfoForm>
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
