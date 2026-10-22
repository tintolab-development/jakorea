import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineSeparatedFields,
  PFText,
} from '@/shared/ui'
import type {
  EducationUjatApplicationContent as UjatApplicationContentModel,
  EducationUjatClassTimeBlock,
} from '../../model/types'
import { hasUjatApplicationContent } from '../../lib/ujat-application-content-from-answers'
import { PipeSeparatedFieldValue } from '../teacher-application-content/pipe-separated-field-value'
import styles from './ujat-application-content.module.css'

export type UjatApplicationContentProps = {
  content?: UjatApplicationContentModel
}

const EMPTY_INSTITUTION = {
  name: '',
  address: '',
  addressDetail: '',
  teacherContact: '',
  otherRequests: '',
} as const

function paddedIndex(index: number): string {
  return String(index + 1).padStart(2, '0')
}

function filledParts(parts: readonly string[]): string[] {
  return parts.map(part => part.trim()).filter(part => part && part !== '-')
}

function DateJoinedValues({ parts }: { parts: readonly string[] }) {
  const items = filledParts(parts)
  if (items.length === 0) return null

  return (
    <PFFormInlineSeparatedFields>
      {items.map((item, index) => (
        <PFText key={`${index}-${item}`} as="span" typo="bd-md-md" color="black">
          {item}
        </PFText>
      ))}
    </PFFormInlineSeparatedFields>
  )
}

function PrimaryJoinedValues({ parts }: { parts: readonly string[] }) {
  const items = filledParts(parts)
  if (items.length === 0) return null

  return (
    <PFFormInlineSeparatedFields>
      {items.map((item, index) => (
        <PFText key={`${index}-${item}`} as="span" typo="bd-lg-sb" color="primary-800">
          {item}
        </PFText>
      ))}
    </PFFormInlineSeparatedFields>
  )
}

function ClassTimeJoinedValues({ block }: { block: EducationUjatClassTimeBlock }) {
  const gradeLabel = filledParts([block.gradeRangeLabel])[0]
  const periods = block.periods.filter(
    period => filledParts([period.periodLabel, period.timeLabel]).length > 0,
  )
  if (!gradeLabel && periods.length === 0) return null

  return (
    <PFFormInlineSeparatedFields>
      {gradeLabel ? (
        <PFText as="span" typo="bd-lg-sb" color="primary-800">
          {gradeLabel}
        </PFText>
      ) : null}
      {periods.map((period, index) => (
        <span key={`${period.periodLabel}-${period.timeLabel}-${index}`} className={styles.periodPair}>
          {period.periodLabel.trim() && period.periodLabel.trim() !== '-' ? (
            <PFText as="span" typo="bd-lg-sb" color="primary-800">
              {period.periodLabel}
            </PFText>
          ) : null}
          {period.timeLabel.trim() && period.timeLabel.trim() !== '-' ? (
            <PFText as="span" typo="bd-lg-sb" color="primary-800">
              {period.timeLabel}
            </PFText>
          ) : null}
        </span>
      ))}
    </PFFormInlineSeparatedFields>
  )
}

export function UjatApplicationContent({ content }: UjatApplicationContentProps) {
  if (!hasUjatApplicationContent(content)) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
        신청 내용이 없습니다.
      </PFText>
    )
  }

  const preferredDates = content?.preferredDates ?? []
  const institution = content?.institution ?? EMPTY_INSTITUTION
  const gradeBlocks = content?.gradeBlocks ?? []
  const classTimeBlocks = content?.classTimeBlocks ?? []
  const showPreferredDates = filledParts(preferredDates).length > 0
  const showInstitution = Object.values(institution).some(value => value.trim().length > 0)

  const displayGradeBlocks = gradeBlocks.flatMap(block => {
    const gradePart = filledParts([block.gradeLabel, block.classCountLabel]).join(' ')
    const parts = filledParts([gradePart || block.gradeLabel, block.classesLabel])
    return parts.length > 0 ? [{ block, parts }] : []
  })
  const displayClassTimeBlocks = classTimeBlocks.flatMap(block => {
    const hasGrade = filledParts([block.gradeRangeLabel]).length > 0
    const hasPeriod = block.periods.some(
      period => filledParts([period.periodLabel, period.timeLabel]).length > 0,
    )
    return hasGrade || hasPeriod ? [block] : []
  })
  const showGradeBlocks = displayGradeBlocks.length > 0
  const showClassTimeBlocks = displayClassTimeBlocks.length > 0
  const showNameAndAddress = Boolean(institution.name.trim() && institution.address.trim())

  return (
    <div className={styles.root}>
      {showPreferredDates ? (
        <section className={styles.section} aria-label="교육 진행 희망일">
          <div className={styles.dateCard}>
            <PFText as="h2" typo="bd-md-sb" color="black" className={styles.dateCardTitle}>
              교육 진행 희망일
            </PFText>
            <DateJoinedValues parts={preferredDates} />
          </div>
        </section>
      ) : null}

      {showInstitution ? (
        <section className={styles.section} aria-label="신청 기관 정보">
          <PFFormFieldTable>
            {showNameAndAddress ? (
              <PFFormFieldRow type="double">
                <PFFormField label="신청 기관명" labelWidth="wider">
                  <p className={styles.fieldValue}>{institution.name}</p>
                </PFFormField>
                <PFFormField label="기관 소재지" labelWidth="wider">
                  <p className={styles.fieldValue}>{institution.address}</p>
                </PFFormField>
              </PFFormFieldRow>
            ) : institution.name.trim() ? (
              <PFFormFieldRow>
                <PFFormField label="신청 기관명" labelWidth="wider" fullWidth>
                  <p className={styles.fieldValue}>{institution.name}</p>
                </PFFormField>
              </PFFormFieldRow>
            ) : institution.address.trim() ? (
              <PFFormFieldRow>
                <PFFormField label="기관 소재지" labelWidth="wider" fullWidth>
                  <p className={styles.fieldValue}>{institution.address}</p>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
            {institution.addressDetail.trim() ? (
              <PFFormFieldRow>
                <PFFormField label="상세 주소" labelWidth="wider" fullWidth>
                  <p className={styles.fieldValue}>{institution.addressDetail}</p>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
            {institution.teacherContact.trim() ? (
              <PFFormFieldRow>
                <PFFormField label="담당 교사 정보" labelWidth="wider" fullWidth>
                  <PipeSeparatedFieldValue value={institution.teacherContact} />
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
            {institution.otherRequests.trim() ? (
              <PFFormFieldRow>
                <PFFormField label="기타 요청사항" labelWidth="wider" fullWidth>
                  <p className={styles.fieldValue}>{institution.otherRequests}</p>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
          </PFFormFieldTable>
        </section>
      ) : null}

      {showGradeBlocks ? (
        <section className={styles.sectionAfterDivider} aria-label="학년 별 신청 정보">
          <PFText as="h2" typo="hl-sm" color="black" className={styles.sectionTitle}>
            학년 별 신청 정보
          </PFText>
          <div className={styles.blockList}>
            {displayGradeBlocks.map(({ block, parts }, index) => {
              return (
                <div key={`${block.gradeLabel}-${index}`} className={styles.block}>
                  <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.blockIndex}>
                    {`신청학년 ${paddedIndex(index)}`}
                  </PFText>
                  <PrimaryJoinedValues parts={parts} />
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {showClassTimeBlocks ? (
        <section className={styles.sectionAfterDivider} aria-label="학년 별 수업 시간">
          <PFText as="h2" typo="hl-sm" color="black" className={styles.sectionTitle}>
            학년 별 수업 시간
          </PFText>
          <div className={styles.blockList}>
            {displayClassTimeBlocks.map((block, index) => (
              <div key={`${block.gradeRangeLabel}-${index}`} className={styles.block}>
                <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.blockIndex}>
                  {`수업 진행 시간 ${paddedIndex(index)}`}
                </PFText>
                <ClassTimeJoinedValues block={block} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
