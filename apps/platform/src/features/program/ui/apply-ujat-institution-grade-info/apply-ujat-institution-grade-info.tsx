import { Fragment } from 'react'
import { DetailInfoForm } from '@/features/form-template'
import { PFItemDeleteButton, PFSelect, PFText, PFTextInput } from '@/shared/ui'
import blockStyles from '../apply-preferred-schedule/apply-preferred-schedule.module.css'
import styles from './apply-ujat-institution-grade-info.module.css'

const GRADE_OPTIONS = Array.from({ length: 6 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1}학년`,
}))

const MAX_CLASS_COUNT = 40

export type ApplyUjatGradeBlock = {
  id: string
  grade: string
  classCountInput: string
  classNoByIndex: Record<number, string>
  studentCountByIndex: Record<number, string>
}

type ApplyUjatInstitutionGradeInfoProps = {
  value: ApplyUjatGradeBlock[]
  onChange: (next: ApplyUjatGradeBlock[]) => void
}

function parseClassCount(raw: string): number {
  const count = Number.parseInt(raw.replace(/\D/g, ''), 10)
  if (!Number.isFinite(count) || count < 1) return 0
  return Math.min(count, MAX_CLASS_COUNT)
}

function createGradeBlock(index: number): ApplyUjatGradeBlock {
  return {
    id: `ujat-grade-${index + 1}`,
    grade: '',
    classCountInput: '',
    classNoByIndex: {},
    studentCountByIndex: {},
  }
}

export function emptyUjatInstitutionGradeBlocks(): ApplyUjatGradeBlock[] {
  return [createGradeBlock(0)]
}

export function appendUjatInstitutionGradeBlock(
  blocks: ApplyUjatGradeBlock[],
): ApplyUjatGradeBlock[] {
  return [...blocks, createGradeBlock(blocks.length)]
}

export function findIncompleteUjatInstitutionGradeInfoMessage(
  blocks: ApplyUjatGradeBlock[],
): string | null {
  if (blocks.length === 0) return '학년 별 신청 정보를 입력해 주세요.'
  for (const [index, block] of blocks.entries()) {
    if (!block.grade) return `신청 학년 ${String(index + 1).padStart(2, '0')}의 학년을 선택해 주세요.`
    const classCount = parseClassCount(block.classCountInput)
    if (classCount < 1) {
      return `신청 학년 ${String(index + 1).padStart(2, '0')}의 총 학급 수를 입력해 주세요.`
    }
    for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
      if (!block.classNoByIndex[classIndex]?.trim() || !block.studentCountByIndex[classIndex]?.trim()) {
        return `신청 학년 ${String(index + 1).padStart(2, '0')}의 학급 별 학생 수를 입력해 주세요.`
      }
    }
  }
  return null
}

export function ujatInstitutionGradeAnswerFromValues(
  blocks: ApplyUjatGradeBlock[],
): Record<string, unknown> {
  const applicationGradeByBlockId: Record<string, string> = {}
  const gradeDetailByBlock: Record<string, ApplyUjatGradeBlock> = {}
  const gradeBlocks = blocks.map(block => {
    const classCount = parseClassCount(block.classCountInput)
    applicationGradeByBlockId[block.id] = block.grade
    gradeDetailByBlock[block.id] = block
    return {
      id: block.id,
      grade: block.grade,
      gradeLabel: block.grade ? `${block.grade}학년` : '',
      classCount,
      classCountInput: block.classCountInput,
      classNoByIndex: block.classNoByIndex,
      studentCountByIndex: block.studentCountByIndex,
      classes: Array.from({ length: classCount }, (_, index) => ({
        classNo: block.classNoByIndex[index] ?? '',
        studentCount: block.studentCountByIndex[index] ?? '',
      })),
    }
  })
  return {
    gradeBlocks,
    ujatApplication: {
      applicationGradeByBlockId,
      gradeDetailByBlock,
    },
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function ujatInstitutionGradeValuesFromDraftAnswer(
  answer: unknown,
): ApplyUjatGradeBlock[] | null {
  const record = asRecord(answer)
  if (!record) return null
  const list = Array.isArray(record.gradeBlocks)
    ? record.gradeBlocks
    : Array.isArray(answer)
      ? answer
      : null
  if (!list || list.length === 0) {
    const nested = asRecord(record.ujatApplication)
    const detailByBlock = asRecord(
      nested?.gradeDetailByBlock ??
        record['ujatApplication.gradeDetailByBlock'] ??
        record.gradeDetailByBlock,
    )
    const gradeByBlock = asRecord(
      nested?.applicationGradeByBlockId ??
        record['ujatApplication.applicationGradeByBlockId'] ??
        record.applicationGradeByBlockId,
    )
    if (!detailByBlock && !gradeByBlock) return null
    const ids = [...new Set([...Object.keys(gradeByBlock ?? {}), ...Object.keys(detailByBlock ?? {})])]
    if (ids.length === 0) return null
    return ids.map(id => {
      const detail = asRecord(detailByBlock?.[id])
      return {
        id,
        grade: String(gradeByBlock?.[id] ?? ''),
        classCountInput: String(detail?.classCountInput ?? ''),
        classNoByIndex: (asRecord(detail?.classNoByIndex) ?? {}) as Record<number, string>,
        studentCountByIndex: (asRecord(detail?.studentCountByIndex) ?? {}) as Record<number, string>,
      }
    })
  }
  return list.map((row, index) => {
    const item = asRecord(row)
    return {
      id: String(item?.id ?? `ujat-grade-${index + 1}`),
      grade: String(item?.grade ?? ''),
      classCountInput: String(item?.classCountInput ?? item?.classCount ?? ''),
      classNoByIndex: (asRecord(item?.classNoByIndex) ?? {}) as Record<number, string>,
      studentCountByIndex: (asRecord(item?.studentCountByIndex) ?? {}) as Record<number, string>,
    }
  })
}

export function ApplyUjatInstitutionGradeInfo({
  value,
  onChange,
}: ApplyUjatInstitutionGradeInfoProps) {
  const patchBlock = (id: string, partial: Partial<ApplyUjatGradeBlock>) => {
    onChange(value.map(block => (block.id === id ? { ...block, ...partial } : block)))
  }

  return (
    <div className={blockStyles.root}>
      {value.map((block, blockIndex) => {
        const classCount = parseClassCount(block.classCountInput)
        const rankTitle = `신청학년 ${String(blockIndex + 1).padStart(2, '0')}`
        return (
          <div key={block.id} className={blockStyles.blockRow}>
            <div className={blockStyles.blockBody}>
              <PFText as="p" typo="bd-md-sb" color="black" className={blockStyles.blockTitle}>
                {rankTitle}
              </PFText>
              <DetailInfoForm
                title="학년 별 신청 정보"
                hideHeader
                mode="edit"
                className={blockStyles.scheduleForm}
              >
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="신청 학년 및 학급 수"
                    fullRow
                    view="-"
                    edit={
                      <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
                        <PFSelect
                          variant="formPage"
                          size="large"
                          width={160}
                          placeholder="신청 학년"
                          options={GRADE_OPTIONS}
                          value={block.grade || undefined}
                          onValueChange={next => patchBlock(block.id, { grade: next })}
                        />
                        <DetailInfoForm.InputsSeparator />
                        <span data-field="classCount">
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={120}
                            inputMode="numeric"
                            placeholder="총 학급 수"
                            value={block.classCountInput}
                            onValueChange={next =>
                              patchBlock(block.id, { classCountInput: next.replace(/\D/g, '') })
                            }
                          />
                        </span>
                        <PFText as="span" typo="bd-md-md" color="black" className={blockStyles.timeUnit}>
                          학급
                        </PFText>
                      </div>
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="학급 별 학생 수"
                    fullRow
                    view="-"
                    edit={
                      classCount < 1 ? (
                        <span className="form-editor-template-field-hint-text">
                          총 학급 수를 먼저 입력해 주세요.
                        </span>
                      ) : (
                        <div
                          className={`detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap ${styles.studentInputsRow}`}
                        >
                          {Array.from({ length: classCount }, (_, index) => (
                            <Fragment key={`${block.id}-class-${index}`}>
                              {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
                              <PFTextInput
                                variant="formPage"
                                size="large"
                                width={80}
                                placeholder="학급"
                                value={block.classNoByIndex[index] ?? ''}
                                onValueChange={next =>
                                  patchBlock(block.id, {
                                    classNoByIndex: { ...block.classNoByIndex, [index]: next },
                                  })
                                }
                              />
                              <PFText
                                as="span"
                                typo="bd-md-md"
                                color="black"
                                className={blockStyles.timeUnit}
                              >
                                반
                              </PFText>
                              <PFTextInput
                                variant="formPage"
                                size="large"
                                width={80}
                                inputMode="numeric"
                                placeholder="학생 수"
                                value={block.studentCountByIndex[index] ?? ''}
                                onValueChange={next =>
                                  patchBlock(block.id, {
                                    studentCountByIndex: {
                                      ...block.studentCountByIndex,
                                      [index]: next.replace(/\D/g, ''),
                                    },
                                  })
                                }
                              />
                              <PFText
                                as="span"
                                typo="bd-md-md"
                                color="black"
                                className={blockStyles.timeUnit}
                              >
                                명
                              </PFText>
                            </Fragment>
                          ))}
                        </div>
                      )
                    }
                  />
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
