import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineSeparatedFields,
  PFText,
} from '@/shared/ui'
import type { EducationUjatApplicationContent as UjatApplicationContentModel } from '../../model/types'
import { PipeSeparatedFieldValue } from '../teacher-application-content/pipe-separated-field-value'
import styles from './ujat-application-content.module.css'

const EMPTY_INSTITUTION = {
  name: '-',
  address: '-',
  addressDetail: '-',
  teacherContact: '-',
  otherRequests: '-',
} as const

export type UjatApplicationContentProps = {
  content?: UjatApplicationContentModel
}

function paddedIndex(index: number): string {
  return String(index + 1).padStart(2, '0')
}

function PrimaryJoinedValues({ parts }: { parts: readonly string[] }) {
  const items = parts.map(part => part.trim()).filter(part => part && part !== '-')
  if (items.length === 0) {
    return (
      <PFText as="p" typo="bd-lg-sb" color="primary-800" className={styles.joinedValue}>
        -
      </PFText>
    )
  }

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

export function UjatApplicationContent({ content }: UjatApplicationContentProps) {
  const preferredDates = content?.preferredDates ?? []
  const institution = content?.institution ?? EMPTY_INSTITUTION
  const gradeBlocks = content?.gradeBlocks ?? []
  const classTimeBlocks = content?.classTimeBlocks ?? []
  const showPreferredDates = preferredDates.length > 0
  const showGradeBlocks = gradeBlocks.length > 0
  const showClassTimeBlocks = classTimeBlocks.length > 0

  return (
    <div className={styles.root}>
      {showPreferredDates ? (
        <section className={styles.section} aria-label="교육 진행 희망일">
          <div className={styles.dateCard}>
            <PFText as="h2" typo="bd-md-sb" color="black" className={styles.dateCardTitle}>
              교육 진행 희망일
            </PFText>
            <PrimaryJoinedValues parts={preferredDates} />
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-label="신청 기관 정보">
        <PFFormFieldTable>
          <PFFormFieldRow type="double">
            <PFFormField label="신청 기관명" labelWidth="wider">
              <p className={styles.fieldValue}>{institution.name}</p>
            </PFFormField>
            <PFFormField label="기관 소재지" labelWidth="wider">
              <p className={styles.fieldValue}>{institution.address}</p>
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow>
            <PFFormField label="상세 주소" labelWidth="wider" fullWidth>
              <p className={styles.fieldValue}>{institution.addressDetail}</p>
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow>
            <PFFormField label="담당 교사 정보" labelWidth="wider" fullWidth>
              <PipeSeparatedFieldValue value={institution.teacherContact} />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow>
            <PFFormField label="기타 요청사항" labelWidth="wider" fullWidth>
              <p className={styles.fieldValue}>{institution.otherRequests}</p>
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </section>

      {showGradeBlocks ? (
        <section className={styles.sectionAfterDivider} aria-label="학년 별 신청 정보">
          <PFText as="h2" typo="hl-sm" color="black" className={styles.sectionTitle}>
            학년 별 신청 정보
          </PFText>
          <div className={styles.blockList}>
            {gradeBlocks.map((block, index) => {
              const gradePart = [block.gradeLabel, block.classCountLabel]
                .map(part => part.trim())
                .filter(part => part && part !== '-')
                .join(' ')
              return (
                <div key={`${block.gradeLabel}-${index}`} className={styles.block}>
                  <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.blockIndex}>
                    {`신청학년 ${paddedIndex(index)}`}
                  </PFText>
                  <PrimaryJoinedValues parts={[gradePart || block.gradeLabel, block.classesLabel]} />
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
            {classTimeBlocks.map((block, index) => (
              <div key={`${block.gradeRangeLabel}-${index}`} className={styles.block}>
                <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.blockIndex}>
                  {`수업 진행 시간 ${paddedIndex(index)}`}
                </PFText>
                <PrimaryJoinedValues
                  parts={[
                    block.gradeRangeLabel,
                    ...block.periods.map(period => `${period.periodLabel} ${period.timeLabel}`),
                  ]}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
