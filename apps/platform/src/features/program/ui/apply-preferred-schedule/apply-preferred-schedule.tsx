import { useState } from 'react'
import { PFDateInput, PFItemDeleteButton, PFText, PFTextInput } from '@/shared/ui'
import styles from './apply-preferred-schedule.module.css'

export type ApplyPreferredScheduleBlock = {
  date: string
  classPeriod: string
  startTime: string
  endTime: string
}

function createEmptyBlock(): ApplyPreferredScheduleBlock {
  return { date: '', classPeriod: '', startTime: '', endTime: '' }
}

type ApplyPreferredScheduleProps = {
  maxBlocks: number
}

export function ApplyPreferredSchedule({ maxBlocks }: ApplyPreferredScheduleProps) {
  const cap = Math.max(1, Math.min(maxBlocks, 10))
  const [blocks, setBlocks] = useState<ApplyPreferredScheduleBlock[]>(() => [createEmptyBlock()])

  const displayBlocks = blocks.slice(0, cap)

  const patchBlock = (index: number, patch: Partial<ApplyPreferredScheduleBlock>) => {
    setBlocks(current =>
      current.map((block, i) => (i === index ? { ...block, ...patch } : block))
    )
  }

  const removeBlock = (index: number) => {
    setBlocks(current => {
      if (current.length <= 1) return [createEmptyBlock()]
      return current.filter((_, i) => i !== index)
    })
  }

  const addBlock = () => {
    setBlocks(current => (current.length >= cap ? current : [...current, createEmptyBlock()]))
  }

  return (
    <div className={styles.root}>
      {displayBlocks.map((block, index) => (
        <div key={index} className={styles.block}>
          <div className={styles.blockBody}>
            <PFText as="p" typo="bd-md-md" color="black" className={styles.title}>
              ■ {index + 1}지망
            </PFText>
            <div className={styles.field}>
              <PFText as="p" typo="bd-sm-md" color="neutral-cool-700" className={styles.fieldLabel}>
                희망 교육일
              </PFText>
              <PFDateInput
                variant="formPage"
                size="large"
                picker="date"
                placeholder="희망 교육 날짜를 선택하세요"
                value={block.date}
                onValueChange={value => patchBlock(index, { date: value })}
              />
            </div>
            <div className={styles.field}>
              <PFText as="p" typo="bd-sm-md" color="neutral-cool-700" className={styles.fieldLabel}>
                1차시 희망 교육 시간
              </PFText>
              <div className={styles.timeRow}>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={120}
                  inputMode="numeric"
                  placeholder="수업 진행 교시"
                  value={block.classPeriod}
                  onValueChange={value => patchBlock(index, { classPeriod: value })}
                />
                <PFText as="span" typo="bd-md-md" color="black" className={styles.timeUnit}>
                  교시
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={140}
                  placeholder="시작 시간"
                  value={block.startTime}
                  onValueChange={value => patchBlock(index, { startTime: value })}
                />
                <PFText as="span" typo="bd-md-md" color="neutral-cool-500" className={styles.timeUnit}>
                  ~
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={140}
                  placeholder="종료 시간"
                  value={block.endTime}
                  onValueChange={value => patchBlock(index, { endTime: value })}
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
      ))}
      {displayBlocks.length >= cap ? null : (
        <button type="button" className={styles.add} onClick={addBlock}>
          <PFText as="span" typo="bd-md-md" color="primary-500">
            + 희망 일정 추가 (최대 {cap}개)
          </PFText>
        </button>
      )}
    </div>
  )
}
